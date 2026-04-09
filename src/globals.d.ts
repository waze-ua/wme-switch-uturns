/// <reference types="wme-sdk-typings" />
// WME Node type (aliased to avoid DOM Node conflict)
interface WMENode {
  connectedSegmentIds: number[]
  geometry: any
  id: number
}
// =============================================================================
// WME-Base
// =============================================================================

declare class WMEBase {
  constructor(name: string, settings?: any)
  id: string
  name: string
  wmeSDK: any
  settings: any
  helper: WMEUIHelper

  // Logging
  log(message: string, ...args: any[]): void
  warn(message: string, ...args: any[]): void
  error(message: string, ...args: any[]): void
  group(message: string, ...args: any[]): void
  groupEnd(): void

  // Shortcuts
  createShortcut(id: string, description: string, keys: string | null, callback: Function): void

  // Permissions
  canEditSegment(model: Segment): boolean
  canEditVenue(model: Venue): boolean

  // Event handlers (override in subclass)
  onNone(event: JQuery.Event): void
  onSegment(event: JQuery.Event, element: HTMLElement, model: Segment): void
  onSegments(event: JQuery.Event, element: HTMLElement, models: Segment[]): void
  onNode(event: JQuery.Event, element: HTMLElement, model: WMENode): void
  onNodes(event: JQuery.Event, element: HTMLElement, models: WMENode[]): void
  onVenue(event: JQuery.Event, element: HTMLElement, model: Venue): void
  onVenues(event: JQuery.Event, element: HTMLElement, models: Venue[]): void
  onPlace(event: JQuery.Event, element: HTMLElement, model: Venue): void
  onPoint(event: JQuery.Event, element: HTMLElement, model: Venue): void
  onResidential(event: JQuery.Event, element: HTMLElement, model: Venue): void

  // Selection
  getSelection(): any

  // Venues
  getAllVenues(except?: string[]): Venue[]
  getSelectedVenue(): Venue | null
  getSelectedVenues(): Venue[]
  getSelectedVenueAddress(): VenueAddress | null

  // Segments
  getAllSegments(except?: number[]): Segment[]
  getSelectedSegment(): Segment | null
  getSelectedSegments(): Segment[]
  getSelectedSegmentAddress(): SegmentAddress | null

  // Nodes
  getAllNodes(except?: number[]): WMENode[]
  getSelectedNode(): WMENode | null
  getSelectedNodes(): WMENode[]
}

// =============================================================================
// WME-UI
// =============================================================================

declare class WMEUI {
  static normalize(str: string): string
  static addStyle(css: string): void
  static addTranslation(uid: string, data: Record<string, any>): void
  static t(uid: string): any
  static getLocale(): string
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

  remove(): void
  addElement(element: WMEUIHelperElement): WMEUIHelperElement
  removeElement(element: WMEUIHelperElement): void
  getChildContainer(): HTMLElement | null
  applyAttributes(element: HTMLElement): HTMLElement
  html(): HTMLElement
  toHTML(): HTMLElement
}

declare class WMEUIHelperContainer extends WMEUIHelperElement {
  addButton(id: string, title: string, description: string, callback: Function, attributes?: any): WMEUIHelperElement
  addButtons(buttons: any): void
  addCheckbox(id: string, title: string, callback: Function, checked?: boolean): WMEUIHelperElement
  addCheckboxes(checkboxes: any): void
  addDiv(id: string, innerHTML?: string | null, attributes?: any): WMEUIHelperElement
  addFieldset(id: string, title: string, attributes?: any): WMEUIHelperElement
  addInput(id: string, title: string, callback: Function, value?: string): WMEUIHelperElement
  addNumber(id: string, title: string, callback: Function, value?: number, min?: number, max?: number, step?: number): WMEUIHelperElement
  addRadio(id: string, title: string, callback: Function, name: string, value: string, checked?: boolean): WMEUIHelperElement
  addRange(id: string, title: string, callback: Function, value: number, min: number, max: number, step?: number): WMEUIHelperElement
  addText(id: string, text: string): WMEUIHelperElement
}

declare class WMEUIHelperFieldset extends WMEUIHelperContainer {}

declare class WMEUIHelperPanel extends WMEUIHelperContainer {
  container(): HTMLElement | null
  inject(): void
}

declare class WMEUIHelperTab extends WMEUIHelperContainer {
  inject(): Promise<void>
}

declare class WMEUIHelperModal extends WMEUIHelperContainer {
  container(): HTMLElement | null
  inject(): void
}

declare class WMEUIHelperDiv extends WMEUIHelperElement {}

declare class WMEUIHelperText extends WMEUIHelperElement {
  setText(text: string): void
}

declare class WMEUIHelperControl extends WMEUIHelperElement {}

declare class WMEUIHelperControlInput extends WMEUIHelperControl {}

declare class WMEUIHelperControlButton extends WMEUIHelperControl {
  constructor(uid: string, id: string, title: string, description: string, callback: Function, attributes?: any)
  description: string
  callback: Function
}

// =============================================================================
// CommonUtils
// =============================================================================

declare class Container {
  container: Record<string, any>
  set(keys: string[], value: any): void
  get(...keys: string[]): any
  has(...keys: string[]): boolean
}
declare class Settings extends Container {
  constructor(name: string, defaults?: any)
  uid: string
  default: any
  load(): void
  save(): void
}

declare const Tools: {
  isObject(item: any): boolean
  mergeDeep<T>(target: any, ...sources: any[]): T
}

// =============================================================================
// GeoUtils
// =============================================================================

declare class GeoUtils {
  static _toRadians(degrees: number): number
  static _toDegrees(radians: number): number
  static _normalizeAngle(degrees: number): number
  static getBearing(pA: number[], pB: number[]): number
  static findAngle(p1: number[], p2: number[], p3: number[]): number
  static getDistance(pA: number[], pB: number[]): number
  static getAngularDistance(pA: number[], pB: number[]): number
  static getDestination(startPoint: number[], bearing: number, distanceRad: number): number[]
  static findIntersection(pA: number[], pB: number[], pC: number[], angle: number): number[] | null
  static findRightAngleIntersection(pA: number[], pB: number[], pC: number[]): number[]
}

// =============================================================================
// Globals
// =============================================================================

declare const I18n: {
  currentLocale(): string
  translations: Record<string, any>
  t(key: string): any
}

// CSS module imports
declare module '*.css' {
  const content: string
  export default content
}
