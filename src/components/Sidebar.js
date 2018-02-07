import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import { Manager, Swipe } from 'hammerjs'

import Author from './Author'
import CurrentUser from './CurrentUser'
import SearchForm from './SearchForm'
import Download from './Download'


/*
 * Sidebar contains secondary content and whatever you put in it.
 * There are several configurations available.
 */

export const defaultSidebar = (props) => merge(props, {
  children: (
    <Fragment>
      <SearchForm />
      <CurrentUser />
    </Fragment>
  ),
})

export const searchSidebar = (props) => merge (props, {
  children: (
    <Fragment>
      <h2>Try the search</h2>

      <SearchForm />
      <CurrentUser />
    </Fragment>
  )
})

export const blogSidebar = (props) => merge(props, {
  children: (
    <Fragment>
      <Author post={props.post} />
      <SearchForm />
      <Download />
      <CurrentUser />
    </Fragment>
  )
})

const merge = (sidebarProps, overridingProps) => ({
  ...sidebarProps,
  ...overridingProps,
})

// Add more configurations if you'd like!

export default class Sidebar extends Component {
  static propTypes = {
    children: PropTypes.node,
    onClick: PropTypes.func,
  }

  componentDidMount() {
    const { actions } = this.props
    const { activate, deactivate } = actions

    this.hammer = new Manager(this.element, {
      touchAction: 'pan-y',
    })
    this.hammer.add(new Swipe())
    this.hammer.on('swipe', (e) => {
      if (this.props.open) { // If extracted from props, open won't work (bug)
        if (e.direction === 4) {
          deactivate()
        }
      } else {
        if (e.direction === 2) {
          activate()
        }
      }
    })
  }

  componentWillUnmount() {
    this.hammer.destroy()
  }

  render() {
    if (!this.props) {
      return <aside></aside>
    }

    const { children } = this.props

    return (
      <aside ref={n => this.element = n}>
        { children }
      </aside>
    )
  }
}
