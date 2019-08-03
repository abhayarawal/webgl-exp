import { mat4, quat, quat2 } from 'gl-matrix';
import { createProgramWithShaders } from './utility/common';

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

    return fetchBuffer(`cube/${raw.buffers[0].uri}`).then(buffer => {
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
            indices: parseBufferType(primitive.indices), // p.indices = scalar
            vertices: parseBufferType(primitive.attributes.POSITION), // p.attributes.POSITION = vec3
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

    return fetch(`${rel}cube/cube.gltf.json`)
    // fetch(`${rel}door/scene.gltf.json`)
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
    console.log(scene)
  });

})();