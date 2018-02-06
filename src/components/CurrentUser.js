import React, { Component } from 'react'
import PropTypes from 'prop-types'
import LoginForm from '../components/LoginForm'
import WP from '../lib/WP'

/*
 * CurrentUser displays current user data, or a login form if unauthenticated.
 */
const User = (props) => {
  return (
    <div className="user">
      <p>Logged in as {props.user_display_name}.</p>

      <a onClick={props.logout}>Log out?</a>
    </div>
  )
}

export default class CurrentUser extends Component {
  constructor(props) {
    super(props)

    this.state = {
      user: false,
      loading: true,
    }
  }

  static propTypes = {
    user: PropTypes.object
  }

  static defaultProps = {
    user: {}
  }

  async handleEvent(e) {
    // Note that handleEvent doesn't work with React events, such as onClick!
    switch(e.type) {
      case 'logout': {
        this.setState({
          user: false,
        })
        break
      }

      case 'authenticated': {
        this.setState({
          user: e.detail.response,
        })
        break
      }

      // no default
    }
  }

  async componentDidMount() {
    WP.addAuthenticationListeners(this)

    const user = await WP.getCurrentUser()

    if (user) {
      return this.setState({
        user,
        loading: false,
      })
    }

    // Will be batched. Show defaults.
    this.setState({
      loading: false,
    })
  }

  componentWillUnmount() {
    WP.removeAuthenticationListeners(this)
  }

  render() {
    const { loading, user } = this.state

    if (loading) {

      return <p>Loading...</p>
    }

    return user ? (
      <User {...user} logout={WP.logout} />
    ) : (
      <LoginForm />
    )
  }
}

