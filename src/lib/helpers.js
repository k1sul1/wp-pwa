import React from 'react'
import ReactHtmlParser from 'react-html-parser'

export const dumpObject = (obj) => (
  <code>
    <pre>
      {Object.entries(obj).map(([key, value]) => `${key}: ${JSON.stringify(value, null, 2)}\n`)}
    </pre>
  </code>
)

const isDownloadComponent = (node) => {
  // readrepo url from package.json
  const nodeText = node.data || (node.children[0] && node.children[0].data);
  return nodeText === '[download]';
}

export const transformWPContent = (...args) => {
  if (isDownloadComponent(...args)) {
    const [, index] = args // Skip the first param, we don't need the node
    return (
      <a
        href="https://github.com/k1sul1/headless-wp-starter"
        target="_blank"
        rel="noopener noreferrer"
        key={index}>
        Download
      </a>
    )
  }

  return undefined
}

export const renderHTML = string => ReactHtmlParser(string, {
  transform: transformWPContent,
})


// Used to avoid caching in development and so on
export const isDevelopment = process.env.NODE_ENV === 'development' ? true : false
console.log(isDevelopment ? 'Running development build' : 'Running production build')

export const taxonomies = {
  post_tag: 'Tag',
  category: 'Category',
}

export const taxonomyName = name => taxonomies[name]
