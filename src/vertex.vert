#version 300 es
precision highp float;
precision highp int;

in vec4 a_position;
in vec3 a_vertexNormal;
in vec2 a_vertexTextureCoords;

uniform mat4 u_normalMatrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_modelViewMatrix;
uniform mat4 lightSpaceMatrix;

out vec3 v_pos;
out vec2 v_textureCoords;
out vec3 v_normal;
out vec3 v_eyeVector;
out vec4 FragPosLightSpace;

void main () {
  // transformed vertex position (euclidean to projective space)
  vec4 vertex = u_modelViewMatrix * a_position; 
  v_pos = vec3(vertex);

  v_textureCoords = a_vertexTextureCoords;
  FragPosLightSpace = lightSpaceMatrix * vertex, 1.0;
  v_normal = vec3(u_normalMatrix * vec4(a_vertexNormal, 0.0));
  v_eyeVector = -vec3(vertex.xyz);
  gl_Position = u_projectionMatrix * u_modelViewMatrix * a_position;
}