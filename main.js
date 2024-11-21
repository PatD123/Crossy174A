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
player.position.set(0, 2, 0);
scene.add(player)

// Adding a car
randomIntervalPlacement();

// Handle keyboard input
let move_dir_ = new THREE.Matrix4();
let isMoving = false; 
let targetPosition = new THREE.Vector3(0, 2, 0); 
let cam_targetPosition = new THREE.Vector3(25, 75, 75);
let time_of_jump = 0.0;
document.addEventListener('keydown', onKeyDown, false);
function onKeyDown(event) {
    if (isMoving) return;

    time_of_jump = clock.getElapsedTime();
    
    switch (event.keyCode) {
        case 37: // Left
            move_dir_.copy(utils.translationMatrix(-4, 0, 0))
            break;
        case 38: // Forward
            move_dir_.copy(utils.translationMatrix(0, 0, -6))
            break;
        case 39: // Right
            move_dir_.copy(utils.translationMatrix(4, 0, 0))
            break;
        case 40: // Backward
            move_dir_.copy(utils.translationMatrix(0, 0, 6))
            break;
        default:
            return;
    }
    
    isMoving = true;    
}

animate();

function animate() {
    requestAnimationFrame(animate);

    // Get modded time.
    let time = clock.getElapsedTime();
    let T = (time - time_of_jump) % 0.25;

    // Get translation Vec3 of move_dir_
    let moveDir = new THREE.Vector3();
    move_dir_.decompose(moveDir, new THREE.Quaternion(), new THREE.Vector3());

    // Up hop and down hop
    var up = new THREE.Vector3();
    up.copy(moveDir);
    up.divideScalar(2);
    up.y = 2.0;
    var down = new THREE.Vector3();
    down.copy(moveDir);


    var new_targetPosition = new THREE.Vector3();
    var new_cam_targetPosition = new THREE.Vector3();

    if (isMoving) {
        // If time is first part, we jump up.
        if(T < 0.125){
            new_targetPosition.addVectors(targetPosition, up);
            new_cam_targetPosition.addVectors(cam_targetPosition, up);
            player.position.lerp(new_targetPosition, 0.6); // Allows player to smoothly get to target location
        }
        // If time is second part, we jump down.
        else{
            new_targetPosition.addVectors(targetPosition, down);
            new_cam_targetPosition.addVectors(cam_targetPosition, down);
            player.position.lerp(new_targetPosition, 0.6); // Allows player to smoothly get to target location
        }        
        
        // If the distance to the target location is made ...
        if (T > 0.125 && player.position.distanceTo(new_targetPosition) < 0.01) {
            targetPosition.copy(new_targetPosition);
            cam_targetPosition.copy(new_cam_targetPosition);
            isMoving = false; // Allow new movement input

            // Update current lane
            if(moveDir.z < 0) curr_lane_++;
            else if(moveDir.z > 0) curr_lane_--;

            move_dir_.identity();
        }

        // Have camera follow TRY and follow smoothly
        var h = new THREE.Vector3();
        // Smoothly interpolate the camera's position towards the target position
        camera.position.lerp(
            h.addVectors(player.position, new THREE.Vector3(25, 75, 75)), // Offset for better viewing
            0.05
        );
        camera.lookAt(player.position);

    }

    // Moving our cars
    cars.forEach(([t, c], idx) => {
        var d_x = 0.05 * (time - t);
        var d_x_M = utils.translationMatrix(d_x, 0, 0);
        c.matrix.premultiply(d_x_M);
    })
    

    if(curr_lane_ === lanes.length - 5) addLanes();

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

        if (i % 4 === 0) {
            lane.material = new THREE.MeshPhongMaterial({ color: 0x00FF00, flatShading: true });
            const numTrees = Math.floor(Math.random() * 3) + 1;
            for (let j = 0; j < numTrees; j++) {
                const tree = utils.Tree();
                const treeX = (Math.random() * 72 - 36 ) / 2; 
                const treeZ = i * -6; // Lane position
                const treeMatrix = utils.translationMatrix(treeX, 0, treeZ);
                tree.matrix.copy(treeMatrix);
                tree.matrixAutoUpdate = false;
                scene.add(tree);
            }            
        }        
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
    if (lane % 4 != 0) {
        var car = utils.Car();
        car.matrix.multiply(lanes[lane].matrix);
        car.matrix.premultiply(toStartOfLane);
        scene.add(car);

        cars.push([clock.getElapsedTime(), car])
    }

    for(var i = 0; i<4; i++){
        var lane = utils.getRandomFarLane(curr_lane_, lanes.length);
        if (lane % 4 != 0) {
            var car = utils.Car();
            car.matrix.multiply(lanes[lane].matrix);
            car.matrix.premultiply(toStartOfLane);
            scene.add(car);
    
            cars.push([clock.getElapsedTime(), car])
        }        
    }
}