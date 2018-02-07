import React, { Component } from 'react'
import { DebounceInput } from 'react-debounce-input'
import WP from '../lib/WP'
import { SearchError } from '../errors'
import { SinglePost } from '../components/PostList'
import PaginatingList, { getMax, defaultMessages } from '../components/PaginatingList'

const messages = {
  ...defaultMessages,
  noPosts: <p>No results. Sorry.</p>,
  pageInfo: () => null,
}

const loadResults = async (page, context) => {
  if (!context) {
    throw new SearchError('Unable to search without search context')
  }

  const result = await WP.query({
    ...context,
    page,
  })

  const posts = result ? result.data : [];
  const headers = result ? result.headers : {};
  const maxPages = getMax(headers, 'x-wp-totalpages')
  const maxPosts = getMax(headers, 'x-wp-total')

  return {
    items: posts,
    maxPages,
    maxPosts,
  }
}

/*
 * Renders a search form.
 */
export default class SearchForm extends Component {
  constructor(props) {
    super(props)

    this.state = {
      searchQuery: '',
    }
  }

  render() {
    const { searchQuery, results } = this.state

    return (
      <form className="search-form">
        <label htmlFor="username_input">
          <span>Search</span>
          <span className="screen-reader-text">
            The search is performed automatically when at least 3 characters are entered into the input below.
          </span>

          <DebounceInput
            type="search"
            placeholder="kittens"
            minLength={3}
            debounceTimeout={300}
            onChange={e => this.setState({ searchQuery: e.target.value })} />
        </label>

        {searchQuery.length !== 0 ? (
          <PaginatingList
            context={{ s: searchQuery }}
            messages={messages}
            loadItems={loadResults}
            renderItem={SinglePost}
            className="search-results" />
        ) : false}

      </form>
    )
  }
}
