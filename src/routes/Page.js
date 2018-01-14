import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Layout from '../components/Layout'
import { defaultSidebar } from '../components/Sidebar'
import { connect } from '../lib/WP'
import p from '../../package.json'

class Page extends Component {
  constructor() {
    super()

    this.state = {
      authenticated: false
    }
  }

  onlogout() {
    this.setState({
      authenticated: false,
    })
  }

  onauthenticated() {
    this.setState({
      authenticated: true,
    })
  }

  handleEvent(e) {
    console.log(e)
    this[`on${e.type}`](e)
  }

  async componentDidMount() {
    this.props.WP.addAuthenticationListeners(this)
    const user = await this.props.WP.getCurrentUser()

    if (user) {
      this.setState({
        authenticated: true,
      })
    }
  }

  componentWillUnmount() {
    this.props.WP.removeAuthenticationListeners(this)
  }

  render() {
    const props = this.props
    const { hooks, post } = props
    const { title, content } = post
    const { authenticated } = this.state

    return (
      <Layout sidebar={defaultSidebar} {...props}>
        <article className="single-page">
          {hooks.title(<h2>{title.rendered}</h2>, props)}

          {hooks.content(
            <section>
              {content.rendered}
            </section>,
            props
          )}

          {authenticated ? (
            <div className="admin-bar">
              <a href={`${p.WPURL}/wp-admin/post.php?post=${post.id}&action=edit`}>Edit</a>
            </div>
          ) : false }
        </article>
      </Layout>
    )
  }
}

Page.propTypes = {
  hooks: PropTypes.object,
  post: PropTypes.object.isRequired,
}

Page.defaultProps = {
  hooks: {
    title: (n) => n,
    content: (n) => n,
  },
}

export default connect(Page)
