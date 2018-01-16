import React, { Component } from 'react'
import Layout from '../components/Layout'
import PostList from '../components/PostList'

export default class Blog extends Component {
  constructor() {
    super()

    this.state = {
      posts: [],
    }
  }

  render() {
    const { post } = this.props
    return (
      <Layout {...this.props} className="blog">
        <h1>{post.title.rendered}</h1>

        <PostList context={post} />
      </Layout>
    )
  }
}
