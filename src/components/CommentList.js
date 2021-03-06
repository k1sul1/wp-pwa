import React from 'react'
import PaginatingList, { getMax, defaultMessages } from './PaginatingList'
import WP from '../lib/WP'

/*
 * PaginatingList expects a template and a loader for comments.
 */

const messages = {
  ...defaultMessages,
  loading: <p>Please wait while we load the comments...</p>,
  noPosts: <p>It appears that there are no comments.</p>,
}

// The standard Comment endpoint forces the usage of potentially hundreds of requests
// on a popular post, and rate limiting is bound to kick in, crashing the application.
// Hence no support for child comments.
/* const loadChildren = async (page, context) => {
  if (!context) {
    throw new Error('Unable to load comments without context')
  }

  await new Promise(resolve => setTimeout(resolve, 2000))

  const params = {
    page,
    parent: context.id,
  }

  if (params.parent === 0) {
    return false
  }

  const result = await WP.getForContext('comments', { params })
  const posts = result ? result.posts : [];
  const headers = result ? result.headers : {};
  const maxPages = headers && headers['x-wp-totalpages']
    ? parseInt(headers['x-wp-totalpages'], 10)
    : 0

  return {
    items: posts.reverse(),
    maxPages,
  }
} */

const loadTopLevelComments = async (page, context) => {
  if (!context) {
    throw new Error('Unable to load comments without context')
  }

  const params = {
    page,
    parent: 0,
    post: context.id,
  }

  const result = await WP.getForContext('comments', { ...params })
  const posts = result ? result.posts : [];
  const headers = result ? result.headers : {};
  const maxPages = getMax(headers, 'x-wp-totalpages')
  const maxPosts = getMax(headers, 'x-wp-total')

  return {
    items: posts.reverse(),
    maxPages,
    maxPosts,
  }
}

export const Comment = (post, context) => {
  return (
    <article className="comment-list__single" key={post.id}>
      <header>
        <img src={post.author_avatar_urls[96].replace(96, 200)} alt={post.author_name} />
        <span className="author-name">{post.author_name}</span>
      </header>

      <div className="comment">
        {post.content.rendered}
      </div>

      {/* Hierarchical comments are so hard to implement that this is an infinite loop}
      {post.parent === 0 ? false && (
        <Comments
          context={post}
          loadItems={loadChildren}
          messages={{ ...messages, noPosts: '', loading: '' }}
          className="child-comment-list"
        />
      ) : false*/}
    </article>
  )
}


export function Comments(props) {
  return (
    <PaginatingList
      loadItems={loadTopLevelComments}
      renderItem={Comment}
      messages={messages}
      className="comment-list"
      {...props}
    />
  )
}

export function CommentList(props) {
  return (
    <div id="comments">
      <h2>Comments</h2>
      <Comments {...props} />
    </div>
  )
}


export default CommentList
