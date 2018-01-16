import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import isEqual from 'lodash.isequal'

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
      posts: props.posts,
      page: props.page,
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

  async getContents() {
    const { context } = this.props
    const { page } = this.state

    if (this.props.posts.length) {
      return this.setState({
        posts: this.props.posts,
        loading: false,
      })
    } else if (context) {
      let posts = []
      let headers = {}

      if (context.isBlogpage) {
        const result = await WP.getForContext('blog', { page })

        if (result) {
          headers = result.headers
          posts = result.posts
        }
      } else if (context.term_id || context.taxonomy) {
        const { term_id, taxonomy } = context
        const result = await WP.getForContext('taxonomy', { term_id, taxonomy, page })

        if (result) {
          headers = result.headers
          posts = result.posts
        }
      }

      const maxPages = headers && headers['x-wp-totalpages']
        ? parseInt(headers['x-wp-totalpages'], 10)
        : 0

      return this.setState({
        posts,
        maxPages,
        loading: false,
      })
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

  async componentDidUpdate(prevProps, prevState) {
    if (prevState.page !== this.state.page) {
      console.log('update postlist')
      await this.getContents()
    }
  }

  async componentDidMount() {
    await this.getContents()
  }

  async componentWillReceiveProps(nextProps) {
    // Don't run this expensive op at every render.
    if (!isEqual(this.props.page, nextProps.page) || !isEqual(this.props.posts, nextProps.posts)) {
      await this.getContents()
    }
  }

  pagination() {
    const { page, maxPages } = this.state
    const previousPage = (e) => {
      e.preventDefault();
      this.setState({
        page: this.state.page - 1,
        loading: true,
      })
    }
    const nextPage = (e) => {
      e.preventDefault();
      this.setState({
        page: this.state.page + 1,
        loading: true,
      })
    }

    const Previous = page > 1 ? (
      <button onClick={previousPage}>
        Previous
      </button>
    ) : false

    const Next = page < maxPages ? (
      <button onClick={nextPage}>
        Next
      </button>
    ) : false

    return (
      <div className="pagination">
        {Previous || false}
        {Next || false}
      </div>
    )
  }

  render() {
    const { posts, loading } = this.state
    return (
      <div className="post-list">
        {loading ? (
          <p>Please wait while we load the posts...</p>
        ) : posts && !posts.length ? (
          <p>It appears that there is no posts.</p>
        ) : (
          <Fragment>
            {posts.map(post => <SinglePost key={post.id} post={post} />)}
            {this.pagination()}
          </Fragment>
        )}
      </div>
    )
  }
}
