import React, { Component } from 'react'
import { NavLink } from 'react-router-dom'

import WP from '../lib/WP'

// Item receives a props object, and we'll extract these keys from it
// Note: Assuming object is the object type could be wrong
const Item = ({ object_id, object, url, title, onClick }) => (
  <li data-oid={object_id} data-otype={object}>
    <NavLink to={url} activeClassName="active" onClick={onClick}>{title}</NavLink>
  </li>
)

export default class Navigation extends Component {
  constructor(props) {
    super(props)

    this.state = {
      open: false,
      items: [],
      ready: false,
    }
  }

  async componentDidMount() {
    const menu = await WP.getMenu(3)
    const { items } = menu

    this.setState({
      items,
      ready: true,
    })
  }

  render() {
    const { open, items, ready } = this.state
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
          {!ready ? (
            <li>Loading...</li>
          ) : (
            items.map(item => (
              <Item {...item} key={item.id} onClick={toggleMenu} />
            ))
          )}
        </ul>
      </nav>
    )
  }
}
