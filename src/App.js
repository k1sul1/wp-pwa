import React, { Component } from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import WP from './lib/WP'

import 'normalize.css'
import './App.styl'

// import About from './routes/About'
// import Blog from './routes/Blog'
// import Home from './routes/Home'
import Loading from './routes/Loading'
import Resolver from './routes/Resolver'


export default class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      posts: null,
      ready: true,
    }
  }

  async componentDidMount() {
    /* const [pages, posts] = await Promise.all([
      WP.getPages(),
      WP.getPosts(),
    ]).catch(console.error)

    console.log(pages, posts) */

    this.setState({
      ready: true,
      // posts,
    })
  }

  render() {
    const { ready, posts } = this.state

    if (!ready) {
      return (
        <Router>
          <div className="application">
            <Loading />
          </div>
        </Router>
      )
    }

    return (
      <Router>
        <div className="application">
          <Route render={props => (
            <Resolver {...props} />
          )} />
        </div>
      </Router>
    )
  }
}
