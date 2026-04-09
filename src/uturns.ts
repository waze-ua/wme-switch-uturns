import { NAME } from './name'
import type { Segment, Turn } from 'wme-sdk-typings'

const ALLOW = true
const DISALLOW = false

const LAYER_NAME = 'Disallowed U-Turns'

const LAYER_STYLE = {
  styleContext: {},
  styleRules: [
    {
      predicate: (properties: any) => properties.styleName === 'disallowed',
      style: {
        pointRadius: 6,
        fillColor: '#ff0000',
        fillOpacity: 0.7,
        stroke: true,
        strokeColor: '#cc0000',
        strokeWidth: 2,
        strokeOpacity: 1,
      },
    },
  ],
}

export class UTurns extends WMEBase {
  tab: any
  counter: any
  text: any
  allow: any
  disallow: any
  layerEnabled: boolean

  constructor (name: string, settings: any = null) {
    super(name, settings)

    this.layerEnabled = this.settings.get('layer')

    this.initTab()
    this.initLayer()
    this.initShortcuts()
    this.initHandlers()
  }

  initTab () {
    this.tab = this.helper.createTab(
      WMEUI.t(NAME).title,
      {
        sidebar: this.wmeSDK.Sidebar,
        image: GM_info.script.icon
      }
    )
    this.tab.addText('description', WMEUI.t(NAME).description)
    this.tab.addButton(
      this.name,
      WMEUI.t(NAME).count,
      '',
      () => this.updateTabUI(this.countUturns()),
      { className: 'waze-btn waze-btn-small waze-btn-white waze-btn-blue' }
    )

    this.counter = this.tab.addText('counter', '')
    this.tab.addText(
      'info',
      '<a href="' + GM_info.scriptUpdateURL + '">' + GM_info.script.name + '</a> ' + GM_info.script.version
    )
    this.tab.addText('blue', 'made in')
    this.tab.addText('yellow', 'Ukraine')
    this.tab.inject()
  }

  initLayer () {
    this.wmeSDK.Map.addLayer({
      layerName: LAYER_NAME,
      styleRules: LAYER_STYLE.styleRules,
      styleContext: LAYER_STYLE.styleContext,
      zIndex: 500,
    })
    this.wmeSDK.Map.setLayerVisibility({ layerName: LAYER_NAME, visibility: this.layerEnabled })

    this.wmeSDK.LayerSwitcher.addLayerCheckbox({ name: LAYER_NAME })
    this.wmeSDK.LayerSwitcher.setLayerCheckboxChecked({ name: LAYER_NAME, isChecked: this.layerEnabled })

    if (this.layerEnabled) {
      this.highlightDisallowed()
    }

    this.wmeSDK.Events.on({
      eventName: 'wme-layer-checkbox-toggled',
      eventHandler: (e: any) => {
        if (e.name === LAYER_NAME) {
          this.layerEnabled = e.checked
          this.settings.set('layer', e.checked)
          this.wmeSDK.Map.setLayerVisibility({ layerName: LAYER_NAME, visibility: e.checked })
          if (e.checked) {
            this.highlightDisallowed()
          } else {
            this.clearHighlights()
          }
        }
      }
    })

    this.wmeSDK.Events.on({
      eventName: 'wme-map-move-end',
      eventHandler: () => {
        if (this.layerEnabled) {
          this.highlightDisallowed()
        }
      }
    })
  }

  highlightDisallowed () {
    this.clearHighlights()

    let nodes = this.getAllNodes()

    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i]
      let counter = this.countNodeUturns(node)
      if (counter.disallowed > 0) {
        let feature = {
          type: 'Feature' as const,
          id: String(node.id),
          properties: { styleName: 'disallowed' },
          geometry: node.geometry,
        }
        this.wmeSDK.Map.addFeatureToLayer({ layerName: LAYER_NAME, feature })
      }
    }
  }

  clearHighlights () {
    let nodes = this.getAllNodes()
    for (let i = 0; i < nodes.length; i++) {
      try {
        this.wmeSDK.Map.removeFeatureFromLayer({ layerName: LAYER_NAME, featureId: String(nodes[i].id) })
      } catch (e) {}
    }
  }

  initShortcuts () {
    this.createShortcut('node-allow', WMEUI.t(NAME).allow, 'A+A', () => this.switchNodeUturn(true))
    this.createShortcut('node-disallow', WMEUI.t(NAME).disallow, 'A+S', () => this.switchNodeUturn(false))
    this.createShortcut('segment-a', WMEUI.t(NAME).switch + ' A', 'A+Q', () => this.switchSegmentUturn('A'))
    this.createShortcut('segment-b', WMEUI.t(NAME).switch + ' B', 'A+W', () => this.switchSegmentUturn('B'))
  }

  initHandlers () {
    this.wmeSDK.Events.on({
      eventName: "wme-after-undo",
      eventHandler: () => this.updateNodeUI(),
    })
    this.wmeSDK.Events.on({
      eventName: "wme-after-redo-clear",
      eventHandler: () => this.updateNodeUI(),
    })
  }

  onNode (event: JQuery.Event, element: HTMLElement, node: WMENode) {
    if (node.connectedSegmentIds.length < 2) {
      return
    }

    if (!this.wmeSDK.DataModel.Nodes.canEditTurns({ nodeId: node.id })) {
      this.log('You don\'t have permissions to edit this turns')
      return
    }

    this.removePanel(element)
    this.createPanel(element)
    this.updateNodeUI()
  }

  createPanel (element: HTMLElement) {
    let container = document.createElement('div')
    container.id = this.id
    container.append(document.createElement('hr'))

    let title = document.createElement('p')
    title.innerText = WMEUI.t(NAME).title
    container.append(title)

    this.text = document.createElement('p')
    container.append(this.text)

    this.allow = document.createElement('wz-button')
    this.allow.color = 'shadowed'
    this.allow.innerText = WMEUI.t(NAME).allow
    this.allow.onclick = () => this.switchNodeUturn(ALLOW)
    this.allow.style.marginBottom = '4px'
    container.append(this.allow)

    this.disallow = document.createElement('wz-button')
    this.disallow.color = 'shadowed'
    this.disallow.innerText = WMEUI.t(NAME).disallow
    this.disallow.onclick = () => this.switchNodeUturn(DISALLOW)
    container.append(this.disallow)

    element.parentNode.append(container)
  }

  removePanel (element: HTMLElement) {
    element.parentNode.querySelector('#' + this.id)?.remove()
  }

  updateTabUI (counter: any) {
    this.counter.setText(
      WMEUI.t(NAME).nodes + ': ' + counter.nodes + '<br/>' +
      WMEUI.t(NAME).allowed + ': ' + counter.allowed + '<br/>' +
      WMEUI.t(NAME).disallowed + ': ' + counter.disallowed
    )
  }

  updateNodeUI () {
    let node = this.getSelectedNode()

    if (!node || !this.allow || !this.disallow) {
      return
    }
    let counter = this.countNodeUturns(node)

    this.allow.style.display = counter.disallowed ? 'flex' : 'none'
    this.disallow.style.display = counter.allowed ? 'flex' : 'none'

    this.text.innerHTML =
      WMEUI.t(NAME).allowed + ': ' + counter.allowed + '<br/>' +
      WMEUI.t(NAME).disallowed + ': ' + counter.disallowed

    if (this.layerEnabled) {
      this.highlightDisallowed()
    }
  }

  countUturns () {
    let counters = {
      nodes: 0,
      allowed: 0,
      disallowed: 0
    }

    let nodes = this.getAllNodes()

    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i]
      let counter = this.countNodeUturns(node)
      counters.nodes++
      counters.allowed += counter.allowed
      counters.disallowed += counter.disallowed
    }

    return counters
  }

  countNodeUturns (node: WMENode) {
    let turns: Turn[] = this.wmeSDK.DataModel.Turns.getTurnsThroughNode({ nodeId: node.id })
    turns = turns.filter((turn: Turn) => turn.isUTurn)

    return {
      allowed: turns.filter((turn: Turn) => turn.isAllowed).length,
      disallowed: turns.filter((turn: Turn) => !turn.isAllowed).length
    }
  }

  switchNodeUturn (status: boolean) {
    let node = this.getSelectedNode()

    if (!node) {
      return
    }

    if (!this.wmeSDK.DataModel.Turns.canEditTurnsThroughNode({ nodeId: node.id })) {
      return
    }

    let turns: Turn[] = this.wmeSDK.DataModel.Turns.getTurnsThroughNode({ nodeId: node.id })
    turns = turns.filter((turn: Turn) => turn.isUTurn)
    turns = turns.filter((turn: Turn) => turn.isAllowed !== status)
    if (turns.length === 0) {
      this.log('Node ID=' + node.id + ': all u-turns are ' + (status ? 'ALLOW' : 'DISALLOW'))
    }

    for (let i = 0; i < turns.length; i++) {
      let turn = turns[i]
      if (this.wmeSDK.DataModel.Turns.getById({ turnId: turn.id })) {
        this.wmeSDK.DataModel.Turns.updateTurn({ turnId: turn.id, isAllowed: status })
        this.log('Turn ID=' + turn.id + ' switched to ' + (status ? 'ALLOW' : 'DISALLOW'))
      } else {
        this.log('Turn ID=' + turn.id + ' Not Found')
      }
    }

    this.updateNodeUI()

    this.log('Node ID=' + node.id + ': ' + turns.length + ' u-turns have switched to ' + (status ? 'ALLOW' : 'DISALLOW'))
  }

  switchSegmentUturn (direction: string = 'A') {
    let segments: Segment[] = this.getSelectedSegments()
    for (let i = 0, total = segments.length; i < total; i++) {
      let segment: Segment = segments[i]
      if (!segment.isTwoWay) {
        continue
      }
      let nodeId = (direction === 'A') ? segment.fromNodeId : segment.toNodeId

      if (!this.wmeSDK.DataModel.Turns.canEditTurnsThroughNode({ nodeId: nodeId })) {
        continue
      }

      let status = this.wmeSDK.DataModel.Turns.isTurnAllowed({ fromSegmentId: segment.id, nodeId: nodeId, toSegmentId: segment.id })

      let turns: Turn[] = this.wmeSDK.DataModel.Turns.getTurnsThroughNode({ nodeId: nodeId })
      turns = turns.filter((turn: Turn) => turn.isUTurn)
      turns = turns.filter((turn: Turn) => turn.fromSegmentId === segment.id && turn.toSegmentId === segment.id)

      if (turns.length === 0) {
        continue
      }

      for (let i = 0; i < turns.length; i++) {
        let turn = turns[i]
        if (this.wmeSDK.DataModel.Turns.getById({ turnId: turn.id })) {
          this.wmeSDK.DataModel.Turns.updateTurn({ turnId: turn.id, isAllowed: !status })
        }
      }

      this.log('U-turn in the point ' + direction + ' switched to ' + (!status ? 'ALLOW' : 'DISALLOW'))
    }
  }
}
