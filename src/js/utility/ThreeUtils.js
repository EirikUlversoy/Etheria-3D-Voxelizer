import { Shape, ExtrudeGeometry, TextureLoader, RepeatWrapping, MeshLambertMaterial } from 'three'
import { voxelSize } from '../config/GlobalConfig'

export const voxelAppearance = {
  material: new MeshLambertMaterial({ color: 'white', map: getVoxelTexture() }),
  geometry: getHexGeometry(voxelSize),
}

/**
 * Creates a hexagonal Shape Geometry
 * @param {Object, Vector3} size
 * @param {number} size.x
 * @param {number} size.y height
 * @param {number} size.z
 * @returns {ExtrudeGeometry}
 */
function getHexGeometry(size) {
  let hexShape = new Shape() // Hexagon
  hexShape.moveTo(0, size.z * 0.5) // back
  hexShape.lineTo(size.x * 0.5, size.z * 0.25) // back right
  hexShape.lineTo(size.x * 0.5, -size.z * 0.25) // front right
  hexShape.lineTo(0, -size.z * 0.5) // front
  hexShape.lineTo(-size.x * 0.5, -size.z * 0.25) // front left
  hexShape.lineTo(-size.x * 0.5, size.z * 0.25) // front back
  hexShape.lineTo(0, size.z * 0.5) // back
  let voxelGeometry = new ExtrudeGeometry(hexShape, {
    depth: size.y,
    bevelEnabled: false,
  })
  voxelGeometry.rotateX(-Math.PI / 2)
  return voxelGeometry
}

/**
 * @returns {Texture}
 */
function getVoxelTexture() {
  let voxelTexture = new TextureLoader().load('img/concrete_light.png')
  voxelTexture.wrapS = RepeatWrapping
  voxelTexture.wrapT = RepeatWrapping
  return voxelTexture
}