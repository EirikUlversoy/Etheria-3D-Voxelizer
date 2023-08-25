import { Color, InstancedMesh, Matrix4, Vector3 } from 'three'
import { maxVoxelCount } from '../utility/GridUtils'
import { voxelAppearance } from '../utility/ThreeUtils'

/**
 * The class represents a clustered set of voxels. This is where the basic access points are defined. 
 The base class is THREE.InstancedMesh.
 */
export class BuildLayer extends InstancedMesh {
  constructor(x, z) {
    super(voxelAppearance.geometry, voxelAppearance.material, maxVoxelCount)
    this.position.x = x
    this.position.z = z
    // Color all Voxels (to make them paintable later), white is important to activate channels
    let color = new Color('white')
    for (let i = 0; i < maxVoxelCount; i++) this.setColorAt(i, color)
    this.count = 0
  }

  // ------------------------------ Edit Voxels

  /**
   * Adds a new voxel to the layer and updates the count.
   * @param {Matrix4} matrix, which describes the position of the voxel to be changed.
   * @param {VoxelColor} color describes the color of the voxel
   * @returns the mesh index of the set voxel. Value range: [0, maxVoxelcount]
   */
  addVoxel(matrix, color) {
    let meshIndex = this.count
    this.count++
    this.setMatrixAt(meshIndex, matrix)
    this.setColorAt(meshIndex, color)
    this.instanceMatrix.needsUpdate = true
    this.instanceColor.needsUpdate = true
    return meshIndex
  }

  /**
   * Voxel at given index gets matrix+color of voxel with highest index
   * Voxel with highest index gets deleted
   * @param {Array, number} indices
   * @returns {Object<number, number>} <oldVoxelIndex, newVoxelIndex> to update in TwoWayMap
   */
  removeVoxel(meshIndex) {
    let highestIndex = this.count - 1
    this.setMatrixAt(meshIndex, this.getMatrixAtMeshIndex(highestIndex))
    this.setColorAt(meshIndex, this._getColorAtMeshIndex(highestIndex))
    this.count -= 1
    this.instanceMatrix.needsUpdate = true
    this.instanceColor.needsUpdate = true
  }

  /**
   * Recolors an existing voxel
   * @param {number} meshIndex of the voxel which color is changed
   * @param {VoxelColor} color describes the new color of the voxel
   * @returns
   */
  recolorVoxel(meshIndex, newColor) {
    this.setColorAt(meshIndex, newColor)
    this.instanceColor.needsUpdate = true
  }

  /**
   * sets the voxel with the given meshIndex to a new position
   * @param {number} meshIndex of the voxel which position is changed
   * @param {Matrix4} matrix, which describes the new translation of the voxel.
   */
  repositionVoxel(meshIndex, newMatrix) {
    this.setMatrixAt(meshIndex, newMatrix)
    this.instanceMatrix.needsUpdate = true
  }

  // ------------------------------ Getter

  /**
   * @param {number} meshIndex of the voxel which position is changed
   * @returns THREE.Color of selected voxel
   */
  _getColorAtMeshIndex(meshIndex) {
    if (meshIndex <= this.count) {
      let color = new Color()
      this.getColorAt(meshIndex, color)
      return color
    }
  }

  /**
   * @param {number} meshIndex of the voxel which position is changed
   * @returns THREE.Matrix4 of selected voxel
   */
  getMatrixAtMeshIndex(meshIndex) {
    if (meshIndex <= this.count) {
      let matrix = new Matrix4()
      this.getMatrixAt(meshIndex, matrix)
      return matrix
    }
  }

  /**
   * @param {number} meshIndex of the voxel which position is changed
   * @returns THREE.Vector3 representing the position of selected voxel
   */
  getPositionAtMeshIndex(meshIndex) {
    return new Vector3().setFromMatrixPosition(this.getMatrixAtMeshIndex(meshIndex))
  }

  /**
   * raycasts the layer and if a voxel is hit the intersection is returned. If no voxel gets hit undefinded is returned.
   * @param {Raycaster} raycaster with the set distance, position and direction
   * @returns the found intersection with the layer
   */
  raycastLayer(raycaster) {
    let intersections = raycaster.intersectObject(this, false)
    if (intersections.length > 0) return intersections[0]
  }
}
