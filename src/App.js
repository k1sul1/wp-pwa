import React, { Component } from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import axios from 'axios'

import 'normalize.css'
import './App.styl'

import About from './routes/About'
import Blog from './routes/Blog'
import Home from './routes/Home'
import Loading from './routes/Loading'
import Resolver from './routes/Resolver'


export default class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      homepage: null,
      blogpage: null,
      posts: null,
      ready: false
    }
  }

  async componentDidMount() {
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

    try {
      const response = await axios.get('https://wcjkl.local/wp-json/wp/v2/posts')
      const posts = response.data

      this.setState({
        posts,
      })
    } catch (e) {
      console.log(e)
    }
  }

  render() {
    const { ready, blogpage, homepage, posts } = this.state

    if (!ready) {
      console.log('not ready')
      return (
        <Router>
          <div className="application">
            <Loading />
          </div>
        </Router>
      )
    }

    const Component = !homepage ? Blog : Home
    const data = !homepage ? blogpage : homepage

    return (
      <Router>
        <div className="application">
          {/*
          <Route exact path="/" render={props => (
            <Component {...props} data={data}  posts={posts}/>
          )} />
          <Route path="/about" component={About}/>*/}

          <Route render={props => (
            <Resolver {...props} data={data} posts={posts} />
          )} />
          {/* <Route component={Resolver} /> */}

        </div>
      </Router>
    )
  }
}
