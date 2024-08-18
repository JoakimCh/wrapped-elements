
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
export function pageSetup({
  lang,
  title,
  favicon,
  viewport,
  stylesheets,
  description,
  allowDarkTheme = true
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
      css.fromFile(url)
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
  fromFile(url) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = url
    document.head.append(link)
    return link
  },
  fromString(string) {
    const style = document.createElement('style')
    style.textContent = string
    document.head.append(style)
    return style
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

export const log = console.log
