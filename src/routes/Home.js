import React from 'react'
import Page from './Page'
import { defaultSidebar } from '../components/Sidebar'

const Home = (props) => <Page {...props} sidebar={defaultSidebar} className="home" />
export default Home
