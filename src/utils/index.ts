export const isUnset = o => typeof o === 'undefined' || o === null
export const isSet = o => !isUnset(o)

interface VueComponent { options: object, _Ctor: VueComponent }
type match = { components: VueComponent[] }
type Route = { matched: match[] }

export function cwaRouteDisabled(route: Route): boolean {
  return routeOption(route, 'cwa', false)
}

export function routeOption (route: Route, key, value) {
  return route.matched.some((m) => {
    if (process.client) {
      // Client
      return Object.values(m.components).some(
        component => component.options && component.options[key] === value
      )
    } else {
      // SSR
      return Object.values(m.components).some(component =>
        Object.values(component._Ctor).some(
          ctor => ctor.options && ctor.options[key] === value
        )
      )
    }
  })
}

export function getMatchedComponents (route: Route, matches = []) {
  return [].concat.apply([], route.matched.map(function (m, index) {
    return Object.keys(m.components).map(function (key) {
      matches.push(index)
      return m.components[key]
    })
  }))
}

export function encodeValue (val) {
  if (typeof val === 'string') {
    return val
  }
  return JSON.stringify(val)
}

export function decodeValue (val) {
  // Try to parse as json
  if (typeof val === 'string') {
    try {
      return JSON.parse(val)
    } catch (_) {
    }
  }

  // Return as is
  return val
}

/**
 * Get property defined by dot notation in string.
 * Based on  https://github.com/dy/dotprop (MIT)
 *
 * @param  {Object} holder   Target object where to look property up
 * @param  {string} propName Dot notation, like 'this.a.b.c'
 * @return {*}          A property value
 */
export function getProp (holder, propName) {
  if (!propName || !holder) {
    return holder
  }

  if (propName in holder) {
    return holder[propName]
  }

  const propParts = Array.isArray(propName) ? propName : (propName + '').split('.')

  let result = holder
  while (propParts.length && result) {
    result = result[propParts.shift()]
  }

  return result
}
