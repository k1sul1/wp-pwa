import React, { Component } from 'react'
import { searchSidebar } from '../components/Sidebar'
import WP from '../lib/WP'
import ExtendableError from 'es6-error'
import { ResolverError, Error404, FatalError404, Forbidden, MenuLoadError, LookupError, Unauthorized } from '../errors'

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
            return ({
              navigation: {
                ...prevState.navigation,
                open: !prevState.navigation.open, // Invert the current value
              }
            })
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

        case Unauthorized: {
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
      const url = WP.getWPURL() + location.pathname
      const cacheSettings = {
        cacheStaleTime: 60 * 1000 * 10,
      }
      const [archives, post] = await Promise.all([
        WP.getArchives({}, cacheSettings),
        WP.getByURL(url, {}, cacheSettings),
      ]);

      const findObjectByProp = (key, compare, arr) => {
        if (!Array.isArray(arr)) {
          return false
        }

        const result = arr.filter(item => item[key] && item[key] === compare ? true : false)
        return result.length ? result.pop : false
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

        const archive = allArchives.find(Boolean)

        if (archive.name === 'slides') {
          return this.showComponent(await import('./Slides'), {
            archive,
          })
        }

        return this.showComponent(await import('./Archive'), {
          archive,
        })
      } else if (post) {
        const { type } = post
        const componentProps = {}

        // post can contain a value or it can be undefined, but if it's an error
        // don't put it into the component
        if (post instanceof LookupError) {
          // This only means that no post was found with the URL, can't return yet
          // error = post
        } else if (post instanceof ExtendableError || post instanceof Error) {
          return this.wpErrorHandler(post)
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

          /* case '/': {
            console.log(post)
            if (post.isBlogpage) {
              return this.showComponent(await import('./Blog'), componentProps)
            } else if (post.isHomepage) {
              return this.showComponent(await import('./Home'), componentProps)
            } else {
              console.log(`/ didn't match for blog or homepage, does the API require auth or what?`)
              if (isError) {

              }
              return this.wpErrorHandler(post)
              return this.showComponent(await import('./InitError'), componentProps)
            }
          } */

          // no default
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

      return this.showComponent(await import('./RoutingError'), {}, true)
    } catch (e) {
      // console.log(e)
      throw e
    }
  }
  async route({ location }) {
    try {
      const url = WP.getWPURL() + location.pathname
      const cacheSettings = {
        cacheStaleTime: 60 * 1000 * 10,
      }
      let [post, archives] = await Promise.all([
        WP.getByURL(url, {}, cacheSettings),
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
        console.log(post)
      }

      if (post) {
        const { type } = post
        const componentProps = { post }

        if (archive) {
          componentProps.archive = archive
        }

        // Let's do "slug" templates first
        switch(location.pathname) {
          case '/about/': {
            return this.showComponent(await import('./About'), componentProps)
          }

          // no default
        }

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

      console.log(archive)

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
      return <Error {...crashed } />
    }

    return ready
      ? <ViewComponent {...ViewComponentProps} navigation={this.state.navigation}/>
      : <Loading />
  }
}

export default Resolver
