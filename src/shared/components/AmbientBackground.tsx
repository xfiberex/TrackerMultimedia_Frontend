/**
 * AmbientBackground
 *
 * WebGL ambient background with shader-based soft bloom haze.
 * Matches the Compliance Platform design spec: soft bloom, ambient drift,
 * pointer-reactive drift. Falls back to a CSS gradient when WebGL is unavailable.
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

  uniform float u_time;
  uniform vec2  u_resolution;
  uniform vec2  u_pointer;

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

    // Very subtle pointer-reactive drift
    vec2 ptr   = u_pointer / u_resolution;
    ptr.y      = 1.0 - ptr.y;
    vec2 drift = (ptr - 0.5) * 0.06;

    vec2  p = uv + drift;
    float t = u_time * 0.06;

    // Layered FBM for the bloom haze
    float n = fbm(p * 1.8 + t);
    n += fbm(p * 3.2 - t * 0.6) * 0.45;
    n  = clamp(n * 0.7 + 0.1, 0.0, 1.0);

    // Palette: #F8FAFC → #E2E8F0 → #CBD5E1
    vec3 c0 = vec3(0.973, 0.980, 0.988); // #F8FAFC
    vec3 c1 = vec3(0.886, 0.910, 0.941); // #E2E8F0
    vec3 c2 = vec3(0.796, 0.835, 0.882); // #CBD5E1

    vec3 color = mix(c0, c1, n);
    color = mix(color, c2, n * n * 0.5);

    // Bright-centre vignette — keeps the core light
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
  const gl = (
    canvas.getContext('webgl') ??
    canvas.getContext('experimental-webgl')
  ) as WebGLRenderingContext | null
  if (!gl) return null

  const vert = makeShader(gl, gl.VERTEX_SHADER,   VERT_SRC)
  const frag = makeShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC)
  if (!vert || !frag) return null

  const prog = gl.createProgram()
  if (!prog) return null
  gl.attachShader(prog, vert)
  gl.attachShader(prog, frag)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null

  const posLoc = gl.getAttribLocation(prog, 'a_position')
  const timeLoc = gl.getUniformLocation(prog, 'u_time')
  const resLoc  = gl.getUniformLocation(prog, 'u_resolution')
  const ptrLoc  = gl.getUniformLocation(prog, 'u_pointer')

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1,  1, -1,  -1, 1,  1, 1]),
    gl.STATIC_DRAW,
  )

  return { gl, prog, buf, posLoc, timeLoc, resLoc, ptrLoc }
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [failed,  setFailed]  = useState(false)
  const ptrRef  = useRef({ x: 0, y: 0 })
  const rafRef  = useRef(0)
  const t0Ref   = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const state = initGL(canvas)
    if (!state) {
      setFailed(true)
      return
    }

    const { gl, prog, buf, posLoc, timeLoc, resLoc, ptrLoc } = state

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    const onPointer = (e: PointerEvent) => {
      ptrRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('pointermove', onPointer)

    t0Ref.current = performance.now()

    const frame = (now: number) => {
      const t = (now - t0Ref.current) / 1000
      gl.useProgram(prog)
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.enableVertexAttribArray(posLoc)
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)
      gl.uniform1f(timeLoc, t)
      gl.uniform2f(resLoc,  canvas.width, canvas.height)
      gl.uniform2f(ptrLoc,  ptrRef.current.x, ptrRef.current.y)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
    }
  }, [])

  if (failed) {
    return <div className="ambient-bg--fallback" aria-hidden="true" />
  }

  return (
    <canvas
      ref={canvasRef}
      className="ambient-bg--canvas"
      aria-hidden="true"
    />
  )
}
