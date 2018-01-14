import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import WP from '../lib/WP'

export const SinglePost = ({ post }) => (
  <article className="post-list__single">
    <Link to={post.link}>
      <h2>{post.title.rendered}</h2>
    </Link>
  </article>
)

export default class PostList extends Component {
  constructor(props) {
    super(props)

    this.state = {
      posts: this.props.posts,
      loading: true,
    }
  }

  static propTypes = {
    posts: PropTypes.array,
    page: PropTypes.number,
    context: PropTypes.object,
    query: PropTypes.object,
  }

  static defaultProps = {
    posts: [],
    page: 1,
  }

  async componentDidMount() {
    const { context, page } = this.props

    if (this.props.posts.length) {
      return this.setState({
        posts: this.props.posts,
        loading: false,
      })
    } else if (context) {
      console.log(context)
      let posts = []

      if (context.isBlogpage) {
        const result = await WP.getForContext('blog', { page })

        if (result) {
          posts = result
        }
      } else if (context.term_id || context.taxonomy) {
        const { term_id, taxonomy } = context
        const result = await WP.getForContext('taxonomy', { term_id, taxonomy })

        if (result) {
          posts = result
        }
      }

      return this.setState({ posts, loading: false })
    }

    const posts = await WP.query({
      ...this.props.query,
      page
    })

    this.setState({
      posts,
      loading: false,
    })
  }

  render() {
    const { posts, loading } = this.state
    return (
      <div className="post-list">
        {posts.length === 0 && loading ? (
          <p>Please wait while we load the posts...</p>
        ) : posts.length === 0 ? (
          <p>It appears that there is no posts.</p>
        ) : (
          posts.map(post => <SinglePost key={post.id} post={post} />)
        )}
      </div>
    )
  }
}
