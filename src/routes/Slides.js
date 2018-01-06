import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import WP from '../lib/WP'
import { getImageData } from '../lib/image'

export default class Slides extends Component {
  constructor(props) {
    super(props)

    const { post } = props

    this.state = {
      slide: post,
      slides: [],
      parent: null,
    }
  }

  afterSwitch() {
    const { slide } = this.state

    return history.pushState({}, slide.title.rendered, slide.link) // eslint-disable-line no-restricted-globals
  }

  switchSlide(direction) {
    const { slide, slides, parent } = this.state
    const compare = parent ? parent.id : slide.id
    const rootSlides = slides.filter(s => s.parent === 0)
    const currentIndex = rootSlides.findIndex(s => s.id === compare)
    const slideCount = rootSlides.length === 0 ? 0 : rootSlides.length - 1

    if (!direction) {
      return
    }

    if (parent) {
      this.setState({
        parent: null,
      })
    }

    switch (direction) {
      case 'forwards': {
        if (currentIndex < slideCount) {
          this.setState({
            slide: rootSlides[currentIndex + 1]
          }, this.afterSwitch)
        }

        break
      }

      case 'backwards': {
        if (currentIndex > 0) {
          this.setState({
            slide: rootSlides[currentIndex - 1]
          }, this.afterSwitch)
        }
        break
      }

      // no default
    }
  }

  switchSubSlide(direction) {
    const { slide, slides, parent } = this.state
    const compare = parent ? parent.id : slide.id
    const childSlides = slides.filter(s => s.parent === compare)
    const currentIndex = childSlides.findIndex(s => s.id === compare)
    const slideCount = childSlides.length === 1 ? 1 : childSlides.length - 1

    if (!direction || slideCount === 0) {
      return
    }


    switch (direction) {
      case 'downwards': {
        if (currentIndex < slideCount) {
          this.setState({
            slide: childSlides[currentIndex + 1]
          }, this.afterSwitch)

          if (!parent) {
            this.setState({
              parent: slide,
            })
          }
        }

        break
      }

      case 'upwards': {
        if (currentIndex > 0) {
          this.setState({
            slide: childSlides[currentIndex - 1]
          }, this.afterSwitch)
        } else if (parent && currentIndex === -1) {
          this.setState({
            slide: parent,
            parent: null,
          }, this.afterSwitch)
        }
        break
      }

      // no-default
    }
  }

  handleEvent(e) {
    switch(e.type) {
      case 'keydown': {
        const { slide, slides } = this.state

        switch(e.key) {
          case 'ArrowLeft': {
            this.switchSlide('backwards')
            break
          }

          case 'ArrowRight': {
            this.switchSlide('forwards')
            break
          }

          case 'ArrowUp': {
            this.switchSubSlide('upwards')
            break
          }

          case 'ArrowDown': {
            this.switchSubSlide('downwards')
            break
          }

          // no default
        }
      }

      // no default
    }
  }

  async componentDidMount() {
    document.body.classList.add('fullscreen')
    window.addEventListener('keydown', this)

    const slides = await WP.getPostsFrom('slides')

    this.setState({
      slides,
    })
  }

  async componentWillReceiveProps(props) {
    console.log('change', props)

    if (props.post) {
      this.setState({
        slide: props.post,
      })
    }
  }

  componentWillUnmount() {
    document.body.classList.remove('fullscreen')
    window.removeEventListener('keydown', this)
  }

  getSlideBackground(slide) {
    const embedded = slide._embedded
    const featuredImages = embedded ? embedded['wp:featuredmedia'] : null
    let style

    if (featuredImages) {
      const first = featuredImages[0]
      style = {
        backgroundImage: `url('${getImageData(first, 'medium').source_url}')`
      }
    }

    return style
  }

  renderSlide(slide) {
    const { title, content } = slide
    return (
      <article className="single-slide" style={this.getSlideBackground(slide)}>
        <div className="wrapper">
          <h1>
            {title.rendered}
          </h1>
          {content.rendered}
        </div>
      </article>
    )
  }

  renderSlidePreview(slide, childSlides = []) {
    return (
      <div key={slide.id} className="slide-preview" style={this.getSlideBackground(slide)}>
        <Link to={slide.link}>Open slide</Link>
        <h2>{slide.title.rendered}</h2>
        {childSlides.length ? (
          <div className="subslides">
            {childSlides.map(s => this.renderSlidePreview(s))}
          </div>
        ) : false}
      </div>
    )
  }

  renderAllSlides() {
    const parentSlides = this.state.slides.filter(slide => slide.parent === 0)
    const childSlides = this.state.slides.filter(slide => slide.parent !== 0)

    return parentSlides.map(slide => this.renderSlidePreview(slide, childSlides.filter(x => slide.id === x.parent)))
  }

  render() {
    const { slide, slides } = this.state

    if (slide === 404) {
      return (
        <div className="all-slides">
          <h1>Slide archive</h1>
          {this.renderAllSlides()}
        </div>
      )
    }

    return this.renderSlide(slide)
  }
}

