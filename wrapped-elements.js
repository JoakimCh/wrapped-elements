
export * from './bonus.js'

/** The HTMLElement setter function in WrappedHtmlElements.
 * @typedef {Function} SetProperty
 * @param {...any} values The value or values to set.
 * @returns {WrappedHtmlElement} 
 */
/** Thanks to Claude.ai for this!
 * @typedef {Object} ElementProxy
 * @typedef {keyof HTMLElementTagNameMap} ElementTagName
 * @typedef {{[K in ElementTagName]: WrappedHtmlElement}} ElementProxyMap
 */
/** Todo: Also document the setter for HTMLElement properties...:
 * @typedef {keyof HTMLElement} HTMLElementProperty
 * @typedef {{[K in HTMLElementProperty]: SetProperty}} HTMLElementPropertyMap
 */

/** Given `WrappedHtmlElements` returns the `HTMLElements`.
 * @param {WrappedHtmlElement} wrappedElements
 * @returns {HTMLElement[]}
*/
export function unwrap(...wrappedElements) {
  return wrappedElements.map(({element}) => element)
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
export const tags = {}

/** @type {WeakMap.<HTMLElement, WrappedHtmlElement>} */
const wrapperWeakMap = new WeakMap()

/** It's like an `HTMLElement` with some helper functions.
 * @implements {HTMLElementPropertyMap}
*/
export class WrappedHtmlElement {
  /** @type {HTMLElement} */
  #element
  /** @type {WrappedHtmlElement} */
  #proxy

  get element() {return this.#element}

  /** @param {string | HTMLElement} tagNameOrElement */
  constructor(tagNameOrElement) {
    Object.seal() // Object.freeze()
    if (tagNameOrElement instanceof HTMLElement) {
      this.#element = tagNameOrElement
      // do not wrap if already wrapped
      if (wrapperWeakMap.has(this.#element)) {
        return wrapperWeakMap.get(this.#element)
      }
    } else {
      this.#element = document.createElement(tagNameOrElement)
    }
    wrapperWeakMap.set(this.#element, this)
    this.#proxy = new Proxy(this, {
      get: this.#getProxy.bind(this),
      set: (target, property, value) => {
        const tagName = this.#element.tagName
        throw Error(`You're not supposed to assign a value to "e.${tagName}.${property}". To assign a value to the "${property}" property of the underlying HTMLElement call the property as a function instead and the argument passed will be assigned to it. Like this "e.${tagName}.${property}(value)", then multiple assignments can be chained.`)
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
        throw Error(`HTMLElement.${property} doesn't exist and can therefore not be set. If you want to set an attribute named "${property}" then use setAttribute('${property}', value) instead.`)
      }
      return function(...value) {
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
      }.bind(this)
    }
  }

  /** Shortcut for `textContent`. */
  text(text) {
    this.#element.textContent = text
    return this.#proxy
  }

  // can just use hidden()
  // hide(hide) {
  //   this.#element.style.display = hide ? 'none' : 'initial'
  //   return this.#proxy
  // }

  /** Shortcut for `append(...unwrap(...elements))`. */
  children(...elements) {
    this.#element.append(...unwrap(...elements))
    return this.#proxy
  }

  /** Store the `HTMLElement` under `tags[key]`. */
  tag(key) {
    tags[key] = this.#element
    return this.#proxy
  }

  tagAndId(key) {
    this.#element.id = key
    tags[key] = this.#element
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


/** A proxy object which returns a new `WrappedHtmlElement` for any property access (the property name is used to create the wrapped `HTMLElement`).
 * @type {ElementProxyMap}
 */
export const e = new Proxy({}, {
  get: function(target, property) {
    return new WrappedHtmlElement(property)
  }
})
