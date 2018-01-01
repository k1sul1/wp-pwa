import React, { Fragment } from 'react'
import Layout from '../components/Layout'
import SearchForm from '../components/SearchForm'

import { dumpObject } from '../lib/helpers'

const sidebar = {
  children: (
    <Fragment>
      <h2>Try the search</h2>

      <SearchForm />
    </Fragment>
  )
}

const FourOhFour = (props) => (
  <Layout {...{sidebar}}>
    <h1>404</h1>

    {dumpObject(props)}
  </Layout>
)

export default FourOhFour
