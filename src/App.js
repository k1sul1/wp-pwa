import React from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'

import 'normalize.css'
import './App.styl'

import Resolver from './routes/Resolver'

const App = () => (
  <Router>
    <div className="application">
      <Route render={props => (
        <Resolver {...props} />
      )} />
    </div>
  </Router>
)

export default App
