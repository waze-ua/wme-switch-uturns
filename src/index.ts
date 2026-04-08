import { NAME, TRANSLATION } from './translations'
import { UTurns } from './uturns'
import css from './style.css'

$(document).on('bootstrap.wme', () => {
  WMEUI.addTranslation(NAME, TRANSLATION)
  WMEUI.addStyle(css)

  new UTurns(NAME)
})
