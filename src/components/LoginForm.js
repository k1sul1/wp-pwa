import React from 'react'
import PropTypes from 'prop-types'
import WP from '../lib/WP'

async function onSubmit(e, afterLogin) {
  e.preventDefault()
  e.stopPropagation()

  // console.log(this.props)
  // const { afterLogin } = this.props
  const form = e.target
  const response = await WP.authenticate(form.elements[0].value, form.elements[1].value)

  if (response) {
    afterLogin(response)
    return
  }

  form.classList.add('animated', 'jello')
  await new Promise(resolve => setTimeout(resolve, 500))
  form.classList.remove('animated', 'jello')
  form.reset()
}

const LoginForm = ({ afterLogin }) => {
  return (
    <form className="login-form" onSubmit={(e) => onSubmit(e, afterLogin)}>
      <label htmlFor="username_input">
        <span>Username</span>
        <input id="username_input" type="text" name="username" defaultValue="vincit.admin" />
      </label>

      <label htmlFor="password_input">
        <span>Password</span>
        <input id="password_input" type="password" name="password" />
      </label>

      <input type="submit" />
    </form>
  )
}

LoginForm.propTypes = {
  afterLogin: PropTypes.func,
}

LoginForm.defaultProps = {
  afterLogin: () => null,
}

export default LoginForm
