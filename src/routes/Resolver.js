import React, { Component } from 'react'
import WP from '../lib/WP'
import p from '../../package.json'

import Index from './Index'
import About from './About'
import FourOhFour from './404'
import Page from './Page'
import Blog from './Blog'
import Home from './Home'
import Loading from './Loading'
import Singular from './Singular'
import Layout from '../components/Layout'


export default class Resolver extends Component {
  constructor() {
    super()

    this.state = {
      ready: false,
      ViewComponent: null,
      ViewComponentProps: {},
    }
  }

  showComponent(component, componentProps) {
    this.setState((prev) => ({
      ViewComponent: component.default || component, // Support dynamic imports
      ViewComponentProps: {
        ...prev.ViewComponentProps,
        ...componentProps,
      },
      ready: true,
    }))
  }

  show404() {
    return this.showComponent(FourOhFour, {})
  }

  async doRouting({ location }) {
    console.log(location)


    try {
      const url = p.WPURL + location.pathname
      const response = await WP.getByURL(url, {}, {
        preferCache: true,
        cacheStaleTime: 3600000, // 1 hour
      })
      console.log(response)
      const { post, error } = response

      console.log(response)

      if (error) {
        if (error === 'No post found.') { // "404"
          return this.show404()
        }

        console.error(error)
      } else {
        const { post_type } = post

        // Page templates are pretty much based on the slug.
        // This ought to be enough for many.
        switch (location.pathname) {
          case '/about/': {
            return this.showComponent(About, { post })
          }

          default: {

          }
        }

        switch (post_type) {
          case "post": {
            this.showComponent(Singular, { post })
            break
          }

          case "page": {
            // component = await import('./Page')
            // component = Singular
            this.showComponent(Page, { post })

            break
          }

          default: {
            this.showComponent(Index, {})
            break
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


  render() {
    const {
      ready,
      ViewComponent,
      ViewComponentProps,
    } = this.state

    return ready
      ? <ViewComponent {...ViewComponentProps} />
      : <Loading />

  }
}
