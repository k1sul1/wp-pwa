import React from 'react'
import Layout from '../components/Layout'
import { defaultSidebar } from '../components/Sidebar'
import LoginForm from '../components/LoginForm'

const RoutingError = (props) => (
  <Layout sidebar={defaultSidebar} className="routing-error" {...props}>
    <h1>Unable to load any route</h1>
    <p>A login may be required.</p>
  </Layout>
)
export default RoutingError
