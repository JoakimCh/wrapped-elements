
import {e, unwrap, pageSetup} from '../wrapped-elements.js'

pageSetup({title: 'Test'})

document.body.append(...unwrap(
  e.span.classList.add('a', 'b')
  .style.color('red'),
  e.div.classList({add: ['a', 'b']}),
  e.div(e.span('Hello'))
))
