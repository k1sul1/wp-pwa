import React from 'react'
import Archive from './Archive'
import { blogSidebar } from '../components/Sidebar'

const Blog = (props) => (
  <Archive {...props} sidebar={blogSidebar} className="blog" />
)

export default Blog
