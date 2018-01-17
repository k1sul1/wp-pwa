import React from 'react'
import WP from './WP'
import p from  '../../package.json'

export const createSrcset = (sizes) => Object.keys(sizes).map((key) => `${sizes[key].source_url} ${sizes[key].width}w`)
export const getImageData = (image, size) => {
  if (!image) return false

  let source_url
  let alt_text
  let media_details
  let sizes

  if (!image.source_url) {
    // acf image
    source_url = image.url
    alt_text = image.alt
    media_details = {
      width: image.width,
      height: image.height,
      file: image.filename,
      sizes: Object.keys(image.sizes).reduce((acc, sizeKey) => {
        if (sizeKey.includes('-height')) {
          const value = image.sizes[sizeKey]
          const k = sizeKey.replace('-height', '')
          acc[k].height = value
        } else if (sizeKey.includes('-width')) {
          const value = image.sizes[sizeKey]
          const k = sizeKey.replace('-width', '')
          acc[k].width = value
        } else {
          acc[sizeKey] = {
            source_url: image.sizes[sizeKey],
          }
        }

        return acc
      }, {}),
    }
    sizes = media_details.sizes
  } else {
    // standard image
    source_url = image.source_url
    alt_text = image.alt_text
    sizes = image.media_details.sizes
  }

  const isSVG = source_url.indexOf('.svg')

  if (size && !isSVG && sizes[size]) {
    source_url = sizes[size].source_url
  }

  const srcset = isSVG ? false : createSrcset(sizes)
  source_url = WP.getWPURL() + source_url

  return {
    srcset,
    source_url,
    alt_text,
  }
}

export const Image = ({ imageObj, size = 'medium', ...remaining }) => {
  if (!imageObj) return false
  const image = getImageData(imageObj, size)
  const url = image.source_url

  return <img src={url} alt={image.alt_text} {...remaining} />
}
