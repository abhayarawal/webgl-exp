;(function() {

  const canvas = <HTMLCanvasElement>document.getElementById("webgl-canvas"),
        gl : WebGLRenderingContext = canvas.getContext("webgl2");

  const vertices = [-0.5, 0.5, 0,   -0.5, -0.5, 0,   0.5, -0.5, 0,   0.5, 0.5, 0],
        indices = [0, 1, 2,   0, 2, 3];


  // create and bind vertex and index buffer data

  const vertexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

  const indexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW)


  gl.bindBuffer(gl.ARRAY_BUFFER, null)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)



  // render

  gl.clearColor(0.6, 0.9, 0.5, 1.0) // set color value for clearing buffers
  gl.clear(gl.COLOR_BUFFER_BIT) // clear buffers to preset

  gl.viewport(0, 0, canvas.width, canvas.height)

}.call(this))
