import axios from 'axios'
import localforage from 'localforage'
import omit from 'lodash.omit'

import { MenuLoadError, ArchiveLoadError, LookupError, FatalError404, Forbidden, Unauthorized } from '../errors'
import { isDevelopment, renderHTML, taxonomyRESTBase } from '../lib/helpers'
import p from  '../../package.json'

const requestCache = localforage.createInstance({
  name: 'requestCache',
})

const dataStore = localforage.createInstance({
  name: 'dataStore',
})

export const getWPURL = () => {
  if (process.env.NODE_ENV === 'production') {
    return p.prodWP
  } else {
    return p.devWP
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
      console.log(error) // Private browsing or disk full? Fail silently.
      this.saveIntoReqCache = false

      return await this.retry()
    } else if (error.message === 'Request failed with status code 403') {
      return this.onError(new Forbidden('It appears this requires authentication'))
    } else if (error.message === 'Request failed with status code 401') {
      return this.onError(new Unauthorized('Resource demands that you authenticate first'))
    } else if (error.message === 'Request failed with status code 404') {
      // Endpoint wasn't found at all.
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
      post.content.rendered = renderHTML(post.content.rendered)
    }

    if (post && post.title) {
      post.title.rendered = renderHTML(post.title.rendered)
    }

    return post
  }


  getCacheKey(endpoint, payload, options, user) {
    return [
      this.cacheKeyPrefix,
      endpoint,
      JSON.stringify(payload),
      JSON.stringify(options),
      JSON.stringify(user),
    ].join('_')
    // could save space by hashing
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
    const response = await this.req(endpoint, payload, options)

    if (response) {
      const { __headers } = response
      const posts = Object.values(omit(response, '__headers'))
        .map(post => this.turnURLRelative('link', post))
        .map(this.renderContent)

      return {
        posts,
        headers: __headers,
      }

    } else {
      console.log('Throw something here? Like plates?')
    }

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
    const formatResponse = ({ headers, posts }) => ({ posts, headers })

    switch (type) {
      case 'blog': {
        const response = await this.getPostsFrom('posts', params, options)

        if (response) {
          return formatResponse(response)
        }

        break
      }

      case 'taxonomy': {
        const { term_id, taxonomy } = params
        const response = await this.getPostsFrom('posts', {
          params: {
            [taxonomyRESTBase(taxonomy)]: term_id,
            ...params,
          }
        }, options)

        if (response) {
          return formatResponse(response)
        }

        break
      }

      case 'post_type': {
        // tl;dr use this.getPostsFrom and pick the type from params
        // might have to create a helper, because rest base..

        break
      }
      // no default
    }

    return false
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

    if (post && post.error) {
      const { error } = post

      if (error === 'No post found.') {
        return new LookupError(error) // Send this through as is, handle it there.
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
    console.log('it does to some extent')
    if (this.lastRequest) {
      const { endpoint, payload, options, retries } = this.lastRequest

      if (retries && retries >= maxTimes) {
        // console.log('Retried too many times.')
        return this.wpErrorHandler(new Error('Retried too many times.'))
      }

      console.log(this.lastRequest, retries)

      this.lastRequest.retries = retries + 1
      return this.req(endpoint, payload, options)
    }

    return false
  }

  async req(endpoint, payload = {}, options = {}) {
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

    const cacheKey = this.getCacheKey(endpoint, payload, options, user)
    const addCacheMeta = (data) => ({
      data,
      meta: {
        cacheTime: Date.now(),
      }
    })

    this.lastRequest = {
      endpoint,
      payload,
      options,
      retries: 0,
      ...(this.lastRequest ? cacheKey === this.getCacheKey(
        this.lastRequest.endpoint,
        this.lastRequest.payload,
        this.lastRequest.options,
        this.user,
      ) ? this.lastRequest : {} : {}),
    }

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

      response.data.__headers = response.headers

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
