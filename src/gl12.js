(function () {
  let relRoute = `https://akute.nyc3.digitaloceanspaces.com/engine/cube/`;

  var newRef = () => {
    return (+new Date()).toString(16) + '.' + (Math.random() * 10000000 | 0).toString(16);
  }

  var parseGltf = (raw) => {
    let scene = {},
        meshes = {};

    let nodes = raw.nodes,
        traverseNode = (n) => {
          let node = nodes[n];
          ('mesh' in node) ? 
            meshes[newRef()] = raw.meshes[node.mesh] :
            ('children' in node) ? 
              node.children.forEach(traverseNode) : 
              null;
        };

    traverseNode(raw.scenes[0].nodes[0]);

    Object.keys(meshes).forEach(meshRef => {
      let mesh = meshes[meshRef];
      console.log(mesh);
    })
  };


  fetch(`${relRoute}cube.gltf.json`)
  // fetch(`https://akute.nyc3.digitaloceanspaces.com/engine/door/scene.gltf.json`)
  .then(response => {
    response.json().then(data => {
      parseGltf(data);
    })
  })
  .catch(err => {
    console.error(`error loading gtlf file`)
  });

})();