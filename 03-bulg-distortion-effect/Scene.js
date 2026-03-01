import GUI from 'lil-gui'
import { Renderer, Program, Texture, Color, Mesh, Triangle, Vec2 } from 'ogl'
/*import vertex from './shaders/main.vert'
import fragment from './shaders/main.frag'*/
import gsap from 'gsap'

const vertex = `
    attribute vec2 uv;
    attribute vec2 position;
    
    uniform vec2 uResolution;
    uniform vec2 uTextureResolution;
    
    varying vec2 vUv;
    
    vec2 resizeUvCover(vec2 uv, vec2 size, vec2 resolution) {
        vec2 ratio = vec2(
            min((resolution.x / resolution.y) / (size.x / size.y), 1.0),
            min((resolution.y / resolution.x) / (size.y / size.x), 1.0)
        );
    
        return vec2(
            uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            uv.y * ratio.y + (1.0 - ratio.y) * 0.5
        );
    }
    
    void main() {
      vUv = resizeUvCover(uv, uTextureResolution, uResolution);
      gl_Position = vec4(position, 0, 1);
    }
`

const fragment = `
    precision highp float;

    uniform vec2 uMouse;
    uniform sampler2D uTexture;
    varying vec2 vUv;
    
    const float radius = 0.7;
    const float strength = 1.2;
    
    vec2 bulge(vec2 uv, vec2 center) {
      uv -= center;
    
      float dist = length(uv) / radius; // distance from UVs
      float distPow = pow(dist, 2.); // exponential
      float strengthAmount = strength / (1.0 + distPow); // Invert bulge and add a minimum of 1)
      uv *= strengthAmount;
    
      uv += center;
    
      return uv;
    }
    
    void main() {
      vec2 center = vec2(0.5, 0.5);
      vec2 bulgeUV = bulge(vUv, uMouse);
      vec4 tex = texture2D(uTexture, bulgeUV);
      gl_FragColor.rgb = tex.rgb;
      gl_FragColor.a = 1.0;
    }
`

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
        const canvasEl = document.querySelector('.canvas')
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
