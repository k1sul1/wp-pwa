import React from 'react'
import PropTypes from 'prop-types'

import Navigation from './Navigation'

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
