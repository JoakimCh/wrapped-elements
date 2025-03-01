
/**
 * A quick way to setup a page from within JavaScript (with sane defaults).
 * @param {object} options
 * @param {string} [options.lang]
 * @param {string} [options.title]
 * @param {string | boolean} [options.favicon]
 * @param {string} [options.viewport] Select the viewport to use. If not defined then it defaults to `width=device-width, initial-scale=1.0`, set it to `false` if you don't want to touch it.
 * @param {string | string[]} [options.stylesheets]
 * @param {string} [options.description]
 * @param {boolean} [options.allowDarkTheme] Whether to add the style `:root {color-scheme: light dark}` which enables the browser to use its default dark style when the user is using a dark theme. It defaults to `true`.
 */
export async function pageSetup({
  lang,
  title,
  favicon,
  viewport,
  stylesheets,
  description,
  allowDarkTheme = true,
  stylesheetsAsLinks = false
}) {
  if (title) {
    document.title = title
  }
  if (favicon !== undefined) {
    setFavicon(favicon)
  }
  if (viewport === undefined) {
    setViewport('width=device-width, initial-scale=1.0')
  } else if (viewport !== false) {
    setViewport(viewport)
  }
  if (allowDarkTheme) {
    css.fromString(':root {color-scheme: light dark}')
  }
  if (stylesheets) {
    if (!Array.isArray(stylesheets)) {
      stylesheets = [stylesheets]
    }
    for (const url of stylesheets) {
      await css.fromFile(url, {asLink: stylesheetsAsLinks})
    }
  }
  if (lang) {
    document.documentElement.lang = lang
  }
  if (description) {
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.append(meta)
    }
    meta.content = description
  }
}

export const css = {
  async fromFile(url, {addToDocument = true, asLink = false} = {}) {
    if (asLink) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = url
      if (addToDocument) document.head.append(link)
      return link
    }
    return this.fromString(await (await fetch(url)).text(), addToDocument)
  },
  fromString(string, {addToDocument = true, asStyle = false} = {}) {
    if (asStyle) {
      const style = document.createElement('style')
      style.textContent = string
      if (addToDocument) document.head.append(style)
      return style
    }
    const styleSheet = new CSSStyleSheet()
    styleSheet.replaceSync(string)
    if (addToDocument) {
      document.adoptedStyleSheets.push(styleSheet)
    }
    return styleSheet
  }
}

/**
 * @param {string} content The viewport setting to use.
 */
export function setViewport(content) {
  let meta = document.querySelector('meta[name="viewport"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'viewport'
    document.head.append(meta)
  }
  meta.content = content
}

/**
 * @param {string | boolean} href The url to the icon or a false value to use a blank one.
 */
export function setFavicon(href) {
  let link = document.querySelector('link[rel="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.append(link)
  }
  link.href = href || 'data:,'
}

export let log = console.log
export let debug = console.debug

/** Globally set the `log` function of this module. */
export function setLog(logFunction) {
  log = logFunction
}
/** Globally set the `debug` function of this module. */
export function setDebug(debugFunction) {
  debug = debugFunction
}

const parallelActionWeakMap = new WeakMap()
/** Allows doing the same action on multiple objects. */
export function parallel(target) {
  // automatically convert common lists of HTMLElements
  if (target instanceof NodeList || target instanceof HTMLCollection) {
    target = Array.from(target)
  }
  if (Array.isArray(target)) {
    let proxy = parallelActionWeakMap.get(target)
    if (proxy) return proxy
    proxy = new Proxy(target, {
      get(targets, prop) {
        // if (prop == 'then') return undefined
        const value = targets[0]?.[prop]
        if (typeof value == 'function') {
          return (...args) => {
            const result = []
            for (const target of targets) {
              result.push(target[prop](...args))
            }
            return result
          }
        }
        // proxy further into nested objects
        const arrayOfValues = targets.map(target => target[prop])
        if (typeof value == 'object' && value != null
        // but skip Arrays, NodeLists and HTMLCollections
        && !(Array.isArray(value) || value instanceof NodeList || value instanceof HTMLCollection)) {
          return parallel(arrayOfValues)
        }
        return arrayOfValues
      },
      set(targets, prop, value) {
        for (const target of targets) {
          target[prop] = value
        }
        return true // indicate success
      },
    })
    parallelActionWeakMap.set(target, proxy)
    return proxy
  }
  return target
}

export function hide(...elements) {
  parallel(elements).hidden = true
}
export function show(...elements) {
  parallel(elements).hidden = false
}
export function disable(...elements) {
  parallel(elements).setAttribute('disabled','')
}
export function enable(...elements) {
  parallel(elements).removeAttribute('disabled')
}
