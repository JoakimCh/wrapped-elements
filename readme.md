
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
import {log, pageSetup, e, tags, wrap, unwrap} from './wrapped-elements.js'

pageSetup({
  title: 'UFO Experiment',
  favicon: 'icon.png',
  stylesheets: 'style.css'
})

document.body.append(...unwrap(
  e.h1('UFO Experiment'),
  e.p('Use your mind to make it hover. ', e.small(
    'One of my different ',
    e.a('TRNG based experiments').href('../'), '.'
  )),
  e.button('Start experiment').tag('start'),
  e.button('Stop experiment').tag('stop').hidden(true),
  e.img.tagAndId('ufo').src('ufo.png').style({bottom: '0px'})
))

const {start, stop, ufo} = tags

log('All is good! 😎')
```

# End of the world

No, maybe just this readme.
