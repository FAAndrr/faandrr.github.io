import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

class ColorGUIHelper {
  constructor(object, prop) {
    this.object = object;
    this.prop = prop;
  }
  get value() {
    return '#' + this.object[this.prop].getHexString();
  }
  set value(hexString) {
    this.object[this.prop].set(hexString);
  }
}


class DegRadHelper {

		constructor( obj, prop ) {

			this.obj = obj;
			this.prop = prop;

		}
		get value() {

			return THREE.MathUtils.radToDeg( this.obj[ this.prop ] );

		}
		set value( v ) {

			this.obj[ this.prop ] = THREE.MathUtils.degToRad( v );

		}

	}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const planeSize = 160;
 
const loader = new THREE.TextureLoader();
const texture = loader.load('resources/images/checker.png');
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.magFilter = THREE.NearestFilter;
texture.colorSpace = THREE.SRGBColorSpace;
const repeats = planeSize / 4;
texture.repeat.set(repeats, repeats);

const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
const planeMat = new THREE.MeshPhongMaterial({map: texture, side: THREE.DoubleSide});
const mesh = new THREE.Mesh(planeGeo, planeMat);
mesh.rotation.x = Math.PI * -.5;
scene.add(mesh);
mesh.position.set(0, -10, 0);


const color = 0xFFFFFF;
const intensity = 150;
const light = new THREE.SpotLight(color, intensity);
light.position.set( 0, 30, 0 );
light.target.position.set( - 5, 0, 0 );
scene.add(light);
scene.add(light.target);


const gui = new GUI();
gui.addColor( new ColorGUIHelper( light, 'color' ), 'value' ).name( 'color' );
gui.add( light, 'intensity', 0, 400, 1 );
gui.add( light, 'distance', 0, 200 ).onChange( updateLight );
gui.add( new DegRadHelper( light, 'angle' ), 'value', 0, 90 ).name( 'angle' ).onChange( updateLight );
gui.add( light, 'penumbra', 0, 1, 0.01 );

makeXYZGUI( gui, light.position, 'position', updateLight );
makeXYZGUI( gui, light.target.position, 'target', updateLight );

const helper = new THREE.SpotLightHelper(light);
scene.add(helper);


const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

const geometry = new THREE.TorusGeometry( 8, 3, 16, 100 );
const material = new THREE.MeshPhongMaterial( { color: 0xffffff } );
const donut = new THREE.Mesh( geometry, material );
donut.position.set(1, 10, 0);
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

function resizeRendererToDisplaySize( renderer ) {

		const canvas = renderer.domElement;
		const width = canvas.clientWidth;
		const height = canvas.clientHeight;
		const needResize = canvas.width !== width || canvas.height !== height;
		if ( needResize ) {

			renderer.setSize( width, height, false );

		}

		return needResize;

}

function render() {

	if ( resizeRendererToDisplaySize( renderer ) ) {

		const canvas = renderer.domElement;
		camera.aspect = canvas.clientWidth / canvas.clientHeight;
		camera.updateProjectionMatrix();

	}

	renderer.render( scene, camera );

	requestAnimationFrame( render );
}

requestAnimationFrame( render );


function makeXYZGUI(gui, vector3, name, onChangeFn) {
  const folder = gui.addFolder(name);
  folder.add(vector3, 'x', -30, 30).onChange(onChangeFn);
  folder.add(vector3, 'y', -30, 30).onChange(onChangeFn);
  folder.add(vector3, 'z', -30, 30).onChange(onChangeFn);
  folder.open();
}

function updateLight() {
  light.target.updateMatrixWorld();
  helper.update();
}
updateLight();
