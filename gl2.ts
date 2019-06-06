;(function() {
  const vertices = [-0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0]

  const indices = [0, 1, 2, 0, 2, 3]

  function createShader(gl: WebGLRenderingContext, type, source) {
    var shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      return shader
    } else {
      console.error(
        `ERROR: Could not compile shader`,
        gl.getShaderInfoLog(shader)
      )
      gl.deleteShader(shader)
      return null
    }
  }

  function createProgram(
    gl: WebGLRenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
  ) {
    var program: WebGLProgram = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return program
    } else {
      console.error(gl.getProgramInfoLog(program))
      gl.deleteProgram(program)
    }
  }

  function initBuffers(gl: WebGLRenderingContext) {
    let vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

    let indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      gl.STATIC_DRAW
    )

    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)

    return { vertexBuffer, indexBuffer }
  }

  function shaderSource(id: string) {
    let script = <HTMLScriptElement>document.getElementById(id)
    return script.text.trim()
  }

  const canvas = <HTMLCanvasElement>document.getElementById("webgl-canvas"),
        gl: WebGLRenderingContext = canvas.getContext("webgl2"),
        vertexShader = createShader(
          gl,
          gl.VERTEX_SHADER,
          shaderSource("vertex-shader")
        ),
        fragmentShader = createShader(
          gl,
          gl.FRAGMENT_SHADER,
          shaderSource("fragment-shader")
        )

  gl.clearColor(0, 0, 0, 1)

  let program = createProgram(gl, vertexShader, fragmentShader),
      { vertexBuffer, indexBuffer } = initBuffers(gl),
      vertexArray = gl.createVertexArray()

  gl.bindVertexArray(vertexArray)

  gl.useProgram(program)
  let a_Position = gl.getAttribLocation(program, "a_Position")

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)

  gl.enableVertexAttribArray(a_Position)
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(a_Position)

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)

  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0)

  gl.bindVertexArray(null)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
})()
