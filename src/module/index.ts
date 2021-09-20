import { resolve, join, basename } from 'path'
import fs from 'fs'
import _set from 'lodash/set'
import _get from 'lodash/get'
import { Module } from '@nuxt/types'
import consola from 'consola'
import { CwaOptions } from '../index'

// // Working out how to include type from package instead...
interface Component {
  pascalName: string
  kebabName: string
  import: string
  asyncImport: string
  export: string
  filePath: string
  shortPath: string
  async?: boolean
  chunkName: string
  /** @deprecated */
  global: boolean
  level: number
}

function extendRoutesFn({ pagesDepth }) {
  // recursive function
  function createRouteObject(
    component,
    depth: number,
    currentDepth: number = 0
  ) {
    if (currentDepth > depth) {
      return null
    }
    const routeObject = {
      name: 'page' + currentDepth,
      path: ':page' + currentDepth + '*',
      component,
      children: null
    }
    if (currentDepth === 0) {
      routeObject.path = '/' + routeObject.path
    }
    const child = createRouteObject(component, depth, currentDepth + 1)
    if (child) {
      routeObject.children = [child]
    }
    return routeObject
  }

  // transpile
  this.nuxt.options.build!.transpile!.push(
    resolve(__dirname, '../core/templates/page')
  )

  // return the function
  return (routes) => {
    routes.push(
      createRouteObject(
        resolve(__dirname, '../core/templates/page'),
        pagesDepth
      )
    )
  }
}

function applyCss() {
  const assetsDir = resolve(__dirname, '../core/assets/sass')
  this.options.css.push(join(assetsDir, 'style.sass'))

  this.extendBuild((config, _) => {
    const sassRuleIdx = config.module.rules.findIndex((e) => {
      return e.test.toString().match(/sass/)
    })

    const sassResourcesLoader = {
      loader: 'sass-resources-loader',
      options: {
        resources: [
          join(assetsDir, 'vars/*.sass'),
          join(assetsDir, '_mixins.sass')
        ]
      }
    }

    if (sassRuleIdx === -1) {
      config.module.rules.push({
        test: /sass/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader',
          'sass-loader',
          sassResourcesLoader
        ]
      })
    } else {
      config.module.rules[sassRuleIdx].oneOf.forEach((rule) =>
        (rule.use as unknown as any[]).push(sassResourcesLoader)
      )
    }
  })
}

async function loadComponents() {
  const requiredModules = [
    ['@nuxtjs/style-resources', {}],
    [
      '@nuxtjs/axios',
      {
        credentials: true,
        progress: false
      }
    ],
    [
      '@nuxtjs/auth',
      {
        redirect: {
          login: '/login',
          logout: '/login',
          home: '/',
          callback: false
        },
        defaultStrategy: 'local',
        strategies: {
          cookie: {
            user: {
              autoFetch: true,
              property: ''
            },
            endpoints: {
              login: { url: '/login', method: 'post' },
              logout: { url: '/logout', method: 'post' },
              user: { url: '/me', method: 'get' }
            },
            token: {
              global: false,
              required: false,
              type: false
            }
          }
        }
      }
    ],
    ['@nuxtjs/svg', {}]
  ]
  for (const module of requiredModules) {
    try {
      await this.addModule(module)
    } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') {
        throw error
      }
      const nextModule = [module[0] + '-next', module[1]]
      consola.info(`Trying to add ${nextModule[0]} instead...`)
      await this.addModule(nextModule)
      consola.info(`Successfully added ${nextModule[0]}`)
    }
  }

  // Need to check if this is the correct way of adding a build module from within a module
  const requiredBuildModules = ['@nuxt/components']
  for (const module of requiredBuildModules) {
    // auto-configure components module
    if (
      !this.options.buildModules.includes(module) &&
      !this.options.buildModules.includes(module + '-next')
    ) {
      this.options.buildModules.push(module)
    }
  }

  if (!this.options.components) {
    this.options.components = []
  } else if (this.options.components === true) {
    this.options.components = [{ path: '~/components/cwa', prefix: 'cwa' }]
  }

  // auto-configure components module for our cwa components
  const extensions = ['vue', 'js', 'ts', 'tsx']
  const pattern = `**/*.{${extensions.join(',')},}`
  const componentImports = {
    pages: [],
    components: []
  }
  const types = Object.keys(componentImports)
  for (const componentType of types) {
    this.options.components.push({
      path: `~/components/cwa/${componentType}`,
      extensions,
      pattern,
      prefix: `cwa-${componentType}`
    })
  }

  // with all the auto-imported components, we will filter out our cwa ones and provide files that can be included
  // which will define all the components by type so that they can be lazy/dynamically loaded
  this.nuxt.hook('components:extend', (components: Component[]) => {
    const findType = (component: Component) => {
      for (const componentType of types) {
        if (component.kebabName.startsWith(`cwa-${componentType}`)) {
          return componentType
        }
      }
    }

    for (const component of components) {
      const foundType = findType(component)
      if (!foundType) {
        continue
      }
      componentImports[foundType].push(component)
    }
    for (const [componentType, components] of Object.entries(
      componentImports
    )) {
      const { dst } = this.addTemplate({
        src: resolve(__dirname, '../../templates/components.js'),
        fileName: join('cwa', `${componentType}.js`),
        options: {
          components,
          prefix: componentType.charAt(0).toUpperCase() + componentType.slice(1)
        }
      })
      this.nuxt.options.plugins.push(resolve(this.nuxt.options.buildDir, dst))
    }
  })

  this.nuxt.options.build!.transpile!.push(
    '@cwa/nuxt-module/core/templates/components/core/component-load-error.vue'
  )
  this.nuxt.options.build!.transpile!.push(
    '@cwa/nuxt-module/core/mixins/ResourceMixin.js'
  )
  this.nuxt.options.build!.transpile!.push(
    '@cwa/nuxt-module/core/templates/components/core/component-collection.vue'
  )
  this.nuxt.options.build!.transpile!.push(
    '@cwa/nuxt-module/core/templates/components/core/component-position.vue'
  )
}

const cwaModule = <Module>async function () {
  const { version, name } = JSON.parse(
    fs.readFileSync(join(__dirname, '../../package.json'), 'utf8')
  )
  const options: CwaOptions = {
    vuex: {
      namespace: 'cwa'
    },
    fetchConcurrency: 10,
    pagesDepth: 3,
    allowUnauthorizedTls: false,
    websiteName: 'Unnamed CWA Site',
    package: {
      name,
      version
    },
    ...this.options.cwa
  }
  this.nuxt.hook('build:templates', ({ templateVars: { layouts } }) => {
    options.layouts = Object.keys(layouts)
      .filter((key) => key !== 'error' && key.substr(0, 4) !== 'cwa-')
      .reduce((obj, key) => {
        obj[key] = layouts[key]
        return obj
      }, {})
  })

  this.addLayout(
    {
      src: resolve(__dirname, '../core/templates/layouts/cwa-error.vue'),
      fileName: join('cwa', 'layouts', 'cwa-error.vue')
    },
    'error'
  )

  this.addLayout(
    {
      src: resolve(__dirname, '../core/templates/layouts/cwa-default.vue'),
      fileName: join('cwa', 'layouts', 'cwa-default.vue')
    },
    'cwa-default'
  )

  this.addLayout(
    {
      src: resolve(__dirname, '../core/templates/layouts/cwa-empty.vue'),
      fileName: join('cwa', 'layouts', 'cwa-empty.vue')
    },
    'cwa-empty'
  )

  // Add CWA Pages
  this.extendRoutes((routes: any[]) => {
    // construct route objects with parts as keys for nesting
    function getRouteObjects(
      baseDir: string,
      newRoutes: any = {},
      pathParts: string[] = ['_cwa']
    ) {
      const files = fs.readdirSync(baseDir)
      files.forEach((filename: string) => {
        const filePath = join(baseDir, filename)
        const isNameRouteParam = filename.substring(0, 1) === '_'
        const name = basename(filename, '.vue').replace(/^_/, '')
        const stat = fs.lstatSync(filePath)
        if (stat.isDirectory()) {
          getRouteObjects(filePath, newRoutes, [...pathParts, name])
          return
        }
        if (filename.substr(-3) !== 'vue') {
          return
        }
        const newObjectPath = [...pathParts, name]
        const postfix = isNameRouteParam ? `:${name}([a-zA-Z0-9/\\-%_]+)` : name
        const path = `/${pathParts.join('/')}/${postfix}`
        const newRouteObject = {
          name: newObjectPath.join('_'),
          path,
          component: resolve(filePath),
          children: _get(newRoutes, newObjectPath) || null
        }
        _set(newRoutes, newObjectPath, newRouteObject)
      })
      return newRoutes
    }
    const newRoutesAsObject = getRouteObjects(
      resolve(__dirname, '../core/templates/pages/_cwa')
    )
    function childrenToValues(object) {
      if (object.children) {
        object.children = Object.values(object.children)
        object.children.forEach((nestedRoute) => {
          childrenToValues(nestedRoute)
        })
      }
    }
    const newRoutes = []
    const processRoutes = (object) => {
      Object.values(object).forEach((newRoute: any) => {
        childrenToValues(newRoute)
        if (newRoute.name === undefined) {
          processRoutes(newRoute)
          return
        }
        newRoutes.push(newRoute)
      })
    }
    processRoutes(newRoutesAsObject._cwa)
    routes.push(...newRoutes)
  })

  this.extendRoutes(
    extendRoutesFn.call(this, { pagesDepth: options.pagesDepth })
  )

  // Add plugin
  const { dst } = this.addTemplate({
    src: resolve(__dirname, '../../templates/plugin.js'),
    fileName: join('cwa', 'cwa.js'),
    options: {
      options
    }
  })
  this.nuxt.options.plugins.push(resolve(this.nuxt.options.buildDir, dst))

  applyCss.call(this)

  await loadComponents.call(this)
}

// @ts-ignore
cwaModule.meta = { name: '@cwa/nuxt-module' }

export default cwaModule
