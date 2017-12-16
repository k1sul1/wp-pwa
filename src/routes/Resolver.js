import React, { Component } from 'react'
import axios from 'axios'

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
      component: null,
      props: {}, // Will be passed into the resolved component
    }
  }

  async getComponent(path, fallback) {
    console.log(path, fallback)
    try {
      const component = await import(path)
      console.log(component)
      return component.default
    } catch(e) {
      console.error(e)
      return fallback
    }
  }

  async componentDidMount() {
    console.log(this.props);
    const url = 'https://wcjkl.local/' + this.props.location.pathname

    try {
      const response = await axios.get('https://wcjkl.local/wp-json/wp/v2/lookup', {
        params: {
          url,
        }
      })
      const { post, error } = response.data

      console.log(response)

      if (error) {
        if (error === 'No post found.') { // "404"
          this.setState({
            component: FourOhFour,
            ready: true,
          })

          return
        }

        console.error(error)
      } else {
        const { post_type } = post

        console.log(post_type)
        let component

        switch (post_type) {
          case "post": {
            component = Singular
            break
          }

          case "page": {
            component = Page
            // component = await import('./Page')
            // component = Singular

            break
          }

          default: {
            component = Index
            break
          }
        }

        console.log(component)

        this.setState((prev) => ({
          component: component.default || component, // Support dynamic imports
          props: {
            ...prev.props,
            post,
          },
          ready: true,
        }))
      }
    } catch (e) {
      console.log(e)
    }
  }

  render() {
    const {
      ready,
      component,
      props, // Not to be confused with this.props!
    } = this.state
    const Component = component // React wants custom tags in uppercase format

    // console.log(this.props)

    return ready
      ? <Component {...props} />
      : <Layout><p>Loading...</p></Layout>

  }
}
