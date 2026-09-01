<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" 
        content="default-src 'self';
                 script-src 'self' 'unsafe-inline' 'unsafe-eval' https://esm.sh;
                 style-src 'self' 'unsafe-inline';
                 img-src 'self' data: https:;
                 connect-src 'self' https://esm.sh https://athera.sbs https://*.athera.sbs https://*athera.sbs https://raw.githubusercontent.com;
                 font-src 'self';
                 worker-src 'self';">
  <title>OBJLoader</title>
  <style>body { margin: 0; overflow: hidden; } canvas { display: block; }</style>
</head>
<body>
<script type="module">
import * as THREE from "https://esm.sh/three@0.160.1";
import { OrbitControls } from "https://esm.sh/three@0.160.1/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from "https://esm.sh/three@0.160.1/examples/jsm/loaders/OBJLoader.js";

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  
  const gridSize = 50;
  const gridDivisions = 50;
  const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x888888, 0xcccccc);
  gridHelper.position.y = -1;
  scene.add(gridHelper);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.01, 1000);
  camera.position.set(0, 1, 2);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xffffff);
  document.body.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 0.1;
  controls.maxDistance = 50;

  scene.add(new THREE.AmbientLight(0xffffff, 1.0));
  
  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight1.position.set(5, 10, 7.5);
  scene.add(directionalLight1);
  
  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight2.position.set(-5, 5, -7.5);
  scene.add(directionalLight2);

  const urlParams = new URLSearchParams(window.location.search);
  const objpath = urlParams.get('url') || '';

  if (!objpath) {
    document.body.innerHTML = '<h1 style="text-align:center;margin-top:50px;">Please provide an OBJ URL using ?url=</h1>';
  } else {
    const loader = new OBJLoader();
    const realurl = objpath
    loader.load(
      realurl,
      (object) => {
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        object.position.sub(center);

        object.rotation.y = Math.PI;

        object.position.y += 2.5;

        const size = box.getSize(new THREE.Vector3()).length();
        const scale = 3.0 / size;
        object.scale.setScalar(scale);

        camera.position.set(0, 3, size * 1.2);
        controls.target.set(0, 2.5, 0);
        controls.update();

        object.traverse(child => {
          if (child.isMesh && !child.material) {
            child.material = new THREE.MeshStandardMaterial({ 
              color: 0x777777,
              roughness: 0.4,
              metalness: 0.2,
              side: THREE.DoubleSide
            });
          }
        });

        scene.add(object);
      },
      (xhr) => console.log(`${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`),
      (error) => {
        console.error('error loading OBJ:', error);
        document.body.innerHTML = '<h1 style="text-align:center;margin-top:50px;">Error loading OBJ file</h1>';
      }
    );
  }

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
</script>
</body>
</head>