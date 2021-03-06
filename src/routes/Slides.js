import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { Manager, Swipe } from 'hammerjs'

import logo from '../img/vincit-logo'
import p from '../../package.json'
import WP from '../lib/WP'
import { getImageData } from '../lib/image'

/*
 * Only an idiot would spend a hundred hours creating their own slides.
 * Instead of using a premade library.
 *
 * Everything here is a terrible hack, barely works, and there are bugs.
 */
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
          document.body.style.backgroundImage = this.getSlideBackground(slide.featured_media === 0 ? parent : slide).backgroundImage
          await this.animate('bounceOutLeft')

          this.setState({
            slide: nextSlide,
            parent: relations[nextSlide.id] ? nextSlide : null,
            animationDir: 'left',
          }, this.afterSwitch)
          return true
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
          return true
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

        return true
      }
    } else {
      Object.entries(relations).forEach(([key, children]) => {
        console.log(key, parent.id, children)
      })

      // find next or previous slide by checking direction and comparing current slide position in the relations
      const currentSlideIndex = relations[parent.id].findIndex(s => s.id === slide.id)
      const nextSlide = relations[parent.id][currentSlideIndex + 1]
      const prevSlide = relations[parent.id][currentSlideIndex - 1]
      const newSlide = direction === 'upwards' ? currentSlideIndex === 0 // If going up and it's the first slide, switch to parent.
        ? parent : prevSlide
        : nextSlide

      if (newSlide) {
        document.body.style.backgroundImage = this.getSlideBackground(newSlide).backgroundImage
        await this.animate(direction !== 'upwards' ? 'bounceOutUp' : 'bounceOutDown')
        this.setState({
          slide: newSlide,
          animationDir: direction === 'upwards' ? 'up' : 'down',
        }, this.afterSwitch)

        return true
      }

      if (!parent) {
        console.error('STOP WRITING BUGGY CODE!')
        console.log('Or wait a bit.');
        return
      }
    }
  }

  async nextSlide() {
    const subslide = await this.switchSubSlide('downwards')

    if (!subslide) {
      this.switchSlide('forwards')
    }
  }

  async previousSlide() {
    const subslide = await this.switchSubSlide('upwards')

    if (!subslide) {
      this.switchSlide('backwards')
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

          case 'PageDown': {
            await this.nextSlide()
            break
          }

          case 'PageUp': {
            await this.previousSlide()
            break
          }

          // no default
        }
      }

      // no default
    }
  }

  async componentDidMount() {
    document.body.classList.add('desktop-fullscreen')
    window.addEventListener('keydown', this)

    const { slide } = this.state

    const response = await WP.getPostsFrom('slides', {
      per_page: 100, // if you have more than a hundred slides you have a problem
      _embed: 1,
    })

    const { posts, headers } = response
    const slides = posts

    if (!slides) {
      throw Error('Unable to get slides. No reason to panic.')
    } else if (parseInt(headers['x-wp-totalpages'], 10) > 1) {
      alert(`I'm not dealing with pagination in the slides. Nope. NOPE.`)
      return
    }

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

    this.addTouchGestures()
  }

  async componentWillReceiveProps(props) {
    console.log('change', props)

    if (props.post) {
      this.setState({
        slide: props.post,
      })
    }
  }

  componentDidUpdate() {
    this.hammer && this.hammer.destroy()
    this.addTouchGestures()
  }

  componentWillUnmount() {
    document.body.classList.remove('desktop-fullscreen')
    window.removeEventListener('keydown', this)

    this.hammer && this.hammer.destroy()
  }

  addTouchGestures() {
    if (!this.slide) {
      return false
    }

    this.hammer = new Manager(this.slide)
    this.hammer.add(new Swipe())

    this.hammer.on('swipe', (e) => {
      switch (e.direction) {
        case 4: {
          return this.nextSlide()
        }

        case 2: {
          return this.previousSlide()
        }

        // no default
      }
    })
  }

  getSlideBackground(slide) {
    const defaultReturn = {
      backgroundImage: '',
    }

    if (!slide) {
      return defaultReturn
    }

    const embedded = slide._embedded
    const featuredImages = embedded ? embedded['wp:featuredmedia'] : null

    if (featuredImages) {
      const first = featuredImages[0]

      if (first && first.code === 'rest_forbidden') {
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

    const bg = this.getSlideBackground(slide)
    const isGif = bg && bg.backgroundImage.indexOf('.gif') !== -1
    const cn = `single-slide animated ${slide.parent ? 'child' : 'parent'} ${isGif ? 'gif' : ''}`

    const { title, content } = slide
    const Title = ({ children }) => children.length > 0 && (
      <h1 className="slide-title">{children}</h1>
    )
    const Content = ({ children }) => children.length > 0 && (
      <div className="slide-content">
        {content.rendered}
      </div>
    )
    return (
      <article
        className={cn}
        onClick={({ target }) => target.classList.toggle('stop')}
        ref={(n) => this.slide = n}
        style={bg}>
        <div className="wrapper">
          <Title>{title.rendered}</Title>
          <Content>{content.rendered}</Content>
        </div>

        <a
          className="edit"
          href={`${WP.getWPURL()}/wp-admin/post.php?post=${slide.id}&action=edit`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Edit slide
        </a>

        <img src={logo} alt="Vincit" className="vincit-logo" />
        <span className="handle">@k1sul1</span>
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
      return <p className="slide-loading-text">Any moment now...</p>
    }

    if (!slide) {
      return (
        <div className="all-slides">
          {this.renderAllSlidePreviews()}
        </div>
      )
    }

    return this.renderSlide(slide)
  }
}

