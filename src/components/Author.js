import React from 'react'
import { get } from 'lodash'

export const getAuthor = (post) => get(post, '_embedded.author[0]', false)

export const AuthorName = ({ name }) => (
  <address className="author-name">
    {name}
  </address>
)

export const AuthorDescription = ({ description }) => !description.length ? false : (
  <p className="author-description">
    {description}
  </p>
)

export const AuthorImage = ({ author }) => !author.avatar_urls ? false : (
  <div className="author-image">
    <img
      src={author.avatar_urls[96].replace(96, 440)}
      alt={author.author_name} />
  </div>
)

export const Author = (props) => {
  const { post, author: authorProp } = props
  if (!post && !authorProp) {
    return false
  }

  const author = authorProp || getAuthor(post)
  if (!author) {
    return false
  }

  return (
    <div className="author">
      <h3>About the author</h3>

      <AuthorImage author={author} />
      <AuthorName name={author.name} />
      <AuthorDescription description={author.description} />
    </div>
  )
}

export default Author
