import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

export default class Sidebar extends Component {
  constructor(props) {
    super(props)

    this.state = {
      posts: []
    }
  }

  componentDidMount() {
    axios.get('https://wcjkl.local/wp-json/wp/v2/posts')
      .then(response => {
        const posts = response.data.map(post => {
          return (
            <p key={post.id}>
              <Link to={post.link.replace('https://wcjkl.local', '')}>{post.title.rendered}</Link>
            </p>
          )
        })

        this.setState({
          posts,
        })
      })
      .catch(error => {
        console.log(error)
      })
  }

  render() {
    const { posts } = this.state

    return (
      <aside>
        <h3>Sidebar</h3>
        {posts}
      </aside>
    )
  }
}
