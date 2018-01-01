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
  }

  static defaultProps = {
    posts: [],
  }

  async componentDidMount() {
    const posts = this.props.query
      ? await WP.query(this.props.query)
      : await WP.getPosts(this.props.getPosts) // this does not do anything right

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
