import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'

import CurrentUser from './CurrentUser'
import SearchForm from '../components/SearchForm'

export const defaultSidebar = {
  children: (
    <Fragment>
      <h3>Sidebar</h3>

      <CurrentUser />
    </Fragment>
  ),
}

export const searchSidebar = {
  children: (
    <Fragment>
      <h2>Try the search</h2>

      <SearchForm />
    </Fragment>
  )
}

// Add more configurations if you'd like!

export default class Sidebar extends Component {
  constructor(props) {
    super(props)

    this.state = {}
  }

  static propTypes = {
    children: PropTypes.node,
  }

  // static defaultProps = defaultSidebar

  render() {
    if (!this.props) {
      return <aside></aside>
    }

    const { children } = this.props

    return (
      <aside>
        { children }
      </aside>
    )
  }
}
