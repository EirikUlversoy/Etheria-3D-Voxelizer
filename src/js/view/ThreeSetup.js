import { PerspectiveCamera, Vector3, Scene, Color, WebGLRenderer, AxesHelper, Raycaster, AmbientLight, DirectionalLight } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { lightConfig, cameraConfig, sceneConfig } from '../config/GlobalConfig'
import { gridSize, raycasterConfig } from '../config/GlobalConfig'

export let camera, scene, axes, renderer, res, raycaster, controls, stats, threeCanvas

export function initThreeSetup() {
  camera = initCamera()

  scene = initScene()

  axes = initAxes()

  //!important first stats   --> renderer
  stats = initStats()

  renderer = initRenderer()

  controls = initControls(camera, renderer)

  raycaster = initRaycaster()

  scene.add(initAmbienteLight())

  for (let param of lightConfig.directional) {
    scene.add(initDirectionalLight(param))
  }

  render()

  document.body.appendChild(renderer.domElement)

  //
}

function initCamera() {
  let res = new PerspectiveCamera(cameraConfig.fov, window.innerWidth / window.innerHeight, cameraConfig.near, cameraConfig.far)
  res.position.set(cameraConfig.pos.x, cameraConfig.pos.y, -gridSize.z)
  res.lookAt(new Vector3(0, 0, 0))
  return res
}

function initScene() {
  let res = new Scene()
  res.background = new Color(sceneConfig.color)
  return res
}

function initRenderer() {
  let res = new WebGLRenderer({ antialias: true })
  res.setSize(window.innerWidth, window.innerHeight)
  res.domElement.setAttribute('id', 'threeCanvas')
  threeCanvas = res.domElement

  res.setAnimationLoop(animate)
  return res
}

function initAxes() {
  axes = new AxesHelper(128)
  axes.name = 'axis'
  scene.add(axes)
  return axes
}

function initStats() {
  res = Stats()
  res.dom.style.cssText = 'position: fixed;bottom:0px;right:0px;'
  document.body.appendChild(res.dom)
  return res
}

function initRaycaster() {
  let res = new Raycaster()
  res.far = raycasterConfig.far
  res.near = raycasterConfig.near
  return res
}

function initAmbienteLight() {
  return new AmbientLight(lightConfig.ambient.color)
}

function initDirectionalLight(param) {
  let lightPoint = new DirectionalLight(param.color, param.intensity)
  lightPoint.position.set(param.pos.x, param.pos.y, param.pos.z)
  return lightPoint
}

function initControls(camera, renderer) {
  return new OrbitControls(camera, renderer.domElement)
}

function animate() {
  controls.update()
  res.update()
  render()
}

function render() {
  renderer.render(scene, camera)
}

export function resize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}
