import React, { Component } from 'react'
import axios from 'axios'

import BlogPost from './BlogPost'
import Layout from '../components/Layout'


export default class Resolver extends Component {
  constructor() {
    super()

    this.state = {
      ready: false,
      component: null,
      data: {},
    }
  }

  async componentDidMount() {
    console.log(this.props);
    const url = 'https://wcjkl.local/' + this.props.location.pathname

    axios.get('https://wcjkl.local/wp-json/wp/v2/lookup', {
      params: {
        url,
      }
    }).then(response => {
      const { post } = response.data
      const component = BlogPost

      console.log(post);

      this.setState({
        data: post,
        component,
        ready: true,
      })
    }).catch(error => {
      console.log(error)
    })
  }

  render() {
    const { ready, component, data } = this.state
    const Component = component

    console.log(data)
    if (data.length) {
      console.log(data.data.data)
    }
    return ready
      ? <Component data={data} />
      : <Layout><p>Loading...</p></Layout>

  }
}
