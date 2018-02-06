import React from 'react'
import Archive from './Archive'
import { blogSidebar } from '../components/Sidebar'

/*
 * Blog uses the archive template, modifying some props of it.
 */
const Blog = (props) => (
  <Archive
    {...props}
    sidebar={blogSidebar(props.sidebar)}
    className="blog"
  />
)

export default Blog
