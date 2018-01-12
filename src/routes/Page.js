import React from 'react'
import Layout from '../components/Layout'

const Page = (props) => {
  console.log(props)
  const { title, content } = props.post

  return (
    <Layout {...props} sidebar={false}>
      <h2>Page</h2>
      <h3>{title.rendered}</h3>
      {content.rendered}
    </Layout>
  )
}

export default Page
