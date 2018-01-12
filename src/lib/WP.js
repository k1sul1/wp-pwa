import React from 'react'
import axios from 'axios'
import localforage from 'localforage'
import ReactHtmlParser from 'react-html-parser'

import { transformWPContent, isDevelopment } from '../lib/helpers'
import p from  '../../package.json'

const requestCache = localforage.createInstance({
  name: 'requestCache',
})

const dataStore = localforage.createInstance({
  name: 'dataStore',
})

class WP_Client {
  constructor(url = undefined) {
    this.url = url || '' // Use relative urls, assume current domain
    this.offline = !navigator.onLine
    this.saveIntoReqCache = true
    this.cacheKeyPrefix = ''
    this.errorHandler = null

    window.addEventListener('online', this)
    window.addEventListener('offline', this)
  }

  async onError(error) {
    if (error.name === 'QuotaExceededError') {
      console.log('it seems that the cache is full, and flush is not implemented yet')

      this.saveIntoReqCache = false

      return await this.retry()

      // clear the cache maybe
      // but whatever you do, don't propagate further
    }

    if (this.errorHandler) {
      return this.errorHandler(error)
    }

    throw error
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

  turnURLRelative(key, obj) {
    obj[key] = obj[key].replace(p.WPURL, '')

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

  async getForContext(object, params = {}, options = {}) {
    // heitä tänne term objekti tai post type objekti, näytä sisältöä siitä kontekstista
    // sivutuksella kiitos

  }

  async getMenus(params = {}, options = {}) {
    return await this.req(`/wp-json/wp-api-menus/v2/menus`, params, options)
  }

  async getMenu(menu_id, params = {}, options = {}) {
    const menu = await this.req(`/wp-json/wp-api-menus/v2/menus/${menu_id}`, params, {
      preferCache: true,
      ...options
    })

    if (!menu) {
      class MenuLoadError extends Error {
        name = 'MenuLoadError'
      }

      return this.onError(new MenuLoadError('Unable to load menu'))
    }

    return {
      ...menu,
      items: menu.items.map(item => this.turnURLRelative('url', item)),
    }
  }

  async getArchives(params = {}, options = {}) {
    const archives = await this.req('/wp-json/emp/v1/archives', params, {
      // crashAppOnError: true,
      ...options
    })

    if (!archives) {
      class ArchiveLoadError extends Error {
        name = 'ArchiveLoadError'
      }

      return this.onError(new ArchiveLoadError('Unable to load archives'))
    }

    return archives
  }

  async query(params = {}, options = {}) {
    return await this.req('/wp-json/wp_query/args/', params, options)
  }

  async authenticate(username, password) {
    const response = await this.req('/wp-json/jwt-auth/v1/token', {
      username,
      password,
    }, {
      method: 'post',
      allowCache: false,
    })

    if (response.token) {
      await dataStore.setItem('user', response)
    }

    return response
  }

  async getByURL(url, params, options) {
    const post = await this.req(`/wp-json/rpl/v1/lookup`, {
      params: {
        url,
        ...params,
      }
    }, options)


    if (!post) {
      class LookupError extends Error { name = 'LookupError' }
      this.onError(new LookupError('Lookup request failed'))
      return false
    }


    if (post && post.error) {
      const { error } = post

      if (error === 'No post found.') {
        class Error404 extends Error { name = 'Error404' }
        this.onError(new Error404('Nothing found with that URL.'))
        // return 404
      } else {
        console.log('UNHANDLED ERROR!')
        throw error
      }

    }
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
      ignoreAxiosError: true,
      allowCache: true,
      preferCache: isDevelopment ? false : true,
      cacheStaleTime: 3600000 * 3, // 3 hours

      ...options, // Overwrite the defaults
    }

    if (!this.saveIntoReqCache) {
      opts.allowCache = false
    }

    const headers = {}
    const user = await dataStore.getItem('user')
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
      // Handle 403s anyway.
      if (e.message === 'Request failed with status code 403') {
        class Forbidden extends Error { name = 'Forbidden' }
        return this.onError(new Forbidden('It appears this requires authentication'))
      }

      if (opts.ignoreAxiosError) {
        return false
      }

      return this.onError(e)
    }
  }
}

const WP = new WP_Client(p.WPURL)
window.WP = WP
export default WP

export const connect = ComponentToConnect => props => {
  const connected = <ComponentToConnect {...props} WP={WP} />

  return connected
}
