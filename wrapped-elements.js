
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
      set: (target, property, value) => {
        const tagName = this.#element.tagName
        throw Error(`You're not supposed to assign a value to "e.${tagName}.${property}". To assign a value to the "${property}" property of the underlying HTMLElement call the property as a function instead and the argument passed will be assigned to it. Like this "e.${tagName}.${property}(value)", then multiple assignments can be chained.`)
      },
      apply: (target, thisArg, args) => {
        return this.children(...args)
      }
    })
    return this.#proxy
  }

  /** The handler for "get" access. */
  #getProxy(target, property) {
    if (property in this) { // is own function?
      if (typeof this[property] == 'function') {
        return this[property].bind(this) // in this case this == target 
      } else {
        return this[property] // e.g. to get this.element
      }
    } else { // is property of element?
      if (!(property in this.#element)) {
        if (typeof property == 'symbol') {
          if (property === Symbol.toPrimitive) {
            throw Error(`Looks like you're trying to add an unwrapped element as a child to an HTMLElement. unwrap() it or add the .element instead.`)
          }
          property = property.toString()
        }
        throw Error(`HTMLElement.${property} doesn't exist and can therefore not be set. If you want to set an attribute named "${property}" then use setAttribute('${property}', value) instead.`)
      }
      /** @type {SetProperty} */
      function setProperty(...value) {
        if (typeof this.#element[property] == 'function') {
          if (property.startsWith('get')) {
            return this.#element[property](...value)
          } else {
            this.#element[property](...value)
          }
        } else if (typeof this.#element[property] == 'object' && this.#element[property] !== null) {
          if (value.length != 1 || typeof value[0] != 'object') {
            throw Error(`HTMLElement.${property} is an object and you must supply an object with the keys to set, not: ${value[0]}`)
          }
          const keysToSet = value[0]
          for (const key in keysToSet) {
            if (key in this.#element[property]) {
              switch (typeof this.#element[property][key]) {
                default:
                  this.#element[property][key] = keysToSet[key]
                break
                case 'function':
                  this.#element[property][key](keysToSet[key])
                break
              }
            } else {
              throw Error(`HTMLElement.${property}.${key} doesn't exist and can therefore not be set.`)
            }
          }
        } else {
          this.#element[property] = value[0]
        }
        return this.#proxy
      }
      //return SetProperty.bind(this)
      const parent = this.#element[property]
      return new Proxy(setProperty, {
        apply: (target, thisArg, args) => {
          return setProperty.call(this, ...args)
        },
        get: (target, property) => {
          return (...args) => {
            if (typeof parent[property] == 'function') {
              parent[property](args)
            } else {
              parent[property] = args[0]
            }
            return this.#proxy
          }
        }
      })
    }
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
