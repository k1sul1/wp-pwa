import React from 'react'
import axios from 'axios'
import localforage from 'localforage'
import ReactHtmlParser from 'react-html-parser'

import { MenuLoadError, ArchiveLoadError, LookupError, FatalError404, Forbidden } from '../errors'
import { transformWPContent, isDevelopment } from '../lib/helpers'
import p from  '../../package.json'

const requestCache = localforage.createInstance({
  name: 'requestCache',
})

const dataStore = localforage.createInstance({
  name: 'dataStore',
})

export const getWPURL = () => {
  if (process.env.NODE_ENV === 'production') {
    return p.homepage
  } else {
    return p.WPURL
  }
}

class WP_Client {
  constructor(url = undefined) {
    this.url = url || '' // Use relative urls, assume current domain
    this.offline = !navigator.onLine
    this.saveIntoReqCache = true
    this.cacheKeyPrefix = ''
    this.errorHandler = null
    this.user = null

    this.getCurrentUser().then(user => {
      this.user = user
      window.dispatchEvent(new CustomEvent('authenticated', { detail: { response: user } }))
    }) // swallow any errors

    this.addNetworkStatusListeners(this)
    this.addAuthenticationListeners(this)
  }

  async onError(error) {
    if (error.name === 'QuotaExceededError') {
      console.log('it seems that the cache is full, and flush is not implemented yet')

      this.saveIntoReqCache = false

      return await this.retry()

      // clear the cache maybe
      // but whatever you do, don't propagate further
    } else if (error.message === 'Request failed with status code 403') {
      return this.onError(new Forbidden('It appears this requires authentication'))
    } else if (error.message === 'Request failed with status code 404') {
      // return this.onError(new Error404('Request failed with status code 404'))
      return this.onError(new FatalError404('No endpoint found.'))
    }

    if (this.errorHandler) {
      return this.errorHandler(error)
    }

    throw error
  }

  async onauthenticated(e) {
    await dataStore.setItem('user', e.detail.response)
    this.user = await this.getCurrentUser()
  }

  async onlogout() {
    await dataStore.removeItem('user')
    this.user = null
  }

  onoffline(e) {
    this.offline = true
    console.log('WP_Client: Switched to offline mode.')
  }

  ononline(e) {
    this.offline = false
    console.log('WP_Client: Switched to online mode.')
  }

  handleEvent(e) {
    this[`on${e.type}`](e)
  }

  connectErrorHandler(handler) {
    this.errorHandler = handler
  }

  disconnectErrorHandler() {
    this.errorHandler = null
  }

  getWPURL() {
    return getWPURL()
  }

  turnURLRelative(key, obj) {
    obj[key] = obj[key].replace(this.getWPURL(), '')

    return obj
  }

  renderContent(post) {
    if (post && post.content) {
      post.content.rendered = ReactHtmlParser(post.content.rendered, {
        transform: transformWPContent,
      })
    }

    if (post && post.title) {
      post.title.rendered = ReactHtmlParser(post.title.rendered, {
        transform: transformWPContent,
      })
    }

    return post
  }


  getCacheKey(endpoint, payload, options) {
    return [
      this.cacheKeyPrefix,
      endpoint,
      JSON.stringify(payload),
      JSON.stringify(options),
    ].join('_') // use hashing pls
  }

  async getCacheSize(cb) {
    try {
      const keys = await localforage.keys()
      const filtered = keys
        .filter(key => key.indexOf(this.cacheKeyPrefix) === 0)
      const values = await Promise.all(filtered.map(key => localforage.getItem(key)))


      // May not actually be bytes because UTF-16 and multibyte chars and AAAAA
      const keyByteCount = keys.reduce((sum, key) => sum + key.length, 0)
      const valueByteCount = values.reduce((sum, value) => sum + JSON.stringify(value).length, 0)
      const totalByteCount = valueByteCount + keyByteCount
      const itemCount = keys.length
      const obj = {
        itemCount,
        keyByteCount,
        valueByteCount,
        totalByteCount,
      }

      if (cb) {
        cb(obj)
      }

      return obj
    } catch (e) {
      throw e
    }
  }

  async getPostsFrom(type = 'posts', payload = {}, options = {}) {
    const page = payload.page ? payload.page : false
    const perPage = payload.perPage ? payload.perPage : 10
    const endpoint = `/wp-json/wp/v2/${type}?${page ? `page=${page}&` : ''}per_page=${perPage}&_embed=1`
    const posts = await this.req(endpoint, payload, options)

    return posts
      .map(post => this.turnURLRelative('link', post))
      .map(this.renderContent)
  }

  async getPages(payload = {}, options = {}) {
    return await this.getPostsFrom('pages', payload, options)
  }

  async getPosts(payload = {}, options = {}) {
    return await this.getPostsFrom('posts', {
      // add custom arguments
      ...payload,
    }, options)
  }

  async getForContext(type, params = {}, options = {}) {
    // heitä tänne term objekti tai post type objekti, näytä sisältöä siitä kontekstista
    // sivutuksella kiitos
    switch (type) {
      case 'blog': {
        break
      }

      case 'taxonomy': {
        const { term_id, taxonomy } = params
        const taxonomies = { post_tag: 'tags', category: 'categories' } // add rest base to the object pls
        const posts = await this.getPostsFrom('posts', {
          params: {
            [taxonomies[taxonomy]]: term_id
          }
        }, options)
        /* const a = {
          'post_type': 'post',
          'tax_query': [
            {
              'taxonomy': 'post_tag',
              'field': 'slug',
              'terms': [ 'who' ]
            },
            {
              'taxonomy': 'post_tag',
              'field': 'slug',
              'terms': [ 'needs' ]
            }
          ]
        }

        const args = Object.keys(a).map(function(k) {
            return encodeURIComponent(k) + '=' + encodeURIComponent(a[k])
        }).join('&')
        console.log(args)

        const posts = await this.req('/wp-json/wp_query/args/?' + args)

        console.log(posts) */

        if (posts) {
          return posts
        }

        break
      }

      case 'post_type': {

        break
      }

      // no default
    }
  }

  async getMenus(params = {}, options = {}) {
    return await this.req(`/wp-json/wp-api-menus/v2/menus`, params, options)
  }

  async getMenu(menu_id, params = {}, options = {}) {
    const menu = await this.req(`/wp-json/wp-api-menus/v2/menus/${menu_id}`, params, {
      // preferCache: true,
      ...options
    })

    if (menu && menu.items) {
      return {
        ...menu,
        items: menu.items.map(item => this.turnURLRelative('url', item)),
      }
    }

    return this.onError(new MenuLoadError('Unable to load menu'))
  }

  async getArchives(params = {}, options = {}) {
    const archives = await this.req('/wp-json/emp/v1/archives', params, {
      // crashAppOnError: true,
      ...options
    })

    if (!archives) {

      return this.onError(new ArchiveLoadError('Unable to load archives'))
    }

    return archives
  }

  async query(params = {}, options = {}) {
    return await this.req('/wp-json/wp_query/args/', params, options)
  }

  async getCurrentUser() {
    const user = await dataStore.getItem('user')

    if (user) {
      return user
    }

    return false
  }

  async logout() {
    try {
      window.dispatchEvent(new Event('logout', {}))
      return true
    } catch(e) {
      console.log(e)
      return false
    }
  }

  async authenticate(username, password) {
    const response = await this.req('/wp-json/jwt-auth/v1/token', {
      username,
      password,
    }, {
      method: 'post',
      allowCache: false,
      ignoreAxiosError: true,
    })

    if (response && response.token) {
      window.dispatchEvent(new CustomEvent('authenticated', { detail: { response } }))
      return true
    }

    return this.onError(response)
    // console.log(response)

    // return false
  }

  addNetworkStatusListeners(component) {
    window.addEventListener('online', component)
    window.addEventListener('offline', component)
  }

  removeNetworkStatusListeners(component) {
    window.removeEventListener('online', component)
    window.removeEventListener('offline', component)
  }

  addAuthenticationListeners(component) {
    window.addEventListener('authenticated', component)
    window.addEventListener('logout', component)
  }

  removeAuthenticationListeners(component) {
    window.removeEventListener('authenticated', component)
    window.removeEventListener('logout', component)
  }

  async getByURL(url, params, options) {
    const post = await this.req(`/wp-json/rpl/v1/lookup`, {
      params: {
        url,
        ...params,
      }
    }, options)

    console.log(post)


    if (!post) {
      // return this.onError(new LookupError('Lookup request failed'))
    }


    if (post && post.error) {
      const { error } = post

      if (error === 'No post found.') {
        return new LookupError(error)
        // return this.onError(new LookupError('Lookup request failed'))
        // return this.onError(new Error404('Nothing found with that URL.'))
      } else {
        console.log('UNHANDLED ERROR!')
        throw error
      }
    }

    if (post) {
      // This portion of the code only exists because WP refuses to work with the _embed parameter
      // with internal requests. No one seems to know why.
      const featuredImage = !post.featured_media ? false : [await this.req(
        `/wp-json/wp/v2/media/${post.featured_media}`
      )]

      if (featuredImage) {
        post['_embedded'] = {
          'wp:featuredmedia': featuredImage || [],
        }
      }
    }

    return this.renderContent(post)
  }

  async retry(maxTimes = 3) {
    console.log('retrying is untested, does it work?')
    if (this.lastRequest) {
      const { endpoint, payload, options, retries } = this.lastRequest

      if (retries && retries > maxTimes) {
        console.log('Retried too many times.')
        return false
      }

      this.lastRequest.retries = retries ? retries + 1 : 1
      return this.req(endpoint, payload, options)
    }

    return false
  }

  async req(endpoint, payload = {}, options = {}) {
    this.lastRequest = {
      endpoint,
      payload,
      options
    }

    const opts = {
      method: 'get',
      raw: false,

      crashAppOnError: false,
      ignoreAxiosError: false,
      allowCache: true,
      preferCache: isDevelopment ? false : true,
      cacheStaleTime: 3600000 * 3, // 3 hours

      ...options, // Overwrite the defaults
    }

    if (!this.saveIntoReqCache) {
      opts.allowCache = false
    }

    const headers = {}
    const user = this.user
    const jwt = user ? user.token : false

    if (jwt) {
      headers['Authorization'] = `Bearer ${jwt}`
    }

    const cacheKey = this.getCacheKey(endpoint, payload, options)
    const addCacheMeta = (data) => ({
      data,
      meta: {
        cacheTime: Date.now(),
      }
    })

    if (!endpoint) {
      throw new Error('Endpoint URL mustn\'t be empty.')
    }

    if ((this.offline || opts.preferCache) && opts.allowCache) {
      const cached = await requestCache.getItem(cacheKey).catch(this.onError)

      if (cached) {
        console.log('hit cache', endpoint)
        const { cacheTime } = cached.meta

        if (Date.now() - cacheTime < opts.cacheStaleTime) {
          return cached.data
        } else {
          // Cache stale!
          console.log('Cache stale for', endpoint)
          if (this.offline) {
            // Better something than nothing?
            return cached.data
          }
        }
      }

      console.log('cache miss', endpoint)
    }

    try {
      const reqOpts = {
        withCredentials: true,
        headers,
        auth: process.env.NODE_ENV === 'production' ? {
          username: 'k1sul1',
          password: 'M4mw43ZufvDeRwQdES3zMAWM', // OMG PASSWORD IN PLAINTEXT
        } : null
      }
      let response

      switch (opts.method) {
        case 'get': {
          response = await axios.get(`${this.url}${endpoint}`, {
            ...reqOpts,
            ...payload,
          })
          break
        }

        case 'post': {
          response = await axios.post(`${this.url}${endpoint}`, {
            ...payload,
          }, reqOpts)
          break
        }

        // no default
      }

      // If a raw response wasn't requested, return the data only
      // Could also implement a method that returns the last request (by storing the last req)
      if (!opts.raw) {
        opts.allowCache && await requestCache.setItem(cacheKey, addCacheMeta(response.data)).catch(this.onError)
        return response.data
      }

      opts.allowCache && await requestCache.setItem(cacheKey, addCacheMeta(response)).catch(this.onError)
      return response
    } catch(e) {

      if (opts.ignoreAxiosError) {
        return e
      }

      return this.onError(e)
    }
  }
}

const WP = new WP_Client(getWPURL())
window.WP = WP
export default WP

export const connect = ComponentToConnect => props => {
  const connected = <ComponentToConnect {...props} WP={WP} />

  return connected
}
