import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Layout from '../components/Layout'
import LoginForm from '../components/LoginForm'
import { dumpObject } from '../lib/helpers'
import WP from '../lib/WP'

/*
 * Resolver will show this error page as a last resort.
 */

const flushCache = async () => {
  await WP.stores.requestCache.clear()
  history.back() // eslint-disable-line
}

const defaultAfterLogin = (() => window.location.reload())
export const Error = (props) => {
  const { name, message } = props.error
  const afterLogin = props.afterLogin || defaultAfterLogin

  return (
    <Layout {...props} className="error">
      <h1>Error.js: {name}</h1>
      <p>{message}</p>
      <p>Would you like to flush the request cache and go to previous page?<br />
        <button children="Yes, please" onClick={flushCache} />
      </p>

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

export default class ErrorComponent extends Component {
  componentDidMount() {
    const { error } = this.props
    console.log(error, )

    document.title = 'Error'
    if (error) {
      document.title = `Error: ${error.name}`
    }
  }

  render() {
    return <Error {...this.props} />
  }
}
