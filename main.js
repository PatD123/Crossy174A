import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import * as utils from './utils.js';

// Clock for animation timing
let clock = new THREE.Clock();

// Our scene    
const scene = new THREE.Scene();

// CAMERA VARIABLES
// const camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, 
//                                              window.innerHeight / 2, window.innerHeight / - 2, 1, 1000 );
const camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 0.1, 1000 );
let cameraPerspective = 0; // 0 Per Cam
                           // 1 FP Cam
let cameraRotAngle = 0;

// OBJ Loader
const loader = new OBJLoader();
let bear = new THREE.Group();
// Load a resource
loader.load(
	// resource URL
	'models/bear.obj',
	// called when resource is loaded
	function ( object ) {
        bear = object;
        object.position.set(0, 1, -7);
        object.scale.set(0.007, 0.007, -0.007)
        console.log(object);
		scene.add( object );

	},
	// called when loading is in progresses
	function ( xhr ) {

		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

	},
	// called when loading has errors
	function ( error ) {

		console.log( 'An error happened' );

	}
);

camera.position.set(25, 75, 75);
camera.lookAt(0, 0, 0);

// Retry if dead
document.addEventListener("click", (e) => {
    if(e.target.tagName === "BUTTON") window.location.reload();
})

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
let lanes = [];
let trees = [];
let safeLanes = [0];
let rivers = [];
let cars = [];
let logs = [];
let death = false;
let attached_log;

// Adding lanes
let curr_lane_ = 0;
addLanes();

// Adding character
let player_geometry = new THREE.BoxGeometry(2, 2, 2);
let player_death_geometry = new THREE.CylinderGeometry(3, 3, 0, 12);
let player_material = new THREE.MeshPhongMaterial({color: 0xFF0000,
                                                    flatShading: true})
let player = new THREE.Mesh(player_geometry, player_material);
player.position.set(0, 2, 0);
scene.add(player)

// Adding a car
randomIntervalPlacement();

// Updating mouse pointer locations
window.addEventListener( 'pointermove', onPointerMove );
// RAYCASTER FOR MOUSE VECTORS
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
function onPointerMove( event ) {
    // Calculates new position of mouse at all 
	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

// Handle keyboard input
let move_dir_ = new THREE.Matrix4();
let isMoving = false; 
let targetPosition = new THREE.Vector3(0, 2, 0); 
let cam_targetPosition = new THREE.Vector3(25, 75, 75);
let time_of_jump = 0.0;
document.addEventListener('keydown', onKeyDown, false);
function onKeyDown(event) {
    if (isMoving) return;

    if(death && event.keyCode != 67) return;

    time_of_jump = clock.getElapsedTime();

    // Detach from attached log
    if(attached_log) {
        attached_log.remove( player );
        player.matrixWorld.decompose( player.position, player.quaternion, player.scale );
        player.position.set(player.position.x, player.position.y - 0.5, player.position.z)
        targetPosition.copy(player.position)
        cam_targetPosition.copy(camera.position)
        scene.add(player)
        attached_log = null
    }

    switch (event.keyCode) {
        case 67:
            // Change camera perspective
            cameraPerspective = cameraPerspective ? 0 : 1;
            return;
        case 65: // Left
            if(checkForTrees(new THREE.Vector3(-4, 0, 0))) return;
            move_dir_.copy(utils.translationMatrix(-4, 0, 0))
            break;
        case 87: // Forward
            if(checkForTrees(new THREE.Vector3(0, 0, -6))) return;
            move_dir_.copy(utils.translationMatrix(0, 0, -6))
            break;
        case 68: // Right
            if(checkForTrees(new THREE.Vector3(4, 0, 0))) return;
            move_dir_.copy(utils.translationMatrix(4, 0, 0))
            break;
        case 83: // Backward
            if(checkForTrees(new THREE.Vector3(0, 0, 6))) return;
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

            document.getElementById("counter").innerText = curr_lane_;

            move_dir_.identity();
        }
    }

    // Render Perspective
    renderPerspectives();

    // Moving our cars
    cars.forEach(([t, c], idx) => {
        var d_x = 0.05 * (time - t);
        var d_x_M = utils.translationMatrix(d_x, 0, 0);
        c.matrix.premultiply(d_x_M);

        // Collision Detection for cars and player
        var car_box = computeCarBB(c);
        var player_box = computePlayerBB();
        if(car_box.intersectsBox(player_box)) {
            console.log("Game Over");
            death = true;
            player.geometry = player_death_geometry;
        }
    })   
    
    // Moving our logs
    logs.forEach(([t, l], idx) => {
        var d_x = 0.05 * (time - t);
        var d_x_M = utils.translationMatrix(d_x, 0, 0);
        l.matrix.premultiply(d_x_M);

        // Attaching a car
        var log_box = computeCarBB(l) // Logs and cars are basically the same thing
        var lane_box = computeCarBB(lanes[curr_lane_]) // Lanes, logs, and cars are basically the same thing
        var player_box = computePlayerBB();
        if(log_box.intersectsBox(player_box) && !isMoving) {
            player.position.set(0, 2, 0)
            l.add(player)
            attached_log = l
        }
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

    // If logs go out of bounds, we cull them out
    for(var i = logs.length - 1; i>=0; i--){
        var [t, l] = logs[i];
        let log_position = new THREE.Vector3();
        l.matrix.decompose(log_position, new THREE.Quaternion(), new THREE.Vector3());
        if(log_position.x >= 25){
            l.material.dispose()
            l.geometry.dispose()
            scene.remove(l);
            l = null
        }
    }

    // Clean up out of scene lanes
}

function addLanes(){
    var start = lanes.length;
    var end = start + 10;
    for(var i = start; i<end; i++){
        if(i % 6 == 0 && i != 0){
            var river = utils.River(i);
            // Add river to scene
            scene.add(river);
            // Add index to indices of river lanes
            rivers.push(i);
            // Add the actual river as a lane
            lanes.push(river)
        }
        else{
            var lane = utils.Lane(i)
            if (i % 4 === 0) {
                lane.material = new THREE.MeshPhongMaterial({ color: 0x00FF00, flatShading: true });
                const numTrees = Math.floor(Math.random() * 3) + 1;
                for (let j = 0; j < numTrees; j++) {
                    const tree = utils.Tree();
                    const treeX = (Math.random() * 72 - 36) / 2;
                    // Make tree not spawn on top of player on spawn
                    if (i == 0 && (treeX > -6 && treeX < 6)) {
                        continue;
                    }

                    const treeZ = i * -6; // Lane position
                    const treeMatrix = utils.translationMatrix(treeX, 4, treeZ);
                    tree.matrix.copy(treeMatrix);
                    tree.matrixAutoUpdate = false;
                    scene.add(tree);
                    trees.push(tree);
                }
                console.log(i);
                safeLanes.push(i);
            }
            scene.add(lane);
            lanes.push(lane);
        }
    }
}

function randomIntervalPlacement() {
    addCars();
    const nextInterval = Math.random() * 500 + 200; // Next interval between 2 and 5 seconds
    setTimeout(randomIntervalPlacement, nextInterval); // Schedule the next call
}

function addCars(){
    var toStartOfLane = utils.translationMatrix(-22.5, 0, 0);
    // Get a near lane to place a car
    var lane = utils.getRandomNearLane(curr_lane_, lanes.length);
    // Guarantees that we find a near lane.
    while(safeLanes.includes(lane) || rivers.includes(lane))lane = utils.getRandomNearLane(curr_lane_, lanes.length);
    var car = utils.Car();
    car.matrix.multiply(lanes[lane].matrix);
    car.matrix.premultiply(toStartOfLane);
    scene.add(car);
    cars.push([clock.getElapsedTime(), car])

    // Placing a car in a farther lane
    for(var i = 0; i<4; i++){
        var lane = utils.getRandomFarLane(curr_lane_, lanes.length);
        if (!safeLanes.includes(lane) && !rivers.includes(lane)) {
            var car = utils.Car();
            car.matrix.multiply(lanes[lane].matrix);
            car.matrix.premultiply(toStartOfLane);
            scene.add(car);
    
            cars.push([clock.getElapsedTime(), car])
        }        
    }

    // For logs
    if(rivers.length > 0){
        var lane = Math.floor(Math.random() * rivers.length);
        var log = utils.Log();
        log.matrix.multiply(lanes[rivers[lane]].matrix);
        log.matrix.premultiply(toStartOfLane);
        scene.add(log);

        logs.push([clock.getElapsedTime(), log])
    }
    
}

function renderPerspectives(){
    // Camera always looks at at the world coordinates of the player.
    var player_world_pos = new THREE.Vector3();
    player.getWorldPosition(player_world_pos)

    if(cameraPerspective){
        // First person

        var h = new THREE.Vector3();
        h.copy(player_world_pos)
        h.z -= 2.5;
        camera.position.lerp(h, 0.1); 
        const target = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z - 1);

        // Target is the center of the screen. The onPointerMove calculates mouse position
        // relative to the center so we can just subtract
        target.sub(new THREE.Vector3(-pointer.x * 2, -pointer.y * 1.2, 0))
        camera.lookAt(target);
    }
    else{
        // Third-Person

        // Have camera follow TRY and follow smoothly
        var h = new THREE.Vector3();
        // Smoothly interpolate the camera's position towards the target position
        camera.position.lerp(
            h.addVectors(player_world_pos, new THREE.Vector3(25, 75, 75)), // Offset for better viewing
            0.05
        );
        
        // Looking at the world coordinates for the player
        camera.lookAt(player_world_pos);
    }
}

function computeCarBB(car){

    // Decompose matrix to get position
    car.matrix.decompose(car.position, car.quaternion, car.scale)

    // Compute bounding box to use
    car.geometry.computeBoundingBox();

    // Change bounding box to be relative to position of car
    var car_box = car.geometry.boundingBox.clone();
    car_box.translate(car.position);

    return car_box;
}

function computePlayerBB(){

    // Compute bounding box to use
    player.geometry.computeBoundingBox();

    // Change bounding box to be relative to position of car
    var player_box = player.geometry.boundingBox.clone();
    player_box.translate(player.position);

    return player_box;
}

function checkForTrees(dir){
    var fut_pos = new THREE.Vector3();

    // Gets the future position of the player
    fut_pos.addVectors(player.position, dir);
    
    // If we are moving out player forward or backward
    // Curr lane has to be in the safelane or the one in the future has to be in the safelanes.
    var possible_dz = ((dir.z > 0 && safeLanes.includes(curr_lane_ - 1)) || (dir.z < 0 && safeLanes.includes(curr_lane_ + 1)) && curr_lane_ != 0);
    var possible_dx = ((dir.x > 0 && safeLanes.includes(curr_lane_)) || (dir.x < 0 && safeLanes.includes(curr_lane_)));
    if(possible_dx || possible_dz){
        var flag = false;

        // Look thru each tree to see if we have an intersection
        // We should sort the trees and binary search tbh.....
        trees.forEach((t, idx) => {
            let bb = new THREE.Box3().setFromObject(t);
            if(bb.containsPoint(fut_pos)) {
                flag = true;
                return true;
            }
        })

        // If flag has been set, there was a tree where we were trying to go.
        if(flag) return true;
        // Else we return.
        else return false;
    }

    return false;
}