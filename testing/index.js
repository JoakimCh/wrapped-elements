
import {e, unwrap} from '../wrapped-elements.js'
document.body.append(...unwrap(
  e.span.classList.add('a', 'b')
  .style.color('red'),
  e.div.classList({add: ['a', 'b']}),
  // e.data.
))
