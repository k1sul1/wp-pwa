import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import WP from '../lib/WP'

import Header from './Header'
import Sidebar from './Sidebar'


/*
 * Layout is used to wrap our views so we can keep the code DRY.
 */
class Layout extends Component {
  constructor() {
    super()

    // When these change, a re-render will trigger and everything can be updated accordingly
    // except the child components.
    this.state = {
      online: navigator.onLine
    }
  }

  static propTypes = {
     navigation: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.object,
    ]).isRequired,
    sidebar: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.object,
    ]).isRequired,

    children: PropTypes.node.isRequired,
  }

  static defaultProps = {
    sidebar: {},
    navigation: {},
  }

  onoffline() {
    this.setState({
      online: false,
    })
  }

  ononline() {
    this.setState({
      online: true,
    })
  }

  handleEvent(e) {
    this[`on${e.type}`](e)
  }

  async componentDidMount() {
    WP.addNetworkStatusListeners(this)
  }

  async componentWillUnmount() {
    WP.removeNetworkStatusListeners(this)
  }

  render() {
    const { children, sidebar, navigation, disableTransition, className } = this.props;
    const { online } = this.state

    const wrapperClass = `
    application__wrapper
    ${!disableTransition ? 'animated lightSpeedIn' : ''}
    ${className || ''}
    ${sidebar ? 'has-sidebar' : 'no-sidebar'}`

    return (
      <Fragment>
        {!online ? <span className="offline-notice">Offline</span> : false}
        <Header navigation={navigation} />
        <div className={wrapperClass}>
          <main id="content">
            {children}
          </main>

          <Sidebar {...sidebar} />
          {/* Pass contents of sidebar object as props,
          if there's no props, no sidebar contents will be rendered.

          For styling purposes the aside element is rendered.*/}
        </div>
      </Fragment>
    )
  }
}

export default Layout
