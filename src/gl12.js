import { mat4, quat, quat2 } from 'gl-matrix';
import { createProgramWithShaders } from './utility/common';

import albedo from './assets/woodmetal/container2.png';
const vShader = `#version 300 es
precision highp float;
precision highp int;

in vec4 a_position;
in vec3 a_vertexNormal;
in vec2 a_vertexTextureCoords;

uniform mat4 u_normalMatrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_modelViewMatrix;

out vec2 v_textureCoords;
out vec3 v_normal;
out vec3 v_eyeVector;

void main () {
  // transformed vertex position (euclidean to projective space)
  vec4 vertex = u_modelViewMatrix * a_position; 

  v_textureCoords = a_vertexTextureCoords;

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

uniform sampler2D u_diffuse;
uniform sampler2D u_specular;

in vec3 v_normal;
in vec3 v_eyeVector;
in vec2 v_textureCoords;

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
    vec3 halfDir = normalize(-L + E);
    float specular = pow(max(dot(halfDir, N), 0.), u_shine);
    // Is = u_lightSpecular * u_materialSpecular * specular;
    Is = u_lightSpecular * u_materialSpecular * specular * texture(u_specular, v_textureCoords);
  }

  color = vec4(vec3(Ia + Id + Is), 1.0);
  color = color * texture(u_diffuse, v_textureCoords);
  // color =  texture(u_diffuse, v_textureCoords);
  // color = vec4(N, 1.);
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

  const INDICES = 0;
  const POSITIONS = 1;
  const NORMALS = 2;
  const TEXTCOORDS = 3;

  let rel = `https://akute.nyc3.digitaloceanspaces.com/engine/door/`;
  let gltfSource = `scene.gltf.json`;

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
    return fetchBuffer(`${raw.buffers[0].uri}`).then(buffer => {
      let parseBufferType = (dtype, idx) => {
        let accessor = raw.accessors[idx],
            bufferView = raw.bufferViews[accessor.bufferView],
            bufferOffset = (accessor.byteOffset || 0) + (bufferView.byteOffset || 0),
            byteLen = 0,
            itemSize = TYPE[accessor.type],
            arrayType = null;

        switch (accessor.componentType) {
          case TYPE_UNSIGNED_SHORT: arrayType = Uint16Array; break;
          case TYPE_UNSIGNED_INT: arrayType = Uint32Array; break;
          case TYPE_UNSIGNED_BYTE: arrayType = Uint8Array; break;
          case TYPE_FLOAT: arrayType = Float32Array; break;
          case TYPE_SHORT: arrayType = Int16Array; break;
          default:
            throw `Component type[${accessor.componentType}] not found`;
            break;
        }

        if (bufferView.byteStride && bufferView.byteStride !== itemSize) {
          byteLen = bufferView.byteStride * accessor.count;
        } else {
          byteLen = accessor.count * TYPE[accessor.type] * arrayType.BYTES_PER_ELEMENT;
        }

        let finalLen = byteLen / arrayType.BYTES_PER_ELEMENT,
            // array = new arrayType(buffer, bufferOffset, finalLen);
            array = new arrayType(buffer, bufferOffset, accessor.count * TYPE[accessor.type]);

        switch (dtype) {
          case INDICES:
            return { 
              array, 
              count: accessor.count, 
              ctype: accessor.componentType, 
              offset: accessor.byteOffset || 0 
            }
          case POSITIONS: 
          case NORMALS: 
          case TEXTCOORDS:
            return { 
              array, 
              size: TYPE[accessor.type], 
              stride: bufferView.byteStride || 0, 
              offset: accessor.byteOffset || 0, 
              normalized: accessor.normalized || false 
            }
        }
      }

      Object.keys(scene.meshes).forEach(meshRef => {
        let { mesh } = scene.meshes[meshRef];
        scene.meshes[meshRef].processed = mesh.primitives.map(primitive => {
          let parsedMesh = {
            mode: primitive.mode || 4, 
            indices: parseBufferType(INDICES, primitive.indices),
            positions: parseBufferType(POSITIONS, primitive.attributes.POSITION),
            normals: parseBufferType(NORMALS, primitive.attributes.NORMAL),
            texcoord: parseBufferType(TEXTCOORDS, primitive.attributes.TEXCOORD_0)
          };

          let material = raw.materials[primitive.material],
              { pbrMetallicRoughness } = material,
              transformedMat,
              diffuse,
              specular;
          if (pbrMetallicRoughness) {
            let { baseColorTexture } = pbrMetallicRoughness;
            diffuse = raw.textures[baseColorTexture.index];            
          } else {
            diffuse = raw.textures[material.extensions.KHR_materials_pbrSpecularGlossiness.diffuseTexture.index];

            if (material.extensions.KHR_materials_pbrSpecularGlossiness.specularGlossinessTexture) {
              specular = raw.textures[material.extensions.KHR_materials_pbrSpecularGlossiness.specularGlossinessTexture.index]
              specular = {...specular, vector: material.extensions.KHR_materials_pbrSpecularGlossiness.specularFactor}
            }
          }

          transformedMat = {
            diffuse: {
              source: raw.images[diffuse.source].uri,
              sampler: diffuse.sampler !== undefined ? raw.samplers[diffuse.sampler] : false
            }
          }

          if (specular) {
            transformedMat = {
              ...transformedMat,
              specular: {
                source: raw.images[specular.source].uri,
                sampler: raw.samplers[specular.sampler],
                vector: specular.vector
              }
            }
          }

          return { ...parsedMesh, material: transformedMat };
        })
      })

      return scene;
    });
    
  };


  var loadGltf = () => {

    // return fetch(`${rel}cube/cube.gltf.json`)
    return fetch(`${rel}${gltfSource}`)
    .then(response => {
      return response.json().then(data => {
        return parseGltf(data)
      })
    });
    // .catch(err => {
    //   console.error(`error loading gtlf file`)
    // });

  }


  var loadTextureBuffer = (gl, tex, prop) => {
    let image = new Image();
    image.src = `${rel}${prop.source}`;
    image.crossOrigin = `anonymous`;
    image.onload = () => {
      let { sampler } = prop;
      // gl.createSampler()
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

      if (sampler) {
        if (sampler.minFilter) {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, sampler.minFilter);
        } else {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
        }

        if (sampler.magFilter) {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, sampler.magFilter);
        } else {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, sampler.wrapS);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, sampler.wrapT);
      }
      
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  }


  var setupMesh = (gl, mesh) => {
    let program = createProgramWithShaders(gl, vShader, fShader);
    gl.useProgram(program);
    mesh = mesh.processed[0];
    let vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

    let posizione = {
      attrs: {
        a_position: gl.getAttribLocation(program, 'a_position'),
        a_normal: gl.getAttribLocation(program, 'a_vertexNormal'),
        a_vertexTextureCoords: gl.getAttribLocation(program, 'a_vertexTextureCoords'),
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
        u_materialSpecular: gl.getUniformLocation(program, 'u_materialSpecular'),

        u_diffuse: gl.getUniformLocation(program, 'u_diffuse'),
        u_specular: gl.getUniformLocation(program, 'u_specular'),
      }
    } 

    gl.uniform1f(posizione.uniforms.u_shine, 64);
    gl.uniform3fv(posizione.uniforms.u_lightDirection, [-.15, -.25, -.25]);
    gl.uniform4fv(posizione.uniforms.u_lightAmbient, [0.1, 0.1, 0.1, 1]);
    gl.uniform4fv(posizione.uniforms.u_lightDiffuse, [1.1, 1.1, 1.1, 1]);
    gl.uniform4fv(posizione.uniforms.u_lightSpecular, [1, 1, 1, 1]);
    
    gl.uniform4fv(posizione.uniforms.u_materialDiffuse, [255/256, 255/256, 255/256, 1]);
    gl.uniform4fv(posizione.uniforms.u_materialAmbient, [1, 1, 1, 1]);
    let specVector = mesh.material.specular.vector;
    gl.uniform4fv(
      posizione.uniforms.u_materialSpecular, 
      specVector.length === 3 ? [...specVector, 1.] : specVector
    );

    let vertexPosBuffer = gl.createBuffer();  
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.positions.array, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(posizione.attrs.a_position);
    gl.vertexAttribPointer(posizione.attrs.a_position, 3, gl.FLOAT, mesh.positions.normalized, 0, 0); //mesh.positions.stride, mesh.positions.offset);

    let indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices.array, gl.STATIC_DRAW);

    let textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.texcoord.array, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(posizione.attrs.a_vertexTextureCoords);
    gl.vertexAttribPointer(posizione.attrs.a_vertexTextureCoords, 2, gl.FLOAT, mesh.texcoord.normalized, 0, 0); 

    let normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.normals.array, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(posizione.attrs.a_normal);
    gl.vertexAttribPointer(posizione.attrs.a_normal, 3, gl.FLOAT, mesh.normals.normalized, 0, 0)// mesh.normals.stride, mesh.normals.offset);
    
    const texture = gl.createTexture();
    loadTextureBuffer(gl, texture, mesh.material.diffuse);
    
    var textureSpec;
    if (mesh.material.specular) {
      textureSpec = gl.createTexture();
      loadTextureBuffer(gl, textureSpec, mesh.material.specular);
    }

    let buffers = {
      vertexPosBuffer,
      indexBuffer,
      textureBuffer,
      normalBuffer,
      texture,
      textureSpec
    }

    return { ...mesh, program, vao, posizione, buffers };
  }
  
  loadGltf().then(scene => {
    // console.log(scene);
    
    const canvas = document.getElementById('webgl-canvas'),
          gl = canvas.getContext('webgl2');

    
  
    // init program
    let program = createProgramWithShaders(gl, vShader, fShader);
    gl.useProgram(program);
    
    Object.keys(scene.meshes).map(k => {
      let mesh = scene.meshes[k];
      scene.meshes[k] = setupMesh(gl, mesh);
    })

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
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


      Object.keys(scene.meshes).map(k => {
        mat4.identity(cameraMatrix);
        let q2 = quat2.create();
        quat2.rotateX(q2, q2, 0);
        quat2.rotateY(q2, q2, 0);
        quat2.rotateZ(q2, q2, 0);
        mat4.fromRotationTranslation(cameraMatrix, q2, [0, 0, 0]);

        let mesh = scene.meshes[k];
        gl.useProgram(mesh.program);

        gl.bindVertexArray(mesh.vao);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, mesh.buffers.texture);
        gl.uniform1i(mesh.posizione.uniforms.u_diffuse, 0);

        if (mesh.material.specular) {
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, mesh.buffers.textureSpec);
          gl.uniform1i(mesh.posizione.uniforms.u_specular, 1);
        }
      
        let q = quat2.create();
        // quat2.rotateX(q, q, -1.3);
        quat2.rotateX(q, q, -1.5);
        quat2.rotateZ(q, q, cubeRotation);
        // quat2.rotateY(q, q, cubeRotation);
        // mat4.fromRotationTranslationScale(modelMatrix, q, [0, 1, -10], [1,1,1]);// [0.05, 0.05, 0.05]);
        mat4.fromRotationTranslationScale(modelMatrix, q, [0, 0, -5], [.011, .011, .011]);// [0.05, 0.05, 0.05]);
        // mat4.fromRotationTranslationScale(modelMatrix, q, [0, -0.35, -1], [14, 14, 14]);// [0.05, 0.05, 0.05]);
        // mat4.fromRotationTranslationScale(modelMatrix, q, [0, 0, -5], [1, 1, 1]);// [0.05, 0.05, 0.05]);
        
        
        mat4.invert(modelViewMatrix, cameraMatrix);
        mat4.multiply(modelViewMatrix, modelViewMatrix, modelMatrix);

        mat4.invert(normalMatrix, modelViewMatrix);
        mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(mesh.posizione.uniforms.u_projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(mesh.posizione.uniforms.u_modelViewMatrix, false, modelViewMatrix);
        gl.uniformMatrix4fv(mesh.posizione.uniforms.u_normalMatrix, false, normalMatrix);

        gl.drawElements(mesh.mode, mesh.indices.count, mesh.indices.ctype, 0);
      })

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