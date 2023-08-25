import { camera, controls, initThreeSetup, raycaster, threeCanvas, scene } from '../view/ThreeSetup'
import { initInterface, getActiveVoxelColor, tileButtons, IOButtons, getMouse, getRotationAngle } from '../view/Interface'
import { Tile } from '../tile/Tile'
import { voxelMapToEtheriaString, stringToVoxelMap } from './IOController'
import { getInteractionMode, interactionMode } from '../view/InteractionMode'

let activeRoutine
let buildingSpeed = 10, // per second (20)
  sprayingSpeed = 10 // per second
let tile

export function startVoxelizer() {
  initThreeSetup()
  initInterface()

  tile = new Tile(0, 0)

  scene.add(tile.floor.mesh)
  scene.add(tile.build.mesh)

  IOButtonsFunctionality()
  tileButtonsFunctionality()

  threeCanvas.addEventListener('pointerdown', editBuild)
  threeCanvas.addEventListener('pointerup', () => {
    clearInterval(activeRoutine)
  })
}

function IOButtonsFunctionality() {
  IOButtons.importButton.addEventListener('click', () => {
    let inputElement = document.getElementById('modalImport-textBox')
    let modelstring = inputElement.value
    tile.voxelizeVoxelMap(stringToVoxelMap(modelstring))
  })

  IOButtons.exportButton.addEventListener('click', () => {
    let textBox = document.getElementById('modalExport-textBox')
    textBox.innerHTML = voxelMapToEtheriaString(tile.getVoxelMap())
  })
}

function tileButtonsFunctionality() {
  tileButtons.centerCameraButton.addEventListener('click', () => controls.reset())
  tileButtons.clearButton.addEventListener('click', () => {
    tile.clearBuild()
  })
  tileButtons.rotationButton.addEventListener('click', () => tile.rotateBuild(getRotationAngle()))
}

function editBuild() {
  raycaster.setFromCamera(getMouse(), camera)
  switch (getInteractionMode()) {
    case interactionMode.build:
      tile.raycastAndBuildVoxel(raycaster, getActiveVoxelColor())
      activeRoutine = setInterval(() => {
        raycaster.setFromCamera(getMouse(), camera)
        tile.raycastAndBuildVoxel(raycaster, getActiveVoxelColor())
      }, 1000 / buildingSpeed)
      break

    case interactionMode.erase:
      tile.raycastAndRemoveVoxel(raycaster, getActiveVoxelColor())
      activeRoutine = setInterval(() => {
        raycaster.setFromCamera(getMouse(), camera)
        tile.raycastAndRemoveVoxel(raycaster, getActiveVoxelColor())
      }, 1000 / buildingSpeed)
      break

    case interactionMode.spray:
      tile.raycastAndRecolorVoxel(raycaster, getActiveVoxelColor())
      activeRoutine = setInterval(() => {
        raycaster.setFromCamera(getMouse(), camera)
        tile.raycastAndRecolorVoxel(raycaster, getActiveVoxelColor())
      }, 1000 / sprayingSpeed)
      break

    case interactionMode.replaceColorLocally:
      tile.raycastAndRecolorCluster(raycaster, getActiveVoxelColor())
      break

    case interactionMode.replaceColorGlobally:
      tile.raycastAndReplaceColor(raycaster, getActiveVoxelColor())
      break
  }
}
