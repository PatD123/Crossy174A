import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as utils from './utils.js';

// Clock for animation timing
let clock = new THREE.Clock();

// Our scene
const scene = new THREE.Scene();

// const camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, 
//                                              window.innerHeight / 2, window.innerHeight / - 2, 1, 1000 );
const camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 0.1, 1000 );

camera.position.set(25, 75, 75);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enabled = true;
controls.minDistance = 10;
controls.maxDistance = 1000;

function createAxisLine(color, start, end) {
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineBasicMaterial({ color: color });
    return new THREE.Line(geometry, material);
}

// Create axis lines
const xAxis = createAxisLine(0xff0000, new THREE.Vector3(0, 0, 0), new THREE.Vector3(5, 0, 0)); // Red
const yAxis = createAxisLine(0x00ff00, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 5, 0)); // Green
const zAxis = createAxisLine(0x0000ff, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 5)); // Blue

// Add axes to scene
scene.add(xAxis);
scene.add(yAxis);
scene.add(zAxis);

// Handle keyboard input
let move_dir_ = new THREE.Matrix4();
document.addEventListener('keydown', onKeyDown, false);
function onKeyDown(event) {
    switch (event.keyCode) {
        case 37:
            // Left
            move_dir_.copy(utils.translationMatrix(-4, 0, 0))
            break;
        case 38:
            // Forward
            move_dir_.copy(utils.translationMatrix(0, 0, -6))
            break;
        case 39:
            // Right
            move_dir_.copy(utils.translationMatrix(4, 0, 0))
            break;
        case 40:
            // Right
            move_dir_.copy(utils.translationMatrix(0, 0, 6))
            break;
    }
}

// Adding Ambient Light
let ambientLight = new THREE.AmbientLight( 0xffffff, 0.5);
ambientLight.power = 10**4
scene.add(ambientLight)

// Adding Directional Light
let directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
directionalLight.position.set(0, 2, 0)
scene.add(directionalLight)

// Provisional Data
let lanes = []

let cars = []

// Adding lanes
let curr_lane_ = 0;
addLanes();

// Adding character
let player_geometry = new THREE.BoxGeometry(2, 2, 2);
let player_material = new THREE.MeshPhongMaterial({color: 0xFF0000,
                                                    flatShading: true})
let player = new THREE.Mesh(player_geometry, player_material);
player.matrix.copy(utils.translationMatrix(0, 2, 0))
player.matrixAutoUpdate = false;
scene.add(player)

// Adding a car
randomIntervalPlacement();

animate();

function animate() {
    requestAnimationFrame(animate);

    let time = clock.getElapsedTime();
    let T = time % 20.0;

    // Moving our player and camera to follow
    let position = new THREE.Vector3();
    move_dir_.decompose(position, new THREE.Quaternion(), new THREE.Vector3());
    if(position.length() != 0){

        // Move player
        player.matrix.premultiply(move_dir_)
        camera.matrix.premultiply(move_dir_)
        camera.matrixAutoUpdate = false;
        camera.lookAt(player.position);
        camera.matrix.decompose(camera.position, camera.quaternion, camera.scale);

        // Update current lane
        if(position.z < 0) curr_lane_++;
        else if(position.z > 0) curr_lane_--;

        // Clear move direction
        move_dir_.identity();
    }

    // Moving our cars
    cars.forEach(([t, c], idx) => {
        var d_x = 0.05 * (time - t);
        var d_x_M = utils.translationMatrix(d_x, 0, 0);
        c.matrix.premultiply(d_x_M);
    })
    

    if(curr_lane_ === lanes.length - 4) addLanes();

    
    

    // CleanUp
    cleanUp()

    renderer.render(scene, camera);
}

function cleanUp(){
    // If cars go out of bounds, we cull them out
    for(var i = cars.length - 1; i>=0; i--){
        var [t, c] = cars[i];
        let car_position = new THREE.Vector3();
        c.matrix.decompose(car_position, new THREE.Quaternion(), new THREE.Vector3());
        if(car_position.x >= 25){
            c.material.dispose()
            c.geometry.dispose()
            scene.remove(c);
            c = null
        }
    }

    // Clean up out of scene lanes
}

function addLanes(){
    var start = lanes.length;
    var end = start + 10;
    for(var i = start; i<end; i++){
        var lane = utils.Lane(i)
        scene.add(lane);
        lanes.push(lane)
    }
}

function randomIntervalPlacement() {
    addCars();
    const nextInterval = Math.random() * 500 + 200; // Next interval between 2 and 5 seconds
    setTimeout(randomIntervalPlacement, nextInterval); // Schedule the next call
}

function addCars(){
    var toStartOfLane = utils.translationMatrix(-22.5, 0, 0);

    var lane = utils.getRandomNearLane(curr_lane_, lanes.length);
    var car = utils.Car();
    car.matrix.multiply(lanes[lane].matrix);
    car.matrix.premultiply(toStartOfLane);
    scene.add(car);

    cars.push([clock.getElapsedTime(), car])

    for(var i = 0; i<2; i++){
        var lane = utils.getRandomFarLane(curr_lane_, lanes.length);
        var car = utils.Car();
        car.matrix.multiply(lanes[lane].matrix);
        car.matrix.premultiply(toStartOfLane);
        scene.add(car);

        cars.push([clock.getElapsedTime(), car])
    }
}
