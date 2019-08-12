import { mat4, quat, quat2 } from 'gl-matrix';
import { createProgramWithShaders } from './utility/common';
import vShader from './vertex.vert';
import fShader from './frag.frag';
import vShaderDepth from './depthV.vert';
import fShaderDepth from './depthF.frag';
import * as dat from 'dat.gui'

let props = {
  light: {
    translation: {
      x: 2,
      y: 2,
      z: 2
    }
  }
}

const gui = new dat.GUI();
var lightBox = gui.addFolder('Point Light Translation');
lightBox.add(props.light.translation, 'x', -30, 30).step(0.1);
lightBox.add(props.light.translation, 'y', -30, 30).step(0.1);
lightBox.add(props.light.translation, 'z', -30, 30).step(0.1);


const quadV = `#version 300 es
precision highp float;

in vec3 aPos;
in vec2 aTexCoords;

out vec2 TexCoords;

void main()
{
    TexCoords = aTexCoords;
    gl_Position = vec4(aPos, 1.0);
}
`;

const quadF = `#version 300 es
precision highp float;
out vec4 color;

in vec2 TexCoords;

uniform sampler2D depthMap;
uniform float near_plane;
uniform float far_plane;

// required when using a perspective projection matrix
float LinearizeDepth(float depth)
{
    float z = depth * 2.0 - 1.0; // Back to NDC 
    return (2.0 * near_plane * far_plane) / (far_plane + near_plane - z * (far_plane - near_plane));	
}

void main()
{             
    float depthValue = texture(depthMap, TexCoords).r;
    // color = vec4(vec3(LinearizeDepth(depthValue) / far_plane), 1.0); // perspective
    color = vec4(vec3(depthValue), 1.0); // orthographic
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

  let rel = `https://akute.nyc3.digitaloceanspaces.com/engine/roamer/`;
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
        lightSpaceMatrix: gl.getUniformLocation(program, 'lightSpaceMatrix'),

        u_shine: gl.getUniformLocation(program, 'u_shine'),
        u_lightDirection: gl.getUniformLocation(program, 'u_dirLight.lightDirection'),
        u_lightAmbient: gl.getUniformLocation(program, 'u_dirLight.lightAmbient'),
        u_lightDiffuse: gl.getUniformLocation(program, 'u_dirLight.lightDiffuse'),
        u_lightSpecular: gl.getUniformLocation(program, 'u_dirLighti.lightSpecular'),

        u_materialAmbient: gl.getUniformLocation(program, 'u_materialAmbient'),
        u_materialDiffuse: gl.getUniformLocation(program, 'u_materialDiffuse'),
        u_materialSpecular: gl.getUniformLocation(program, 'u_materialSpecular'),

        u_diffuse: gl.getUniformLocation(program, 'u_diffuse'),
        u_specular: gl.getUniformLocation(program, 'u_specular'),
        shadowMap: gl.getUniformLocation(program, 'shadowMap'),

        lights: {
          u_pl_position: gl.getUniformLocation(program, 'u_pointLights[0].position'),
          u_pl_ambient: gl.getUniformLocation(program, 'u_pointLights[0].ambient'),
          u_pl_diffuse: gl.getUniformLocation(program, 'u_pointLights[0].diffuse'),
          u_pl_diffuseMultiplier: gl.getUniformLocation(program, 'u_pointLights[0].diffuseMultiplier'),
          u_pl_specular: gl.getUniformLocation(program, 'u_pointLights[0].specular'),
          u_pl_constant: gl.getUniformLocation(program, 'u_pointLights[0].constant'),
          u_pl_linear: gl.getUniformLocation(program, 'u_pointLights[0].linear'),
          u_pl_quadratic: gl.getUniformLocation(program, 'u_pointLights[0].quadratic'),
        }
      }
    } 

    // console.log(posizione);

    gl.uniform1f(posizione.uniforms.u_shine, 64);
    gl.uniform3fv(posizione.uniforms.u_lightDirection, [-.15, -.25, -.25]);
    gl.uniform4fv(posizione.uniforms.u_lightAmbient, [0.1, 0.1, 0.1, 1]);
    gl.uniform4fv(posizione.uniforms.u_lightDiffuse, [1.0, 1.0, 1.0, 1]);
    gl.uniform4fv(posizione.uniforms.u_lightSpecular, [1, 1, 1, 1]);

    gl.uniform3fv(posizione.uniforms.lights.u_pl_position, [3.0, 3.0, 3.0]);
    gl.uniform3fv(posizione.uniforms.lights.u_pl_ambient, [0.2, 0.2, 0.2]);
    gl.uniform3fv(posizione.uniforms.lights.u_pl_diffuse, [1., 1., 1.]);
    gl.uniform1f(posizione.uniforms.lights.u_pl_diffuseMultiplier, 1.2);
    gl.uniform3fv(posizione.uniforms.lights.u_pl_specular, [1.0, 1.0, 1.0]);
    gl.uniform1f(posizione.uniforms.lights.u_pl_constant, [1.0]);
    gl.uniform1f(posizione.uniforms.lights.u_pl_linear, [0.045]);
    gl.uniform1f(posizione.uniforms.lights.u_pl_quadratic, [0.0075]);

    
    gl.uniform4fv(posizione.uniforms.u_materialDiffuse, [255/256, 255/256, 255/256, 1]);
    gl.uniform4fv(posizione.uniforms.u_materialAmbient, [1, 1, 1, 1]);

    if (mesh.material.specular) {
      let specVector = mesh.material.specular.vector;
      gl.uniform4fv(
        posizione.uniforms.u_materialSpecular, 
        specVector.length === 3 ? [...specVector, 1.] : specVector
      );
    } else {
      gl.uniform4fv(posizione.uniforms.u_materialSpecular, [1., 1., 1., 1.]);
    }

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

    let depthVao = gl.createVertexArray();
    gl.bindVertexArray(depthVao);

    let depthPos = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, depthPos);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.positions.array, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, mesh.positions.normalized, 0, 0); //mesh.positions.stride, mesh.positions.offset);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices.array, gl.STATIC_DRAW);

    return { ...mesh, program, vao, depthVao, posizione, buffers, modelMatrix: mat4.create() };
  }
  
  loadGltf().then(scene => {
    // console.log(scene);
    
    const canvas = document.getElementById('webgl-canvas'),
          gl = canvas.getContext('webgl2');
  
    // init program
    let program = createProgramWithShaders(gl, vShader, fShader);
    // gl.useProgram(program);
    
    Object.keys(scene.meshes).map(k => {
      let mesh = scene.meshes[k];
      scene.meshes[k] = setupMesh(gl, mesh);
    })

    let depthProgram = createProgramWithShaders(gl, vShaderDepth, fShaderDepth);
    // gl.useProgram(depthProgram);
    let depthUniforms = {
      lightSpaceMatrix: gl.getUniformLocation(depthProgram, 'lightSpaceMatrix'),
      model: gl.getUniformLocation(depthProgram, 'model')
    }

    let depthMapFBO = gl.createFramebuffer();
    const depthMap = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, depthMap);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT16, 1024, 1024, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, depthMapFBO);
    gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthMap, 0);
    gl.drawBuffers([gl.NONE]);
    gl.readBuffer(gl.NONE);

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);

    let depthQuadProgram = createProgramWithShaders(gl, quadV, quadF);
    gl.useProgram(depthQuadProgram);
    let depthQuadUniforms = {
      aPos: gl.getAttribLocation(depthQuadProgram, 'aPos'),
      aTexCoords: gl.getAttribLocation(depthQuadProgram, 'aTexCoords'),
      depthMap: gl.getUniformLocation(depthQuadProgram, 'depthMap'),
      near_plane: gl.getUniformLocation(depthQuadProgram, 'near_plane'),
      far_plane: gl.getUniformLocation(depthQuadProgram, 'far_plane')
    }
    

    let quadPos = new Float32Array([
      -1.0,  1.0, 0.0,
      -1.0, -1.0, 0.0,
       1.0,  1.0, 0.0,
       1.0, -1.0, 0.0
    ]);

    let quadTex = new Float32Array([
      0.0, 1.0,
      0.0, 0.0,
      1.0, 1.0,
      1.0, 0.0,
    ])
    
    let quadVao = gl.createVertexArray();
    gl.bindVertexArray(quadVao);

    let vertexPosBuffer = gl.createBuffer();  
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadPos, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(depthQuadUniforms.aPos);
    gl.vertexAttribPointer(depthQuadUniforms.aPos, 3, gl.FLOAT, false, 0, 0);

    let textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadTex, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(depthQuadUniforms.aTexCoords);
    gl.vertexAttribPointer(depthQuadUniforms.aTexCoords, 2, gl.FLOAT, false, 0, 0); 

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);

    var fov = 55 * Math.PI / 180, // radians
        aspect = gl.canvas.clientWidth / gl.canvas.clientHeight,
        zNear = 0.1,
        zFar = 10000.0,
        cubeRotation = 0.9,
        nearPlane = 1.0,
        farPlane = 7.5;
    
    const projectionMatrix = mat4.create(),
          modelMatrix = mat4.create(),
          cameraMatrix = mat4.create(),
          modelViewMatrix = mat4.create(),
          normalMatrix = mat4.create(),

          // orthoMatrix = mat4.create(),
          lightProjection = mat4.create(),
          lightView = mat4.create(),
          lightSpaceMatrix = mat4.create();

    mat4.perspective(projectionMatrix, fov, aspect, zNear, zFar);
    mat4.ortho(lightProjection, -5.0, 5.0, -5.0, 5.0, nearPlane, farPlane);
    
    let draw = (deltaTime) => {
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, depthMapFBO);
      gl.clearColor(0.1, 0.1, 0.1, 1.0);
      gl.viewport(0, 0, 1024, 1024);
      gl.enable(gl.DEPTH_TEST);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.useProgram(depthProgram);

      let {x, y, z} = props.light.translation;
      mat4.lookAt(lightView, [x, y, z], [0, 0, 0], [0, 1., 0]);
      mat4.multiply(lightSpaceMatrix, lightProjection, lightView);

      Object.keys(scene.meshes).map(k => {
        let mesh = scene.meshes[k];

        let q = quat2.create();
        quat2.rotateX(q, q, -1.5);
        if (k > 0) {
          quat2.rotateX(q, q, 1.5);
          quat2.rotateY(q, q, cubeRotation*0.2);
          mat4.fromRotationTranslationScale(mesh.modelMatrix, q, [0, -1, -3], [1., 1., 1.]);
        } else {
          // quat2.rotateZ(q, q, cubeRotation*0.2);
          mat4.fromRotationTranslationScale(mesh.modelMatrix, q, [0, -1, -3], [1.5, 1.5, 1.5]);
        }

        gl.bindVertexArray(mesh.depthVao);
        gl.uniformMatrix4fv(depthUniforms.lightSpaceMatrix, false, lightSpaceMatrix);
        gl.uniformMatrix4fv(depthUniforms.model, false, mesh.modelMatrix);

        gl.drawElements(mesh.mode, mesh.indices.count, mesh.indices.ctype, 0);
      });


      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);
      gl.clearColor(0.05, 0.05, 0.05, 1);
      gl.clearDepth(100);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.depthFunc(gl.LEQUAL);
      // gl.enable(gl.GL_FRAMEBUFFER_SRGB);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


      // gl.useProgram(depthQuadProgram);
      // gl.bindVertexArray(quadVao);
      
      // gl.activeTexture(gl.TEXTURE0);
      // gl.bindTexture(gl.TEXTURE_2D, depthMap);
      // gl.uniform1f(depthQuadUniforms.near_plane, nearPlane);
      // gl.uniform1f(depthQuadUniforms.far_plane, farPlane);

      // gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);


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

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, depthMap);
        gl.uniform1i(mesh.posizione.uniforms.shadowMap, 2);
        
        // mat4.fromRotationTranslationScale(modelMatrix, q, [0, 0, -5], [.011, .011, .011]);
        
        gl.uniform3fv(mesh.posizione.uniforms.lights.u_pl_position, [x, y, z]);
        mat4.invert(modelViewMatrix, cameraMatrix);
        mat4.multiply(modelViewMatrix, modelViewMatrix, scene.meshes[k].modelMatrix);

        mat4.invert(normalMatrix, modelViewMatrix);
        mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(mesh.posizione.uniforms.lightSpaceMatrix, false, lightSpaceMatrix);
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