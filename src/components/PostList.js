import React from 'react'
import { Link } from 'react-router-dom'
import PaginatingList from './PaginatingList'

import WP from '../lib/WP'

export const SinglePost = (post, context) => {
  return (
    <article className="post-list__single" key={post.id}>
      <Link to={post.link}>
        <h2>{post.title.rendered}</h2>
      </Link>
    </article>
  )
}

const loadItems = async (page, context) => {
  if (!context) {
    throw new Error('Unable to load items without context')
  }

  let result = null

  if (context.isBlogpage) {
    result = await WP.getForContext('blog', { page })
  } else if (context.term_id && context.taxonomy) {
    const { term_id, taxonomy } = context
    result = await WP.getForContext('taxonomy', { term_id, taxonomy, page })
  } else if (context.taxonomies) {
    // post type
    const restBase = context.rest_base || context.name
    result = await WP.getForContext('post_type', { restBase, page })
  }

  const posts = result ? result.posts : [];
  const headers = result ? result.headers : {};
  const maxPages = headers && headers['x-wp-totalpages']
    ? parseInt(headers['x-wp-totalpages'], 10)
    : 0

  return {
    items: posts,
    maxPages,
  }
}

export default function PostList(props) {
  return (
    <PaginatingList
      loadItems={loadItems}
      renderItem={SinglePost}
      {...props}
    />
  )
}
