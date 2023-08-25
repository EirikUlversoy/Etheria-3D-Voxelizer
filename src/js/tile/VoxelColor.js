import { Color } from 'three'

const EPSILON = 0.0001

export class VoxelColor extends Color {
  constructor(name, color, etheriaIndex) {
    super(color)
    this.name = name
    this.etheriaIndex = etheriaIndex
  }

  equals(color) {
    return Math.abs(this.r - color.r) < EPSILON && Math.abs(this.g - color.g) < EPSILON && Math.abs(this.b - color.b) < EPSILON
  }

  equalsName(color) {
    return this.name === color.name
  }
}
