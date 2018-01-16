import React from 'react'
import Layout from '../components/Layout'

const Loading = (props) => (
  <Layout disableTransition={true} className="loading" {...props}>
    <p>Loading...</p>
  </Layout>
)

export default Loading
