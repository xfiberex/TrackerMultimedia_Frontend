/**
 * AmbientBackground
 *
 * Fondo ambiental en WebGL: una neblina fija. Si no hay WebGL, cae a un degradado CSS.
 *
 * **No se mueve, y es a propósito.** Tenía dos animaciones y se han ido las dos: seguía
 * al puntero con un `drift` —mover el ratón arremolinaba el humo detrás de lo que estás
 * leyendo— y además derivaba sola con el tiempo. Con ellas se van un `pointermove` global
 * que disparaba en cada píxel de movimiento y **un `requestAnimationFrame` que repintaba
 * la pantalla entera sesenta veces por segundo, para siempre**, aun con la ventana
 * quieta.
 *
 * De ahí que se pinte **una sola vez**. Eso traslada una responsabilidad: sin bucle, el
 * lienzo ya no se refresca solo, así que cada cosa que cambie lo que hay que pintar tiene
 * que pedir el repintado —el tamaño de la ventana y el tema—. Olvidarse de una no rompe
 * nada a la vista: deja el fondo del tema anterior debajo de la interfaz nueva.
 *
 * De propina, ya no hay nada que respetar en `prefers-reduced-motion`: una animación en
 * `requestAnimationFrame` no la detiene ninguna regla de CSS, así que mientras el bucle
 * existió, quien pidiera menos movimiento lo tenía igual.
 */
import { useEffect, useRef, useState } from 'react'

// ─── Shaders ────────────────────────────────────────────────────────────────

const VERT_SRC = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

const FRAG_SRC = `
  precision mediump float;

  uniform vec2  u_resolution;
  uniform float u_dark;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),                 hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p  = p * 2.1 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;

    vec2 p = uv;

    // Layered FBM for the bloom haze
    float n = fbm(p * 1.8);
    n += fbm(p * 3.2) * 0.45;
    n  = clamp(n * 0.7 + 0.1, 0.0, 1.0);

    // Palettes: light (#F8FAFC→#E2E8F0→#CBD5E1) / dark (#0F172A→#1E293B→#334155)
    vec3 lc0 = vec3(0.973, 0.980, 0.988);
    vec3 lc1 = vec3(0.886, 0.910, 0.941);
    vec3 lc2 = vec3(0.796, 0.835, 0.882);
    vec3 dc0 = vec3(0.059, 0.090, 0.165);
    vec3 dc1 = vec3(0.118, 0.161, 0.231);
    vec3 dc2 = vec3(0.200, 0.255, 0.333);
    vec3 c0 = mix(lc0, dc0, u_dark);
    vec3 c1 = mix(lc1, dc1, u_dark);
    vec3 c2 = mix(lc2, dc2, u_dark);

    vec3 color = mix(c0, c1, n);
    color = mix(color, c2, n * n * 0.5);

    // Vignette — keeps the core light in light mode, subtle in dark mode
    float v = 1.0 - dot(uv - 0.5, uv - 0.5) * 1.2;
    color = mix(c1 * 0.98, color, clamp(v, 0.0, 1.0) * 0.6 + 0.4);

    gl_FragColor = vec4(color, 1.0);
  }
`

// ─── WebGL bootstrap ────────────────────────────────────────────────────────

function makeShader(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function initGL(canvas: HTMLCanvasElement) {
  const gl = (canvas.getContext('webgl') ??
    canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
  if (!gl) return null

  const vert = makeShader(gl, gl.VERTEX_SHADER, VERT_SRC)
  const frag = makeShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC)
  if (!vert || !frag) return null

  const prog = gl.createProgram()
  if (!prog) return null
  gl.attachShader(prog, vert)
  gl.attachShader(prog, frag)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null

  const posLoc = gl.getAttribLocation(prog, 'a_position')
  const resLoc = gl.getUniformLocation(prog, 'u_resolution')
  const darkLoc = gl.getUniformLocation(prog, 'u_dark')

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)

  return { gl, prog, buf, posLoc, resLoc, darkLoc }
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const state = initGL(canvas)
    if (!state) {
      setFailed(true)
      return
    }

    const { gl, prog, buf, posLoc, resLoc, darkLoc } = state

    const pintar = () => {
      const esOscuro = document.documentElement.getAttribute('data-theme') === 'dark'
      gl.useProgram(prog)
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.enableVertexAttribArray(posLoc)
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)
      gl.uniform2f(resLoc, canvas.width, canvas.height)
      gl.uniform1f(darkLoc, esOscuro ? 1.0 : 0.0)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    // Redimensionar el lienzo lo deja en blanco, así que aquí repintar no es opcional.
    const alRedimensionar = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
      pintar()
    }
    alRedimensionar()
    window.addEventListener('resize', alRedimensionar)

    // El interruptor de tema cambia `data-theme` en el `<html>`. Con el bucle, el
    // fotograma siguiente ya traía el color nuevo; sin él, hay que repintar aquí o el
    // fondo se queda en el tema anterior debajo de una interfaz que ya cambió.
    const observador = new MutationObserver(pintar)
    observador.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    return () => {
      window.removeEventListener('resize', alRedimensionar)
      observador.disconnect()
    }
  }, [])

  if (failed) {
    return <div className="ambient-bg--fallback" aria-hidden="true" />
  }

  return <canvas ref={canvasRef} className="ambient-bg--canvas" aria-hidden="true" />
}
