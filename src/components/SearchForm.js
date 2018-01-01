import React, { Component } from 'react'
// import PropTypes from 'prop-types'

export default class SearchForm extends Component {
  constructor(props) {
    super(props)

    this.state = {
      searchQuery: '',
    }
  }

  static propTypes = {}

  static defaultProps = {}

  onChange(e) {
    this.setState({
      searchQuery: e.target.value,
    })
  }

  onSubmit(e) {
    e.preventDefault()
  }

  render() {
    const { searchQuery } = this.state

    return (
      <form onSubmit={() => this.onSubmit()}>
        <input
          type="search"
          placeholder="kittens"
          value={searchQuery}
          onChange={() => this.onChange()}
        />
        <input type="submit" value="&#x1F50E;" title="Do the search" />
      </form>
    )
  }
}
