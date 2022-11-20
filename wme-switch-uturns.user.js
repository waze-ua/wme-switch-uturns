// ==UserScript==
// @name         WME Switch Uturns
// @version      2022.10.27.001
// @description  Switches U-turns for selected node or segment. Forked and improved "WME Add Uturn from node" script.
// @author       ixxvivxxi, uranik, turbopirate, AntonShevchuk
// @namespace    https://github.com/waze-ua/wme-switch-uturns
// @updateURL    https://github.com/waze-ua/wme-switch-uturns/raw/master/wme-switch-uturns.user.js
// @downloadURL  https://github.com/waze-ua/wme-switch-uturns/raw/master/wme-switch-uturns.user.js
// @match        https://*.waze.com/editor*
// @match        https://*.waze.com/*/editor*
// @exclude      https://*.waze.com/user/editor*
// @grant        none
// @require      https://greasyfork.org/scripts/450160-wme-bootstrap/code/WME-Bootstrap.js?version=1119377
// @require      https://greasyfork.org/scripts/452563-wme/code/WME.js?version=1101598
// @require      https://greasyfork.org/scripts/450221-wme-base/code/WME-Base.js?version=1101617
// @require      https://greasyfork.org/scripts/450320-wme-ui/code/WME-UI.js?version=1110180
// ==/UserScript==

/* jshint esversion: 8 */
/* global require */
/* global $ */
/* global W */
/* global I18n */
/* global WME, WMEBase, WMEUI, WMEUIHelper, WMEUIShortcut */

(function () {
  'use strict'

  // Script name, uses as unique index
  const NAME = 'SWITCH-UTURNS'

  // Translations
  const TRANSLATION = {
    'en': {
      title: 'Switch U-Turns',
      switch_uturn: 'Switch U-turn at point',
      allowed: 'Allowed',
      disallowed: 'Disallowed',
      allow_uturns: 'Allow all U-turns',
      disallow_uturns: 'Disallow all U-turns',
    },
    'uk': {
      title: 'Керування розворотами',
      switch_uturn: 'Змінити розворот у точці',
      allowed: 'Дозволено',
      disallowed: 'Заборонено',
      allow_uturns: 'Дозволити всі розвороти',
      disallow_uturns: 'Заборонити всі розвороти',
    },
    'ru': {
      title: 'Управление разворотами',
      switch_uturn: 'Изменить разворот в точке',
      allowed: 'Разрешено',
      disallowed: 'Запрещено',
      allow_uturns: 'Разрешить все развороты',
      disallow_uturns: 'Запретить все развороты',
    }
  }

  const STYLE = '#node-edit-general button { margin-bottom: 2px }' +
    'p.info-bar { border-top: 1px solid #ccc; color: #777; font-size: x-small; margin-top: 15px; padding-top: 10px; text-align: center; }'

  WMEUI.addTranslation(NAME, TRANSLATION)
  WMEUI.addStyle(STYLE)

  class UTurns extends WMEBase {
    /**
     * Handler for `node.wme` event
     * @param {jQuery.Event} event
     * @param {HTMLElement} element
     * @param {W.model} model
     * @return {void}
     */
    onNode (event, element, model) {
      if (model.getSegmentIds().length < 2) {
        return
      }
      this.createPanel(element)
      this.updateNodeUI()
    }

    /**
     * Added controls
     * @param {HTMLElement} element
     */
    createPanel (element) {
      // Separator line
      let sl = document.createElement('div')
      sl.className = 'separator-line'
      sl.style.marginBottom = '16px'
      // Label
      let label = document.createElement('label')
      label.innerHTML = I18n.t(NAME).title
      label.className = 'control-label'
      // Controls div
      let div = document.createElement('div')
      div.className = 'controls'
      // Text
      this.text = document.createElement('p')
      div.append(this.text)
      // Allow button
      // <wz-button color="shadowed" class="disallow-connections">Заборонити всі повороти</wz-button>
      this.allow = document.createElement('wz-button')
      this.allow.color = 'shadowed'
      this.allow.innerHTML = I18n.t(NAME).allow_uturns
      this.allow.onclick = () => this.switchNodeUturn(1)
      div.append(this.allow)
      // Separator space
      div.append(document.createElement('p'))
      // Disallow button
      this.disallow = document.createElement('wz-button')
      this.disallow.color = 'shadowed'
      this.disallow.innerHTML = I18n.t(NAME).disallow_uturns
      this.disallow.onclick = () => this.switchNodeUturn(0)
      div.append(this.disallow)
      // Info bar
      let info = document.createElement('p')
      info.className = 'info-bar'
      info.innerHTML = '<a href="' + GM_info.scriptUpdateURL + '">' + GM_info.script.name + '</a> ' + GM_info.script.version
      div.append(info)

      element.append(sl)
      element.append(label)
      element.append(div)
    }

    /**
     * Updated buttons status and counters
     */
    updateNodeUI () {
      let node = WME.getSelectedNode()
      if (!node) {
        return
      }

      let counter = this.countNodeUturns(node)

      // Change display properties of the buttons
      this.allow.style.display = counter.disallowed ? 'inline-block' : 'none'
      this.disallow.style.display = counter.allowed ? 'inline-block' : 'none'

      // Change text
      this.text.innerHTML =
        I18n.t(NAME).allowed + ': ' + counter.allowed + '<br/>' +
        I18n.t(NAME).disallowed + ': ' + counter.disallowed
    }

    /**
     * @param node
     * @return {{allowed: number, disallowed: number}}
     */
    countNodeUturns (node) {
      let counter = {
        allowed: 0,
        disallowed: 0
      }

      let segmenstIds = node.getSegmentIds()

      for (let i = 0; i < segmenstIds.length; i++) {
        let segment = W.model.segments.getObjectById(segmenstIds[i])
        if (!segment) {
          continue
        }
        if (segment.isTurnAllowed(segment, node)) {
          counter.allowed++
        } else {
          counter.disallowed++
        }
      }
      return counter
    }

    /**
     * Handler for selected node
     * @param status
     */
    switchNodeUturn (status) {
      let node = WME.getSelectedNode()
      if (!node) {
        return
      }
      let segmenstIds = node.getSegmentIds()
      if (segmenstIds.length < 2) {
        return
      }
      for (let i = 0; i < segmenstIds.length; i++) {
        let segment = W.model.segments.getObjectById(segmenstIds[i])
        if (segment.isOneWay()) {
          continue;
        }
        let turn = W.model.getTurnGraph().getTurnThroughNode(node, segment, segment)
        W.model.actionManager.add(
          new WazeActionSetTurn(
            W.model.getTurnGraph(),
            turn.withTurnData(turn.getTurnData().withState(status)))
        )
      }
      this.updateNodeUI()
    }

    /**
     * Handler for selected segments
     * @param direction
     */
    switchSegmentUturn (direction = 'A') {
      let segments = WME.getSelectedSegments()
      for (let i = 0, total = segments.length; i < total; i++) {
        let segment = segments[i]
        if (segment.isOneWay()) {
          continue;
        }
        let node = (direction === 'A') ? segment.getFromNode() : segment.getToNode()
        let status = segment.isTurnAllowed(segment, node) ? 0 : 1
        let turn = W.model.getTurnGraph().getTurnThroughNode(node, segment, segment)
        W.model.actionManager.add(
          new WazeActionSetTurn(
            W.model.getTurnGraph(),
            turn.withTurnData(turn.getTurnData().withState(status)) // enable it
          )
        )
      }
    }
  }

  let WazeActionSetTurn

  $(document)
    .on('bootstrap.wme', () => {
      // Require Waze components
      WazeActionSetTurn = require('Waze/Model/Graph/Actions/SetTurn')

      let UTurnsInstance = new UTurns(NAME)

      // Hotkeys for node manipulation
      WMEUI.addShortcut(NAME + '-node-allow', I18n.t(NAME).allow_uturns, NAME, I18n.t(NAME).title, 'A+A', () => UTurnsInstance.switchNodeUturn(1))
      WMEUI.addShortcut(NAME + '-node-disallow', I18n.t(NAME).disallow_uturns, NAME, I18n.t(NAME).title, 'A+S', () => UTurnsInstance.switchNodeUturn(0))
      // Hotkeys for segment manipulation
      WMEUI.addShortcut(NAME + '-segment-a', I18n.t(NAME).switch_uturn + ' A', NAME, I18n.t(NAME).title, 'A+Q', () => UTurnsInstance.switchSegmentUturn('A'))
      WMEUI.addShortcut(NAME + '-segment-b', I18n.t(NAME).switch_uturn + ' B', NAME, I18n.t(NAME).title, 'A+W', () => UTurnsInstance.switchSegmentUturn('B'))
      // Update count of UTurns on events
      W.model.actionManager.events.register('afterundoaction', null, () => UTurnsInstance.updateNodeUI())
      W.model.actionManager.events.register('afterclearactions', null, () => UTurnsInstance.updateNodeUI())
      W.model.actionManager.events.register('afteraction', null, () => UTurnsInstance.updateNodeUI())
    })
})()
