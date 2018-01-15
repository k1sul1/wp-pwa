import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Layout from '../components/Layout'
import { defaultSidebar } from '../components/Sidebar'
import { connect } from '../lib/WP'

const noop = n => n
class Page extends Component {
  constructor() {
    super()

    this.state = {
      authenticated: false
    }
  }

  static propTypes = {
    hooks: PropTypes.object,
    post: PropTypes.object.isRequired,
  }


  static defaultProps = {
    hooks: {
      title: noop,
      content: noop,
    },
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
    console.log(this.props.hooks)

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
    const { hooks, post, WP } = props
    const { title, content } = post
    const { authenticated } = this.state

    console.log(hooks)

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
              <a href={`${WP.getWPURL()}/wp-admin/post.php?post=${post.id}&action=edit`}>Edit</a>
            </div>
          ) : false }
        </article>
      </Layout>
    )
  }
}

export default connect(Page)
