import React from 'react'
import Layout from '../components/Layout'

const Singular = (props) => {
  const { title, content } = props.post

  return (
    <Layout {...props}>
      <h1>{title.rendered}</h1>
      {content.rendered}
    </Layout>
  )
}

export default Singular
