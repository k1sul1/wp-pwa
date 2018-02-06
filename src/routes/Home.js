import React from 'react'
import Page from './Page'
import { defaultSidebar } from '../components/Sidebar'

/*
 * Home uses the Page component, changing some of its props.
 */
const Home = (props) => (
  <Page
    {...props}
    filterTitle={() => null}
    sidebar={defaultSidebar(props.sidebar)}
    className="home" />
)

export default Home
