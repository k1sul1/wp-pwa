import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import './Navigation.styl'

export default class Navigation extends Component {
  constructor(props) {
    super(props)

    this.state = {
      open: false,
    }
  }

  render() {
    const { open } = this.state
    const toggleMenu = (e) => {
      this.setState(prevState => ({
        open: !prevState.open // Invert the current value
      }))
    }

    return (
      <nav className={`navigation ${open ? 'open' : 'closed'}`}>
        <button onClick={toggleMenu} className="navigation__toggle">
          {!open ? 'Open menu' : 'Close menu'}
        </button>
        <ul style={{ display: open ? 'flex' : 'none'}} className="navigation__menu">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About</Link></li>
        </ul>
      </nav>
    )
  }
}
