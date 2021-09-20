// TODO: Should import Route type from 'vue-router'
interface VueComponent {
  options: object
  _Ctor: VueComponent
}
type match = { components: VueComponent[] }
type Route = { matched: match[] }

export function cwaRouteDisabled(route: Route): boolean {
  return routeOptionEquals(route, 'cwa', false)
}

export function authRouteDisabled(route: Route): boolean {
  return routeOptionEquals(route, 'auth', false)
}

export function routeOption(route: Route, key: string) {
  const values = []
  route.matched.forEach((m) => {
    Object.values(m.components).forEach((component) => {
      if (process.client) {
        return (
          component.options &&
          component.options[key] &&
          values.push(component.options[key])
        )
      } else {
        Object.values(component._Ctor).forEach(
          (ctor) =>
            ctor.options && ctor.options[key] && values.push(ctor.options[key])
        )
      }
    })
  })
  if (!values.length) {
    return null
  }
  return values[values.length - 1]
}

export function routeOptionEquals(route: Route, key, value) {
  return route.matched.some((m) => {
    return Object.values(m.components).some((component) =>
      process.client
        ? component.options && component.options[key] === value
        : Object.values(component._Ctor).some(
            (ctor) => ctor.options && ctor.options[key] === value
          )
    )
  })
}

/**
 * Get property defined by dot notation in string.
 * Based on  https://github.com/dy/dotprop (MIT)
 *
 * @param  {Object} holder   Target object where to look property up
 * @param  {string} propName Dot notation, like 'this.a.b.c'
 * @return {*}          A property value
 */
export function getProp(holder, propName) {
  if (!propName || !holder) {
    return holder
  }

  if (propName in holder) {
    return holder[propName]
  }

  const propParts = Array.isArray(propName)
    ? propName
    : (propName + '').split('.')

  let result = holder
  while (propParts.length && result) {
    result = result[propParts.shift()]
  }

  return result
}

// fastest https://medium.com/@jakubsynowiec/unique-array-values-in-javascript-7c932682766c
export function UnqiueArray(array) {
  const length = array.length
  const result = []
  const seen = new Set()
  for (let index = 0; index < length; index++) {
    const value = array[index]
    if (seen.has(value)) {
      continue
    }
    seen.add(value)
    result.push(value)
  }
  return result
}
