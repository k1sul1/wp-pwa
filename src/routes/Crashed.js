import React from 'react'
import Layout from '../components/Layout'

import { dumpObject } from '../lib/helpers'

const Crashed = (props) => (
  <Layout>
    <h1>Something terrible happened, and the application crashed</h1>
    {dumpObject(props)}
  </Layout>
)

export default Crashed
