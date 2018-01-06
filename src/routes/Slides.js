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
      animationDir: null,
    }
  }

  resetAnimationClasses(element) {
    const classes = [
      'slideOutUp',
      'slideOutDown',
      'slideOutLeft',
      'slideOutRight',
      'slideInUp',
      'slideInDown',
      'slideInLeft',
      'slideInRight',
    ]

    if (element) {
      element.classList.remove(...classes)
    }
  }

  async animate(className) {
    if (!this.slide) {
      console.log('unable to animate as slide is not set', this.slide)
      return false
    }

    this.resetAnimationClasses(this.slide)
    this.slide.classList.add(className)
    await new Promise(resolve => setTimeout(resolve, 300))
    this.resetAnimationClasses(this.slide)
  }

  async afterSwitch() {
    const { slide, animationDir } = this.state

    switch (animationDir) {
      case 'left': {
        await this.animate('slideInRight')
        break
      }

      case 'right': {
        await this.animate('slideInLeft')
        break
      }

      case 'up': {
        await this.animate('slideInDown')
        break
      }

      case 'down': {
        await this.animate('slideInUp')
        break
      }

      // no default
    }

    return history.pushState({}, slide.title.rendered, slide.link) // eslint-disable-line no-restricted-globals
  }

  async switchSlide(direction) {
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
          await this.animate('slideOutLeft')

          this.setState({
            slide: rootSlides[currentIndex + 1],
            animationDir: 'left',
          }, this.afterSwitch)
        }

        break
      }

      case 'backwards': {
        if (currentIndex > 0) {
          await this.animate('slideOutRight')

          this.setState({
            slide: rootSlides[currentIndex - 1],
            animationDir: 'right'
          }, this.afterSwitch)
        }
        break
      }

      // no default
    }
  }

  async switchSubSlide(direction) {
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
        console.log(currentIndex, slideCount, childSlides, compare)
        if (currentIndex < slideCount) {
          await this.animate('slideOutUp')

          this.setState({
            slide: childSlides[currentIndex + 1],
            animationDir: 'down',
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
          await this.animate('slideOutDown')

          this.setState({
            slide: childSlides[currentIndex - 1],
            animationDir: 'up',
          }, this.afterSwitch)
        } else if (parent && currentIndex === -1) {
          await this.animate('slideOutDown')

          this.setState({
            slide: parent,
            parent: null,
            animationDir: 'up',
          }, this.afterSwitch)
        }
        break
      }

      // no default
    }
  }

  async handleEvent(e) {
    switch(e.type) {
      case 'keydown': {
        switch(e.key) {
          case 'ArrowLeft': {
            this.switchSlide('backwards')
            break
          }

          case 'ArrowRight': {
            await this.switchSlide('forwards')
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
    if (!slide) {
      return false
    }

    const { title, content } = slide
    return (
      <article className="single-slide animated" ref={(n) => this.slide = n} style={this.getSlideBackground(slide)}>
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

  renderAllSlidePreviews() {
    const parentSlides = this.state.slides.filter(slide => slide.parent === 0)
    const childSlides = this.state.slides.filter(slide => slide.parent !== 0)

    return parentSlides.map(slide => this.renderSlidePreview(slide, childSlides.filter(x => slide.id === x.parent)))
  }

  render() {
    const { slide } = this.state

    if (slide === 404) {
      return (
        <div className="all-slides">
          {this.renderAllSlidePreviews()}
        </div>
      )
    }

    return this.renderSlide(slide)
  }
}

