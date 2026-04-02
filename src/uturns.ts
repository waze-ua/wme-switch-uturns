import { NAME } from './translations'

const ALLOW = true
const DISALLOW = false

export class UTurns extends WMEBase {
  helper: any
  tab: any
  text: any
  allow: any
  disallow: any

  constructor (name: string, settings: any = null) {
    super(name, settings)

    this.initHelper()

    this.initTab()

    this.initShortcuts()

    this.initHandlers()
  }

  initHelper() {
    this.helper = new WMEUIHelper(this.name)
  }

  initTab() {
    this.tab = this.helper.createTab(
      I18n.t(this.name).title,
      {
        sidebar: this.wmeSDK.Sidebar,
        image: GM_info.script.icon
      }
    )
    this.tab.addText('description', I18n.t(this.name).description)
    let button = this.tab.addButton(
      this.name,
      I18n.t(this.name).count,
      '',
      () => this.updateTabUI(this.countUturns())
    )
    button.html().className += ' waze-btn-blue'

    this.tab.addText('counter', '')
    this.tab.addText(
      'info',
      '<a href="' + GM_info.scriptUpdateURL + '">' + GM_info.script.name + '</a> ' + GM_info.script.version
    )
    this.tab.addText('blue', 'made in')
    this.tab.addText('yellow', 'Ukraine')
    // Inject custom HTML to container in the WME interface
    this.tab.inject()
  }

  initShortcuts () {
    let shortcuts = [
      // Hotkeys for node manipulation
      {
        callback: () => this.switchNodeUturn(true),
        description: I18n.t(NAME).allow,
        shortcutId: this.id + '-node-allow',
        shortcutKeys: 'A+A',
      },
      {
        callback: () => this.switchNodeUturn(false),
        description: I18n.t(NAME).disallow,
        shortcutId: this.id + '-node-disallow',
        shortcutKeys: 'A+S',
      },
      // Hotkeys for segment manipulation
      {
        callback: () => this.switchSegmentUturn('A'),
        description: I18n.t(NAME).switch + ' A',
        shortcutId: this.id + '-segment-a',
        shortcutKeys: 'A+Q',
      },
      {
        callback: () => this.switchSegmentUturn('B'),
        description: I18n.t(NAME).switch + ' B',
        shortcutId: this.id + '-segment-b',
        shortcutKeys: 'A+W',
      },
    ]

    for (let i = 0; i < shortcuts.length; i++) {
      let shortcut = shortcuts[i]

      if (this.wmeSDK.Shortcuts.areShortcutKeysInUse({ shortcutKeys: shortcut.shortcutKeys })) {
        this.log('Shortcut already in use')
        shortcut.shortcutKeys = null
      }
      this.wmeSDK.Shortcuts.createShortcut(shortcut);
    }
  }

  /**
   * Update count of UTurns on events
   */
  initHandlers () {
    this.wmeSDK.Events.on({
      eventName: "wme-after-undo",
      eventHandler: () => this.updateNodeUI(),
    });
    this.wmeSDK.Events.on({
      eventName: "wme-after-redo-clear",
      eventHandler: () => this.updateNodeUI(),
    });
  }

  /**
   * Handler for `node.wme` event
   */
  onNode (event: any, element: HTMLElement, node: any) {
    if (node.connectedSegmentIds.length < 2 ) {
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

  /**
   * Added controls
   */
  createPanel (element: HTMLElement) {
    // Container
    let container = document.createElement('div')
    container.id = this.id
    // Separator space
    container.append(document.createElement('hr'))
    // Title
    let title = document.createElement('p')
    title.innerText = I18n.t(NAME).title
    container.append(title)
    // Text
    this.text = document.createElement('p')
    container.append(this.text)
    // Allow button
    this.allow = document.createElement('wz-button')
    this.allow.color = 'shadowed'
    this.allow.innerText = I18n.t(NAME).allow
    this.allow.onclick = () => this.switchNodeUturn(ALLOW)
    this.allow.style.marginBottom = '4px'
    container.append(this.allow)
    // Disallow button
    this.disallow = document.createElement('wz-button')
    this.disallow.color = 'shadowed'
    this.disallow.innerText = I18n.t(NAME).disallow
    this.disallow.onclick = () => this.switchNodeUturn(DISALLOW)
    container.append(this.disallow)

    element.parentNode.append(container)
  }

  /**
   * Remove controls
   */
  removePanel(element: HTMLElement) {
    element.parentNode.querySelector('#' + this.id)?.remove()
  }

  /**
   * Update counter for the plugin tab
   */
  updateTabUI (counter: any) {
    this.tab.html().querySelector('p.switch-u-turns-counter').innerHTML = '' +
      I18n.t(NAME).nodes + ': ' + counter.nodes + '<br/>' +
      I18n.t(NAME).allowed + ': ' + counter.allowed + '<br/>' +
      I18n.t(NAME).disallowed + ': ' + counter.disallowed
  }

  /**
   * Updated buttons status and counters
   */
  updateNodeUI () {
    let node = this.getSelectedNode()

    if (!node || !this.allow || !this.disallow) {
      return
    }
    let counter = this.countNodeUturns(node)

    // Change display properties of the buttons
    this.allow.style.display = counter.disallowed ? 'flex' : 'none'
    this.disallow.style.display = counter.allowed ? 'flex' : 'none'

    // Change text
    this.text.innerHTML =
      I18n.t(NAME).allowed + ': ' + counter.allowed + '<br/>' +
      I18n.t(NAME).disallowed + ': ' + counter.disallowed
  }

  /**
   * @return {{nodes: number, allowed: number, disallowed: number}}
   */
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

  /**
   * @param {Object} node
   * @return {{allowed: number, disallowed: number}}
   */
  countNodeUturns (node: any) {
    let turns = this.wmeSDK.DataModel.Turns.getTurnsThroughNode( { nodeId: node.id } )
    turns = turns.filter( (turn: any) => turn.isUTurn )

    return  {
      allowed: turns.filter( (turn: any) => turn.isAllowed ).length,
      disallowed: turns.filter( (turn: any) => !turn.isAllowed ).length
    }
  }

  /**
   * Handler for selected node
   */
  switchNodeUturn (status: boolean) {
    let node = this.getSelectedNode()

    if (!node) {
      return
    }

    if (!this.wmeSDK.DataModel.Turns.canEditTurnsThroughNode( { nodeId: node.id } )) {
      return
    }

    let turns = this.wmeSDK.DataModel.Turns.getTurnsThroughNode( { nodeId: node.id } )
    turns = turns.filter( (turn: any) => turn.isUTurn )
    turns = turns.filter( (turn: any) => turn.isAllowed !== status )
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

  /**
   * Handler for selected segments
   */
  switchSegmentUturn (direction: string = 'A') {
    let segments = this.getSelectedSegments()
    for (let i = 0, total = segments.length; i < total; i++) {
      let segment = segments[i]
      if (!segment.isTwoWay) {
        continue;
      }
      let nodeId = (direction === 'A') ? segment.fromNodeId : segment.toNodeId

      if (!this.wmeSDK.DataModel.Turns.canEditTurnsThroughNode( { nodeId: nodeId } )) {
        continue
      }

      let status = this.wmeSDK.DataModel.Turns.isTurnAllowed({ fromSegmentId: segment.id, nodeId: nodeId, toSegmentId: segment.id })

      let turns = this.wmeSDK.DataModel.Turns.getTurnsThroughNode( { nodeId: nodeId } )
      turns = turns.filter( (turn: any) => turn.isUTurn )
      turns = turns.filter( (turn: any) => turn.fromSegmentId === segment.id && turn.toSegmentId === segment.id )

      if (turns.length === 0) {
        continue
      }

      // it should be always only one turn, but who knows
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
