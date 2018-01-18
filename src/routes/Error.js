import React from 'react'
import PropTypes from 'prop-types'
import Layout from '../components/Layout'
import LoginForm from '../components/LoginForm'
import { dumpObject } from '../lib/helpers'

// import { ResolverError } from './Resolver'


const Error = (props) => {
  const { name, message } = props.error
  const afterLogin = props.afterLogin || (() => window.location.reload())

  return (
    <Layout {...props}>
      <h1>Error.js: {name}</h1>
      <p>{message}</p>

      {name === 'Forbidden' || name === 'Unauthorized' ? (
        <LoginForm afterLogin={() => afterLogin()} />
      ) : false}

      {dumpObject(props)}
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
