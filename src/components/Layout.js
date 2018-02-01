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
      online: navigator.onLine,
      // sidebarOpen: window.innerWidth > 768,
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

  /* maybeToggleSidebar(e) {
    // e.preventDefault() // Enabling prevents onSubmit from working in LoginForm
    if (e.target.tagName !== 'ASIDE') {
      return
    }

    if (window.innerWidth <= 768) {
      this.setState({
        sidebarOpen: !this.state.sidebarOpen,
      })
    }
  }

  resize(e) {
    if (window.innerWidth > 768) {
      this.setState({
        sidebarOpen: true
      })
    } else {
      this.setState({
        sidebarOpen: false
      })
    }
  }

  onresize = debounce((e) => this.resize(e), 100)

  handleEvent(e) {
    console.log(e)
    this[`on${e.type}`](e)
  } */

  async componentDidMount() {
    WP.addNetworkStatusListeners(this)
    window.addEventListener('resize', this.onresize)
  }

  async componentWillUnmount() {
    WP.removeNetworkStatusListeners(this)
    window.removeEventListener('resize', this.onresize)
  }

  render() {
    const { children, sidebar, navigation, disableTransition, className } = this.props;
    const { online } = this.state

    const wrapperClass = `
      application__wrapper
      ${!disableTransition ? 'animated fadeIn' : ''}
      ${className || ''}
      ${sidebar ? `has-sidebar ${sidebar.open ? 'sidebar-open' : 'sidebar-closed'}` : 'no-sidebar'}`

    return (
      <Fragment>
        {!online ? <span className="offline-notice">Offline</span> : false}
        <Header navigation={navigation} />
        <div className={wrapperClass}>
          <main id="content">
            {children /* <Layout><p>Child 1</p><p>Child 2</p></Layout> */}
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
