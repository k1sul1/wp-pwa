import React from 'react'
import Layout from '../components/Layout'
import PostList from '../components/PostList'
import { taxonomyName } from '../lib/helpers'


const Archive = (props) => {
  const { archive } = props
  const prefix = taxonomyName(archive.taxonomy) || false

  const titlePrefix = prefix && `${prefix}: `
  const title = archive.label || archive.name

  if (!archive) {
    throw new Error(`Archive wasn't provided with archive data, unable to render archive.`);
  }

  return (
    <Layout className="archive" {...props}>
      <h1>
        {titlePrefix}
        {title}
      </h1>

      <PostList context={archive}/>
    </Layout>
  )
}

export default class ArchiveComponent extends React.Component {
  componentDidMount() {
    document.querySelector('main#content').classList.add('bg--grey')
  }

  componentWillUnmount() {
    document.querySelector('main#content').classList.remove('bg--grey')
  }

  render() {
    return <Archive {...this.props} />
  }
}
// export default Archive
