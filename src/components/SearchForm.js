import React, { Component } from 'react'
import WP from '../lib/WP'
import { SearchError } from '../errors'
import PostList from '../components/PostList'
// import PropTypes from 'prop-types'

export default class SearchForm extends Component {
  constructor(props) {
    super(props)

    this.state = {
      searchQuery: '',
      loading: false,
      results: [],
    }
  }

  static propTypes = {}

  static defaultProps = {}

  onChange(e) {
    this.setState({
      searchQuery: e.target.value,
    })
  }

  async onSubmit(e) {
    const { searchQuery } = this.state

    e.preventDefault()
    this.setState({
      loading: true,
    })

    const results = await WP.query({
      s: searchQuery
    })

    if (results) {
      console.log(results)
      this.setState({ results })
    } else {
      throw new SearchError(`Search query didn't return an acceptable response`)
    }
  }

  render() {
    const { searchQuery, results } = this.state

    return (
      <form onSubmit={(e) => this.onSubmit(e)}>
        <input
          type="search"
          placeholder="kittens"
          value={searchQuery}
          onChange={(e) => this.onChange(e)}
        />
        <input type="submit" value="&#x1F50E;" title="Do the search" />

        {results.length ? <PostList posts={results} /> : false}
      </form>
    )
  }
}
