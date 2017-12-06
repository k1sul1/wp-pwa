import React, { Component } from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import axios from 'axios'

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
  </Container>
)

const Blog = (props) => (
  <Container {...props}>
    list posts here
  </Container>
)

const About = (props) => (
  <Container {...props} sidebar={false}>
    <h2>About</h2>
  </Container>
)

export default class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      homepage: null,
      blogpage: null,
      ready: false
    }
  }

  componentDidMount() {
    axios.get('https://wcjkl.local/wp-json/wp/v2/pages')
      .then(response => {
        const newState = response.data.reduce((acc, page) => {
          if (page.isHomepage) {
            acc.homepage = page
          } else if (page.isBlogpage) {
            acc.blogpage = page
          }

          return acc
        }, {
          ready: true,
        })

        this.setState(newState, () => {
          // This will fire after the state has updated
        })
      })
      .catch(error => {
        console.log(error)
      })
  }

  render() {
    const { ready, blogpage, homepage } = this.state

    if (!ready) {
      console.log('not ready')
      return (
        <Router>
          <div className="application">
            <Container>
              <p>Loading...</p>
            </Container>
          </div>
        </Router>
      )
    }

    return (
      <Router>
        <div className="application">
          <Route exact path="/" component={!homepage ? Blog : Home}/>
          <Route path="/about" component={About}/>
        </div>
      </Router>
    )
  }
}
