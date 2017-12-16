const fs = require('fs')
const watch = require('node-watch')
const routes = require('./routes.json')

const route = {
  write(type, name) {
    const types = ['enable', 'disable']
    const state = types.indexOf(type) > -1 ? [true, false][types.indexOf(type)] : new Error('Wat?')
    const fresh = require('./routes.json')

    console.log(fresh)
    const obj = Object.assign(
      {},
      fresh,
      { [name]: state }
    )

    fs.writeFile('./src/routes.json', JSON.stringify(obj, false, 2), (err) => {
      if (err) {
        return console.log(err)
      }

      console.log(type, name, obj)
    })
  },

  enable(name) {
    this.write('enable', name)
  },

  disable(name) {
    this.write('disable', name)
  },
}

const watcher = watch(`./src/routes/`)
watcher.on('change', (evt, name) => {
  const basename = name.split('/').pop().replace('.js', '')

  switch (evt) {
    case "update": {
      if (basename in routes) {
        route.enable(basename)
      }

      break
    }

    case "remove": {
      if (basename in routes) {
        route.disable(basename)
      }

      break
    }
  }
})

watcher.on('error', (err) => {
  console.log(err)
})
