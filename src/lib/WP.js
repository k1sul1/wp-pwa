import axios from 'axios'
import localforage from 'localforage'
import omit from 'lodash.omit'
import queryString from 'query-string'
import NProgress from 'nprogress'

import { isDevelopment, renderHTML, taxonomyRESTBase } from '../lib/helpers'
import p from  '../../package.json'
import {
  MenuLoadError,
  ArchiveLoadError,
  LookupError,
  FatalError404,
  // Forbidden,
  Unauthorized,
  OfflineError
} from '../errors'

NProgress.configure({
  easing: 'linear',
  speed: 350
})
/*
 * Store for data that can be gotten rid of at any time.
 */
const requestCache = localforage.createInstance({
  name: 'requestCache',
})

/*
 * Store for data that shouldn't be invalidated between builds.
 * User info & preferences for example.
 */
const dataStore = localforage.createInstance({
  name: 'dataStore',
})

/*
 * Helper for getting the correct instance URL.
 */
export const getWPURL = () => {
  return p.prodWP

  const urls = [p.prodWP, p.devWP]
  const index = urls.indexOf(window.location.origin)
  if (index > -1) {
    return urls[index]
  } else if (process.env.NODE_ENV === 'production') {
    return p.prodWP
  } else {
    return p.devWP
  }
}

/*
 * WP_Client is the abstraction between WordPress and the application.
 * It gives you data.
 */
class WP_Client {
  constructor(url = undefined) {
    this.offline = !navigator.onLine
    this.saveIntoReqCache = true
    this.cacheLogging = false
    this.errorHandler = null
    this.user = null
    this.axios = axios.create({
      baseURL: url || '', // Use relative urls
      validateStatus: status => {
        // 403 and 401 shouldn't fall into catch

        const successRange = status >= 200 && status < 300
        const exceptions = status === 403 || status === 401

        return successRange || exceptions
      },
      transformRequest: [
        function (data, headers) {
          NProgress.start()
          return data
        },
      ],
      /* transformResponse: [
        function (data) {
          NProgress.done()
          return data
        },
      ], */
    })

    this.setUser() // Async, will not be ready with the first request
    this.addNetworkStatusListeners(this)
    this.addAuthenticationListeners(this)
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

  /*
   * Bind the user to the class instance. For authentication.
   */
  async setUser() {
    const user = await this.getCurrentUser()

    if (user) {
      this.user = user

      window.dispatchEvent(new CustomEvent('authenticated', {
        detail: {
          response: user
        }
      }))
    }
  }

  async getCurrentUser() {
    const user = await dataStore.getItem('user')

    if (user) {
      return user
    }

    return false
  }

  /*
   * Error handler, will pass any unhandled errors into registered error handler.
   * (Resolver.js)
   */
  async onError(error) {
    if (error.name === 'QuotaExceededError') {
      console.log(error) // Private browsing or disk full? Fail silently.
      this.saveIntoReqCache = false
      return false
    }

    switch (error.message) {
      case 'Network Error': {
        return this.onError(new OfflineError('Unable to connect to network'))
      }

      case 'Request failed with status code of 404': {
        return this.onError(new FatalError404('No endpoint found.'))
      }

      // no default
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
    if (this[`on${e.type}`]) {
      this[`on${e.type}`](e)
    }
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
    const response = await this.post('/wp-json/simple-jwt-authentication/v1/token', {
      username,
      password,
    })

    if (response) {
      const { data } = response

      if (data && data.token) {
        window.dispatchEvent(new CustomEvent('authenticated', {
          detail: {
            response: data,
          },
        }))
        return true
      }
    }

    // maybe return a custom error
    return false
  }

  async validateAuthentication(token) {
    const response = await this.post('/wp-json/simple-jwt-authentication/v1/validate', {}, {
      validateStatus: (status) => (status >= 200 && status < 300) || (status >= 401 && status <= 403),
      headers: {
        'Authorization': `Bearer ${token}`
      },
    })

    if (response) {
      const { status } = response

      if (status === 200) {
        return true
      }
    }

    return false
  }


  /*
   * Wrap data with meta before caching for invalidation and settings.
   */
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
    const key = [
      // TODO: get commit or build hash and invalidate cache based on it
      params,
      omit(user, 'token'),
    ].map(i => JSON.stringify(i)).join('_')

    return key
  }

  async getCached(endpoint, params) {
    const key = await this.cacheKey(params)

    try {
      const cached = JSON.parse(await requestCache.getItem(key))

      if (cached) {
        const { cacheTime, cacheExpiry, always } = cached.meta

        if (!always && isDevelopment) {
          return false
        }

        this.cacheLogging && console.log('hit cache', endpoint, cached)
        if (Date.now() - cacheTime < cacheExpiry) {
          return cached.data
        } else {
          this.cacheLogging && console.log('Cache stale for', endpoint)

          if (this.offline) {
            // Return the data anyway, user should see an offline indicator
            return cached.data
          }
        }
      }

      this.cacheLogging && console.log('cache miss', endpoint)
      return false
    } catch(e) {
      return this.onError(e)
    }
  }

  async cache(request, params, options = {}) {
    if (!this.saveIntoReqCache) {
      return false
    }

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

  /*
   * Transform selected key in provided object, stripping WP URL from it.
   */
  turnURLRelative(key, obj) {
    obj[key] = obj[key].replace(this.getWPURL(), '')

    return obj
  }

  /*
   * Render everything inside post object to React elements.
   * Never cache the output of this function!
   */
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

  /*
   * Generic function to get posts from given post type with given params.
   */
  async getPostsFrom(type = 'posts', payload = {}, options) {
    const endpoint = `/wp-json/wp/v2/${type}`

    const cacheParams = {
      method: 'getPostsFrom',
      type,
      payload,
    }

    const cached = await this.getCached(endpoint, cacheParams)
    const request = cached ? cached : await this.get(endpoint, {
      ...payload,
      _embed: 1,
    }, options)

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

  /*
   * Fetch data based on context.
   */
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
          [taxonomyRESTBase(taxonomy)]: term_id,
          ...params,
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
          ...omit(params, 'restBase'),
        }, options)

        if (response) {
          return formatResponse(response)
        }

        break
      }

      case 'comments': {
        const response = await this.getPostsFrom('comments', params)

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

    if (response) {
      const { data } = response
      !cached && await this.cache(response, cacheParams, { always: false })

      if (data.items) {
        return {
          ...data,
          items: data.items.map(item => this.turnURLRelative('url', item)),
        }
      }
    }

    return this.onError(new MenuLoadError('Unable to load menu'))
  }

  /*
   * Load all archives using a custom endpoint.
   */
  async getArchives(params = {}, options = {}) {
    const cacheParams = {
      method: 'getArchives',
      ...options,
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

  /*
   * WP_Query on the client side.
   */
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

      const data = Object.values(response.data)
        .map(post => this.turnURLRelative('link', post))
        .map(this.renderContent)

      return {
        ...response,
        data,
      }
    }

    return this.onError(new Error('????? query error'))
  }

  async getMedia(id) {
    const response = await this.get(`/wp-json/wp/v2/media/${id}`)

    if (response) {
      return response.data
    }

    return false
  }

  async getUser(id) {
    const response = await this.get(`/wp-json/wp/v2/users/${id}`)

    if (response) {
      return response.data
    }

    return false
  }

  /*
   * Query the custom permalink endpoint with an URL.
   * Fill in missing data because WP is buggy.
   */
  async getByURL(url, options) {
    const cacheParams = {
      method: 'getByURL',
      url,
      options,
    }
    const cacheOpts = {}

    if (url.indexOf('preview=true') > -1) {
      cacheOpts.cacheTime = 0
    }

    const endpoint = '/wp-json/rpl/v1/lookup'
    const cached = await this.getCached(endpoint, cacheParams)
    const request = cached ? cached : await this.get(endpoint, {
      url,
    })

    if (request) {
      const { data } = request
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

      !cached &&  await this.cache(request, cacheParams, cacheOpts)

      return this.renderContent(post)
    }

    return false
  }

  /*
   * Append authentication header to headers if user is authenticated.
   */
  async addAuthHeader(headers) {
    const user = this.user || await this.getCurrentUser() // this.user is null on initial req
    const expiry = user ? user.token_expires : 0
    const jwt = user ? user.token : false

    if (jwt && expiry * 1000 > Date.now()) {
      headers['Authorization'] = `Bearer ${jwt}`
    }

    return headers
  }

  /*
   * Perform a GET request using axios
   */
  async get(url, payload = {}, config = {}) {
    const headers = await this.addAuthHeader(config.headers || {})

    try {
      // parse url, remove querystrings and append them to payload
      const [endpoint, qs] = url.split('?')
      const response = await this.axios.get(
        endpoint,
        {
          ...config,
          params: {
            ...queryString.parse(qs),
            ...payload,
          },
          headers,
        }
      )

      const { status } = response
      if (status === 401 || status === 403) {
        return this.onError(new Unauthorized('Resource requires authentication'))
      }

      return response
    } catch (e) {
      return this.onError(e)
    } finally {
      NProgress.done()
    }
  }

  /*
   * Perform a POST request using axios
   */
  async post(url, payload = {}, config = {}) {
    const headers = await this.addAuthHeader(config.headers || {})

    try {
      const endpoint = url
      const response = await this.axios.post(endpoint, payload, {
        ...config,
        headers
      })

      const { status } = response
      if (status === 401 || status === 403) {
        return this.onError(new Unauthorized('Resource requires authentication'))
      }

      return response
    } catch (e) {
      return this.onError(e)
    } finally {
      NProgress.done()
    }
  }
}

const WP = new WP_Client(getWPURL())

window.WP = WP
export default WP
