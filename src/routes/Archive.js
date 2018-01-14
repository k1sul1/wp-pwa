import React, { Component } from 'react'
import Layout from '../components/Layout'
import PostList from '../components/PostList'

export default class Archive extends Component {
  render() {
    console.log(this.props);
    return (
      <Layout {...this.props}>
        <p>Archive</p>

        <PostList context={this.props.archive}/>
      </Layout>
    )
  }
}
