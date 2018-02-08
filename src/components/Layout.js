import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import WP from '../lib/WP'

import Header from './Header'
import Sidebar from './Sidebar'

const AnimationBoundary = (props) => (
  <div {...props} onAnimationEnd={props.onAnimationEnd}>
    {props.children}
  </div>
)

/*
 * Layout is used to wrap our components so we can keep the code DRY.
 */
class Layout extends Component {
  constructor(props) {
    super(props)

    this.state = {
      online: navigator.onLine,
      transitioning: !props.disableTransition,
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

  shouldComponentUpdate() {
    return !this.state.transitioning
  }

  async componentDidMount() {
    WP.addNetworkStatusListeners(this)
    window.addEventListener('resize', this.onresize)
  }

  async componentWillUnmount() {
    if (!this.props.disableTransition) {
      this.setState({
        transitioning: true,
      })
    }

    WP.removeNetworkStatusListeners(this)
    window.removeEventListener('resize', this.onresize)
  }

  render() {
    const { children, sidebar, navigation, disableTransition, className } = this.props;
    const { online, transitioning } = this.state

    const wrapperClass = `
      application__wrapper
      ${!disableTransition && transitioning ? `animated fadeIn` : ''}
      ${className || ''}
      ${sidebar ? `has-sidebar ${sidebar.open ? 'sidebar-open' : 'sidebar-closed'}` : 'no-sidebar'}`

    return (
      <Fragment>
        {!online ? <span className="offline-notice">Offline</span> : false}
        <Header navigation={navigation} />
        <AnimationBoundary
          onAnimationEnd={() => this.setState({ transitioning: false })}
          className={wrapperClass}>
            <main id="content">
              {children /* <Layout><p>Child 1</p><p>Child 2</p></Layout> */}
            </main>

            <Sidebar {...sidebar} />
            {/* Pass contents of sidebar object as props,
            if there's no props, no sidebar contents will be rendered.

            For styling purposes the aside element is rendered.*/}
        </AnimationBoundary>
      </Fragment>
    )
  }
}

export default Layout
