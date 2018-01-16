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
  <Page {...props} className="about" filterTitle={fancyHeader} />
)

export default About
