import { Vector2 } from 'three'
import { colorMap } from '../config/Palettes'
import { VoxelColor } from '../tile/VoxelColor'
import { initInteractionMode } from './InteractionMode'
import { resize, renderer } from './ThreeSetup'

// ============================== G L O B A L

export let voxelColors = []

export let mouse = new Vector2()

export let tileButtons = {
  centerCameraButton: document.getElementById('centerCamera'),
  rotationButton: document.getElementById('rotate'),
  clearButton: document.getElementById('clear'),
}

export let IOButtons = {
  exportButton: document.getElementById('exportButton'),
  importButton: document.getElementById('importButton'),
}

// ==============================  L O C A L
let activeColorIndex = 1

/**
 * Entry of the interface, whereby the individual interface components are created and the mouse interaction is maintained.
 */
export function initInterface() {
  initColorBar()
  initInteractionMode()

  initRangeInput()
  initSelectionLists()

  window.addEventListener('resize', resize)
  window.addEventListener('pointermove', updateMouse)
}

/**
 * initializes ColorBar and initializes clicklisteners
 */
export function initColorBar() {
  let colorBar = document.getElementById('colorBar')

  for (let colorIndex of Object.keys(colorMap)) {
    let colorSwatchWrapper = document.createElement('div')
    colorSwatchWrapper.classList.add('colorSwatchWrapper')

    colorSwatchWrapper.addEventListener('click', function () {
      activeColorIndex = colorIndex
      updateActiveColorSwatch(colorSwatchWrapper)
    })

    //initialize with default color
    if (colorIndex == activeColorIndex) {
      updateActiveColorSwatch(colorSwatchWrapper)
    }

    let colorSwatch = document.createElement('div')
    colorSwatch.classList.add('colorSwatch')
    colorSwatch.style.background = colorMap[colorIndex]

    // TODO refactor when implementing color swatches
    voxelColors[colorIndex] = new VoxelColor('color' + colorIndex, colorMap[colorIndex], colorIndex)

    // Color Index
    let label = document.createElement('p')
    label.textContent = colorIndex
    label.style.color = isColorDark(colorMap[colorIndex]) ? 'white' : 'black'
    colorSwatch.appendChild(label)

    colorSwatchWrapper.appendChild(colorSwatch)
    colorBar.appendChild(colorSwatchWrapper)
  }

  function isColorDark(hexString) {
    hexString = hexString.substring(1) // strip #
    let rgb = parseInt(hexString, 16) // convert rrggbb to decimal
    let r = (rgb >> 16) & 0xff // extract red
    let g = (rgb >> 8) & 0xff // extract green
    let b = (rgb >> 0) & 0xff // extract blue
    let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b // per ITU-R BT.709
    return luma < 128
  }
}

export function getActiveVoxelColor() {
  return voxelColors[activeColorIndex]
}

function updateActiveColorSwatch(activeElement) {
  let colorSwatches = document.getElementsByClassName('colorSwatchWrapper')
  for (let element of colorSwatches) {
    element.classList.remove('active')
  }
  activeElement.classList.add('active')
}

function updateMouse(event) {
  mouse.x = ((event.clientX - renderer.domElement.offsetLeft) / renderer.domElement.width) * 2 - 1
  mouse.y = -((event.clientY - renderer.domElement.offsetTop) / renderer.domElement.height) * 2 + 1
}

export function getMouse() {
  return mouse
}

/**
 * Initializes the range slider and the input field of the rotation tool. The slider and the input are kept upright and the input is checked for correctness.
 */
function initRangeInput() {
  let inputRanges = document.getElementsByClassName('input-range')
  for (let inputRange of inputRanges) {
    let textInput = inputRange.querySelector('.text-input')
    let rangeInput = inputRange.querySelector('.range-input')
    inputRange.oldValue = textInput.value || 0
    rangeInput.addEventListener('input', (event) => {
      textInput.value = rangeInput.value
      inputRange.oldValue = rangeInput.value
    })
    textInput.addEventListener('input', (event) => {
      // Prevent non numeric Input
      if ((event.inputType === 'insertText' || event.inputType === 'insertFromPaste') && isNaN(event.data)) {
        textInput.value = inputRange.oldValue
      }
      // Prevent to large Input
      if (parseInt(textInput.value) > textInput.max) {
        textInput.value = inputRange.oldValue
      }
      rangeInput.value = textInput.value
      inputRange.oldValue = textInput.value
    })
  }
}

export function getRotationAngle() {
  return document.getElementById('rotation-angle').value
}

function initSelectionLists() {
  let selectionsLists = document.getElementsByClassName('selection-list')
  for (let selectionList of selectionsLists) {
    let selectionElements = selectionList.querySelectorAll('.selection-element')
    for (let i = 0; i < selectionElements.length; i++) {
      let selectionElement = selectionElements[i]
      if (i != 0) selectionElement.classList.add('deselected')
      selectionElement.addEventListener('click', () => {
        for (let element of selectionElements) element.classList.add('deselected')
        selectionElement.classList.remove('deselected')
      })
    }
  }
}
