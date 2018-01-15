import React, { Component } from 'react'
import { searchSidebar } from '../components/Sidebar'
import WP, { connect } from '../lib/WP'
import { ResolverError, Error404, FatalError404, Forbidden, MenuLoadError, LookupError } from '../errors'

import Error from './Error'
import Loading from './Loading'

class Resolver extends Component {
  constructor() {
    super()

    this.state = {
      ready: false,
      crashed: false,

      // These will determine what will be rendered:
      // The component and it's props!
      ViewComponent: null,
      ViewComponentProps: {
        disableTransition: true,
      },
    }
  }

  async showComponent(component, componentProps, merge = false) {
    // Transition the element out. React will re-render after setState,
    // reseting this and transitioning again.
    const wrapper = document.querySelector('.application__wrapper')
    if (!componentProps.disableTransition) {
      wrapper.classList.add('lightSpeedOut')
      await new Promise((resolve) => setTimeout(resolve, 300))
    } else {
      wrapper.classList.remove('animated')
      wrapper.classList.remove('lightSpeedIn')
    }


    this.setState({
      ViewComponent: component.default || component, // Support dynamic imports
      ViewComponentProps: {
        // In some cases you might want to merge the old and new props
        // But that's an insane default behaviour, so nah.
        ...(merge ? this.state.ViewComponentProps : {}),
        ...componentProps,
      },
      ready: true,
    }, () => {
      // wrapper.classList.add('animated', 'lightSpeedIn')
    })
  }

  async wpErrorHandler(error) {
    console.log('Resolver::wpErrorHandler', error)

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
        break
      }

      case LookupError: {
        // sshhh, it'll all be over soon

        return new Error404(`Query didn't find any results.`)
      }

      case Error404: {
        this.setState({
          ViewComponentProps: {
            ...this.state.ViewComponentProps,
            disableTransition: true,
            sidebar: searchSidebar
          }
        })
        break // Stop the switch but fall down!
      }

      case FatalError404: {
        this.setState({
          crashed: { error }
        })
        break
      }

      // no default
    }

    // For errors that are not custom.
    switch (error.name) {
      case 'QuotaExceededError': {
        this.setState({
          crashed: {
            error: {
              ...error,
              name: 'ApplicationIsGreedy',
              message: `Is your disk full? This error shouldn't be shown, as it's a cache error and should die silently.`,
            }
          },
        })

        return
      }

      // no default
    }

    // Keep the props from previous view in case of error
    // It'll help track down the cause of the bug if there's one.
    // In production you might want to disable this and/or use something like Sentry.
    return this.showComponent(
      Error,
      {
        ...this.state.ViewComponentProps,
        error
      },
      false // process.env.NODE_ENV === 'production' instead of true to disable in prod
    )
  }

  async doRouting({ location }) {
    try {
      const url = WP.getWPURL() + location.pathname

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

      // Just add custom post types and taxonomies here as they appear.

      const postTypeArchive = findObjectByProp('archive_link', url, archives.post_types);
      const categoryArchive = findObjectByProp('archive_link', url, archives.taxonomies.category);
      const postTagArchive = findObjectByProp('archive_link', url, archives.taxonomies.post_tag);
      const allArchives = [postTypeArchive, categoryArchive, postTagArchive]
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
        const { type } = post
        const componentProps = {}

        // post can contain a value or it can be undefined, but if it's an error
        // don't put it into the component
        if (post instanceof LookupError) {
          // This only means that no post was found with the URL, can't return yet
        } else {
          componentProps.post = post
        }

        switch (location.pathname) {
          case '/about/': {
            return this.showComponent(await import('./About'), componentProps)
          }

          case '/slides/': {
            console.log('no nonono')
            return this.showComponent(await import('./Slides'), componentProps)
          }

          case '/': {
            if (post.isBlogpage) {
              return this.showComponent(await import('./Blog'), componentProps)
            } else if (post.isHomepage) {
              return this.showComponent(await import('./Home'), componentProps)
            } else {
              console.log(
                `Root post wasn't blog or homepage.
  Is k1sul1/expose-more-pagedata-in-rest installed and activated in WordPress?`,
                post
              )
              return this.showComponent(await import('./Home'), componentProps)
            }
          }

          default: {

          }
        }

        switch (type) {
          case "post": {
            return this.showComponent(await import('./Singular'), componentProps)
          }

          case "page": {
            if (post.isBlogpage) {
              return this.showComponent(await import('./Blog'), componentProps)
            } else if (post.isHomepage) {
              return this.showComponent(await import('./Home'), componentProps)
            }

            return this.showComponent(await import('./Page'), componentProps)
          }

          case "slides": {
            console.log('yesyesyes', componentProps)
            return this.showComponent(await import('./Slides'), componentProps)
          }

          // default: {
            // return this.showComponent(await import('./Index'), {})
          // }
          // no default
        }

        if (post instanceof LookupError) {
          return this.wpErrorHandler(new Error404(post.message))
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
