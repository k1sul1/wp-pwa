import React, { Component } from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'

import Navigation from './components/Navigation'
import Sidebar from './components/Sidebar'

/*
 * Container is used to wrap our views so we can keep the code DRY.
 * On the parameter definition, I've used destructuring. The function receives
 * props object as the first parameter, and those are the values I want to use.
 */
const Container = ({ children, sidebar = true }) => (
  <div>
    <header>
      <Navigation />
    </header>

    <main id="content" className={sidebar ? 'has-sidebar' : 'no-sidebar'}>
      {children}
      {sidebar ? <Sidebar /> : false /* sidebar is a boolean value, if it's truthy, show sidebar */}
    </main>
  </div>
)

const Home = () => (
  <Container>
    <h2>Home</h2>
  </Container>
)

const About = () => (
  <Container sidebar={false}>
    <h2>About</h2>
  </Container>
)

export default class Routes extends Component {
  render() {
    return (
      <Router>
        <div>
          <Route exact path="/" component={Home}/>
          <Route path="/about" component={About}/>
        </div>
      </Router>
    )
  }
}
