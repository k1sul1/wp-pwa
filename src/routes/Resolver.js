import React, { Component } from 'react'
import ExtendableError from 'es6-error'
import debounce from 'debounce'

import { searchSidebar, defaultSidebar } from '../components/Sidebar'
import WP from '../lib/WP'
import {
  ResolverError,
  Error404,
  FatalError404,
  Forbidden,
  MenuLoadError,
  LookupError,
  Unauthorized,
  OfflineError
} from '../errors'

import Error from './Error'
import Loading from './Loading'

class Resolver extends Component {
  constructor() {
    super()

    this.state = {
      ready: false,
      crashed: false,
      authenticationRequired: false,

      sidebar: defaultSidebar({
        open: window.innerWidth > 768,
        onClick: (e) => this.maybeToggleSidebar(e),
      }),

      navigation: {
        open: false,
        ready: false,
        error: false,
        items: [],
        toggleMenu: () => {
          this.setState(prevState => {
            return ({
              navigation: {
                ...prevState.navigation,
                open: !prevState.navigation.open, // Invert the current value
              }
            })
          })
        },
      },

      // These will determine what will be rendered
      ViewComponent: null,
      ViewComponentProps: {
        disableTransition: false,
      },
    }
  }

  maybeToggleSidebar(e) {
    // e.preventDefault() // Enabling prevents onSubmit from working in LoginForm
    if (e.target.tagName !== 'ASIDE') {
      return
    }

    if (window.innerWidth <= 768) {
      const newState = {
        sidebar: {
          ...this.state.sidebar,
          open: !this.state.sidebar.open,
        }
      }

      this.setState(newState)
    }
  }

  resize(e) {
    if (window.innerWidth > 768) {
      this.setState({
        sidebarOpen: true
      })
    } else {
      this.setState({
        sidebarOpen: false
      })
    }
  }

  onresize = debounce((e) => this.resize(e), 100)

  handleEvent(e) {
    console.log(e)
    this[`on${e.type}`](e)
  }

  async showComponent(component, componentProps = {}, merge = false) {
    // Transition the element out. React will re-render after setState,
    // reseting this and transitioning again.

    const wrapper = document.querySelector('.application__wrapper')
    if (wrapper) {
      if (!componentProps.disableTransition) {
        wrapper.classList.add('fadeOut')
        await new Promise((resolve) => setTimeout(resolve, 300))

        // re-render handles most cases, but not everything causes a re-render
        wrapper.classList.remove('fadeOut')
      } else {
        wrapper.classList.remove('animated')
        wrapper.classList.remove('fadeIn')
      }
    }

    this.setState({
      ViewComponent: component.default || component, // Support dynamic imports
      ViewComponentProps: {
        // In some cases you might want to merge the old and new props
        // But that's an insane default behaviour, so nah.
        ...(merge ? this.state.ViewComponentProps : {}),
        ...componentProps,
        // navigation: this.state.navigation,
      },
      ready: true,
    })

    return
  }

    async wpErrorHandler(error) {
      console.log('Resolver::wpErrorHandler', error)
      // this.props.history contains additional helpful data

      switch (error.constructor) {
        case MenuLoadError: {
          this.setState({
            navigation: {
              ...this.state.navigation,
              error: error.message,
            }
          })

          return false
        }

        case Forbidden: {
          this.setState({
            authenticationRequired: true,
          })

          return false
        }

        case Unauthorized: {
          this.setState({
            authenticationRequired: true,
          })

          return false
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
              // sidebar: searchSidebar
            },
            // sidebar: {
              // ...this.state.sidebar,
              // ...searchSidebar()
            // },
            sidebar: searchSidebar(this.state.sidebar)
          })
          break // Stop the switch but fall down!
        }

        case FatalError404: {
          this.setState({
            crashed: { error }
          })
          break
        }

        case OfflineError: {
        console.log(`
You can just swallow OfflineError by returning before the error page is displayed.

That gets rid of the OfflineError flash when offline. Other error handling will kick in if content isn't found.`)

          // return // uncomment to swallow error
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

  async route({ location }) {
    try {
      const url = WP.getWPURL() + location.pathname + location.search
      const cacheSettings = {
        cacheStaleTime: 60 * 1000 * 10,
      }
      let [post, archives] = await Promise.all([
        WP.getByURL(url, cacheSettings),
        WP.getArchives({}, cacheSettings),
      ])
      const findObjectByProp = (key, compare, arr) => {
        if (!Array.isArray(arr)) {
          return false
        }

        const result = arr.filter(item => item[key] && item[key] === compare ? true : false)
        return result.length ? result.pop() : false
      }

      if (!archives) {
        return this.wpErrorHandler(new ResolverError('Unable to get WordPress archives. Is WordPress up?'))
      }

      // Just add taxonomies here as they appear.
      const availableArchives = [
        findObjectByProp('archive_link', url, archives.post_types),
        findObjectByProp('archive_link', url, archives.taxonomies.category),
        findObjectByProp('archive_link', url, archives.taxonomies.post_tag)
      ]
      const archive = availableArchives.find(Boolean)
      const isArchive = archive ? true : false

      if (post instanceof LookupError) {
        // If the permalink endpoint says that nothing was found
        // swallow the error, and unset post
        post = null
      } else if (post instanceof ExtendableError || post instanceof Error) {
        // If it's an error, but of a different kind, handle the error
        return this.wpErrorHandler(post)
      } else {
        // Nothing to do here.
      }

      if (post) {
        const { type } = post
        const componentProps = { post }

        if (archive) {
          componentProps.archive = archive
        }

        // This is how you select a template based on the slug
        /*switch(location.pathname) {
          case '/about/': {
            return this.showComponent(await import('./About'), componentProps)
          }

          // no default
        }*/

        switch (type) {
          case 'post': {
            return this.showComponent(await import('./Singular'), componentProps)
          }

          case 'page': {
            if (post.isBlogpage) {
              return this.showComponent(await import('./Blog'), componentProps)
            } else if (post.isHomepage) {
              return this.showComponent(await import('./Home'), componentProps)
            }

            return this.showComponent(await import('./Page'), componentProps)
          }

          case 'slides': {
            return this.showComponent(await import('./Slides'), componentProps)
          }

          default: {
            console.log(`Unexpected post type ${type}.`)
            return this.showComponent(await import('./Singular'), componentProps)
            // return this.showComponent(await import('./Index'), {})
          }
        }
      }

      if (isArchive) {
        switch (archive.name) {
          case 'slides': {
            return this.showComponent(await import('./Slides'), { archive })
          }

          default: {
            console.log('this is a ridiculous fix for postlist and causes flashing')
            this.showComponent(Loading, {})
            return this.showComponent(await import('./Archive'), { archive })
          }
        }
      }

      if (this.state.authenticationRequired) {
        const afterLogin = () => {
          this.setState({
            authenticationRequired: false,
          }, () => window.location.reload())
        }

        return this.showComponent(Error, {
          error: new Unauthorized(`I'm afraid that requires authentication.`),
          afterLogin,
        })
      }

      return this.wpErrorHandler(new Error404('No archive or single post matched your query.'))
    } catch (e) {
      throw e
    }
  }

  async componentDidMount() {
    WP.connectErrorHandler(this.wpErrorHandler.bind(this))
    // this.doRouting(this.props)
    this.route(this.props)

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

  async componentWillReceiveProps(nextProps) {
    // console.log(nextProps, this.props)
    // this.doRouting(props)

    // Normally you'd check that the props have changed before running
    // this kind of op again. Not necessary here.
    this.route(nextProps)
  }

  componentWillUnmount() {
    WP.disconnectErrorHandler()
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
      return <Error {...crashed} navigation={this.state.navigation} sidebar={this.state.sidebar} />
    }

    return ready
      ? <ViewComponent {...ViewComponentProps} navigation={this.state.navigation} sidebar={this.state.sidebar} />
      : <Loading navigation={this.state.navigation} sidebar={this.state.sidebar} />
  }
}

export default Resolver
