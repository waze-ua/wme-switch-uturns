// ==UserScript==
// @name         WME Switch Uturns
// @version      2022.08.18.001
// @description  Switches U-turns for selected node or segment. Forked and improved "WME Add Uturn from node" script.
// @author       ixxvivxxi, uranik, turbopirate, AntonShevchuk
// @include      /^https:\/\/(www|beta)\.waze\.com(\/\w{2,3}|\/\w{2,3}-\w{2,3}|\/\w{2,3}-\w{2,3}-\w{2,3})?\/editor\b/
// @grant        none
// @require      https://greasyfork.org/scripts/389117-apihelper/code/APIHelper.js?version=1082818
// @require      https://greasyfork.org/scripts/389577-apihelperui/code/APIHelperUI.js?version=1082911
// @namespace    https://github.com/waze-ua/wme-switch-uturns
// @updateURL    https://github.com/waze-ua/wme-switch-uturns/raw/master/wme-switch-uturns.user.js
// @downloadURL  https://github.com/waze-ua/wme-switch-uturns/raw/master/wme-switch-uturns.user.js
// ==/UserScript==

/* jshint esversion: 6 */
/* global require */
/* global $ */
/* global W */
/* global OL */
/* global I18n */
/* global APIHelper */

(function ($) {
  'use strict';

  // Script name, uses as unique index
  const NAME = 'SWITCH-UTURNS';

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
  };

  APIHelper.bootstrap();
  APIHelper.addTranslation(NAME, TRANSLATION);
  APIHelper.addStyle(
    '#node-edit-general button { margin-bottom: 2px }'
  );

  $(document)
    .on('init.apihelper', ready)
    .on('node.apihelper', createNodeUI)
  ;

  let sl, label, div, text, allow, disallow;

  let WazeActionSetTurn;

  function ready() {
    // Require Waze components
    WazeActionSetTurn = require('Waze/Model/Graph/Actions/SetTurn');
    // Separator line
    sl = document.createElement('div');
    sl.className = 'separator-line';
    sl.style.marginBottom = '16px';
    // Label
    label = document.createElement('label');
    label.innerHTML = I18n.t(NAME).title;
    label.className = 'control-label';
    // Controls div
    div = document.createElement('div');
    div.className = 'controls';
    // Text
    text = document.createElement('p');
    div.append(text);
    // Allow button
    // <wz-button color="shadowed" class="disallow-connections">Заборонити всі повороти</wz-button>
    allow = document.createElement('wz-button');
    allow.color = 'shadowed';
    allow.innerHTML = I18n.t(NAME).allow_uturns;
    allow.onclick = () => switchNodeUturn(1);
    div.append(allow);
    // Disallow button
    disallow = document.createElement('wz-button');
    disallow.color = 'shadowed';
    disallow.innerHTML = I18n.t(NAME).disallow_uturns;
    disallow.onclick = () => switchNodeUturn(0);
    div.append(disallow);

    // Hotkeys for node manipulation
    new APIHelperUIShortcut(NAME + '-node-allow', I18n.t(NAME).allow_uturns, NAME, I18n.t(NAME).title, 'A+A', () => switchNodeUturn(1), null).add();
    new APIHelperUIShortcut(NAME + '-node-disallow', I18n.t(NAME).disallow_uturns, NAME, I18n.t(NAME).title, 'A+S', () => switchNodeUturn(0), null).add();
    // Hotkeys for segment manipulation
    new APIHelperUIShortcut(NAME + '-segment-a', I18n.t(NAME).switch_uturn + ' A', NAME, I18n.t(NAME).title, 'A+Q', () => switchSegmentUturn('A'), null).add();
    new APIHelperUIShortcut(NAME + '-segment-b', I18n.t(NAME).switch_uturn + ' B', NAME, I18n.t(NAME).title, 'A+W', () => switchSegmentUturn('B'), null).add();
    // Update count of UTurns on events
    W.model.actionManager.events.register('afterundoaction', null, updateNodeUI);
    W.model.actionManager.events.register('afterclearactions', null, updateNodeUI);
    W.model.actionManager.events.register('afteraction', null, updateNodeUI);
  }

  function createNodeUI(ev, element) {
    let node = APIHelper.getSelectedNode();
    if (!node) {
      return;
    }
    if (node.getSegmentIds().length < 2) {
      return;
    }
    element.append(sl);
    element.append(label);
    element.append(div);
    // Refresh
    updateNodeUI();
  }

  function updateNodeUI() {
    let node = APIHelper.getSelectedNode();
    if (!node) {
      return;
    }
    let counter = countNodeUturns(node);

    // Change display properties of the buttons
    allow.style.display = counter.disallowed ? 'inline-block' : 'none';
    disallow.style.display = counter.allowed ? 'inline-block' : 'none';

    // Change text
    text.innerHTML =
      I18n.t(NAME).allowed + ': ' + counter.allowed + '<br/>' +
      I18n.t(NAME).disallowed + ': ' + counter.disallowed
    ;
  }

  function countNodeUturns(node) {
    let counter = {
      allowed: 0,
      disallowed: 0
    };

    let segmenstIds = node.getSegmentIds();

    for (let i = 0; i < segmenstIds.length; i++) {
      let segment = W.model.segments.getObjectById(segmenstIds[i]);
      if (!segment) {
        continue;
      }
      if (segment.isTurnAllowed(segment, node)) {
        counter.allowed++;
      } else {
        counter.disallowed++;
      }
    }
    return counter;
  }

  // Handler for selected node
  function switchNodeUturn(status) {
    let node = APIHelper.getSelectedNode();
    if (!node) {
      return;
    }
    let segmenstIds = node.getSegmentIds();
    if (segmenstIds.length < 2) {
      return;
    }
    for (let i = 0; i < segmenstIds.length; i++) {
      let segment = W.model.segments.getObjectById(segmenstIds[i]);
      let turn = W.model.getTurnGraph().getTurnThroughNode(node, segment, segment);
      W.model.actionManager.add(
        new WazeActionSetTurn(
          W.model.getTurnGraph(),
          turn.withTurnData(turn.getTurnData().withState(status)))
      );
    }
    updateNodeUI();
  }

  // Handler for selected segments
  function switchSegmentUturn(direction = 'A') {
    let segments = APIHelper.getSelectedSegments();
    for (let i = 0, total = segments.length; i < total; i++) {
      let segment = segments[i];
      let node = (direction === 'A') ? segment.getFromNode() : segment.getToNode();
      let status = segment.isTurnAllowed(segment, node) ? 0 : 1;
      let turn = W.model.getTurnGraph().getTurnThroughNode(node, segment, segment);
      W.model.actionManager.add(
        new WazeActionSetTurn(
          W.model.getTurnGraph(),
          turn.withTurnData(turn.getTurnData().withState(status)) // enable it
        )
      );
    }
  }
})(window.jQuery);
