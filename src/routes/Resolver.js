import React, { Component, Fragment } from 'react'
import WP, { connect } from '../lib/WP'
import { ResolverError, Error404, Forbidden, MenuLoadError } from '../errors'
import p from '../../package.json'

// import Index from './Index'
// import About from './About'
// import Page from './Page'
// import Blog from './Blog'
// import Archive from './Archive'
// import Home from './Home'
// import Singular from './Singular'

import Error from './Error'
import Loading from './Loading'
import SearchForm from '../components/SearchForm'


class Resolver extends Component {
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

  async wpErrorHandler(error) {
    console.log(error, error.constructor, error.name, error.message)

    switch (error.constructor) {
      case MenuLoadError: {
        this.setState({
          ViewComponentProps: {
            ...this.state.ViewComponentProps,
            navigation: {
              error: error.message,
            }
          }
        })
        return
      }

      case Forbidden: {
        // Uh oh.
        this.setState({
          crashed: { error },
        })
        return
      }

      case Error404: {
        this.setState({
          ViewComponentProps: {
            ...this.state.ViewComponentProps,
            sidebar: {
              children: (
                <Fragment>
                  <h2>Try the search</h2>

                  <SearchForm />
                </Fragment>
              )
            }
          }
        })
        // return
        break // Stop the switch but fall down!
      }


      // no default
    }

    // For errors that are not custom.
    switch (error.name) {
      case 'QuotaExceededError': {
        console.log('Using too much storage? Is your disk full?')
        this.setState({
          crashed: {
            error: {
              ...error,
              name: 'ApplicationIsGreedy',
              message: 'Is your disk full? This error shouldn\'t be shown.',
            }
          },
        })

        return
      }

      // no default
    }

    return this.showComponent(Error, {
      ...this.state.ViewComponentProps,
      error
    })
  }

  async doRouting({ location }) {
    try {
      const url = p.WPURL + location.pathname

      const cacheSettings = {
        // preferCache: true,
        cacheStaleTime: 60 * 1000 * 10,
      }
      const [archives, post] = await Promise.all([
        WP.getArchives({}, cacheSettings),
        WP.getByURL(url, {}, cacheSettings),
        // this.getSingularByURL(url, {}, cacheSettings),
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

      if (!archives) {
        // console.log('no', archives)
        return this.wpErrorHandler(
          new ResolverError('Unable to load archive page data, which is required for the routing to work')
        )
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
        // if (post === 404) {
          // this.show404({ error: 'Post not found.' })
        // }
        // if (post instanceof 'Error404') {
          // throw post
        // }
        if (post.name === 'Error404') {
          throw post
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

          // default: {
            // return this.showComponent(await import('./Index'), {})
          // }
          // no default
        }
      }
    } catch (e) {
      // console.log(e)
      throw e
    }
  }

  async componentDidMount() {
    this.props.WP.connectErrorHandler(this.wpErrorHandler.bind(this))
    this.doRouting(this.props)
  }

  async componentWillReceiveProps(props) {
    // console.log(props)
    this.doRouting(props)
  }

  componentWillUnmount() {
    this.props.WP.disconnectErrorHandler()
  }

  componentDidCatch(error, info) {
    this.setState({
      crashed: { error },
    })

    console.log(error, info)
  }


  render() {
    const { ready, crashed, ViewComponent, ViewComponentProps } = this.state

    if (crashed) {
      return <Error {...crashed } />
    }

    return ready
      ? <ViewComponent {...ViewComponentProps} />
      : <Loading />
  }
}

// export ResolverError
export default connect(Resolver)
