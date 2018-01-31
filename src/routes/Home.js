import React from 'react'
import Page from './Page'
import { defaultSidebar } from '../components/Sidebar'

const Home = (props) => (
  <Page
    {...props}
    filterTitle={() => null}
    sidebar={defaultSidebar(props.sidebar)}
    className="home" />
)

export default Home
