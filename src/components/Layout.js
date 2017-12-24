import React from 'react'

import Navigation from './Navigation'
import Sidebar from './Sidebar'
/*
 * Layout is used to wrap our views so we can keep the code DRY.
 */
const Layout = (props) => {
  // Here I've used destructuring to pick certain values from props.
  const {
    match,    //
    location, // <-- react-router-dom provides these
    history,  //

    children,
    sidebar = true,
    navigation = true,
  } = props;

  return [
      <header className="application__header" key="header">
        {navigation ? <Navigation match={match} /> : false}
      </header>,

      <div
        className={`application__wrapper ${sidebar ? 'has-sidebar' : 'no-sidebar'}`}
        key="wrapper"
      >
        <main
          id="content"
        >
          {children}
        </main>


        {/* sidebar is a boolean value, if it's truthy, show sidebar */}
        {sidebar ? <Sidebar /> : false }
      </div>
  ]
}

export default Layout
