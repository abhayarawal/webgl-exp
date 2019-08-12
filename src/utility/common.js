function createShader (gl, shaderSource, type) {
  let shader = gl.createShader(type);
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);

  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return shader;
  } else {
    gl.deleteShader(shader);
    console.error(gl.getShaderInfoLog(shader));
    throw `ERROR: Could not compile shader ${type}`;
  }
}

function createProgram (gl, vertexShader, fragmentShader) {
  let program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  // force predefined locations
  // gl.bindAttribLocation(program, 0, 'a_position');

  gl.linkProgram(program);

  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return program;
  } else {
    gl.deleteProgram(program);
    console.error(gl.getProgramInfoLog(program));
    throw `ERROR: Could not create program`;
  }
}

function createProgramWithShaders(gl, vShaderSource, fShaderSource) {
  let vertexShader = createShader(gl, vShaderSource, gl.VERTEX_SHADER);
  // console.log('vertex shader compiled');

  let fragmentShader = createShader(gl, fShaderSource, gl.FRAGMENT_SHADER);
  // console.log('fragment shader compiled');
  
  let program = createProgram(gl, vertexShader, fragmentShader);
  
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

export { createProgram, createProgramWithShaders, createShader }