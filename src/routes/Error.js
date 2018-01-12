import React from 'react'
import PropTypes from 'prop-types'
import Layout from '../components/Layout'
import WP from '../lib/WP'
import { dumpObject } from '../lib/helpers'

// import { ResolverError } from './Resolver'

const login = (e) => {
  const form = e.target
  WP.authenticate(form.elements[0].value, form.elements[1].value)
    .then(r => {
      console.log(r)
      if (r && r.token) {
        window.location.reload()
      }

      form.reset()
    }).catch(console.error)

  e.preventDefault();
}

const Error = (props) => {
  const { name, message } = props.error

  return (
    <Layout {...props} sidebar={false}>
      <h1>{name}</h1>
      <p>{message}</p>
      {dumpObject(props)}

    {name === 'Forbidden' ? (
      <form onSubmit={login}>
        <input type="text" name="username" />
        <input type="password" name="password" />
        <input type="submit" />
      </form>
    ) : false}
    </Layout>
  )
}

Error.propTypes = {
  error: PropTypes.object.isRequired,
}

Error.defaultProps = {
  error: {
    name: 'GenericError',
    message: 'No error message provided'
  }
}

export default Error

    // switch (error.name) {
      // case 'Error': {
        // switch(error.message) {
          // case 'Network Error': {
            // console.log('Network error')
            // break
          // }

          // no default
        // }

        // break
      // }

      // no default
    // }
