import React from 'react'
import ReactHtmlParser from 'react-html-parser'

import SyntaxHighlighter, { registerLanguage } from 'react-syntax-highlighter/prism-light'
import jsx from 'react-syntax-highlighter/languages/prism/jsx'
import prism from 'react-syntax-highlighter/styles/prism/prism' // eslint-disable-line
import { atomDark } from 'react-syntax-highlighter/styles/prism'

registerLanguage('jsx', jsx)

export const dumpObject = (obj) => {
  const string = JSON.stringify({ ...obj }, null, 2)

  return (
    <SyntaxHighlighter language='javascript' style={atomDark}>
      {string}
    </SyntaxHighlighter>
  )
}


const isDownloadComponent = (node) => {
  // readrepo url from package.json
  const nodeText = node.data || (node.children[0] && node.children[0].data);
  return nodeText === '[download]';
}

const isCodeblock = (node) => {
  const cond = node.name === 'code'

  if (cond) {
    // console.log(node)
  }

  return cond
}

const isCodechild = (node) => {
  const cond = (node.parent && node.parent.name === 'code')

  if (cond) {
    // console.log(node)
  }

  return cond
}

// Used to avoid caching in development and so on
export const isDevelopment = process.env.NODE_ENV === 'development' ? true : false
console.log(isDevelopment ? 'Running development build' : 'Running production build')

// TODO: Maybe add this data to the REST API via expose-more-pagedata?
export const taxonomies = {
  post_tag: {
    name: 'Tag',
    RESTBase: 'tags',
  },

  category: {
    name: 'Category',
    RESTBase: 'categories',
  }
}

export const taxonomyExists = slug => slug in taxonomies
export const taxonomyName = slug => taxonomyExists(slug) && taxonomies[slug.toLowerCase()].name
export const taxonomyRESTBase = slug => taxonomyExists(slug) && taxonomies[slug.toLowerCase()].RESTBase
export const transformWPContent = (...args) => {
  const [node, index] = args
  if (isDownloadComponent(...args)) {
    return (
      <a
        href="https://github.com/k1sul1/headless-wp-starter"
        target="_blank"
        rel="noopener noreferrer"
        key={index}>
        Download
      </a>
    )
  } else if (isCodeblock(...args)) {
    const string = node.children.map(child => child.data).join()
    return (
      <SyntaxHighlighter language='javascript' style={atomDark} className={string.length < 30 ? 'small' : 'normal'} key={index}>
        {string}
      </SyntaxHighlighter>
    )
  } else if (isCodechild(...args)) {
    return false
  }

  return undefined
}

export const renderHTML = (str) => ReactHtmlParser(str, {
  transform: transformWPContent,
})


