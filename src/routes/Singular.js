import React, { Fragment } from 'react'
import Page from './Page'
import { blogSidebar } from '../components/Sidebar'
import CommentList from '../components/CommentList'

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

const content = (node, { post }) => (
  <Fragment>
    {node}

    <CommentList context={post} />
  </Fragment>
)

const Singular = (props) => console.log(props) || (
  <Page {...props} sidebar={blogSidebar} filterTitle={header} filterContent={content} className="singular" />
)

export default Singular
