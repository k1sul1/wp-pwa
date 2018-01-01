import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'

export default class Sidebar extends Component {
  constructor(props) {
    super(props)

    this.state = {}
  }

  static propTypes = {
    children: PropTypes.node,
  }

  static defaultProps = {
    children: (
      <Fragment>
        <h3>Sidebar</h3>
      </Fragment>
    ),
  }

  render() {
    return this.props.disabled ? false : (
      <aside>
        { this.props.children }
      </aside>
    )
  }
}
