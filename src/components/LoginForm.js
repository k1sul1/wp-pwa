import React, { Component } from 'react'
import WP from '../lib/WP'

export default class LoginForm extends Component {
  constructor() {
    super()

    this.state = {

    }
  }

  async onSubmit(e) {
    e.preventDefault()

    console.log(this.props)
    const { afterLogin } = this.props
    const form = e.target
    const response = await WP.authenticate(form.elements[0].value, form.elements[1].value)

    if (response) {
      afterLogin && afterLogin()
      return
    }

    form.classList.add('animated', 'jello')
    await new Promise(resolve => setTimeout(resolve, 500))
    form.reset()
  }

  render() {
    return (
      <form onSubmit={(e) => this.onSubmit(e)}>
        <input type="text" name="username" defaultValue="vincit.admin" />
        <input type="password" name="password" />
        <input type="submit" />
      </form>
    )
  }
}
