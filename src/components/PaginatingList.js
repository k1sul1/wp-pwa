import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'


export const getMax = (headers, key) => headers && headers[key]
  ? parseInt(headers[key], 10)
  : 0

/*
 * PaginatingList contains paginationg logic, so components like
 * PostList and CommentList can only provide a loader.
 *
 * DRY.
 */

export const defaultMessages = {
  loading: <p>Please wait while we load posts...</p>,
  noPosts: <p>It appears that there are no posts.</p>,
  pageInfo: (page, maxPages) => <p>Showing page {page} of {maxPages}.</p>,
  entryInfo: (maxPosts) => <p>Total of {maxPosts} entries found.</p>
}

export default class PaginatingList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      items: [],
      page: 1,
      loading: true,
    }
  }

  static propTypes = {
    loadItems: PropTypes.func,
    renderItem: PropTypes.func,
    messages: PropTypes.object,
  }

  static defaultProps = {
    messages: defaultMessages,
  }

  async getContents() {
    const { context, loadItems } = this.props
    const { page } = this.state

    // this.setState({ items: [] })

    try {
      const loaded = await loadItems(page, context)
      console.log(loaded)

      if (loaded) {
        const { items, maxPages, maxPosts } = loaded
        return this.setState({ page, items, maxPages, maxPosts, loading: false });
      }
    } catch(e) {
      console.log(e)
    }

    this.setState({ loading: false })
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevState.page !== this.state.page || prevProps.context !== this.props.context) {
      console.log('update postlist')
      await this.getContents()
    }
  }

  async componentDidMount() {
    await this.getContents()
  }

  /* async componentWillReceiveProps(nextProps) {
    // Don't run this expensive op at every render.
    if (!isEqual(this.props.page, nextProps.page) ||
        !isEqual(this.props.items, nextProps.items) ||
        !isEqual(this.props.context, nextProps.context)) {
      await this.getContents()
    }
  } */

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
      <button onClick={previousPage} className="button--bluishgrey previous">
        Previous
      </button>
    ) : false

    const Next = page < maxPages ? (
      <button onClick={nextPage} className="button--bluishgrey next">
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

  queryInfo() {
    const { messages } = this.props
    const { page, maxPages, maxPosts } = this.state

    return (
      <div className="query-info">
        {messages.pageInfo(page, maxPages)}
        {messages.entryInfo(maxPosts)}
      </div>
    )
  }

  render() {
    const { items, loading } = this.state
    const { renderItem, context, className, messages } = this.props
    return (
      <div className={`${className || ''} paginating-list`}>
        {loading ? (
          messages.loading
        ) : items && !items.length ? (
          messages.noPosts
        ) : (
          <Fragment>
            {items.map(post => renderItem(post, context))}
            {this.queryInfo()}
            {this.pagination()}
          </Fragment>
        )}
      </div>
    )
  }
}
