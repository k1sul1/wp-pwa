import React, { Component } from 'react'

export default class Slide extends Component {
  constructor() {
    super()

    this.state = {
      slide: false,
      subslides: false,
    }
  }

  handleEvent(e) {
    switch(e.type) {
      case 'keydown': {
        switch(e.key) {
          case 'ArrowLeft': {
            console.log('left')
            break
          }

          case 'ArrowRight': {
            console.log('right')
            break
          }

          case 'ArrowUp': {
            console.log('up')
            break
          }

          case 'ArrowDown': {
            console.log('down')
            break
          }

          // no default
        }
        console.log(e)
      }

      // no default
    }
  }

  componentDidMount() {
    document.body.classList.add('fullscreen')
    window.addEventListener('keydown', this)
  }

  componentWillUnmount() {
    document.body.classList.remove('fullscreen')
    window.removeEventListener('keydown', this)
  }

  render() {
    const { title, content } = this.props.post

    return (
      <article className="slide">
        <h1>{title.rendered}</h1>
        {content.rendered}
      </article>
    )
  }
}

