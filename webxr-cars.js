import * as THREE from 'three';
import { ARButton } from 'ARButton';
import { GLTFLoader } from 'GLTFLoader';

let scene, camera, renderer;
let reticle, controller;
let modelPlaced = false;

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

  document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

  // Reticle
  reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.1, 0.13, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x5fff5f, side: THREE.DoubleSide })
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

let hitTestSource = null;
let hitTestSourceRequested = false;

function animate() {
  renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {
  if (frame) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();

    if (!hitTestSourceRequested) {
      session.requestReferenceSpace('viewer').then((refSpace) => {
        session.requestHitTestSource({ space: refSpace }).then((source) => {
          hitTestSource = source;
        });
      });
      session.addEventListener('end', () => {
        hitTestSourceRequested = false;
        hitTestSource = null;
      });
      hitTestSourceRequested = true;
    }

    if (hitTestSource) {
      const hitTestResults = frame.getHitTestResults(hitTestSource);
      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        reticle.visible = true;
        reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
      } else {
        reticle.visible = false;
      }
    }
  }
  renderer.render(scene, camera);
}

// --- Tap на екран — розміщення двох GLB-моделей ---
function onSelect() {
  if (modelPlaced || !reticle.visible) return;
  modelPlaced = true;

  const group = new THREE.Group();
  const loader = new GLTFLoader();

  // --- 1-а машина ---
  loader.load('car/car1.glb', (gltf1) => {
    const car1 = gltf1.scene;
    car1.position.set(-0.3, 0, 0); // зліва
    car1.scale.set(0.7, 0.7, 0.7);
    group.add(car1);
  }, undefined, () => {
    alert('Не вдалося завантажити car1.glb');
  });

  // --- 2-а машина ---
  loader.load('car/car2.glb', (gltf2) => {
    const car2 = gltf2.scene;
    car2.position.set(0.3, 0, 0); // справа
    car2.scale.set(0.7, 0.7, 0.7);
    group.add(car2);
  }, undefined, () => {
    alert('Не вдалося завантажити car2.glb');
  });

  // Додаємо групу (обидві машини) у позицію reticle
  group.position.setFromMatrixPosition(reticle.matrix);
  group.quaternion.setFromRotationMatrix(reticle.matrix);
  scene.add(group);
}
