import React, { Component } from 'react'
import PropTypes from 'prop-types'
import AdminBar from '../components/AdminBar'
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

    if (!post) {
      throw new Error('Expected post to contain post data')
    }

    const { title, content } = post
    const { authenticated } = this.state

    return (
      <Layout sidebar={defaultSidebar} className="single-page" {...props}>
        <article className="single-page">
          {filterTitle(<h2>{title.rendered}</h2>, props)}
          {filterContent(
            content.rendered,
            props
          )}

          <AdminBar authenticated={authenticated} post={post} />
        </article>
      </Layout>
    )
  }
}

export default connect(Page)
