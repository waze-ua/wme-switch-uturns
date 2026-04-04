import { NAME, TRANSLATION } from './translations'
import { UTurns } from './uturns'
import css from './style.css'

WMEUI.addTranslation(NAME, TRANSLATION)
WMEUI.addStyle(css)

$(document).on('bootstrap.wme', () => {
  new UTurns(NAME)
})
