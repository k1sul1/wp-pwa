import React from 'react'
import Layout from '../components/Layout'

const About = (props) => (
  <Layout {...props} sidebar={false}>
    <h2>About</h2>
    {props.post.post_content}
    <p>
      Additional text that isn't in DB!
    </p>

  </Layout>
)

export default About
