import React from 'react'
import PropTypes from 'prop-types'

import Navigation from './Navigation'


/*
 * Header receives data from Resolver as props and renders a navigation.
 */

const Header = ({ navigation }) => (
  <header className="application__header">
    {navigation ? <Navigation {...navigation}/> : false}
  </header>
)

Header.propTypes = {
  navigation: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]).isRequired,
}

export default Header
