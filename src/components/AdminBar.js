import React from 'react'
import WP from '../lib/WP'

const AdminBar = (props) => {
  const { authenticated, post } = props
  const EditLink = ({ post }) => <a href={`${WP.getWPURL()}/wp-admin/post.php?post=${post.id}&action=edit`}>Edit</a>

  if (!authenticated) {
    return false
  }

  return (
    <div className="admin-bar">
      {post ? (
        <EditLink post={post} />
      ) : false}
    </div>
  )
}

export default AdminBar
