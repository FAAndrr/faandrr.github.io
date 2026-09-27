import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

const geometry = new THREE.TorusGeometry( 8, 3, 16, 100 );
const material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
const donut = new THREE.Mesh( geometry, material );
scene.add( donut );

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // smoother movement
controls.dampingFactor = 0.04;

camera.position.z = 40;

function animate( time ) {
  donut.rotation.x = time / 200;
  donut.rotation.y = time / 1000;
  
  controls.update();
  renderer.render( scene, camera );
}
