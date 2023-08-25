import { Vector3 } from 'three'

export const cameraConfig = {
  fov: 70,
  near: 0.1,
  far: 500,
  pos: { x: 0, y: 150 },
}

// !important to be valid: (diameter - 1) % 4 == 0

export let gridSize = {
  y: 128,
  z: 133,
  x: 1 + (133 - 1) * 0.75,
}

export const raycasterConfig = {
  far: 250,
  near: 2,
}

export const sceneConfig = {
  color: 'grey',
}

export const voxelConfig = {
  radius: 1,
  height: 1,
  corners: 6,
}

let voxelRadius = 1
export const voxelSize = new Vector3(
  Math.sqrt(3) * voxelRadius, //x
  voxelConfig.height, //y
  2 * voxelConfig.radius //z
)

export const lightConfig = {
  ambient: {
    color: 'white',
  },
  directional: [
    {
      color: 0x666666,
      intensity: 0.6,
      pos: { x: -400, y: 400, z: -100 },
    },
    {
      color: 0x666666,
      intensity: 0.6,
      pos: { x: 400, y: 400, z: 100 },
    },
  ],
}
