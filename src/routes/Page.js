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
    filterTitle: PropTypes.func.isRequired,
    filterContent: PropTypes.func.isRequired,
  }


  static defaultProps = {
    filterTitle: noop,
    filterContent: noop,
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
    const { WP } = this.props
    const user = await WP.getCurrentUser()

    WP.addAuthenticationListeners(this)

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
    const { filterTitle, filterContent, post, WP } = props
    const { title, content } = post
    const { authenticated } = this.state

    return (
      <Layout sidebar={defaultSidebar} {...props}>
        <article className="single-page">
          {filterTitle(<h2>{title.rendered}</h2>, props)}

          {filterContent(
            content.rendered,
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
