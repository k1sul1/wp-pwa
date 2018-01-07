import React, { Component } from 'react'
import WP from '../lib/WP'
import p from '../../package.json'

// import Index from './Index'
// import About from './About'
// import Page from './Page'
// import Blog from './Blog'
// import Archive from './Archive'
// import Home from './Home'
// import Singular from './Singular'

import Loading from './Loading'
import FourOhFour from './404'
import NothingToSeeHereMoveAlong from './Crashed'

export default class Resolver extends Component {
  constructor() {
    super()

    this.state = {
      ready: false,
      ViewComponent: null,
      ViewComponentProps: {},
      crashed: false,

    }
  }

  showComponent(component, componentProps) {
    this.setState({
      ViewComponent: component.default || component, // Support dynamic imports
      ViewComponentProps: {
        ...componentProps,
      },
      ready: true,
    })
  }

  show404(props = {}) {
    return this.showComponent(FourOhFour, props)
  }

  async getSingularByURL(url) {
    const post = await WP.getByURL(url, {}, {
      preferCache: true,
      cacheStaleTime: 3600000, // 1 hour
    })

    if (!post) {
      return false
    }

    if (post.error) {
      const { error } = post
      console.error(error)

      if (error === 'No post found.') {
        return 404
        // return this.show404({ error })
      }

      throw error
    } else {
      return post;
    }
  }

  async doRouting({ location }) {
    console.log(location)

    try {
      const url = p.WPURL + location.pathname

      const cacheSettings = {
        preferCache: true,
        cacheStaleTime: 60 * 1000 * 10,
      }
      const [archives, post] = await Promise.all([
        WP.getArchives({}, cacheSettings),
        this.getSingularByURL(url, {}, cacheSettings),
      ]);

      const findObjectByProp = (key, compare, arr) => {
        if (!Array.isArray(arr)) {
          console.log(arr)
          return false
        }

        const result = arr.filter(item => item[key] && item[key] === compare ? true : false)

        if (result.length) {
          return result.pop()
        }

        return false
      }

      const postTypeArchive = findObjectByProp('archive_link', url, archives.post_types);
      const categoryArchive = findObjectByProp('archive_link', url, archives.taxonomies.category);
      const allArchives = [postTypeArchive, categoryArchive]
      const isArchive = allArchives.some(Boolean)

      if (isArchive) {
        if (post) {
          if (post.isBlogpage) {
            console.log('returning blog early');
            return this.showComponent(await import ('./Blog'), { post })
          }
        }

        console.log('isArchive', post);
        return this.showComponent(await import('./Archive'), {
          archive: allArchives.find(Boolean)
        })
      } else if (post) {
        // Page templates are pretty much based on the slug.
        // This ought to be enough for many. It's possible to use black magic
        // and Webpack to reproduce the page-[slug].php behaviour, but
        // create-react-app doesn't support it and nags if you try to.
        if (post === 404) {
          this.show404({ error: 'Post not found.' })
        }

        const { type } = post

        switch (location.pathname) {
          case '/about/': {
            return this.showComponent(await import('./About'), { post })
          }

          case '/slides/': {
            return this.showComponent(await import('./Slides'), { post })
          }

          case '/': {
            if (post.isBlogpage) {
              return this.showComponent(await import('./Blog'), { post })
            } else if (post.isHomepage) {
              return this.showComponent(await import('./Home'), { post })
            } else {
              console.log(
                `Root post wasn't blog or homepage.
  Is k1sul1/expose-more-pagedata-in-rest installed and activated in WordPress?`,
                post
              )
              return this.showComponent(await import('./Home'), { post })
            }
          }

          default: {

          }
        }

        switch (type) {
          case "post": {
            return this.showComponent(await import('./Singular'), { post })
          }

          case "page": {
            if (post.isBlogpage) {
              return this.showComponent(await import('./Blog'), { post })
            } else if (post.isHomepage) {
              return this.showComponent(await import('./Home'), { post })
            }

            return this.showComponent(await import('./Page'), { post })
          }

          case "slides": {
            return this.showComponent(await import('./Slides'), { post })
          }

          default: {
            return this.showComponent(await import('./Index'), {})
          }
        }
      }
    } catch (e) {
      // console.log(e)
      throw e
    }
  }

  async componentDidMount() {
    this.doRouting(this.props)
  }

  async componentWillReceiveProps(props) {
    // console.log(props)
    this.doRouting(props)
  }

  componentDidCatch(error, info) {
    this.setState({
      crashed: true,
    })

    console.log(error, info)
  }


  render() {
    const {
      ready,
      crashed,
      ViewComponent,
      ViewComponentProps,
    } = this.state

    if (crashed) {
      return <NothingToSeeHereMoveAlong />
    }

    return ready
      ? <ViewComponent {...ViewComponentProps} />
      : <Loading />

  }
}
