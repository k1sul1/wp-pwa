import React, { Component } from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'

import 'normalize.css'
import './App.styl'
import Navigation from './components/Navigation'
import Sidebar from './components/Sidebar'

/*
 * Container is used to wrap our views so we can keep the code DRY.
 */
const Container = (props) => {
  // Here I've used destructuring to pick certain values from props.
  const {
    match,    //
    location, // <-- react-router-dom provides these
    history,  //

    children,
    sidebar = true
  } = props;

  console.log(match, location, history);

  return [
      <header className="application__header" key="header">
        <Navigation match={match} />
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

const Home = (props) => (
  <Container {...props}>
    <h2>Home</h2>
    <p>Help</p>

  </Container>
)

const About = (props) => (
  <Container {...props} sidebar={false}>
    <h2>About</h2>
  </Container>
)

export default class App extends Component {
  render() {
    return (
      <Router>
        <div className="application">
          <Route exact path="/" component={Home}/>
          <Route path="/about" component={About}/>
        </div>
      </Router>
    )
  }
}
