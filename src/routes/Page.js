import React from 'react'
import Layout from '../components/Layout'

const Page = (props) => {
  const { post_title, post_content } = props.post

  return (
    <Layout {...props} sidebar={false}>
      <h2>Page</h2>
      <h3>{post_title}</h3>
      {post_content}
    </Layout>
  )
}

export default Page
