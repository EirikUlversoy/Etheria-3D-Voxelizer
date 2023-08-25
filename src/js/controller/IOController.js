import { getDiscretePositionFromGridIndex, isValidGridIndex, maxVoxelCount } from '../utility/GridUtils'
import { voxelColors } from '../view/Interface'

/**
 * generates a three-dimensional model with the respective color values from the input string
 * @param {String} modelstring describing a valid model.
 */
export function stringToVoxelMap(modelString) {
  let buildArray = {}
  for (let gridIndex = 0; gridIndex < maxVoxelCount; gridIndex++) {
    let discretePos = getDiscretePositionFromGridIndex(gridIndex)
    // notice: Etheria's y is Voxelizer's z and vice versa
    let x = discretePos.x,
      y = discretePos.z,
      z = discretePos.y,
      i = gridIndex
    eval(modelString)
  }

  let voxelMap = {} // voxelMap maps cleaned gridIndices to VoxelColor
  for (let gridIndex of Object.keys(buildArray)) {
    if (buildArray[gridIndex] === 0) continue
    let voxelColor = voxelColors[buildArray[gridIndex]]
    if (isValidGridIndex(gridIndex) && voxelColor !== undefined) {
      voxelMap[gridIndex] = voxelColor
    }
  }
  return voxelMap
}

/**
 * Sorts voxelMap into Position Buckets (Tree Structure)
 * @param {Object} voxelMap maps gridIndices to Etheria Color Indices
 * @returns {Object<number, Object<number, Object<number, number>>>} <z, <x, <y, colorIndex>>>
 */
function sortVoxelMapInBuckets(voxelMap) {
  let positionBuckets = {}
  for (let gridIndex of Object.keys(voxelMap)) {
    let discretePos = getDiscretePositionFromGridIndex(gridIndex)
    positionBuckets[discretePos.z] || (positionBuckets[discretePos.z] = {})
    positionBuckets[discretePos.z][discretePos.x] || (positionBuckets[discretePos.z][discretePos.x] = {})
    positionBuckets[discretePos.z][discretePos.x][discretePos.y] = voxelMap[gridIndex]
  }
  return positionBuckets
}

function positionBucketsToRangeBuckets(positionBuckets) {
  let rangeBuckets = {}
  for (let z of Object.keys(positionBuckets)) {
    rangeBuckets[z] = {}
    for (let x of Object.keys(positionBuckets[z])) {
      rangeBuckets[z][x] = {}
      for (let y of Object.keys(positionBuckets[z][x])) {
        let colorIndex = positionBuckets[z][x][y]
        if (rangeBuckets[z][x][y - 1] !== undefined && colorIndex == positionBuckets[z][x][y - 1]) {
          rangeBuckets[z][x][y] = rangeBuckets[z][x][y - 1]
          delete rangeBuckets[z][x][y - 1]
        } else {
          rangeBuckets[z][x][y] = { yFrom: y, colorIndex: colorIndex } // a new range starts (new color || not connected)
        }
      }
    }
  }
  return rangeBuckets
}

export function voxelMapToEtheriaString(voxelMap) {
  if (Object.keys(voxelMap).length === 0) return 'Nothing built yet ...'
  let rangeBuckets = positionBucketsToRangeBuckets(sortVoxelMapInBuckets(voxelMap))
  let usedColorIndices = new Set()
  let res = ''

  let firstZRange = true
  for (let z of Object.keys(rangeBuckets)) {
    if (firstZRange) firstZRange = false
    else res += 'else '
    res += `if (y === ${z}){\n`
    let firstXRange = true
    for (let x of Object.keys(rangeBuckets[z])) {
      if (firstXRange) firstXRange = false
      else res += 'else '
      res += `if (x === ${x}){\n`

      let firstYRange = true
      for (let yTo of Object.keys(rangeBuckets[z][x])) {
        if (firstYRange) firstYRange = false
        else res += 'else '

        let yFrom = rangeBuckets[z][x][yTo].yFrom
        let colorIndex = rangeBuckets[z][x][yTo].colorIndex
        usedColorIndices.add(colorIndex)
        if (yFrom == yTo) {
          res += `if(z === ${yTo}){ buildArray[i] = color${colorIndex};} \n`
        } else {
          res += `if(z >= ${yFrom} && z <= ${yTo}){ buildArray[i] = color${colorIndex};} \n`
        }
      }
      res += '}\n'
    }
    res += '}\n'
  }
  // Add Color Variables
  for (let colorIndex of usedColorIndices) {
    res = `let color${colorIndex} = ${colorIndex};\n` + res
  }
  return res
}
