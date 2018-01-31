import React, { Fragment } from 'react'
import Page from './Page'
import { Image } from '../lib/image'
import { blogSidebar } from '../components/Sidebar'
import CommentList from '../components/CommentList'

const AuthorLine = ({ author }) => (
  <address>
    {author.name}
  </address>
)

const header = (node, { post }) => {
  const embedded = post._embedded
  const featuredImages = embedded && embedded['wp:featuredmedia'].length ? embedded['wp:featuredmedia'] : null

  return (
    <header className={`post-header ${featuredImages ? 'has-image' : 'no-image'}`}>
      {featuredImages ? <Image imageObj={featuredImages[0]} /> : false}

      <div className="overlay">
        {node}
        {post && post._embedded && post._embedded.author ? (
          <AuthorLine author={post._embedded.author[0]} />
        ) : false}
      </div>
    </header>
  )
}

const content = (node, { post }) => (
  <Fragment>
    {node}

    <CommentList context={post} />
  </Fragment>
)

const Singular = (props) => (
  <Page {...props} sidebar={blogSidebar(props.sidebar)} filterTitle={header} filterContent={content} className="singular" />
)

export default Singular
