import { mat4 } from 'gl-matrix';
import PicoGL from 'picogl';

const vShader = `#version 300 es

layout(location=0) in vec4 position;

out vec3 vUV;

void main () {
  vUV = position.xy + 0.5;
  gl_Position = position;
}
`;

const fShader = `#version 300 es
precision highp float;

in vec3 vUV;
uniform sampler2D tex;
out vec4 fragColor;

void main () {
  fragColor = texture(tex, uUV);
}
`;

(function () {

  const canvas = document.getElementById('webgl-canvas'),
        gl = canvas.getContext('webgl2');
  
  let app = PicoGL.createApp(canvas);

  app.clearColor(0, 0, 0, 1);

  // program consists of vertex shader (geometry positioning), fragment shader (color pixels)

  app.clear();

})()