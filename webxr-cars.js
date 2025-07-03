import * as THREE from 'three';
import { ARButton } from 'ARButton';
import { GLTFLoader } from 'GLTFLoader';

let scene, camera, renderer;

init();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera();

  // Світло
  scene.add(new THREE.DirectionalLight(0xffffff, 1.1).position.set(30, 20, 0));
  scene.add(new THREE.AmbientLight(0xffffff, 0.38));

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: [] }));

  // Додаємо машини одразу при старті AR
  renderer.xr.addEventListener('sessionstart', placeCars);

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function animate() {
  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}

function placeCars() {
  // Група для двох машин
  const group = new THREE.Group();
  const loader = new GLTFLoader();

  // Позиція на 1 метр вперед від старту (Z від'ємний у камері THREE.js)
  group.position.set(0, 0, -1);

  // --- 1-а машина ---
  loader.load('car/car1.glb', (gltf1) => {
    const car1 = gltf1.scene;
    car1.position.set(-0.22, 0, 0); // зліва
    car1.scale.set(0.35, 0.35, 0.35);
    group.add(car1);
  }, undefined, () => {
    alert('Не вдалося завантажити car1.glb');
  });

  // --- 2-а машина ---
  loader.load('car/car2.glb', (gltf2) => {
    const car2 = gltf2.scene;
    car2.position.set(0.22, 0, 0); // справа
    car2.scale.set(0.35, 0.35, 0.35);
    group.add(car2);
  }, undefined, () => {
    alert('Не вдалося завантажити car2.glb');
  });

  scene.add(group);
}
