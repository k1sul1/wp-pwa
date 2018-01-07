import React from 'react'

export const dumpObject = (obj) => (
  <code>
    <pre>
      {Object.entries(obj).map(([key, value]) => `${key}: ${(value)}\n`)}
    </pre>
  </code>
)

const isDownloadComponent = (node) => {
  const nodeText = node.data || (node.children[0] && node.children[0].data);
  return nodeText === '[download]';
}

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
export const isDevelopment = module.hot ? true : false
console.log(isDevelopment ? 'Running development build' : 'Running production build')
