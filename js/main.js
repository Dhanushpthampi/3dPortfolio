import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- SIZES ---
let width = window.innerWidth;
let height = window.innerHeight;

// --- ORTHOGRAPHIC CAMERA ---
const scale = 100;
const camera = new THREE.OrthographicCamera(
  -width / scale, width / scale,
   height / scale, -height / scale,
   0.1, 2000
);
camera.position.set(100, 100, 100);
camera.lookAt(0, 0, 0);

// --- SCENE ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// --- RENDERER ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// --- CONTROLS ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// --- LIGHTS ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(50, 100, 50);
dirLight.castShadow = true;
dirLight.shadow.bias = -0.001;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 400;
dirLight.shadow.camera.left = -150;
dirLight.shadow.camera.right = 150;
dirLight.shadow.camera.top = 150;
dirLight.shadow.camera.bottom = -150;
scene.add(dirLight);

// --- INTERACTABLE MESHES ---
const interactableMeshes = [];

// --- GLTF LOADER ---
const loader = new GLTFLoader();
loader.load('./assets/gamePortfolio2.glb',
  (gltf) => {
    const model = gltf.scene;

    // Center model
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const minY = box.min.y;
    model.position.sub(center);
    model.position.y -= minY;

    // Traverse model to set shadows and collect interactable meshes
    model.traverse((child) => {
  if (child.isMesh) {
    child.castShadow = true;
    child.receiveShadow = true;
    child.material.side = THREE.DoubleSide;

    // Get top-level ancestor name
    let ancestor = child;
    while (ancestor.parent && ancestor.parent !== model) {
      ancestor = ancestor.parent;
    }

    // Check if the top-level ancestor is an interactable collection
    const collectionName = ancestor.name.toLowerCase();
    if (
      collectionName === 'house' ||
      collectionName === 'office' ||
      collectionName === 'drone' ||
      collectionName.startsWith('project')
    ) {
      interactableMeshes.push(child);
    }
  }
});


    scene.add(model);
  },
  undefined,
  (err) => console.error(err)
);

// --- RAYCASTER ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let INTERSECTED = null;

function onPointerMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onClick() {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactableMeshes);
  if (intersects.length > 0) {
    const clickedMesh = intersects[0].object;
    showPopup(clickedMesh.name);
  }
}

window.addEventListener('pointermove', onPointerMove);
window.addEventListener('click', onClick);

// --- POPUP HTML ---
const popup = document.getElementById('popup');
const popupTitle = document.getElementById('popupTitle');
const popupContent = document.getElementById('popupContent');
const popupClose = document.getElementById('popupClose');

function showPopup(name) {
  popupTitle.innerText = name;
  popupContent.innerText = `Details about ${name} go here.`;
  popup.style.display = 'block';
}

popupClose.addEventListener('click', () => {
  popup.style.display = 'none';
});

// --- HANDLE RESIZE ---
window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;

  camera.left = -width / scale;
  camera.right = width / scale;
  camera.top = height / scale;
  camera.bottom = -height / scale;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
});

// --- ANIMATION LOOP ---
function animate() {
  controls.update();

  // Hover detection
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactableMeshes);
  if (intersects.length > 0) {
    if (INTERSECTED !== intersects[0].object) {
      INTERSECTED = intersects[0].object;
      document.body.style.cursor = 'pointer';
    }
  } else {
    INTERSECTED = null;
    document.body.style.cursor = 'default';
  }

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
