import React, { Component } from 'react'
import { searchSidebar } from '../components/Sidebar'
import WP from '../lib/WP'
import { ResolverError, Error404, FatalError404, Forbidden, MenuLoadError, LookupError } from '../errors'

import Error from './Error'
import Loading from './Loading'

class Resolver extends Component {
  constructor() {
    super()

    this.state = {
      ready: false,
      crashed: false,

      navigation: {
        open: false,
        ready: false,
        error: false,
        items: [],
        toggleMenu: () => {
          this.setState(prevState => {
            const clone = Object.assign({}, prevState)

            const newState = Object.assign(clone, {
              navigation: {
                ...clone.navigation,
                open: !clone.navigation.open
              }
            })
            console.log(newState)
            this.setState(newState)
            /* return ({
              navigation: {
                ...prevState.navigation,
                open: !prevState.navigation.open, // Invert the current value
              }
            }) */
          })
        },
      },

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
    console.log('find out how to disable the transition for the first load')

    const wrapper = document.querySelector('.application__wrapper')
    console.log(wrapper)
    if (!componentProps.disableTransition) {
      wrapper.classList.add('fadeOut')
      await new Promise((resolve) => setTimeout(resolve, 300))

      // re-render handles most cases, but not everything causes a re-render
      wrapper.classList.remove('fadeOut')
    } else {
      wrapper.classList.remove('animated')
      wrapper.classList.remove('fadeIn')
    }

    console.log(componentProps, { ...componentProps, navigation: this.state.navigation })

    this.setState({
      ViewComponent: component.default || component, // Support dynamic imports
      ViewComponentProps: {
        // In some cases you might want to merge the old and new props
        // But that's an insane default behaviour, so nah.
        ...(merge ? this.state.ViewComponentProps : {}),
        ...componentProps,
        navigation: this.state.navigation,
      },
      ready: true,
    }, () => {
      // wrapper.classList.add('animated', 'fadeIn')
    })
  }

    async wpErrorHandler(error) {
      console.log('Resolver::wpErrorHandler', error)

      switch (error.constructor) {
        case MenuLoadError: {
          this.setState({
            navigation: {
              ...this.state.navigation,
              error: error.message,
            }
          })
          return
        }

        case Forbidden: {
          // This could be a naughty user. Unmount everything and demand login.
          this.setState({
            crashed: { error },
          })
          break
        }

        case LookupError: {
          // Nothing matched the requested URL.
          // Exchange the error for a generic one.
          return new Error404(`Query didn't find any results.`)
        }

        case Error404: {
          this.setState({
            ViewComponentProps: {
              ...this.state.ViewComponentProps,
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
              message: `Is your disk full? This error shouldn't be shown,
              as it's a cache error and should die silently.`,
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
    return this.showComponent(Error, { error }, true) // process.env.NODE_ENV === 'production' instead of true to disable in prod
  }

  async doRouting({ location }) {
    try {

      if (location.search) {
        console.error('hey you should probably handle these params')
      }
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
            return this.showComponent(await import ('./Blog'), { post })
          }
        }

        return this.showComponent(await import('./Archive'), {
          archive: allArchives.find(Boolean)
        })
      } else if (post) {
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
    WP.connectErrorHandler(this.wpErrorHandler.bind(this))
    this.doRouting(this.props)

    const menu = await WP.getMenu(3)

    if (menu) {
      const { items } = menu

      this.setState({
        navigation: {
          ...this.state.navigation,
          items,
          ready: true,
        }
      })
    }
  }

  async componentWillReceiveProps(props) {
    console.log(props, this.props)
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
      ? <ViewComponent {...ViewComponentProps} navigation={this.state.navigation}/>
      : <Loading />
  }
}

export default Resolver
