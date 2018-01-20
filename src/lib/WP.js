import axios from 'axios'
import localforage from 'localforage'
import omit from 'lodash.omit'
import queryString from 'query-string'

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
  const urls = [p.prodWP, p.devWP]
  const index = urls.indexOf(window.location.origin)
  if (index > -1) {
    console.log('using same domain')
    return urls[index]
  } else if (process.env.NODE_ENV === 'production') {
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

    this.setUser() // Async, will not be ready with the first request
    this.addNetworkStatusListeners(this)
    this.addAuthenticationListeners(this)
  }

  async setUser() {
    const user = await this.getCurrentUser()

    if (user) {
      this.user = user

      window.dispatchEvent(new CustomEvent('authenticated', { detail: {
        response: user }
      }))
    }
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
    post = { ...post }
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

  async getPostsFrom(type = 'posts', payload = {}) {
    const page = payload.page ? payload.page : false
    const perPage = payload.perPage ? payload.perPage : 10
    const endpoint = `/wp-json/wp/v2/${type}?${page ? `page=${page}&` : ''}per_page=${perPage}&_embed=1`
    // const response = await this.req(endpoint, payload, options)

    const cacheParams = {
      method: 'getPostsFrom',
      type,
      payload,
    }

    const cached = await this.getCached(endpoint, cacheParams)
    const request = cached ? cached : await this.get(endpoint, {
      page,
      per_page: perPage,
      ...payload,
    })

    const { data, headers } = request

    if (data) {
      await this.cache(request, cacheParams)

      const posts = Object.values(data)
        .map(post => this.turnURLRelative('link', post))
        .map(this.renderContent)

      return  {
        posts,
        headers,
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
        const { restBase } = params
        const response = await this.getPostsFrom(restBase, {
          params: {
            ...params,
          }
        }, options)

        if (response) {
          return formatResponse(response)
        }

        break
      }
      // no default
    }

    return false
  }

  async getMenus(params = {}, options = {}) {
    const cacheParams = {
      method: 'getMenus',
      ...params,
    }
    const endpoint = `/wp-json/wp-api-menus/v2/menus`
    const cached = await this.getCached(endpoint, cacheParams)
    const response = cached ? cached : await this.get(endpoint, params)

    if (response) {
      !cached && await this.cache(response, cacheParams, { always: true })

      return response.data
    } else {
      return this.onError(new MenuLoadError('Unable to load menus'))
    }
  }

  async getMenu(menu_id, params = {}, options = {}) {
    const cacheParams = {
      method: 'getMenu',
      ...params,
    }
    const endpoint = `/wp-json/wp-api-menus/v2/menus/${menu_id}`
    const cached = await this.getCached(endpoint, cacheParams)
    const response = cached ? cached : await this.get(endpoint, params)

    console.log(response)

    if (response) {
      const { data } = response
      !cached && await this.cache(response, cacheParams, { always: true })

      if (data.items) {
        return {
          ...data,
          items: data.items.map(item => this.turnURLRelative('url', item)),
        }
      }
    }

    return this.onError(new MenuLoadError('Unable to load menu'))
  }

  async getArchives(params = {}, options = {}) {
    const cacheParams = {
      method: 'getMenu',
      ...params,
    }
    const endpoint = '/wp-json/emp/v1/archives'
    const cached = await this.getCached(endpoint, cacheParams)
    const response = cached ? cached : await this.get(endpoint, params)

    if (response) {
      await this.cache(response, cacheParams)
      return response.data
    }

    return this.onError(new ArchiveLoadError('Unable to load archives'))
  }

  async query(params = {}, options = {}) {
    // not used anywhere, might be broken

    const cacheParams = {
      method: 'query',
      ...params,
    }
    const endpoint = '/wp-json/wp_query/args/'
    const cached = await this.getCached(endpoint, cacheParams)
    const response = cached ? cached : await this.get(endpoint, params)

    if (response) {
      await this.cache(response, cacheParams)
      return response
    }

    return this.onError(new Error('????? query error'))
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

  async getMedia(id) {
    return await this.req(`/wp-json/wp/v2/media/${id}`)
  }

  async getUser(id) {
    return await this.req(`/wp-json/wp/v2/users/${id}`)
  }

  async getByURL(url, params) {
    const cacheParams = {
      method: 'getByURL',
      url,
      params,
    }

    const endpoint = '/wp-json/rpl/v1/lookup'
    const cached = await this.getCached(endpoint, cacheParams)
    const request = cached ? cached : await this.get(endpoint, {
      params: {
        ...params,
        url,
      }
    })

    const { data } = request

    if (data) {
      const { error } = data

      if (error) {
        if (error === 'No post found.') {
          return new LookupError(error)
        }

        return error
      }

      const featuredImage = !data.featured_media ? false : [await this.getMedia(data.featured_media)]
      const author = !data.author ? false : [await this.getUser(data.author)]
      const post = {
        ...data,
        _embedded: {
          'wp:featuredmedia': featuredImage || [],
          'author': author || [],
        }
      }

      if (!data.__cached) {
        await this.cache(request, cacheParams)
      }

      return this.renderContent(post)
    }
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
    const user = this.user || await this.getCurrentUser() // this.user is null on initial req
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

  addCacheMeta(data, meta = {}) {
    const cacheTime =  Date.now()
    return {
      data: {
        ...data,
        __cached: cacheTime,
      },
      meta: {
        always: false,
        cacheTime,
        cacheExpiry: 1000 * 60 * 10, // 10 minutes
        ...meta,
      }
    }
  }

  async cacheKey(params = {}) {
    const user = await this.getCurrentUser()

    return [
      this.cacheKeyPrefix,
      params,
      omit(user, 'token'),
    ].map(i => JSON.stringify(i)).join('_')
  }

  async getCached(endpoint, params) {
    const key = await this.cacheKey(params)

    try {
      const cached = JSON.parse(await requestCache.getItem(key))

      if (cached) {
        const { cacheTime, cacheExpiry, always } = cached.meta

        if (!always && process.env.NODE_ENV !== 'production') {
          return false
        }

        console.log('hit cache', endpoint, cached)
        if (Date.now() - cacheTime < cacheExpiry) {
          return cached.data
        } else {
          console.log('Cache stale for', endpoint)

          if (this.offline) {
            // Return the data anyway, user should see an offline indicator
            return cached.data
          }
        }
      }

      console.log('cache miss', endpoint)
      return false
    } catch(e) {
      return this.onError(e)
    }
  }

  async cache(request, params, options = {}) {
    const key = await this.cacheKey(params)
    const withMeta = JSON.stringify(this.addCacheMeta(request, options))

    try {
      await requestCache.setItem(key, withMeta)
      return true
    } catch (e) {
      // TODO: Ignore if it's Safari complaining in private browsing
      return this.onError(e)
    }
  }

  async get(url, payload = {}) {
    try {
      // parse url, remove querystrings and append them to payload
      const [endpoint, qs] = url.split('?')
      const response = await axios.get(`${this.url}${endpoint}`, {
        // params: {
          ...queryString.parse(qs),
          ...payload,
        // }
      })

      return response
    } catch (e) {
      return this.onError(e)
    }
  }

  async post(url, payload = {}) {
    try {
      const endpoint = url
      const response = await axios.get(`${this.url}${endpoint}`, payload)

      return response
    } catch (e) {
      return this.onError(e)
    }
  }
}

const WP = new WP_Client(getWPURL())
window.WP = WP

export default WP
