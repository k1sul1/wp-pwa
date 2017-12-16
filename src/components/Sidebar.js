import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

export default class Sidebar extends Component {
  constructor(props) {
    super(props)

    this.state = {}
  }

  async componentDidMount() {
  }

  render() {
    const { posts } = this.props

    return (
      <aside>
        <h3>Sidebar</h3>
        {posts && posts.map(post => {
          return (
            <p key={post.id}>
              <Link to={''}>{post.title.rendered}</Link>
            </p>
          )
        })
}
      </aside>
    )
  }
}
