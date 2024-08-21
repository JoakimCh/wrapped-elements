
export * from './bonus.js'

/** The HTMLElement setter function in WrappedHtmlElements.
 * @typedef {(value: any, ...additionalValues: any[]) => WrappedHtmlElement} SetProperty
 */
/** The e proxy record.
 * @typedef {Record<keyof HTMLElementTagNameMap, WrappedHtmlElement>} ElementMap
 */
/** Todo: Also document the setters for HTMLElement properties...
 * @typedef {Record<keyof HTMLElement, SetProperty>} HTMLElementPropertyMap
 */

/** Given `WrappedHtmlElements` returns the `HTMLElements`, anything else is passed through.
 * @param {WrappedHtmlElement} wrappedElements
 * @returns {HTMLElement[]}
*/
export function unwrap(...wrappedElements) {
  return wrappedElements.map((wrapper) => 
    wrapper instanceof WrappedHtmlElement ? wrapper.element : wrapper)
}

/** Returns a `WrappedHtmlElement` instance wrapped around this element. If it's already wrapped in one then we just return that one.
 * @param {HTMLElement} element
 * @returns {WrappedHtmlElement}
*/
export function wrap(element) {
  if (wrapperWeakMap.has(element)) {
    return wrapperWeakMap.get(element)
  }
  return new WrappedHtmlElement(element)
}

/** Find any tagged `HTMLElements` here.
 * @type {Object.<string, HTMLElement>} */
export let tags = {}

/** @type {WeakMap.<HTMLElement, WrappedHtmlElement>} */
const wrapperWeakMap = new WeakMap()

/** It's like an `HTMLElement` with some helper functions.
 * @class
 * @implements {HTMLElementPropertyMap}
*/
export class WrappedHtmlElement extends Function {
  /** @type {HTMLElement} */
  #element
  /** @type {WrappedHtmlElement} */
  #proxy

  get element() {return this.#element}

  /** @param {string | HTMLElement} tagNameOrElement */
  constructor(tagNameOrElement) {
    super()
    Object.seal() // Object.freeze()
    if (tagNameOrElement instanceof HTMLElement) {
      this.#element = tagNameOrElement
      // do not wrap if already wrapped
      if (wrapperWeakMap.has(this.#element)) {
        return wrapperWeakMap.get(this.#element)
      }
    } else {
      const split = tagNameOrElement.split(/(?=[A-Z])/) // regex to split camelCase words
      if (split.length > 1) {
        tagNameOrElement = split.join('-')
      }
      this.#element = document.createElement(tagNameOrElement.toLowerCase())
    }
    wrapperWeakMap.set(this.#element, this)
    this.#proxy = new Proxy(this, {
      get: this.#getProxy.bind(this),
      set: this.#setProxy.bind(this),
      apply: this.#applyProxy.bind(this),
    })
    return this.#proxy
  }

  #applyProxy(target, thisArg, args) {
    return this.children(...args)
  }

  #getProxy(target, property, r) {
    if (property in this) {
      if (typeof this[property] == 'function') {
        return this[property].bind(this)
      }
      return this[property]
    } else if (property in this.#element) {
      return this.#getProperty(this.#element, property)
    }
  }

  #setProxy(target, property, value, r) {
    if (property in this) {
      this[property] = value
    } else if (property in this.#element) {
      this.#element[property] = value
    } else {
      throw Error(`No such property: ${property}`)
    }
  }

  #getProperty(parent, property) {
    const value = parent[property]
    switch (typeof value) {
      case 'function':
        return (...args) => {
          value.call(parent, ...args)
          return this.#proxy
        }
      case 'object':
        if (value !== null) {
          return this.#propertyProxy(value)
        }
    }
    // if primitive
    const setOrGet = function(value) {
      if (!arguments.length) {
        return parent[property]
      }
      parent[property] = value
      return this.#proxy
    }
    return setOrGet.bind(this)
  }

  #propertyProxy(parent) {
    return new Proxy(() => {}, {
      get: (target, property) => {
        if (property in parent) {
          return this.#getProperty(parent, property)
        }
      },
      set: (target, property, value) => {
        parent[property] = value
      },
      apply: (target, thisArg, args) => {
        // it's either an object or a function
        if (typeof parent == 'function') {
          parent(...args)
        } else {
          if (args.length > 1 || typeof args[0] != 'object') {
            throw Error(`You must supply an object with the values to set.`)
          }
          for (const key in args[0]) {
            if (!(key in parent)) {
              throw Error(`No such key ${key} in object.`)
            }
            const value = args[0][key]
            if (typeof parent[key] == 'function') {
              parent[key](...(Array.isArray(value) ? value : [value]))
            } else {
              parent[key] = value
            }
          }
        }
        return this.#proxy
      }
    })
  }

  /** Shortcut for `textContent`. */
  text(text) {
    this.#element.textContent = text
    return this.#proxy
  }

  /** Shortcut for `append(...unwrap(...elements))`. */
  children(...elements) {
    this.#element.append(...unwrap(...elements))
    return this.#proxy
  }

  /** Store the `HTMLElement` under `tags[title]`. */
  tag(title) {
    tags[title] = this.#element
    return this.#proxy
  }

  /** Store the `HTMLElement` under `tags[title]` and assign an id with the sane title. */
  tagAndId(title) {
    this.#element.id = title
    tags[title] = this.#element
    return this.#proxy
  }
  
  /** Shortcut for `addEventListener`. */
  on(type, listener, options = undefined) {
    this.#element.addEventListener(type, listener, options)
    return this.#proxy
  }

  /** Shortcut for `addEventListener` with the `once` option. */
  once(type, listener, options = {once: true}) {
    this.#element.addEventListener(type, listener, options)
    return this.#proxy
  }

  /** Shortcut for `setAttribute`. */
  set(attribute, value) {
    this.#element.setAttribute(attribute, value)
    return this.#proxy
  }

  /** Shortcut for `getAttribute`. */
  get(attribute) {
    return this.#element.getAttribute(attribute)
  }
}


/** Returns a new `WrappedHtmlElement` for any property you access.
 * @type {ElementMap}
 */
export const e = new Proxy({}, {
  get: function(target, property) {
    return new WrappedHtmlElement(property)
  }
})

/** If given strings then consume the specified tags out of the `tags` object (return and remove them). If no arguments then consume all the tags.
 * @param {string | object | undefined} tags */
export function consumeTags(...tagTitle) {
  // consume all
  if (!tagTitle.length) {
    const result = tags
    tags = {}
    return result
  }
  // consume some
  const consumed = {}
  for (const title of tagTitle) {
    consumed[title] = tags[title]
    delete tags[title]
  }
  return consumed
}
