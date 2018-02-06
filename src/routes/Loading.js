import React from 'react'
import Layout from '../components/Layout'

const Loading = (props) => (
  <Layout disableTransition={true} className="loading" {...props}>
    <p style={{ margin: '20px' }}>Loading...</p>
  </Layout>
)

export default Loading
