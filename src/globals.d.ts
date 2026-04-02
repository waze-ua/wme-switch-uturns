// WME-Base types
declare class WMEBase {
  constructor(name: string, settings?: any)
  id: string
  name: string
  wmeSDK: any
  settings: any

  log(message: string, ...args: any[]): void
  group(message: string, ...args: any[]): void
  groupEnd(): void

  onNone(event: any): void
  onSegment(event: any, element: HTMLElement, model: any): void
  onSegments(event: any, element: HTMLElement, models: any[]): void
  onNode(event: any, element: HTMLElement, model: any): void
  onNodes(event: any, element: HTMLElement, models: any[]): void
  onVenue(event: any, element: HTMLElement, model: any): void
  onVenues(event: any, element: HTMLElement, models: any[]): void
  onPlace(event: any, element: HTMLElement, model: any): void
  onPoint(event: any, element: HTMLElement, model: any): void
  onResidential(event: any, element: HTMLElement, model: any): void

  getAllVenues(except?: string[]): any[]
  getSelectedVenue(): any
  getSelectedVenues(): any[]
  getSelectedVenueAddress(): any

  getAllSegments(except?: number[]): any[]
  getSelectedSegment(): any
  getSelectedSegments(): any[]

  getAllNodes(except?: any[]): any[]
  getSelectedNode(): any
  getSelectedNodes(): any[]
}

// WME-UI types
declare class WMEUI {
  static normalize(str: string): string
  static addStyle(css: string): void
  static addTranslation(uid: string, data: any): void
}

declare class WMEUIHelper {
  constructor(uid: string)
  uid: string
  index: number

  generateId(): string
  createPanel(title: string, attributes?: any): WMEUIHelperPanel
  createTab(title: string, attributes?: any): WMEUIHelperTab
  createModal(title: string, attributes?: any): WMEUIHelperModal
  createFieldset(title: string, attributes?: any): WMEUIHelperFieldset
}

declare class WMEUIHelperElement {
  uid: string
  id: string
  title: string | null
  attributes: any
  element: HTMLElement | null
  elements: WMEUIHelperElement[]

  addElement(element: WMEUIHelperElement): WMEUIHelperElement
  applyAttributes(element: HTMLElement): HTMLElement
  html(): HTMLElement
  toHTML(): HTMLElement
}

declare class WMEUIHelperContainer extends WMEUIHelperElement {
  addButton(id: string, title: string, description: string, callback: Function): WMEUIHelperElement
  addButtons(buttons: any): void
  addCheckbox(id: string, title: string, callback: Function, checked?: boolean): WMEUIHelperElement
  addDiv(id: string, innerHTML?: string | null, attributes?: any): WMEUIHelperElement
  addFieldset(id: string, title: string): WMEUIHelperElement
  addInput(id: string, title: string, callback: Function, value?: string): WMEUIHelperElement
  addNumber(id: string, title: string, callback: Function, value?: number, min?: number, max?: number, step?: number): WMEUIHelperElement
  addRadio(id: string, title: string, callback: Function, name: string, value: string, checked?: boolean): WMEUIHelperElement
  addRange(id: string, title: string, callback: Function, value: number, min: number, max: number, step?: number): WMEUIHelperElement
  addText(id: string, text: string): WMEUIHelperElement
}

declare class WMEUIHelperFieldset extends WMEUIHelperContainer {}
declare class WMEUIHelperPanel extends WMEUIHelperContainer {
  container(): HTMLElement
  inject(): void
}
declare class WMEUIHelperTab extends WMEUIHelperContainer {
  inject(): Promise<void>
}
declare class WMEUIHelperModal extends WMEUIHelperContainer {
  container(): HTMLElement
  inject(): void
}

declare class WMEUIHelperControlButton extends WMEUIHelperElement {
  constructor(uid: string, id: string, title: string, description: string, callback: Function)
  description: string
  callback: Function
}

declare const I18n: {
  t(key: string): any
}

// CSS module imports
declare module '*.css' {
  const content: string
  export default content
}
