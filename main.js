import './style.css'
import * as THREE from 'three'
import fragmentShader from './shaders/fragment.frag?raw'
import vertexShader from './shaders/vertex.vert?raw'
import background from './assets/picel-bg.jpeg'

const size = {
  width: window.innerWidth,
  height: window.innerHeight,
}

const mouse = {
  x: 0,
  y: 0,
  prevX: 0,
  prevY: 0,
  vx: 0,
  vy: 0,
}

const canvas = document.getElementById('webGL')

const frustrumSize = 1
const aspect = size.width / size.height

const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(
  (frustrumSize * aspect) / -2,
  (frustrumSize * aspect) / 2,
  frustrumSize / 2,
  frustrumSize / -2,
  -1000,
  1000
)
const renderer = new THREE.WebGLRenderer({ canvas })
const clock = new THREE.Clock()

camera.fov = 75
camera.aspect = size.width / size.height
camera.far = 100
camera.near = 0.1
camera.position.set(0, 0, 1)

scene.add(camera)

// create a buffer with color data

const gridSize = 128
const width = gridSize
const height = gridSize

const arraySize = width * height
const data = new Float32Array(4 * arraySize)

for (let i = 0; i < arraySize; i++) {
  const r = Math.random()
  const stride = i * 4

  data[stride] = r
  data[stride + 1] = r
  data[stride + 2] = r
  data[stride + 3] = 255
}

const texture = new THREE.DataTexture(
  data,
  width,
  height,
  THREE.RGBAFormat,
  THREE.FloatType
)
texture.needsUpdate = true

const planeGeometry = new THREE.PlaneBufferGeometry(1.5, 1, 1)
const planeMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uResolution: { value: new THREE.Vector4() },
    uTime: { value: 0 },
    uTexture: { value: new THREE.TextureLoader().load(background) },
    uDataTexture: { value: texture },
  },
})
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)

scene.add(planeMesh)

function resizeHandler() {
  size.height = window.innerHeight
  size.width = window.innerWidth

  const imageAspect = 1280 / 1920
  let side1, side2

  if (size.height / size.width > imageAspect) {
    side1 = (size.width / size.height) * imageAspect
    side2 = 1
  } else {
    side1 = 1
    side2 = size.height / size.width / imageAspect
  }

  planeMaterial.uniforms.uResolution.value.x = size.width
  planeMaterial.uniforms.uResolution.value.y = size.height
  planeMaterial.uniforms.uResolution.value.z = side1
  planeMaterial.uniforms.uResolution.value.w = side2

  camera.aspect = size.width / size.height
  camera.updateProjectionMatrix()

  renderer.setSize(size.width, size.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}
resizeHandler()

window.addEventListener('resize', resizeHandler)

function tick() {
  const elapsedTime = clock.getElapsedTime()

  planeMaterial.uniforms.uTime.value = elapsedTime

  function updateDataTexture() {
    const data = texture.image.data
    for (let i = 0; i < data.length; i += 4) {
      data[i] *= 0.98
      data[i + 1] *= 0.98
    }

    const gridMouseX = gridSize * mouse.x
    const gridMouseY = gridSize * (1 - mouse.y)
    const maxDistance = (gridSize / 18) ** 2

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const distance = (gridMouseX - i) ** 2 + (gridMouseY - j) ** 2
        const power = Math.sqrt(maxDistance / distance < 1 ? 1 : distance)

        if (distance < maxDistance) {
          const index = 4 * (i + gridSize * j)
          data[index] += power * mouse.vx * 5
          data[index + 1] -= power * mouse.vy * 5
        }
      }
    }

    mouse.vx *= 0.9
    mouse.vy *= 0.9

    texture.needsUpdate = true
  }
  updateDataTexture()

  renderer.render(scene, camera)

  window.requestAnimationFrame(tick)
}
tick()

const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches
const event = isTouch ? 'touchmove' : 'mousemove'
let timeoutId
window.addEventListener(event, e => {
  if (isTouch && e.touches?.[0]) {
    const touchEvent = e.touches[0]
    mouse.x = touchEvent.clientX / size.width
    mouse.y = touchEvent.clientY / size.height
  } else {
    mouse.x = e.clientX / size.width
    mouse.y = e.clientY / size.height
  }

  mouse.vx = mouse.x - mouse.prevX
  mouse.vy = mouse.y - mouse.prevY

  mouse.prevX = mouse.x
  mouse.prevY = mouse.y

  clearTimeout(timeoutId)
  timeoutId = setTimeout(() => {
    mouse.x = 0
    mouse.y = 0
  }, 1500)
})
