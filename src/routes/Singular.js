import React from 'react'
import Page from './Page'
import { blogSidebar } from '../components/Sidebar'

const header = (node, props) => (
  <header>
    <h2>show the thumbnail here and so on</h2>
    {node}
  </header>
)
const Singular = (props) => <Page {...props} sidebar={blogSidebar} filterTitle={header} className="singular" />
export default Singular
