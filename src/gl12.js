(function () {

  var newRef = () => {
    return (+new Date()).toString(16) + '.' + (Math.random() * 10000000 | 0).toString(16);
  }

  var parseGltf = (raw) => {
    let scene = {
    }

    let nodes = raw.nodes,
        meshes = [],
        traverseNode = (n) => {
          let node = nodes[n];
          ('mesh' in node) ? 
            meshes.push(node) :
            ('children' in node) ? 
              node.children.forEach(traverseNode) : 
              null;
        };

    traverseNode(raw.scenes[0].nodes[0]);
    scene.meshes = meshes;

    console.log(scene);
  };


  fetch(`https://akute.nyc3.digitaloceanspaces.com/engine/cube/cube.gltf.json`)
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