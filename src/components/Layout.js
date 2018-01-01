import React, { Fragment } from 'react'
import PropTypes from 'prop-types'

import Header from './Header'
import Sidebar from './Sidebar'

/*
 * Layout is used to wrap our views so we can keep the code DRY.
 */
const Layout = (props) => {
  const { children, sidebar } = props;

  // react-router-dom provides the following, but we do not need them at this point.
  // const { match, location, history } = props

  // Down below, Sidebar & Navigation are going to receive props
  // from sidebar & navigation. Pay attention the capitalization.

  const wrapperClass = `application__wrapper ${sidebar ? 'has-sidebar' : 'no-sidebar'}`

  return (
    <Fragment>
      <Header {...props} />
      <div className={wrapperClass}>
        <main id="content">
          {children}
        </main>

        <Sidebar {...sidebar} />
      </div>
    </Fragment>
  )
}

Layout.propTypes = {
  sidebar: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]).isRequired,


  children: PropTypes.node.isRequired,
}

Layout.defaultProps = {
  sidebar: false,
  navigation: {},
}

export default Layout
