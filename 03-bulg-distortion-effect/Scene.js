import GUI from 'lil-gui'
import { Renderer, Program, Texture, Color, Mesh, Triangle, Vec2 } from 'ogl'
import vertex from '@/js/glsl/main.vert'
import fragment from '@/js/glsl/main.frag'
import gsap from 'gsap'
// import LoaderManager from '@/js/managers/LoaderManager'

class Scene {
    #renderer
    #mesh
    #program
    #mouse = new Vec2(0, 0)
    #canMove = true
    #guiObj = {
        offset: 1,
    }
    constructor() {
        // this.setGUI()
        this.setScene()
        this.events()
    }

    setGUI() {
        const gui = new GUI()

        const handleChange = (value) => {
            this.#program.uniforms.uOffset.value = value
        }

        gui.add(this.#guiObj, 'offset', 0.5, 4).onChange(handleChange)
    }

    async setScene() {
        const canvasEl = document.querySelector('.scene')
        this.#renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 2), canvas: canvasEl })
        const gl = this.#renderer.gl
        gl.clearColor(1, 1, 1, 1)

        this.handleResize()

        // Rather than using a plane (two triangles) to cover the viewport here is a
        // triangle that includes -1 to 1 range for 'position', and 0 to 1 range for 'uv'.
        // Excess will be out of the viewport.

        //         position                uv
        //      (-1, 3)                  (0, 2)
        //         |\                      |\
        //         |__\(1, 1)              |__\(1, 1)
        //         |__|_\                  |__|_\
        //   (-1, -1)   (3, -1)        (0, 0)   (2, 0)

        const geometry = new Triangle(gl)

        const loadTexture = (url) =>
            new Promise((resolve) => {
                const image = new Image()
                const texture = new Texture(gl)

                image.onload = () => {
                    texture.image = image
                    resolve(texture)
                }

                image.src = url
            })

        const texture = await loadTexture('./img/image-2.jpg')

        this.#program = new Program(gl, {
            vertex,
            fragment,
            uniforms: {
                uTime: { value: 0 },
                uTexture: { value: texture },
                uTextureResolution: { value: new Vec2(texture.image.width, texture.image.height) },
                uResolution: { value: new Vec2(gl.canvas.offsetWidth, gl.canvas.offsetHeight) },
                uMouse: { value: new Vec2(0.5, 0.5) },
            },
        })

        this.#mesh = new Mesh(gl, { geometry, program: this.#program })
    }

    events() {
        window.addEventListener('resize', this.handleResize.bind(this), false)
        window.addEventListener('mousemove', this.handleMouseMove.bind(this), false)
        window.addEventListener('mouseenter', this.handleMouseEnter.bind(this), false)
        window.addEventListener('mouseleave', this.handleMouseLeave.bind(this), false)

        requestAnimationFrame(this.handleRAF)
    }

    handleMouseMove = (e) => {
        const x = e.clientX / window.innerWidth
        const y = 1 - e.clientY / window.innerHeight

        this.#mouse.x = x
        this.#mouse.y = y

        // update the uMouse value here or in the handleRAF
        this.#program.uniforms.uMouse.value = this.#mouse
    }

    handleMouseEnter = () => {
        if (!this.#canMove) return
        this.tlHide?.kill()
        this.tlShow?.kill()
        // this.tlLeave?.kill()
        this.tlForceIntro = new gsap.timeline()
        this.tlForceIntro.to(this.#program.uniforms.uIntro, { value: 1, duration: 5, ease: 'expo.out' })
        gsap.to(this.#program.uniforms.uBulge, { value: 1, duration: 1, ease: 'expo.out' })
    }

    handleMouseLeave = () => {
        if (!this.#canMove) return
        this.tlForceIntro?.kill()
        this.tlLeave = new gsap.timeline()
        this.tlLeave.to(this.#program.uniforms.uBulge, { value: 0, duration: 1, ease: 'expo.out' })
    }

    handleResize = () => {
        this.#renderer.setSize(window.innerWidth, window.innerHeight)

        if (this.#program) {
            this.#program.uniforms.uResolution.value = new Vec2(window.innerWidth, window.innerHeight)
        }
    }

    handleRAF = (t) => {
        requestAnimationFrame(this.handleRAF)

        if (this.#program) {
            this.#program.uniforms.uTime.value = t
            this.#renderer.render({ scene: this.#mesh })
        }
    }


}

export default Scene
