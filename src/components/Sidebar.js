import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'

import CurrentUser from './CurrentUser'
import SearchForm from '../components/SearchForm'

export const defaultSidebar = (props) => merge({
  children: (
    <Fragment>
      <h2>Sidebar</h2>

      <CurrentUser />
    </Fragment>
  ),
}, props)

export const searchSidebar = {
  children: (
    <Fragment>
      <h2>Try the search</h2>

      <SearchForm />
      <CurrentUser />
    </Fragment>
  )
}

export const blogSidebar = (props) => merge({
  children: (
    <Fragment>
      <h2>Blog sidebar</h2>
      <CurrentUser />
    </Fragment>
  )
}, props)

const merge = (sidebarProps, overridingProps) => ({
  ...sidebarProps,
  ...overridingProps,
})

// Add more configurations if you'd like!

export default class Sidebar extends Component {
  constructor(props) {
    super(props)

    this.state = {}
  }

  static propTypes = {
    children: PropTypes.node,
    onClick: PropTypes.func,
  }

  render() {
    if (!this.props) {
      return <aside></aside>
    }

    const { children, onClick } = this.props

    return (
      <aside onClick={(e) => onClick(e)}>
        { children }
      </aside>
    )
  }
}
