import React from 'react'
import PaginatingList from './PaginatingList'
import WP from '../lib/WP'

const messages = {
  loading: <p>Please wait while we load the comments...</p>,
  noPosts: <p>It appears that there are no comments.</p>,
}

const loadChildren = async (page, context) => {
  if (!context) {
    throw new Error('Unable to load comments without context')
  }

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
}

const loadTopLevelComments = async (page, context) => {
  if (!context) {
    throw new Error('Unable to load comments without context')
  }

  const params = {
    page,
    parent: 0,
    post: context.id,
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

      {/* One level of hierarchy is going to have to be enough. */}
      {post.parent === 0 ? (
        <Comments
          context={post}
          loadItems={loadChildren}
          messages={{ ...messages, noPosts: '', loading: '' }}
          className="child-comment-list"
        />
      ) : false}
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
