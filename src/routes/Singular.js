import React from 'react'
import Layout from '../components/Layout'

const Singular = (props) => {
  const { post_title, post_content } = props.post

  return (
    <Layout {...props}>
      <h1>{post_title}</h1>
      {post_content}
    </Layout>
  )
}

export default Singular
