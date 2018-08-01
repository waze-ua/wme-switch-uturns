// ==UserScript==
// @name         WME Switch Uturns
// @version      2018.08.01.001
// @description  Switches Uturns for selected node. Forked and improved "WME Add Uturn from node" script.
// @author       ixxvivxxi, uranik, turbopirate
// @include      /^https:\/\/(www|beta)\.waze\.com(\/\w{2,3}|\/\w{2,3}-\w{2,3}|\/\w{2,3}-\w{2,3}-\w{2,3})?\/editor\b/
// @grant        none
// @namespace    https://github.com/waze-ua/wme-switch-uturns
// ==/UserScript==

function Uturns_bootstrap()
{
    var bGreasemonkeyServiceDefined = false;
    try
    {
        if ("object" === typeof Components.interfaces.gmIGreasemonkeyService)
        {
            bGreasemonkeyServiceDefined = true;
        }
    }
    catch (err)
    {
        //Ignore.
    }
    if ( "undefined" === typeof unsafeWindow  ||  ! bGreasemonkeyServiceDefined)
    {
        unsafeWindow    = ( function ()
        {
            var dummyElem   = document.createElement('p');
            dummyElem.setAttribute ('onclick', 'return window;');
            return dummyElem.onclick ();
        } ) ();
    }
    /* begin running the code! */
    setTimeout(startUturns,999);
}

function getUturnsCount(node) {
    var numUTurns=0;
    for(var currentNode in W.model.nodes.objects)
    {
        var node2=W.model.nodes.getObjectById(currentNode);
        if(node2.attributes.id==node.attributes.id)
        {
            if(node2===undefined)continue;
            numUTurns=0;
            for(var j=0;j<node2.attributes.segIDs.length;j++)
            {
                var segID=node2.attributes.segIDs[j];
                var segment2=W.model.segments.getObjectById(segID);
                if(segment2===undefined)continue;
                var attributes=segment2.attributes;
                if(attributes.fwdDirection===true&&attributes.revDirection===true)
                {
                    if(node2.attributes.segIDs.length>1)
                    {
                        if(segment2.isTurnAllowed(segment2,node2))
                            numUTurns++;
                    }
                }
            }
        }
    }
    console.log('u-turns count in selected node', numUTurns);
    return numUTurns;
}

function getSegmentsCount(node) {
    return node.attributes.segIDs.length;
}

function switchUturn(s) {
    var wazeActionSetTurn= require("Waze/Model/Graph/Actions/SetTurn");
    var node = W.selectionManager.getSelectedFeatures()[0].model;
    var segIDs = node.attributes.segIDs;

    for (var i = 0; i < segIDs.length; i++) {
        var segment = W.model.segments.objects[segIDs[i]];
        var turn = W.model.getTurnGraph().getTurnThroughNode(node, segment, segment);
        W.model.actionManager.add(new wazeActionSetTurn(W.model.getTurnGraph(), turn.withTurnData(turn.getTurnData().withState(s))));
    }
}

function getI18N(id, loc) {
    var i18n = {
        "allow_uturns": {
            "en" : "Allow all U-turns",
            "ru" : "Разрешить все развороты",
            "uk" : "Дозволити усі розвороти"
        },
        "disallow_uturns": {
            "en": "Disallow all U-turns",
            "ru": "Запретить все развороты",
            "uk": "Заборонити усі розвороти"
        }
    };

    if (id in i18n) {
        if (loc in i18n[id]) {
            return i18n[id][loc];
        } else {
            return i18n[id].en;
        }
    }
}

function updateButtons() {
    var uturnCount = getUturnsCount(W.selectionManager.getSelectedFeatures()[0].model);
    var segsCount = getSegmentsCount(W.selectionManager.getSelectedFeatures()[0].model);

    var disallowBtn = $('#edit-panel .side-panel-section #disallowUturns');
    var allowBtn = $('#edit-panel .side-panel-section #allowUturns');

    if (segsCount == 1) {
        allowBtn.hide();
        disallowBtn.hide();
        return;
    }

    if (uturnCount === 0) {
        allowBtn.show();
        disallowBtn.hide();
        return;
    }

    if (uturnCount != segsCount) {
        allowBtn.show();
        disallowBtn.show();
    } else {
        allowBtn.hide();
        disallowBtn.show();
    }
}

function startUturns() {
    W.selectionManager.events.register("selectionchanged", null, showButton);
    function showButton() {
        var loc = I18n.locale;
        if(W.selectionManager.getSelectedFeatures().length === 0 || W.selectionManager.getSelectedFeatures().length > 1) return;
        if(W.selectionManager.getSelectedFeatures()[0].model.type == "node") {
            $('#edit-panel .side-panel-section:first-child').append('<button id="disallowUturns" class="btn btn-default">' + getI18N("disallow_uturns", loc) + '</button>');
            $('#edit-panel .side-panel-section:first-child').append('<button id="allowUturns" class="btn btn-default">' + getI18N("allow_uturns", loc) + '</button>');
            updateButtons();
        }
    }
    $('#sidebar').on('click', '#allowUturns', function(event) {
        switchUturn(1);
        updateButtons();
    });

    $('#sidebar').on('click', '#disallowUturns', function(event) {
        switchUturn(0);
        updateButtons();
    });
}

Uturns_bootstrap();
