import React from 'react'
import Layout from '../components/Layout'

const Home = (props) => {
  console.log(props);
  const { post } = props
  const { title, content } = post

  return (
    <Layout {...props} sidebar={{ children: <h1>Hello!</h1> }}>
      <h2>Home</h2>
      <h3>{title.rendered}</h3>
      {content.rendered}
    </Layout>
  )
}

export default Home
