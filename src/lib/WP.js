import axios from 'axios'
import localforage from 'localforage'
import p from  '../../package.json'

class WP_Client {
  constructor(url = undefined) {
    this.url = url || '' // Use relative urls, assume current domain
    this.offline = !navigator.onLine
    this.cacheKeyPrefix = 'WP_Client'

    window.addEventListener('online', this)
    window.addEventListener('offline', this)
  }

  handleEvent(e) {
    this[`on${e.type}`](e)
  }

  onError(error, type = 'general', severe = false) {
    console.log(`${severe ? 'Severe error' : 'Error'}: ${type}`, error)

    if (severe) {
      // Crash application
      throw error
    }
  }


  onoffline(e) {
    this.offline = true
    console.log('WP_Client: Switched to offline mode.')
  }

  ononline(e) {
    this.offline = false
    console.log('WP_Client: Switched to online mode.')
  }

  turnURLRelative(key, obj) {
    obj[key] = obj[key].replace(p.WPURL, '')

    return obj
  }


  getCacheKey(endpoint, payload, options) {
    return [
      this.cacheKeyPrefix,
      endpoint,
      JSON.stringify(payload),
      JSON.stringify(options),
    ].join('_')
  }

  async req(endpoint, payload = {}, options = {}) {
    const opts = {
      raw: false,
      method: 'get',
      preferCache: false,
      cacheStaleTime: 3600000 * 3, // 3 hours

      ...options, // Overwrite the defaults
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

    if (this.offline || opts.preferCache) {
      const cached = await localforage.getItem(cacheKey).catch(e => {
        return this.onError(e, 'cache')
      })

      if (cached) {
        const { cacheTime } = cached.meta

        if (Date.now() - cacheTime < opts.cacheStaleTime) {
          return cached.data
        } else {
          // Cache stale!
          if (this.offline) {
            // Better something than nothing?
            return cached.data
          }
        }
      }
    }

    try {
      const response = await axios[opts.method](`${this.url}${endpoint}`, payload)

      // If a raw response wasn't requested, return the data only
      // Could also implement a method that returns the last request (by storing the last req)
      if (!opts.raw) {
        await localforage.setItem(cacheKey, addCacheMeta(response.data)).catch((e) => this.onError(e, 'cache'))
        return response.data
      }

      await localforage.setItem(cacheKey, addCacheMeta(response)).catch((e) => this.onError(e, 'cache'))
      return response
    } catch(e) {
      return this.onError(e, 'axios')
    }
  }

  async getByURL(url, params, options) {
    return await this.req(`/wp-json/rpl/v1/lookup`, {
      params: {
        url,
        ...params,
      }
    }, options)
  }

  async getPostsFrom(type = 'posts', payload = {}, options = {}) {
    const posts = await this.req(`/wp-json/wp/v2/${type}`, payload, options)

    return posts.map(post => this.turnURLRelative('link', post))
  }

  async getPages(payload = {}, options = {}) {
    return await this.getPostsFrom('pages', payload, options)
  }

  async getPosts(payload = {}, options = {}) {
    return await this.getPostsFrom('posts', payload, options)
  }

  async getMenus(params = {}, options = {}) {
    return await this.req(`/wp-json/wp-api-menus/v2/menus`, params, options)
  }

  async getMenu(menu_id, params = {}, options = {}) {
    const menu = await this.req(`/wp-json/wp-api-menus/v2/menus/${menu_id}`, params, {
      preferCache: true,
      ...options
    })

    return {
      ...menu,
      items: menu.items.map(item => this.turnURLRelative('url', item)),
    }
  }

  async getArchives() {
    return await this.req('/wp-json/emp/v1/archives')
  }

  async query(params = {}, options = {}) {
    return await this.req('/wp-json/wp_query/args/', params, options)
  }
}

const WP = new WP_Client(p.WPURL)
export default WP
