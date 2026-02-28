import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import * as dat from 'datGui'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// ----------------------------------------------------------
// Galaxy
// ----------------------------------------------------------
const params = {}
params.count = 100000
params.size = 0.01
params.radius = 2.5
params.branches = 8
params.spin = 1
params.randomness = 1
params.randomnessPower = 3.5
params.insideColor = '#ff6030'
params.outsideColor = '#1b3984'

class GalaxyGenerator {
    constructor (params, scene) {
        this.params = params
        this.scene = scene

        this.geometry = this.getGeometry()
        this.material = this.getMaterial()
        this.galaxy = this.getGalaxy()

        this.scene.add(this.galaxy)
    }

    getGeometry () {
        const positions = new Float32Array(this.params.count * 3)
        const colors = new Float32Array(this.params.count * 3)

        const colorInside = new THREE.Color(this.params.insideColor)
        const colorOutside = new THREE.Color(this.params.outsideColor)

        for (let i = 0; i < this.params.count; i++) {
            const i3 = i * 3

            // Position
            const radius = Math.random() * this.params.radius
            const spinAngle = radius * this.params.spin
            const branchAngle = (i % this.params.branches) / this.params.branches * Math.PI * 2

            const randomX = Math.pow(Math.random(), this.params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * this.params.randomness
            const randomY = Math.pow(Math.random(), this.params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * this.params.randomness
            const randomZ = Math.pow(Math.random(), this.params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * this.params.randomness

            positions[i3    ] = Math.cos(branchAngle + spinAngle) * radius + randomX
            positions[i3 + 1] = randomY
            positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ

            // Colors
            const mixedColor = colorInside.clone()
            mixedColor.lerp(colorOutside, radius / this.params.radius)

            colors[i3    ] = mixedColor.r
            colors[i3 + 1] = mixedColor.g
            colors[i3 + 2] = mixedColor.b
        }
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        return geometry
    }

    getMaterial () {
        const material = new THREE.PointsMaterial ()
        material.size = this.params.size
        material.sizeAttenuation = true
        material.depthWrite = false
        material.blending = THREE.AdditiveBlending
        material.vertexColors = true
        return material
    }

    getGalaxy () {
        return new THREE.Points(this.geometry, this.material)
    }

    destroy() {
        if (!this.galaxy) return

        this.scene.remove(this.galaxy)
        this.geometry.dispose()
        this.material.dispose()

        this.galaxy = null
        this.geometry = null
        this.material = null
    }
}

let proxima = new GalaxyGenerator(params, scene)

gui.add(params, 'count').min(100).max(1000000).step(100).onFinishChange(() => {
    proxima.destroy()
    proxima = new GalaxyGenerator(params, scene)
})
gui.add(params, 'size').min(0.01).max(0.1).step(0.01).onFinishChange(() => {
    proxima.destroy()
    proxima = new GalaxyGenerator(params, scene)
})
gui.add(params, 'radius').min(0.01).max(20).step(0.01).onFinishChange(() => {
    proxima.destroy()
    proxima = new GalaxyGenerator(params, scene)
})
gui.add(params, 'branches').min(2).max(20).step(1).onFinishChange(() => {
    proxima.destroy()
    proxima = new GalaxyGenerator(params, scene)
})
gui.add(params, 'spin').min(-5).max(5).step(0.001).onFinishChange(() => {
    proxima.destroy()
    proxima = new GalaxyGenerator(params, scene)
})
gui.add(params, 'randomness').min(0).max(2).step(0.001).onFinishChange(() => {
    proxima.destroy()
    proxima = new GalaxyGenerator(params, scene)
})
gui.add(params, 'randomnessPower').min(1).max(10).step(0.001).onFinishChange(() => {
    proxima.destroy()
    proxima = new GalaxyGenerator(params, scene)
})
gui.addColor(params, 'insideColor').onFinishChange(() => {
    proxima.destroy()
    proxima = new GalaxyGenerator(params, scene)
})
gui.addColor(params, 'outsideColor').onFinishChange(() => {
    proxima.destroy()
    proxima = new GalaxyGenerator(params, scene)
})

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 3
camera.position.y = 3
camera.position.z = 3
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    proxima.galaxy.rotation.y = elapsedTime * 0.1

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()