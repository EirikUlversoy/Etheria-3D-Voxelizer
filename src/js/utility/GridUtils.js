import { Vector3, Matrix4 } from 'three'
import { gridSize, voxelSize } from '../config/GlobalConfig'

//! import discretePosition is like in Three.js orientation
export const pillarCount = calcPillarCount()
export const maxVoxelCount = pillarCount * gridSize.y
const pillarIndex_center = (maxVoxelCount / gridSize.y - 1) / 2
const pillarIndex_maxInc = 33 + 1 + 3 * ((33 * (33 + 1)) / 2) // Highest Pillar Index of the widening Corner
const pillarIndex_minDec = pillarCount - pillarIndex_maxInc // Lowest Pillar Index of the narrowing Corner

/**
 * Needs the gridSize (number of voxels in x/y/z direction)
 * @returns Number of voxels in one Layer
 */
function calcPillarCount() {
  let corners = ((gridSize.z - 1) * 0.25 + 1) * (gridSize.x + 1)
  let center = ((gridSize.z + 1) * 0.5 - 2 - 1) * (gridSize.x - 0.5) + (gridSize.x - 1)
  return corners + center
}

// ------------------------------ Converter (Grid Index <-> Position)

/**
 * Valid for Etheria Tile Grids with Height 128
 * @param {Object, Vector3} discretePos
 * @param {number} discretePos.x
 * @param {number} discretePos.y
 * @param {number} discretePos.z
 * @returns {number} gridIndex
 */
export function getGridIndexFromDiscretePos(discretePos) {
  if (!isValidDiscretePos(discretePos)) return
  let pillarIndex
  if (discretePos.z <= -33) {
    // widening corner
    let zOffset = discretePos.z + 66
    let sumOfPreviousPillars = getNumberOfPillarsInclusiveNthRow(zOffset) // inclusive current row
    pillarIndex = sumOfPreviousPillars - Math.ceil(getNumberOfPillarsInNthRow(zOffset) / 2) + discretePos.x
  } else if (discretePos.z < 33) {
    // center part
    pillarIndex = pillarIndex_center + Math.ceil(99.5 * discretePos.z) + discretePos.x
  } else {
    // narrowing corner
    let zOffset = 66 - discretePos.z
    let sumOfSubsequentPillars = getNumberOfPillarsInclusiveNthRow(zOffset) // inclusive current row
    let successivePillars = sumOfSubsequentPillars - Math.floor(getNumberOfPillarsInNthRow(zOffset) / 2) - discretePos.x
    pillarIndex = maxVoxelCount / gridSize.y - successivePillars
  }
  return pillarIndex * gridSize.y + discretePos.y
}

/**
 * Valid for Etheria Tile Grids with Height 128
 * @param {number} gridIndex [0, maxVoxelCount[
 * @returns {Vector3} discretePos
 * @returns {number} discretePos.x
 * @returns {number} discretePos.y
 * @returns {number} discretePos.z
 */
export function getDiscretePositionFromGridIndex(gridIndex) {
  if (!isValidGridIndex(gridIndex)) return
  let x, z
  let y = gridIndex % gridSize.y
  let pillarIndex = (gridIndex - y) / gridSize.y
  if (pillarIndex < pillarIndex_maxInc) {
    // widening corner
    let zOffset = Math.ceil((1 / 6) * (Math.sqrt(24 * (pillarIndex + 1) + 1) - 5)) // Midnight Formula (zOffset >= 0)
    let sumOfPreviousPillars = getNumberOfPillarsInclusiveNthRow(zOffset) // inclusive current row
    x = pillarIndex - sumOfPreviousPillars + Math.ceil(getNumberOfPillarsInNthRow(zOffset) / 2)
    z = zOffset - 66
  } else if (pillarIndex < pillarIndex_minDec) {
    // center part
    let indexOffsetToCenter = pillarIndex - pillarIndex_center
    x = Math.floor(indexOffsetToCenter - Math.round(indexOffsetToCenter / 99.5) * 99.5) // Like Modulo with Decimal Numbers
    z = Math.round((indexOffsetToCenter - x) / 99.5)
  } else {
    // narrowing corner
    let zOffset = Math.ceil((1 / 6) * (Math.sqrt(24 * (pillarCount - pillarIndex) + 1) - 5)) // Midnight Formula (zOffset >= 0)
    let sumOfSubsequentPillars = getNumberOfPillarsInclusiveNthRow(zOffset) // inclusive current row
    x = sumOfSubsequentPillars - Math.floor(getNumberOfPillarsInNthRow(zOffset) / 2) - (pillarCount - pillarIndex) // pillarCount from Center of current Row to End - pillar Count to End
    z = 66 - zOffset
  }
  return new Vector3(x, y, z)
}

function getNumberOfPillarsInclusiveNthRow(n) {
  return n + 1 + 3 * n * (n + 1) * 0.5
}

export function getNumberOfPillarsInNthRow(n) {
  return 1 + n * 3
}

/**
 * Valid for Etheria Tile Grids with Height 128
 * @param {Object, Vector3} actualPos
 * @param {number} actualPos.x
 * @param {number} actualPos.y
 * @param {number} actualPos.z
 * @returns {number} gridIndex
 */
export function getGridIndexFromActualPosition(actualPos) {
  return getGridIndexFromDiscretePos(getDiscretePositionFromActualPosition(actualPos))
}

/**
 * Valid for Etheria Tile Grids with Height 128
 * @param {number} gridIndex [0, maxVoxelCount[
 * @returns {Vector3} actualPosition
 * @returns {number} actualPosition.x
 * @returns {number} actualPosition.y
 * @returns {number} actualPosition.z
 */
export function getActualPositionFromGridIndex(gridIndex) {
  return getActualPositionFromDiscretePosition(getDiscretePositionFromGridIndex(gridIndex))
}

/**
 * @param {number} gridIndex
 * @returns {Matrix4}
 */
export function getMatrixFromGridIndex(gridIndex) {
  return new Matrix4().setPosition(getActualPositionFromDiscretePosition(getDiscretePositionFromGridIndex(gridIndex)))
}

// ------------------------------ Converter (Position)

/**
 * Converts decimal position of Three.js to the discrete positions of Etheria Builder
 * @param {Vector3, Object} actualPos
 * @returns {Vector3} discretePos
 */
export function getDiscretePositionFromActualPosition(actualPos) {
  let z = Math.round(actualPos.z / (voxelSize.z * 0.75))
  let xFix = Math.abs(z) % 2 == 0 ? 0 : 0.5
  return new Vector3(Math.round(-actualPos.x / voxelSize.x - xFix), Math.round(actualPos.y / voxelSize.y - 0.5), z)
}

/**
 * Converts discrete positions of Etheria Builder to decimal position of Three.js
 * @param {Vector3, Object} discretePos
 * @returns {Vector3} actualPos
 */
export function getActualPositionFromDiscretePosition(discretePos) {
  let xFix = Math.abs(discretePos.z) % 2 == 0 ? 0 : voxelSize.x * 0.5
  return new Vector3(voxelSize.x * -discretePos.x - xFix, voxelSize.y * discretePos.y + voxelSize.y * 0.5, voxelSize.z * discretePos.z * 0.75)
}

/**
 * Prevents Accuracy Issues from Rounding by discretizing an Actual Position before converting back
 * @param {Object, Vector3} actualPos
 * @returns {Object, Vector3} actualPos
 */
export function cleanActualPosition(actualPos) {
  return getActualPositionFromDiscretePosition(getDiscretePositionFromActualPosition(actualPos))
}

/**
 * @param {Object, Vector3} discretePos
 * @returns {Matrix4}
 */
export function getMatrixFromDiscretePosition(discretePos) {
  return new Matrix4().setPosition(getActualPositionFromDiscretePosition(discretePos))
}

/**
 * @param {Matrix4} matrix
 * @returns {Object, Vector3} discretePos
 */
export function getDiscretePositionFromMatrix(matrix) {
  let discretePos = getDiscretePositionFromActualPosition(new Vector3().setFromMatrixPosition(matrix))
  return discretePos
}

// ------------------------------ Validator (Position, GridIndex)

/**
 * Checks if a gridIndex is within the valid Range of an Etheria Tile Grid of height 128
 * @param {number} gridIndex
 * @returns {boolean}
 */
export function isValidGridIndex(gridIndex) {
  return gridIndex >= 0 && gridIndex < maxVoxelCount
}

/**
 * Checks if a discrete Etheria Positino is within the valid Range of an Etheria Tile Grid of height 128
 * y: [0,128] x: [-49,49] z: [-66,66] and also corners
 * @param {Object, Vector3} gridIndex
 * @returns {boolean}
 */
export function isValidDiscretePos(discretePos) {
  if (!(0 <= discretePos.y && discretePos.y < gridSize.y && Math.abs(discretePos.z) <= 66)) return false
  if (discretePos.z >= 33) {
    // narrowing corner (inclusive first full row)
    let threshold = (getNumberOfPillarsInNthRow(66 - discretePos.z) - 1) * 0.5
    return Math.floor(-threshold) <= discretePos.x && discretePos.x <= Math.floor(threshold)
  } else if (discretePos.z > -33) {
    // center part
    let negativeThreshold = discretePos.z % 2 == 0 ? -49 : -50
    return negativeThreshold <= discretePos.x && discretePos.x <= 49
  } else {
    // widening corner (inclusive last full row)
    let threshold = (getNumberOfPillarsInNthRow(discretePos.z + 66) - 1) * 0.5
    return Math.floor(-threshold) <= discretePos.x && discretePos.x <= Math.floor(threshold)
  }
}

// ------------------------------ Getter

export function getAdjacentGridIndices(gridIndex) {
  let res = []
  if (!isValidGridIndex(gridIndex)) return res
  let discretePos = getDiscretePositionFromGridIndex(gridIndex)
  let adjacentShifts = [
    new Vector3(1, 0, 0),
    new Vector3(-1, 0, 0),
    new Vector3(0, 1, 0),
    new Vector3(0, -1, 0),
    new Vector3(0, 0, 1),
    new Vector3(0, 0, -1),
  ]
  let sign = Math.abs(discretePos.z) % 2 == 1 ? 1 : -1
  adjacentShifts.push(new Vector3(sign, 0, 1), new Vector3(sign, 0, -1))
  for (let shift of adjacentShifts) {
    let adjacentDiscretePos = new Vector3().addVectors(discretePos, shift)
    if (!isValidDiscretePos(adjacentDiscretePos)) continue
    res.push(getGridIndexFromDiscretePos(adjacentDiscretePos))
  }
  return res
}
