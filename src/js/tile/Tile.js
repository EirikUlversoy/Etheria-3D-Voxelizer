import { isValidGridIndex } from '../utility/GridUtils'
import { Floor } from './Floor'
import { Build } from './Build'

export class Tile {
  constructor(x, z) {
    this.floor = new Floor(x, z)
    this.build = new Build(x, z)
  }

  // ------------------------------ Edit whole Build

  clearBuild() {
    this.build.clear()
  }

  rotateBuild(angle) {
    this.build.rotateLayer(angle)
  }

  // ------------------------------ Reycast & Edit

  raycastAndBuildVoxel(raycaster, color) {
    let gridIndexBuild = this.build.raycastForNewVoxel(raycaster)
    if (gridIndexBuild !== undefined) {
      this.build.addVoxel(gridIndexBuild, color)
      return
    }

    let gridIndexFloor = this.floor.raycastForNewVoxel(raycaster)
    if (gridIndexFloor !== undefined && !this.build.isOccupied(gridIndexFloor)) {
      this.build.addVoxel(gridIndexFloor, color)
    }
  }

  raycastAndRemoveVoxel(raycaster) {
    let gridIndex = this.build.raycastForExistingVoxel(raycaster)
    if (gridIndex !== undefined) this.build.removeVoxel(gridIndex)
  }

  raycastAndRecolorVoxel(raycaster, newColor) {
    let gridIndex = this.build.raycastForExistingVoxel(raycaster)
    if (gridIndex !== undefined) this.build.recolorVoxel(gridIndex, newColor)
  }

  raycastAndReplaceColor(raycaster, newColor) {
    let gridIndex = this.build.raycastForExistingVoxel(raycaster)
    if (gridIndex !== undefined) {
      let oldColor = this.build.getColor(gridIndex)
      this.build.replaceColor(oldColor, newColor)
    }
  }

  raycastAndRecolorCluster(raycaster, newColor) {
    let hitGridIndex = this.build.raycastForExistingVoxel(raycaster)

    if (hitGridIndex !== undefined) {
      let cluster = this.build.getColorCluster(hitGridIndex)

      for (let gridIndex of cluster) {
        this.build.recolorVoxel(gridIndex, newColor)
      }
    }
  }

  // ------------------------------ Loader

  /**
   * @param {Object<number, VoxelColor>} voxelMap
   */
  voxelizeVoxelMap(voxelMap) {
    for (let gridIndex of Object.keys(voxelMap)) {
      if (isValidGridIndex(gridIndex)) {
        this.build.addVoxel(gridIndex, voxelMap[gridIndex])
      }
    }
  }

  // ------------------------------ Getter

  /**
   * @returns {Object<number, number>} Map from gridIndex to Etheria Color Index
   */
  getVoxelMap() {
    let res = {}
    for (let gridIndex of Object.keys(this.build.gridIndexToVoxel)) {
      res[gridIndex] = this.build.gridIndexToVoxel[gridIndex].color.etheriaIndex
    }
    return res
  }
}
