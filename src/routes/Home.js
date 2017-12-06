import React from 'react'
import Layout from '../components/Layout'

const Home = (props) => console.log(props) || (
  <Layout {...props}>
    <h2>{props.data.title.rendered}</h2>
  </Layout>
)

export default Home
