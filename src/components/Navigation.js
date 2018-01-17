import React from 'react'
import { NavLink } from 'react-router-dom'

// Item receives a props object, and we'll extract these keys from it
// Note: Assuming object is the object type could be wrong
const Item = ({ object_id, object, url, title, onClick }) => (
  <li data-oid={object_id} data-otype={object}>
    <NavLink to={url} activeClassName="active" onClick={onClick}>{title}</NavLink>
  </li>
)

const Navigation = ({ items, open, ready, error, toggleMenu }) => (
  <nav className={`navigation ${open ? 'open' : 'closed'}`}>
    <button onClick={toggleMenu} className="navigation__toggle">
      {!open ? 'Open menu' : 'Close menu'}
    </button>
    <ul style={{ display: open ? 'flex' : 'none'}} className="navigation__menu">
      {error ? (
        <li>{error}</li>
      ) : !ready ? (
        <li>Loading...</li>
      ) : (
        items.map(item => (
          <Item {...item} key={item.id} onClick={toggleMenu} />
        ))
      )}
    </ul>
  </nav>
)

export default Navigation
