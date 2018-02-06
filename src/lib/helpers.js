import React from 'react'
import ReactHtmlParser from 'react-html-parser'

import SyntaxHighlighter, { registerLanguage } from 'react-syntax-highlighter/prism-light'
import jsx from 'react-syntax-highlighter/languages/prism/jsx'
import javascript from 'react-syntax-highlighter/languages/prism/javascript'
import prism from 'react-syntax-highlighter/styles/prism/prism' // eslint-disable-line
import { atomDark } from 'react-syntax-highlighter/styles/prism'

import Download from '../components/Download'

registerLanguage('jsx', jsx)
registerLanguage('javascript', javascript)

export const dumpObject = (obj) => {
  const string = JSON.stringify({ ...obj }, null, 2)

  return (
    <SyntaxHighlighter language='javascript' style={atomDark}>
      {string}
    </SyntaxHighlighter>
  )
}


const isDownloadComponent = (node) => {
  const nodeText = node.data || (node.children[0] && node.children[0].data);
  return nodeText === '[download]';
}

const isCodeblock = (node) => node.name === 'code'
const isCodechild = (node) => (node.parent && node.parent.name === 'code')

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

export const taxonomyExists = slug => typeof slug === 'string' && slug.toLowerCase() in taxonomies
export const taxonomyName = slug => taxonomyExists(slug) && taxonomies[slug.toLowerCase()].name
export const taxonomyRESTBase = slug => taxonomyExists(slug) && taxonomies[slug.toLowerCase()].RESTBase

export const transformWPContent = (...args) => {
  const [node, index] = args
  if (isDownloadComponent(...args)) {
    return <Download key={index} />
  } else if (isCodeblock(...args)) {
    const string = node.children.map(child => child.data).join()
    return (
      <SyntaxHighlighter language='javascript' style={atomDark} className={string.length < 30 ? 'small' : 'normal'} key={index}>
        {string}
      </SyntaxHighlighter>
    )
  } else if (isCodechild(...args)) {
    return null
  }

  return undefined
}

export const renderHTML = (str) => ReactHtmlParser(str, {
  transform: transformWPContent,
})


