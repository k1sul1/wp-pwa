import React from 'react'
import Layout from '../components/Layout'

// import { ResolverError } from './Resolver'

const Error = (props) => {
  const { name, message } = props.error
  console.log(props)

  return (
    <Layout {...props} sidebar={false}>
      <h1>{name}</h1>
      <p>{message}</p>
    </Layout>
  )
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
