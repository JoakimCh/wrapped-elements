
# wrapped-elements

[HTMLElements](https://developer.mozilla.org/docs/Web/API/HTMLElement) wrapped like hot burritos!

They are intended to be used by programmers who enjoys coding more than messing around with HTML files.

E.g. just let your index.html be like this:
```html
<!DOCTYPE html>
<meta charset="utf-8">
<script type="module" src="index.js"></script>
```

# Features
  * A simple way to work with HTMLElements within JavaScript.
  * An HTMLElement is only ever wrapped once (instances not garbage collected are reused).
  * Has a function for easy page setup from within JavaScript.

# A work in progress...

It's still being developed... So I got no documentation and more features are underway. But feel free to try it out, I am already using it myself! 😎

# Install

```bash
npm i wrapped-elements
```

# Example

```js
import {log, pageSetup, e} from './wrapped-elements.js'

pageSetup({
  title: 'UFO Experiment',
  favicon: 'icon.png',
  stylesheets: 'style.css'
})

let start, stop, ufo

document.body.append(
  e.h1('UFO Experiment'),
  e.p('Use your mind to make it hover. ', e.small(
    'One of my different ',
    e.a.href('../')('TRNG based experiments'), '.'
  )),
  start = e.button('Start experiment'),
  stop = e.button.hidden(true)('Stop experiment'),
  ufo = e.img.id('ufo').src('ufo.png').style({bottom: '0px'})()
)

log('All is good! 😎')
```

# "In production":

https://the-guess-experiment.com (a great example of how to use it)
https://joakimch.github.io/TRNG-Mind-Over-Matter-Experiments (in the experiments)

# Quirks

## e.text

`e.text` returns a function to create a text node, hence `e.text('whatever')` creates and returns such a node.

## Difference between () and add()
`e.div()` allows adding children just like `e.div.add()`, but it returns the wrapped element (the contained `HTMLElement`), unlike `add()` which returns the wrapper for further chaining.

This is done so we can easily return the `HTMLElement` instead of having to follow it with `.element`.

# End of the world

No, maybe just this readme.
