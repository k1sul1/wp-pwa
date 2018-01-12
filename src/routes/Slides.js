import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import p from '../../package.json'
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
      relations: {},
      animationDir: null,
      ready: false,
    }
  }

  resetAnimationClasses(element) {
    const classes = [
      'bounceOutUp',
      'bounceOutDown',
      'bounceOutLeft',
      'bounceOutRight',
      'bounceInUp',
      'bounceInDown',
      'bounceInLeft',
      'bounceInRight',
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

    this.animationInProgress = true
    this.resetAnimationClasses(this.slide)
    this.slide.classList.add(className)
    await new Promise(resolve => setTimeout(resolve, 300))
    this.resetAnimationClasses(this.slide)
    this.animationInProgress = false
  }

  async afterSwitch() {
    const { slide, animationDir } = this.state

    switch (animationDir) {
      case 'left': {
        await this.animate('bounceInRight')
        break
      }

      case 'right': {
        await this.animate('bounceInLeft')
        break
      }

      case 'up': {
        await this.animate('bounceInDown')
        break
      }

      case 'down': {
        await this.animate('bounceInUp')
        break
      }

      // no default
    }

    if (slide) {
      return history.pushState({}, slide.title.rendered, slide.link) // eslint-disable-line no-restricted-globals
    }
  }

  async switchSlide(direction) {
    if (!direction || this.animationInProgress) {
      return
    }

    const { slide, slides, parent, relations } = this.state
    const compare = parent ? parent.id : slide.id
    const rootSlides = slides.filter(s => s.parent === 0)
    const currentIndex = rootSlides.findIndex(s => s.id === compare)
    const slideCount = rootSlides.length === 0 ? 0 : rootSlides.length - 1


    switch (direction) {
      case 'forwards': {
        if (currentIndex < slideCount) {
          console.log(slide)
          const nextSlide = rootSlides[currentIndex + 1]
console.log(this.getSlideBackground)
          document.body.style.backgroundImage = this.getSlideBackground(slide.featured_media === 0 ? parent : slide).backgroundImage
          await this.animate('bounceOutLeft')

          this.setState({
            slide: nextSlide,
            parent: relations[nextSlide.id] ? nextSlide : null,
            animationDir: 'left',
          }, this.afterSwitch)
        }

        break
      }

      case 'backwards': {
        if (currentIndex > 0) {
          const prevSlide = rootSlides[currentIndex - 1]
          document.body.style.backgroundImage = this.getSlideBackground(slide.featured_media === 0 ? parent : slide).backgroundImage
          await this.animate('bounceOutRight')

          this.setState({
            slide: prevSlide,
            parent: relations[prevSlide.id] ? prevSlide : null,
            animationDir: 'right'
          }, this.afterSwitch)
        }
        break
      }

      // no default
    }
  }

  async switchSubSlide(direction) {
    if (!direction || this.animationInProgress) {
      return false
    }

    // known bug: doesn't work if first slide contains subslides

    const { slide, relations, parent } = this.state
    const isParent = relations[slide.id] ? true : false


    if (slide.parent === 0 && !isParent) {
      return false // No children.
    }

    if (isParent) {
      // can only go down
      if (direction === 'downwards') {
        // document.body.style.backgroundImage = this.getSlideBackground(slide).backgroundImage
        this.setState({
          slide: relations[slide.id][0],
          animationDir: 'down',
          // parent,
        }, this.afterSwitch)

        return
      }
    } else {
      Object.entries(relations).forEach(([key, children]) => {
        console.log(key, parent.id, children)
      })

      console.log(slide)
      console.log(parent)
      console.log(relations)
      console.log(relations[parent.id])

      // find next or previous slide by checking direction and comparing current slide position in the relations
      const currentSlideIndex = relations[parent.id].findIndex(s => s.id === slide.id)
      const nextSlide = relations[parent.id][currentSlideIndex + 1]
      const prevSlide = relations[parent.id][currentSlideIndex - 1]
      const newSlide = direction === 'upwards' ? currentSlideIndex === 0 // If going up and it's the first slide, switch to parent.
        ? parent : prevSlide
        : nextSlide

      console.log(currentSlideIndex)
      console.log(nextSlide)
      console.log(prevSlide)

      if (newSlide) {
        document.body.style.backgroundImage = this.getSlideBackground(newSlide).backgroundImage
        await this.animate(direction !== 'upwards' ? 'bounceOutUp' : 'bounceOutDown')
        this.setState({
          slide: newSlide,
          animationDir: direction === 'upwards' ? 'up' : 'down',
        }, this.afterSwitch)
      }

      if (!parent) {
        console.error('STOP WRITING BUGGY CODE!')
        console.log('Or wait a bit.');
        return
      }

      /* const relationsLength = relations[parent.id].length
      const slideCount = relationsLength > 1 ? relationsLength - 1 : relationsLength


      switch (direction) {
        case 'downwards': {
          if (currentIndex < slideCount) {
            // document.body.style.backgroundImage = this.getSlideBackground(relations[parent.id][currentIndex + 1]).backgroundImage
            await this.animate('bounceOutUp')

            this.setState({
              slide: relations[parent.id][currentIndex + 1],
              parent,
              animationDir: 'down',
            }, this.afterSwitch)
          }

          break
        }

        case 'upwards': {
          if (currentIndex - 1 >= 0) {
            // document.body.style.backgroundImage = this.getSlideBackground(relations[parent.id][currentIndex - 1]).backgroundImage
            await this.animate('bounceOutDown')

            this.setState({
              slide: relations[parent.id][currentIndex - 1],
              parent,
              animationDir: 'up',
            }, this.afterSwitch)
          } else if (currentIndex - 1 < 0) {
            await this.animate('bounceOutDown')
            // document.body.style.backgroundImage = this.getSlideBackground(parent).backgroundImage


            this.setState({
              slide: parent,
              animationDir: 'up',
            }, this.afterSwitch)
          }
          break
        }

        // no default
      } */
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

    const { slide } = this.state

    const slides = await WP.getPostsFrom('slides', {
      perPage: 100, // if you have more than a hundred slides you have a problem
    }, {
      // preferCache: true,
      // cacheStaleTime: 3600000 / 12,
    })
    const relations = slides.reduce((acc, slide) => {
      if (slide.parent !== 0) {
        const parentID = slide.parent

        if (acc[parentID]) {
          acc[parentID] = [
            ...acc[parentID],
            slide,
          ].sort((a, b) => {
            return a.menu_order - b.menu_order
          })
        } else {
          acc[parentID] = [slide]
        }
      }

      return acc
    }, {})

    let parent

    if (slide && slide.parent !== 0) {
      parent = slides.find(s => s.id === slide.parent)
    }

    this.setState({
      slides,
      relations,
      parent,
      ready: true,
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
    const defaultReturn = {
      backgroundImage: false,
    }

    if (!slide) {
      return defaultReturn
    }

    const embedded = slide._embedded
    const featuredImages = embedded ? embedded['wp:featuredmedia'] : null

    if (featuredImages) {
      const first = featuredImages[0]

      if (first.code === 'rest_forbidden') {
        // https://core.trac.wordpress.org/ticket/41445
        return defaultReturn
      }

      const image = getImageData(first, 'medium')

      return {
        backgroundImage: `url('${image.source_url}')`
      }
    }

    return defaultReturn
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
        <a className="edit" href={`${p.WPURL}/wp-admin/post.php?post=${slide.id}&action=edit`}>
          Edit slide
        </a>
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
    const { slide, ready } = this.state

    if (!ready) {
      return <p>Any moment now...</p>
    }

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

