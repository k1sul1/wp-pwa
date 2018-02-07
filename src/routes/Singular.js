import React, { Fragment } from 'react'
import { get } from 'lodash'

import Page from './Page'
import { Image } from '../lib/image'
import { blogSidebar } from '../components/Sidebar'
import CommentList from '../components/CommentList'
import { AuthorLine, getAuthor } from '../components/Author'

/*
 * Singular component is based on Page, but it changes the template almost entirely.
 */


const header = (node, { post }) => {
  const author = getAuthor(post)
  const featuredImage = get(post, '_embedded[wp:featuredmedia][0]', null)

  return (
    <header className={`post-header ${featuredImage ? 'has-image' : 'no-image'}`}>
      {featuredImage ? <Image imageObj={featuredImage} /> : false}

      <div className="overlay">
        {node}
        {author ? (
          <AuthorLine author={author} />
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

const Singular = (props) => console.log(props) || (
  <Page
    {...props}
    sidebar={blogSidebar({
      ...props.sidebar,
      post: {...props.post},
    })}
    filterTitle={header}
    filterContent={content}
    className="single-post"
  />
)

export default Singular
