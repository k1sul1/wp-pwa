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
      console.log(e);
      this.setState(prevState => ({
        open: !prevState.open // Invert the current value
      }))
    }

    return (
      <nav className="navigation" onClick={toggleMenu}>
        <ul style={{ display: open ? 'flex' : 'none'}}>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About</Link></li>
        </ul>
      </nav>
    )
  }
}
