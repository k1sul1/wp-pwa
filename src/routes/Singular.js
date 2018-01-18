import React from 'react'
import Page from './Page'
import { blogSidebar } from '../components/Sidebar'

const AuthorLine = ({ author }) => (
  <address>
    {author.name}
  </address>
)

const header = (node, { post }) => (
  <header>
    {node}

    {post && post._embedded && post._embedded.author ? (
      <AuthorLine author={post._embedded.author[0]} />
    ) : false}
  </header>
)
const Singular = (props) => console.log(props) || (
  <Page {...props} sidebar={blogSidebar} filterTitle={header} className="singular" />
)
export default Singular
