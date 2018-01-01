import React from 'react'
import PropTypes from 'prop-types'

import Navigation from './Navigation'

const Header = ({ match, navigation }) => (
  <header className="application__header">
    {navigation ? <Navigation match={match} {...navigation}/> : false}
  </header>
)

Header.propTypes = {
  navigation: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]).isRequired,
}

export default Header
