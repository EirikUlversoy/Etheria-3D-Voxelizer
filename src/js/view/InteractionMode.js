import { controls } from './ThreeSetup'

const toolButtons = {
  hammer: document.getElementById('buildToolButton'),
  rubber: document.getElementById('eraseToolButton'),
  sprayer: document.getElementById('sprayToolButton'),

  // buckets
  localBucket: document.getElementById('bucketToolButton'),
  globalBucket: document.getElementById('replaceColorToolButton'),
}

const tools = {
  hammer: 'hammer',
  rubber: 'rubber',
  sprayer: 'sprayer',
  // buckets
  localBucket: 'localBucket',
  globalBucket: 'globalBucket',
}

const keys = {
  none: 'none',
  space: 'space',
  shift: 'shift',
}

let activeTool = tools.hammer,
  pressedKey = keys.none

function isPressed(key) {
  return pressedKey === key
}

function isActive(tool) {
  return activeTool === tool
}
/**
 * Initializes all interaction modes and updates the currently selected tool.
 */
export function initInteractionMode() {
  initActiveToolListeners()
  window.addEventListener('keydown', updateInteractionMode)
  window.addEventListener('keyup', updateInteractionMode)
}

/**
 * Initializes the tools and sets the event listeners that will be used to update the active tool
 */
function initActiveToolListeners() {
  for (let tool of Object.keys(tools)) {
    toolButtons[tool].addEventListener('click', () => {
      updateActiveTool(tool)
    })
  }
  // Set Hammer as Default
  updateActiveTool(tools.hammer)
}

/**
 * maintains that only the updated tool is displayed
 * @param {Button} newTool the new selected tool
 */
function updateActiveTool(newTool) {
  for (let tool of Object.keys(tools)) {
    toolButtons[tool].classList.remove('active')
  }
  toolButtons[newTool].classList.add('active')
  activeTool = newTool
}

/**
 * updates the pressed keys and maintains the shortcuts
 * @param {Key Event} event keydown or keyup
 * @returns undefined, if invalid state matches
 */
function updateInteractionMode(event) {
  if (event.type === 'keydown') {
    if (pressedKey !== keys.none) return

    switch (event.keyCode) {
      case 16: //shift
        pressedKey = keys.shift
        controls.enabled = false
        break
      case 32: //space
        pressedKey = keys.space
        controls.enabled = false
        break
      case 49: // 1
        isPressed(keys.shift) && updateActiveTool(tools.hammer)
        break
      case 50: // 2
        isPressed(keys.shift) && updateActiveTool(tools.sprayer)
        break
      case 51: // 3
        isPressed(keys.shift) && updateActiveTool(tools.localBucket)
        break
      case 52: // 4
        isPressed(keys.shift) && updateActiveTool(tools.globalBucket)
        break
      case 53: // 5
        isPressed(keys.shift) && updateActiveTool(tools.rubber)
        break
      default:
      //window.alert(event.keyCode)
    }
  } else if (event.type === 'keyup') {
    switch (event.keyCode) {
      case 16:
      case 32:
        pressedKey = keys.none
        controls.enabled = true
        break
    }
  }
}

export const interactionMode = {
  build: 'build',
  erase: 'erase',
  spray: 'spray',
  replaceColorLocally: 'replaceColorLocally',
  replaceColorGlobally: 'replaceColorGlobally',
}

/**
 * Provides the user interaction to the exterior on the basis of the keys pressed and the tool selected.
 * @returns the interactionMode
 */
export function getInteractionMode() {
  if (isActive(tools.hammer) && isPressed(keys.space)) return interactionMode.build
  else if (isActive(tools.hammer) && isPressed(keys.shift)) return interactionMode.erase
  else if (isActive(tools.rubber) && isPressed(keys.space)) return interactionMode.erase
  else if (isActive(tools.sprayer) && isPressed(keys.space)) return interactionMode.spray
  else if (isActive(tools.localBucket) && isPressed(keys.space)) return interactionMode.replaceColorLocally
  else if (isActive(tools.globalBucket) && isPressed(keys.space)) return interactionMode.replaceColorGlobally
}
