import React, { Component } from 'react'
import Layout from '../components/Layout'
import PostList from '../components/PostList'
import { taxonomyName } from '../lib/helpers'


export default class Archive extends Component {
  render() {
    const { archive } = this.props
    const prefix = taxonomyName(archive.taxonomy) || false

    if (!archive) {
      throw new Error(`Archive wasn't provided with archive data, unable to render archive.`);
    }

    return (
      <Layout {...this.props} className="archive">
        <h1>
          {prefix && `${prefix}: `}
          {archive.name}
        </h1>

        <PostList context={this.props.archive}/>
      </Layout>
    )
  }
}
