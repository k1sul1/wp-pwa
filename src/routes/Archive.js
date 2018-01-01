import React, { Component } from 'react'
import Layout from '../components/Layout'
import PostList from '../components/PostList'

import { dumpObject } from '../lib/helpers'

export default class Archive extends Component {
  constructor() {
    super()

    this.state = {
      posts: [],
    }
  }

  render() {
    console.log(this.props);
    return (
      <Layout {...this.props}>
        <p>Archive</p>

        <PostList getPosts={this.props.archive}/>

        {dumpObject(this.props.archive)}
      </Layout>
    )
  }
}
