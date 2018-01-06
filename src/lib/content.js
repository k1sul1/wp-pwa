import React from 'react'
// import ReactHtmlParser from 'react-html-parser'

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

export default transformWPContent
