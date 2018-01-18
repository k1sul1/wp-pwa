import React from 'react'
import Layout from '../components/Layout'
import PostList from '../components/PostList'
import { taxonomyName } from '../lib/helpers'


const Archive = (props) => {
  const { archive } = props
  const prefix = taxonomyName(archive.taxonomy) || false

  if (!archive) {
    throw new Error(`Archive wasn't provided with archive data, unable to render archive.`);
  }

  return (
    <Layout {...props} className="archive">
      <h1>
        {prefix && `${prefix}: `}
        {archive.name}
      </h1>

      <PostList context={archive}/>
    </Layout>
  )
}

export default Archive
