import React from 'react'
import ReactDOM from 'react-dom'
import webfontloader from 'webfontloader'
import Konami from 'konami'

import App from './App'
import registerServiceWorker from './registerServiceWorker'

webfontloader.load({
  google: {
    families: ['Source Sans Pro', 'Source Code Pro'],
  }
})

new Konami(() => {
  alert('Konami code activated!')

  window.location.href = '/slides/'
})

ReactDOM.render(<App /> , document.getElementById('root'))

if (module.hot) {
  module.hot.accept('./App', () => {
    ReactDOM.render(<App />, document.getElementById('root'))
  })
}

registerServiceWorker()
