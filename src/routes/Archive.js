import React from 'react'
import Layout from '../components/Layout'
import PostList from '../components/PostList'
import { taxonomyName } from '../lib/helpers'


const Archive = (props) => {
  const { archive } = props
  const prefix = taxonomyName(archive.taxonomy) || false

  const titlePrefix = prefix && `${prefix}: `
  const title = archive.label || archive.name

  if (!archive) {
    throw new Error(`Archive wasn't provided with archive data, unable to render archive.`);
  }

  return (
    <Layout {...props} className="archive">
      <h1>
        {titlePrefix}
        {title}
      </h1>

      <PostList context={archive}/>
    </Layout>
  )
}

export default Archive
