import React from 'react'
import p from '../../package.json'

/*
 * Download will simple link to the repository of this project.
 */
const Download = () => (
  <section className="download-project">
    <div className="wrapper">
      <h2>Browse the source, fork or download it</h2>
      <p>Released under MIT, so you can do pretty much whatever you want with it.</p>

      <a
        href={p.repository.url}
        target="_blank"
        rel="noopener noreferrer"
        className="button"
      >
        View project on GitHub
      </a>
    </div>
  </section>
)

export default Download
