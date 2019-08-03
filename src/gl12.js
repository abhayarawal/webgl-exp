import { mat4, quat, quat2 } from 'gl-matrix';
import { createProgramWithShaders } from './utility/common';

const vShader = `#version 300 es
precision highp float;
precision highp int;

in vec4 a_position;
in vec3 a_vertexNormal;

uniform mat4 u_normalMatrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_modelViewMatrix;

out vec3 v_normal;
out vec3 v_eyeVector;

void main () {
  // transformed vertex position (euclidean to projective space)
  vec4 vertex = u_modelViewMatrix * a_position; 

  v_normal = vec3(u_normalMatrix * vec4(a_vertexNormal, 0.0));
  v_eyeVector = -vec3(vertex.xyz);
  gl_Position = u_projectionMatrix * u_modelViewMatrix * a_position;
}
`;

const fShader = `#version 300 es
precision highp float;

uniform float u_shine;
uniform vec3 u_lightDirection;
uniform vec4 u_lightAmbient;
uniform vec4 u_lightDiffuse;
uniform vec4 u_lightSpecular;
uniform vec4 u_materialAmbient;
uniform vec4 u_materialDiffuse;
uniform vec4 u_materialSpecular;

in vec3 v_normal;
in vec3 v_eyeVector;
out vec4 color;

void main () {
  vec3 L = normalize(u_lightDirection);
  vec3 N = normalize(v_normal);
  float lambertTerm = dot(N, -L);
  vec4 Ia = u_lightAmbient * u_materialAmbient;
  vec4 Id = vec4(0.0, 0.0, 0.0, 1.0);
  vec4 Is = vec4(0.0, 0.0, 0.0, 1.0);
  
  if (lambertTerm > 0.0) {
    Id = u_lightDiffuse * u_materialDiffuse * lambertTerm;
    vec3 E = normalize(v_eyeVector);
    // vec3 R = reflect(L, N);
    vec3 halfDir = normalize(-L + E);
    // float specular = pow( max(dot(R, E), 0.), u_shine );
    float specular = pow(max(dot(halfDir, N), 0.), u_shine);
    Is = u_lightSpecular * u_materialSpecular * specular;
  }

  color = vec4(vec3(Ia + Id + Is), 1.0);
  // color = vec4(N, 1.);
  // color = vec4(1.);
}
`;

(function () {
  const MODE_POINTS 			= 0;	//Mode Constants for GLTF and WebGL are identical
  const MODE_LINES			= 1;	//https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants
  const MODE_LINE_LOOP		= 2;
  const MODE_LINE_STRIP		= 3;
  const MODE_TRIANGLES		= 4;
  const MODE_TRIANGLE_STRIP	= 5;
  const MODE_TRIANGLE_FAN	= 6;

  const TYPE_BYTE			= 5120;
  const TYPE_UNSIGNED_BYTE	= 5121;
  const TYPE_SHORT			= 5122;
  const TYPE_UNSIGNED_SHORT	= 5123;
  const TYPE_UNSIGNED_INT	= 5125;
  const TYPE_FLOAT			= 5126;

  const COMP_SCALAR			= 1;
  const COMP_VEC2			= 2;
  const COMP_VEC3			= 3;
  const COMP_VEC4			= 4;
  const COMP_MAT2			= 4;
  const COMP_MAT3			= 9;
  const COMP_MAT4			= 16;

  const TYPE = {
    'SCALAR': 1,
    'VEC2': 2,
    'VEC3': 3,
    'VEC4': 4,
    'MAT2': 4,
    'MAT3': 9,
    'MAT4': 16
  }

  let rel = `https://akute.nyc3.digitaloceanspaces.com/engine/`;

  var newRef = () => {
    return (+new Date()).toString(16) + '.' + (Math.random() * 10000000 | 0).toString(16);
  }
  
  var fetchBuffer = (uri) => {
    return  fetch(`${rel}${uri}`)
            .then(response => {
              return response.arrayBuffer()
            })
            .catch(err => {
              console.error(err);
            });
  }

  var parseGltf = (raw) => {
    let scene = { meshes: {}, assets: {} };

    let nodes = raw.nodes,
        traverseNode = (n) => {
          let node = nodes[n];
          ('mesh' in node) ? 
            scene.meshes[node.mesh] = { props: node, mesh: raw.meshes[node.mesh] }:
            ('children' in node) ? 
              node.children.forEach(traverseNode) : 
              null;
        };

    traverseNode(raw.scenes[0].nodes[0]);

    // return fetchBuffer(`cube/${raw.buffers[0].uri}`).then(buffer => {
    return fetchBuffer(`barrel/${raw.buffers[0].uri}`).then(buffer => {
      let parseBufferType = (idx) => {
        let accessor = raw.accessors[idx],
            bufferView = raw.bufferViews[accessor.bufferView],
            bufferOffset = (accessor.byteOffset || 0) + (bufferView.byteOffset || 0),
            byteLen = 0,
            arrayType = null;

        switch (accessor.componentType) {
          case TYPE_UNSIGNED_SHORT: arrayType = Uint16Array; break;
          case TYPE_UNSIGNED_INT: arrayType = Uint32Array; break;
          case TYPE_UNSIGNED_BYTE: arrayType = Uint32Array; break;
          case TYPE_FLOAT: arrayType = Float32Array; break;
          case TYPE_SHORT: arrayType = Int16Array; break;
          default:
            throw `Component type[${accessor.componentType}] not found`;
            break;
        }

        if (bufferView.byteStride != undefined) {
          byteLen = bufferView.byteStride * accessor.count;
        } else {
          byteLen = accessor.count * TYPE[accessor.type] * arrayType.BYTES_PER_ELEMENT;
        }

        let finalLen = byteLen / arrayType.BYTES_PER_ELEMENT,
            array = new arrayType(finalLen);

        return new arrayType(buffer, bufferOffset, finalLen);
      }

      Object.keys(scene.meshes).forEach(meshRef => {
        let { mesh } = scene.meshes[meshRef];
        scene.meshes[meshRef].processed = mesh.primitives.map(primitive => {
          let parsedMesh = {
            mode: MODE_TRIANGLES, 
            elements: parseBufferType(primitive.indices), // p.indices = scalar
            positions: parseBufferType(primitive.attributes.POSITION), // p.attributes.POSITION = vec3
            normals: parseBufferType(primitive.attributes.NORMAL), // p.attributes.NORMAL = vec3
            // texcoord: null, // p.attributes.TEXCOORD_0 = vec2
            // weights: null // p.attributes.WEIGHTS_0 = vec4
          };

          return parsedMesh;
        })
      })
      
      return scene;
    });
    
  };


  var loadGltf = () => {

    // return fetch(`${rel}cube/cube.gltf.json`)
    return fetch(`${rel}barrel/scene.gltf.json`)
    .then(response => {
      return response.json().then(data => {
        return parseGltf(data)
      })
    })
    .catch(err => {
      console.error(`error loading gtlf file`)
    });

  }
  
  loadGltf().then(scene => {
    console.log(scene);
    
    const canvas = document.getElementById('webgl-canvas'),
        gl = canvas.getContext('webgl2');
  
    // init program
    let program = createProgramWithShaders(gl, vShader, fShader);
    gl.useProgram(program);

    let mesh = scene.meshes[0].processed[0];


    // init vertex array
    let vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    let posizione = {
      attrs: {
        a_position: gl.getAttribLocation(program, 'a_position'),
        a_normal: gl.getAttribLocation(program, 'a_vertexNormal'),
      },
      uniforms: {
        u_projectionMatrix: gl.getUniformLocation(program, 'u_projectionMatrix'),
        u_modelViewMatrix: gl.getUniformLocation(program, 'u_modelViewMatrix'),
        u_normalMatrix: gl.getUniformLocation(program, 'u_normalMatrix'),

        u_shine: gl.getUniformLocation(program, 'u_shine'),
        u_lightDirection: gl.getUniformLocation(program, 'u_lightDirection'),
        u_lightAmbient: gl.getUniformLocation(program, 'u_lightAmbient'),
        u_lightDiffuse: gl.getUniformLocation(program, 'u_lightDiffuse'),
        u_lightSpecular: gl.getUniformLocation(program, 'u_lightSpecular'),

        u_materialAmbient: gl.getUniformLocation(program, 'u_materialAmbient'),
        u_materialDiffuse: gl.getUniformLocation(program, 'u_materialDiffuse'),
        u_materialSpecular: gl.getUniformLocation(program, 'u_materialSpecular')
      }
    }

    gl.uniform1f(posizione.uniforms.u_shine, 12);
    gl.uniform3fv(posizione.uniforms.u_lightDirection, [-.25, -.25, -.25]);
    gl.uniform4fv(posizione.uniforms.u_lightAmbient, [0.02, 0.02, 0.02, 1]);
    gl.uniform4fv(posizione.uniforms.u_lightDiffuse, [1, 1, 1, 1]);
    gl.uniform4fv(posizione.uniforms.u_lightSpecular, [1, 1, 1, 1]);
    
    gl.uniform4fv(posizione.uniforms.u_materialDiffuse, [255/256, 255/256, 255/256, 1]);
    gl.uniform4fv(posizione.uniforms.u_materialAmbient, [1, 1, 1, 1]);
    gl.uniform4fv(posizione.uniforms.u_materialSpecular, [0.7, 0.7, 0.7, 1]);



    let vertexPosBuffer = gl.createBuffer();  
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(posizione.attrs.a_position);
    gl.vertexAttribPointer(posizione.attrs.a_position, 3, gl.FLOAT, false, 0, 0);

    let indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.elements, gl.STATIC_DRAW);


    let normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(posizione.attrs.a_normal);
    gl.vertexAttribPointer(posizione.attrs.a_normal, 3, gl.FLOAT, false, 0, 0);

    var fov = 55 * Math.PI / 180, // radians
        aspect = gl.canvas.clientWidth / gl.canvas.clientHeight,
        zNear = 0.1,
        zFar = 10000.0,
        cubeRotation = 0.9;
    
    const projectionMatrix = mat4.create(),
          modelMatrix = mat4.create(),
          cameraMatrix = mat4.create(),
          modelViewMatrix = mat4.create(),
          normalMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fov, aspect, zNear, zFar);

    let draw = (deltaTime) => {
      gl.clearColor(0.9, 0.9, 0.9, 1);
      gl.clearDepth(100);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.depthFunc(gl.LEQUAL);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


      let q = quat2.create();
      quat2.rotateY(q, q, cubeRotation);
      mat4.fromRotationTranslation(modelMatrix, q, [0, 0, -7]);
      
      mat4.identity(cameraMatrix);
      let q2 = quat2.create();
      quat2.rotateX(q2, q2, 0);
      quat2.rotateY(q2, q2, 0);
      quat2.rotateZ(q2, q2, 0);
      mat4.fromRotationTranslation(cameraMatrix, q2, [0, 0, 0]);

      mat4.invert(modelViewMatrix, cameraMatrix);
      mat4.multiply(modelViewMatrix, modelViewMatrix, modelMatrix);

      mat4.invert(normalMatrix, modelViewMatrix);
      mat4.transpose(normalMatrix, normalMatrix);

      gl.uniformMatrix4fv(posizione.uniforms.u_projectionMatrix, false, projectionMatrix);
      gl.uniformMatrix4fv(posizione.uniforms.u_modelViewMatrix, false, modelViewMatrix);
      gl.uniformMatrix4fv(posizione.uniforms.u_normalMatrix, false, normalMatrix);

      gl.drawElements(gl.TRIANGLES, mesh.elements.length, gl.UNSIGNED_SHORT, 0);

      cubeRotation += deltaTime;
    }

    var then = 0;
    function render (now) {
      now *= 0.001;
      const deltaTime = now - then;
      then = now;
      draw(deltaTime);
      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);


  });

})();