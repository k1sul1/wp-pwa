import React from 'react'
import Page from './Page'

const fancyHeader = (node, props) => {
  return (
    <header className='fancy-header'>
      {node}
    </header>
  )
}

const About = (props) => (
  <Page {...props} hooks={{ title: fancyHeader, content: (n) => n }} />
)

export default About
