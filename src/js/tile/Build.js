import { Matrix4, Vector3 } from 'three'
import { voxelSize } from '../config/GlobalConfig'
import {
  getAdjacentGridIndices,
  getDiscretePositionFromActualPosition,
  getGridIndexFromActualPosition,
  getGridIndexFromDiscretePos,
  isValidDiscretePos,
  isValidGridIndex,
} from '../utility/GridUtils'
import { getMatrixFromGridIndex } from '../utility/GridUtils'
import { BuildLayer } from './BuildLayer'

/**
 * The Build class bundles and manages multiple layers of voxels. In addition, a mapping of the gridIndex to the MeshIndex and the color is maintained. {gridIndex : {meshIndex, color}}
 */
export class Build {
  constructor(x = 0, z = 0) {
    this.mesh = new BuildLayer(x, z)
    this.gridIndexToVoxel = {}
  }

  /**
   * Checks if the given GridIndex is defined AND has been set previously. gridIndex ∈ [0, maxVoxelCount]
   * @param {number} gridIndex the gridIndex to be checked
   * @returns validity of gridIndex
   */
  isOccupied(gridIndex) {
    return gridIndex !== undefined && this.gridIndexToVoxel[gridIndex] !== undefined
  }

  // ------------------------------ Edit whole Build

  /**
   * resets all layers and the gridIndexToVoxel.
   */
  clear() {
    this.mesh.count = 0
    this.gridIndexToVoxel = {}
  }

  /**
   * Rotates all voxels by a given angle.
   * @param {number} angle to rotate in degree, default: 60°
   */

  rotateLayer(angle) {
    let radiant = ((((angle / 360) * Math.PI * 2) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    let newGridIndexToVoxel = {}
    for (let meshIndex = 0; meshIndex < this.mesh.count; meshIndex++) {
      let oldMatrix = this.mesh.getMatrixAtMeshIndex(meshIndex)
      let actualPos = new Vector3().setFromMatrixPosition(oldMatrix)
      let oldGridIndex = getGridIndexFromDiscretePos(getDiscretePositionFromActualPosition(actualPos))

      actualPos.applyMatrix4(new Matrix4().makeRotationAxis(new Vector3(0, 1, 0), radiant))
      this.mesh.setMatrixAt(meshIndex, new Matrix4().setPosition(actualPos))

      let newGridIndex = getGridIndexFromDiscretePos(getDiscretePositionFromActualPosition(actualPos))
      newGridIndexToVoxel[newGridIndex] = this.gridIndexToVoxel[oldGridIndex]
    }
    this.gridIndexToVoxel = newGridIndexToVoxel
    this.mesh.instanceMatrix.needsUpdate = true
  }

  // ------------------------------ Edit Voxels

  /**
   * Adds Voxel to Mesh and maintains gridIndexToVoxel Map
   * @param {number} gridIndex of the new voxel
   * @param {VoxelColor} color of the new voxel
   */
  addVoxel(gridIndex, color) {
    if (!isValidGridIndex(gridIndex)) return
    if (this.isOccupied(gridIndex)) this.removeVoxel(gridIndex)
    let matrix = getMatrixFromGridIndex(gridIndex)
    let meshIndex = this.mesh.addVoxel(matrix, color)
    this.gridIndexToVoxel[gridIndex] = {
      meshIndex: meshIndex,
      color: color,
    }
  }

  /**
   * checks if the given gridIndex is valid an if so, removes the corresponding voxel and updates gridIndexToVoxel Map
   * @param {number} gridIndex of the voxel which gets removed
   */
  removeVoxel(gridIndex) {
    if (!isValidGridIndex(gridIndex) || !this.isOccupied(gridIndex)) return

    // Update Map
    let swapGridIndex = getGridIndexFromActualPosition(this.mesh.getPositionAtMeshIndex(this.mesh.count - 1))
    this.gridIndexToVoxel[swapGridIndex].meshIndex = this.gridIndexToVoxel[gridIndex].meshIndex
    // Delete Voxel
    this.mesh.removeVoxel(this.gridIndexToVoxel[gridIndex].meshIndex)
    delete this.gridIndexToVoxel[gridIndex]
  }

  /**
   * check if the given gridIndex is valid and if so, change the color of the corresponding voxel.
   * @param {number} gridIndex of the voxel which gets recolored
   * @param {VoxelColor} newColor of the voxel
   */
  recolorVoxel(gridIndex, newColor) {
    if (!isValidGridIndex(gridIndex) || !this.isOccupied(gridIndex)) return
    let meshIndex = this.gridIndexToVoxel[gridIndex].meshIndex
    this.mesh.recolorVoxel(meshIndex, newColor)
    this.gridIndexToVoxel[gridIndex].color = newColor
  }

  /**
   * swaps all voxels with the old color to the new color and updates layer.
   * @param {VoxelColor} oldColor of the voxel which gets recolored
   * @param {VoxelColor} newColor which replaces the old color
   */
  replaceColor(oldColor, newColor) {
    for (let gridIndex of Object.keys(this.gridIndexToVoxel)) {
      if (this.gridIndexToVoxel[gridIndex].color.equals(oldColor)) {
        this.recolorVoxel(gridIndex, newColor)
      }
    }
  }

  // ------------------------------ Getter

  /**
   * raycastes all layers and checks if at least one voxel was hit. If so, the intersection to the closest voxel is returned.
   * @param {Raycaster} raycaster with the set distance, position and direction
   * @returns gridIndex of the clostest voxel
   */
  raycastForExistingVoxel(raycaster) {
    let intersection = this.mesh.raycastLayer(raycaster)
    if (intersection === undefined) return
    let actualPos = this.mesh.getPositionAtMeshIndex(intersection.instanceId)
    return getGridIndexFromActualPosition(actualPos)
  }

  /**
   * raycasts all layers and checks if at least one voxel has been hit. If this is the case, the gridIndex of the next free and valid position is returned.  If no such position exists, nothing is returned.
   * @param  {Raycaster} raycaster with the set distance, position and direction
   * @returns the gridIndex of the found valid position or  undefinded if no such position exists
   */
  raycastForNewVoxel(raycaster) {
    let intersection = this.mesh.raycastLayer(raycaster)
    if (intersection === undefined) return
    let actualPos = this.mesh.getPositionAtMeshIndex(intersection.instanceId)
    if (!isValidDiscretePos(getDiscretePositionFromActualPosition(actualPos))) return
    return getGridIndexFromActualPosition(new Vector3().copy(intersection.face.normal).multiply(voxelSize).add(actualPos))
  }

  /**
   * Finds all grid indices of the neighboring voxels of the given gridIndex.
   * @param {number} gridIndex of the voxel which neightbouring voxel should be found.
   * @returns List of neighboring gridIndices
   */
  getOccupiedAdjacentGridIndices(gridIndex) {
    return getAdjacentGridIndices(gridIndex).filter((index) => this.isOccupied(index))
  }

  /**
   * gets the color of the given gridIndex if it is valid.
   * @param {number} gridIndex of the voxel which color is needed.
   * @returns color of the voxel
   */
  getColor(gridIndex) {
    if (this.isOccupied(gridIndex)) {
      return this.gridIndexToVoxel[gridIndex].color
    }
  }

  /**
   * searches for a list of neighboring voxels of the same color starting from a gridIndex.
   * @param  {number} gridIndex of the voxel which starts the clustering
   * @returns list of gridIndices which voxels are of same color
   */
  getColorCluster(gridIndex) {
    let oldColor = this.getColor(gridIndex)
    let cluster = []
    let border = [gridIndex]

    while (border.length > 0) {
      let currentGridIndex = border.shift()
      cluster.push(currentGridIndex)
      let adjacentGridIndices = this.getOccupiedAdjacentGridIndices(currentGridIndex)
      for (let adjacentGridIndex of adjacentGridIndices) {
        if (oldColor.equals(this.getColor(adjacentGridIndex)) && !border.includes(adjacentGridIndex) && !cluster.includes(adjacentGridIndex)) {
          border.push(adjacentGridIndex)
        }
      }
    }
    return cluster
  }

  /**
   * @returns {Object<number, number>} Map from gridIndex to Etheria Color Index
   */
  getVoxelMap() {
    let res = {}
    for (let gridIndex of Object.keys(this.gridIndexToVoxel)) {
      res[gridIndex] = this.gridIndexToVoxel[gridIndex].color.etheriaIndex
    }
    return res
  }
}
