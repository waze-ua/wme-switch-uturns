// ==UserScript==
// @name         WME Switch Uturns
// @version      1.0.0
// @description  Switches Uturns for selected node. Forked and improved "WME Add Uturn from node" script.
// @author       ixxvivxxi, uranik, turbopirate, AntonShevchuk
// @include      /^https:\/\/(www|beta)\.waze\.com(\/\w{2,3}|\/\w{2,3}-\w{2,3}|\/\w{2,3}-\w{2,3}-\w{2,3})?\/editor\b/
// @grant        none
// @require      https://greasyfork.org/scripts/24851-wazewrap/code/WazeWrap.js
// @require      https://greasyfork.org/scripts/389117-wme-api-helper/code/WME%20API%20Helper.js?version=729071
// @namespace    https://github.com/waze-ua/wme-switch-uturns
// ==/UserScript==

/* jshint esversion: 6 */
/* global require, window, W, I18n, OL, APIHelper, WazeWrap */

(function ($) {
  'use strict';

  // Script name, uses as unique index
  const NAME = 'SWITCH-UTURNS';

  // Translations
  const TRANSLATION = {
    'en': {
      title: 'Switch U-Turns',
      allowed: 'Allowed',
      disallowed: 'Disallowed',
      allow_uturns: 'Allow all U-turns',
      disallow_uturns: 'Disallow all U-turns',
    },
    'uk': {
      title: 'Керування розворотами',
      allowed: 'Дозволено',
      disallowed: 'Заборонено',
      allow_uturns: 'Дозволити усі розвороти',
      disallow_uturns: 'Заборонити усі розвороти',
    },
    'ru': {
      title: 'Управление разворотами',
      allowed: 'Разрешено',
      disallowed: 'Запрещено',
      allow_uturns: 'Разрешить все развороты',
      disallow_uturns: 'Запретить все развороты',
    }
  };

  APIHelper.bootstrap();
  APIHelper.addTranslation(NAME, TRANSLATION);

  $(document)
    .on('ready.apihelper', ready)
    .on('node.apihelper', '#edit-panel', createUI)
  ;

  let label, div, text, allow, disallow;

  let WazeActionSetTurn = require('Waze/Model/Graph/Actions/SetTurn');

  function ready() {
    // Label
    label = document.createElement('label');
    label.innerHTML = I18n.t(NAME).title;
    label.className = 'control-label';
    // div
    div = document.createElement('div');
    div.className = 'controls';

    // Text
    text = document.createElement('p');
    div.append(text);
    // Allow button
    allow = document.createElement('button');
    allow.className = 'btn btn-default';
    allow.innerHTML = I18n.t(NAME).allow_uturns;
    allow.onclick = () => switchNodeUturn(1);
    div.append(allow);
    // Disallow button
    disallow = document.createElement('button');
    disallow.className = 'btn btn-default';
    disallow.innerHTML = I18n.t(NAME).disallow_uturns;
    disallow.onclick = () => switchNodeUturn(0);
    div.append(disallow);
  }

  function createUI(ev, element) {
    if (W.selectionManager.getSelectedFeatures()[0].model.getSegmentIds().length < 2) {
      return;
    }
    element.append(label);
    element.append(div);
    // Refresh
    updateUI();
  }

  function updateUI() {
    let node = W.selectionManager.getSelectedFeatures()[0].model;
    let counter = countUturns(node);

    // Change display properties of the buttons
    allow.style.display = counter.disallowed ? 'inline-block' : 'none';
    disallow.style.display = counter.allowed ? 'inline-block' : 'none';

    // Change text
    text.innerHTML =
      I18n.t(NAME).allowed + ': ' + counter.allowed + '<br/>' +
      I18n.t(NAME).disallowed + ': ' + counter.disallowed
    ;
  }

  function countUturns(node) {
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

  function switchNodeUturn(status) {
    let node = W.selectionManager.getSelectedFeatures()[0].model;
    let segmenstIds = node.getSegmentIds();

    for (let i = 0; i < segmenstIds.length; i++) {
      let segment = W.model.segments.getObjectById(segmenstIds[i]);
      let turn = W.model.getTurnGraph().getTurnThroughNode(node, segment, segment);
      W.model.actionManager.add(
        new WazeActionSetTurn(
          W.model.getTurnGraph(),
          turn.withTurnData(turn.getTurnData().withState(status)))
      );
    }
    updateUI();
  }
})(window.jQuery);
