import React from 'react'
import Layout from '../components/Layout'

const BlogPost = (props) => {
  const { post_title, post_content } = props.data

  return (
    <Layout {...props}>
      <h1>{post_title}</h1>
      {post_content}
    </Layout>
  )
}

export default BlogPost
