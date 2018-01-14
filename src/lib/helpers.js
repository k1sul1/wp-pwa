import React from 'react'

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

// const isColumnComponent = (node) => {
  // const nodeText = node.data || (node.children[0] && node.children[0].data);
  // return nodeText === '[column]';
// }


export const transformWPContent = (...args) => {
  if (isDownloadComponent(...args)) {
    return (
      <a href="https://github.com/k1sul1/headless-wp-starter" target="_blank" rel="noopener noreferrer">
        Download
      </a>
    )
  }

  return undefined
}

// Used to avoid caching in development and so on
export const isDevelopment = process.env.NODE_ENV === 'development' ? true : false
console.log(isDevelopment ? 'Running development build' : 'Running production build')
