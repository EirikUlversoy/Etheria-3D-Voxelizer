import { Vector3, Matrix4, InstancedMesh, Color } from 'three'
import { gridSize, voxelSize } from '../config/GlobalConfig'
import { getDiscretePositionFromMatrix, getGridIndexFromDiscretePos, pillarCount } from '../utility/GridUtils'
import { voxelAppearance } from '../utility/ThreeUtils'

export class Floor {
  constructor(x = 0, z = 0) {
    this.mesh = new InstancedMesh(voxelAppearance.geometry, voxelAppearance.material, pillarCount)
    this.mesh.position.x = x
    this.mesh.position.z = z
    this._generateGrid()
    this.setColor(new Color('#A1A6B6'))
  }

  _generateGrid() {
    let rowLength = 1
    let pillarIndex = 0
    let longCenterRow = true
    for (let z = 0; z < gridSize.z; z++) {
      for (let x = 0; x < rowLength; x++) {
        let voxelPosition = {
          x: voxelSize.x * (rowLength / 2 + 0.5 - x) - voxelSize.x,
          y: -0.5 * voxelSize.y,
          z: voxelSize.z * 0.75 * (z - (gridSize.z - 1) / 2),
        }
        if (z % 2 == 0 && rowLength == gridSize.x) {
          voxelPosition.x -= voxelSize.x * 0.5
        }

        let translationMatrix = new Matrix4().makeTranslation(voxelPosition.x, voxelPosition.y, voxelPosition.z)
        this.mesh.setMatrixAt(pillarIndex, translationMatrix)
        this.mesh.setColorAt(pillarIndex, voxelAppearance.material.color)
        pillarIndex += 1
      }
      if (z < (gridSize.z - 1) * 0.25) {
        rowLength += 3
      } else if (z >= (gridSize.z - 1) * 0.75) {
        rowLength -= 3
      } else {
        if (longCenterRow) rowLength -= 1
        else rowLength += 1
        longCenterRow = !longCenterRow
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true
    this.mesh.instanceColor.needsUpdate = true
  }

  raycastForNewVoxel(raycaster) {
    let intersections = raycaster.intersectObject(this.mesh, false)
    if (intersections.length > 0 && intersections[0].face.normal.equals(new Vector3(0, 1, 0))) {
      let matrix = new Matrix4()
      this.mesh.getMatrixAt(intersections[0].instanceId, matrix)
      let discretePos = getDiscretePositionFromMatrix(matrix)
      discretePos.add(new Vector3(0, 1, 0))

      return getGridIndexFromDiscretePos(discretePos)
    }
  }

  setColor(newColor) {
    for (let pillarIndex = 0; pillarIndex < this.mesh.count; pillarIndex++) {
      this.mesh.setColorAt(pillarIndex, newColor)
    }
    this.mesh.instanceColor.needsUpdate = true
  }

  getColor() {
    return this.mesh.getColorAt(0, new Color())
  }
}
