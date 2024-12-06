import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import * as utils from './utils.js';

// Lane Types
const SAFE = 0;
const ROAD  = 1;
const RIVER = 2;

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
let scooter = null;

function loadModel(loader, url) {
    return new Promise((resolve, reject) => {
        loader.load(
            url,
            (gltf) => resolve(gltf), // Resolve the promise when loaded
            undefined,               // Optional progress callback
            (error) => reject(error) // Reject the promise on error
        );
    });
}

async function loadScooter() {
    try {
        scooter = await loadModel(loader, 'models/scooter.obj');
        scooter.scale.set(0.03, 0.03, -0.03)
        const localAxis = new THREE.Vector3(0, 1, 0); // Y-axis

        // Rotate 45 degrees (in radians)
        const angle = 3*Math.PI/2; // 45°

        // Apply rotation
        scooter.rotateOnAxis(localAxis, angle);
        scooter.traverse(function(child) {
            if (child instanceof THREE.Mesh) {
                child.material.color.set(0x40e0d0);  // Change to red
            }
        });
        console.log('Scooter loaded:', scooter);
    } catch (error) {
        console.error('Error loading model:', error);
    }
}

loadScooter();

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

// Provisional Data
let lanes = [];
let boundingBoxes = {};
let trees = [];
let safeLanes = [0];
let lastSafeLane = 0;
let rivers = [];
let lastRiver = 0;
let river_meshes = [];
let cars = [];
let scooters = [];
let car_direction = [];
let logs = [];
let death = false;
let attached_log = null;

// Adding lanes
let curr_lane_ = 0;
addBackground();
addLanes();

// Score Calculation
let max_distance = 0;

// Adding character
let player_geometry = new THREE.BoxGeometry(2, 2, 2);
let player_death_geometry = new THREE.CylinderGeometry(3, 3, 0, 12);
let player_material = new THREE.MeshPhongMaterial({color: 0xFF0000,
                                                    flatShading: true})
let player = new THREE.Mesh(player_geometry, player_material);
player.position.set(0, 2, 0);
scene.add(player)

// Adding Directional Light
let directionalLight = new THREE.DirectionalLight( 0xffffff, 0.6);
directionalLight.position.set(25, 75, 75);
directionalLight.castShadow = true;
directionalLight.target = player;
scene.add(directionalLight)

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
let targetPosition = new THREE.Vector3(0, 1.9, 0); 
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
            if(Math.round(player.position.x) <= -48 || checkForTrees(new THREE.Vector3(-4, 0, 0))) return;
            move_dir_.copy(utils.translationMatrix(-4, 0, 0))
            break;
        case 87: // Forward
            if(checkForTrees(new THREE.Vector3(0, 0, -6))) return;
            move_dir_.copy(utils.translationMatrix(0, 0, -6))
            break;
        case 68: // Right
            if(Math.round(player.position.x) >= 48 || checkForTrees(new THREE.Vector3(4, 0, 0))) return;
            move_dir_.copy(utils.translationMatrix(4, 0, 0))
            break;
        case 83: // Backward
            if(Math.round(player.position.z) >= 0 || checkForTrees(new THREE.Vector3(0, 0, 6))) return;
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

    river_meshes.forEach((river) => {
        if (river.material instanceof THREE.ShaderMaterial && river.material.uniforms) {
            river.material.uniforms.time.value += 0.009;
        } else {
            console.warn("River material is not a ShaderMaterial or uniforms are undefined", river);
        }
    });

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
        // console.log(targetPosition);
        // console.log(curr_lane_);
        // If time is first part, we jump up.
        if (targetPosition.z > 0) {
        }
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
            if(moveDir.z < 0) {
                curr_lane_++;
                if (targetPosition.z < max_distance) {
                    max_distance = targetPosition.z;
                }
            }
            else if (moveDir.z > 0) {
                curr_lane_--;
            }


            
            document.getElementById("counter").innerText = -max_distance/6;

            move_dir_.identity();
        }
    }

    // Render Perspective
    renderPerspectives();

    // Moving our cars
    cars.forEach(([t, c, d], idx) => {
        var d_x = 0;
        if (d == 1) {
            d_x = 0.05 * (time - t);
        }
        else {
            d_x = -0.05 * (time - t);
        }
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

    // Moving our cars
    scooters.forEach(([t, s, d], idx) => {
        var d_x = 0;
        if (d == 1) {
            d_x = 0.05 * (time - t);
        }
        else {
            d_x = -0.05 * (time - t);
        }
        var d_x_M = utils.translationMatrix(d_x, 0, 0);
        s.position.set(s.position.x + d_x, s.position.y, s.position.z)

        // Collision Detection for scooters and player
        var scooter_box = computeScooterBB(s);
        var player_box = computePlayerBB();
        if(scooter_box.intersectsBox(player_box)) {
            console.log("Game Over");
            death = true;
            player.geometry = player_death_geometry;
        }
    }) 
    
    var lane_box = computeCarBB(lanes[curr_lane_]) // Lanes, logs, and cars are basically the same thing
    var player_box = computePlayerBB();

    // Moving our logs
    logs.forEach(([t, l], idx) => {
        var d_x = 0.05 * (time - t);
        var d_x_M = utils.translationMatrix(d_x, 0, 0);
        l.matrix.premultiply(d_x_M);

        // Attaching a car
        var log_box = computeCarBB(l) // Logs and cars are basically the same thing
        if(log_box.intersectsBox(player_box) && !isMoving) {
            player.position.set(0, 1.9, 0)
            l.add(player)
            attached_log = l
        }
        
        // ****TODO if the player rides on the log, he can go out of bounds -> find a way to bump player off the log
        // If the log goes out of bounds, bump the player off
        // var log_position = new THREE.Vector3();
        // l.matrix.decompose(log_position, new THREE.Quaternion(), new THREE.Vector3());
        // if (Math.round(log_position.x) >= 24 && attached_log === l) {
        //     // detaches the player from the log
        //     l.remove(player);
        //     player.matrixWorld.decompose(player.position, player.quaternion, player.scale);

        //     player.position.set(player.position.x, player.position.y, player.position.z);
        //     targetPosition.copy(player.position);

        //     attached_log = null;
        //     scene.add(player)
        //     console.log("Player bumped off the log!");
        //     console.log(player.position);

        //     if(attached_log == null && rivers.includes(curr_lane_)){
        //         if(lane_box.intersectsBox(player_box)){
        //             console.log("Game Over");
        //             death = true;
        //             player.geometry = player_death_geometry;
        //         }
        //     }            
        // }
    }) 

    if(attached_log == null && rivers.includes(curr_lane_) && !isMoving){
        if(lane_box.intersectsBox(player_box)){
            console.log("Game Over");
            death = true;
            player.geometry = player_death_geometry;
        }
    }

    if(curr_lane_ === lanes.length - 10) addLanes();

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
        if(car_position.x >= 50){
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
        if(log_position.x >= 50){
            l.material.dispose()
            l.geometry.dispose()
            scene.remove(l);
            l = null
        }
    }

    // Clean up out of scene lanes
}

function addLanes(){
    const minInterval = 6;
    var start = lanes.length;
    var end = start + 10;
    for(var i = start; i<end; i++){
        let isRiver = false;
        let isSafe = false;

        // gurantees that there is unique terrain every 6 lanes
        if (i - lastRiver >= minInterval) {
            isRiver = true;
        }

        else if (!isRiver && i - lastSafeLane >= minInterval) {
            isSafe = true;
        }

        // otherwise randomly generate a lane type
        if (!isRiver && !isSafe) {
            const type = Math.random();
            //make sure adjacent rivers don't spawn since its hard to align logs for a path
            if (type < 0.2 && lastRiver + 1 != i) {
                isRiver = true;
            } 
            else if (type < 0.35) {
                isSafe = true;
            }
        }
        // river lanes
        if(isRiver && i != 0){
            var river = utils.River(i);
            // Add river to scene
            scene.add(river);
            // Add index to indices of river lanes
            rivers.push(i);
            river_meshes.push(river);
            // Add the actual river as a lane
            lanes.push(river)
            lastRiver = i;
        }
        else{
            var lane = utils.Lane(i)
            //safe lanes
            if (isSafe || i == 0) {
                var safeLane = utils.safeLane(i);
                const numTrees = Math.floor(Math.random() * 6) + 1;
                
                //create a list to hold all of the boundary boxes for the trees
                if (!boundingBoxes[i]) {
                    boundingBoxes[i] = [];
                }

                for (let j = 0; j < numTrees; j++) {
                    const tree = utils.Tree();
                    const treeX = Math.floor((Math.random() * 96 - 48) / 4) * 4;
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

                    // add the tree's boundary to the list
                    const treeBoundingBox = new THREE.Box3().setFromObject(tree);
                    boundingBoxes[i].push(treeBoundingBox);
                }
                safeLanes.push(i);
                scene.add(safeLane);
                lanes.push(safeLane);
                lastSafeLane = i;
            }
            
            //normal lanes           
            else {
                car_direction[i] = Math.random() < 0.5 ? 1 : -1;
                scene.add(lane);
                lanes.push(lane);                
            }
        }
    }
}

function randomIntervalPlacement() {
    addCars();
    const nextInterval = Math.random() * 800 + 400; // Next interval between 2 and 5 seconds
    setTimeout(randomIntervalPlacement, nextInterval); // Schedule the next call
}

function addCars(){
    var toStartOfLane = utils.translationMatrix(-48, 0, 0);
    var toEndOfLane = utils.translationMatrix(48, 0, 0);
    // Get a near lane to place a car
    var lane = utils.getRandomNearLane(curr_lane_, lanes.length);
    // Guarantees that we find a near lane.
    while(safeLanes.includes(lane) || rivers.includes(lane))lane = utils.getRandomNearLane(curr_lane_, lanes.length);

    var f = Math.random();
    if(f > 0.3){
        var car = utils.Car();
        car.matrix.multiply(lanes[lane].matrix);

        car_direction[lane] == 1 ? car.matrix.premultiply(toStartOfLane) : car.matrix.premultiply(toEndOfLane);
        scene.add(car);
        cars.push([clock.getElapsedTime(), car, car_direction[lane]])
    }
    else{
        if(scooter != null && !safeLanes.includes(lane + 3) && !rivers.includes(lane + 3)){
            var new_scooter = scooter.clone();
            var lane_pos = new THREE.Vector3();
            lanes[lane].matrix.decompose(lane_pos, new THREE.Quaternion(), new THREE.Vector3())
            new_scooter.position.set(lane_pos.x + 90, lane_pos.y - 2, lane_pos.z - 3)
            scene.add(new_scooter);
            scooters.push([clock.getElapsedTime(), new_scooter, 0])
        }
    }

    
    

    // Placing a car in a farther lane
    for(var i = 0; i<4; i++){
        var lane = utils.getRandomFarLane(curr_lane_, lanes.length);
        if (!safeLanes.includes(lane) && !rivers.includes(lane)) {
            var car = utils.Car();
            car.matrix.multiply(lanes[lane].matrix);
            car_direction[lane] == 1 ? car.matrix.premultiply(toStartOfLane) : car.matrix.premultiply(toEndOfLane);
            scene.add(car);
            cars.push([clock.getElapsedTime(), car, car_direction[lane]])
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
        camera.fov = 100;
        camera.updateProjectionMatrix();
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
        camera.fov = 35;
        camera.updateProjectionMatrix();
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

function computeScooterBB(scoot){
    let bb = new THREE.Box3().setFromObject(scoot);
    return bb;
}

function checkForTrees(dir){
    var fut_pos = new THREE.Vector3();

    // Gets the future position of the player
    fut_pos.addVectors(player.position, dir);
    
    // If we are moving out player forward or backward
    // Curr lane has to be in the safelane or the one in the future has to be in the safelanes.
    const lane_to_check = [curr_lane_, curr_lane_ - 1, curr_lane_ + 1];

    // Look thru each tree to see if we have an intersection
    for (const lane of lane_to_check) {
        // if there the lane is has trees i.e. is a safe lane
        if (boundingBoxes[lane]) {
            for (const boundingBox of boundingBoxes[lane]) {
                if (boundingBox.containsPoint(fut_pos)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function addBackground() {
    for (let i = -10; i < 0; i++) {
        let isRiver = false;
        let isSafe = true;
        const type = Math.random();
        //make sure adjacent rivers don't spawn since its hard to align logs for a path
        if (type < 0.3) {
            isRiver = true;
        } 

        let lane = null;

        if (isRiver) {
            lane = utils.River(i);
            river_meshes.push(lane);
        }

        else if (isSafe) {
            lane = utils.safeLane(i);
        }
        scene.add(lane);
    }
    // Add the sky to the scene
    let sky = utils.createSky();
    let sun = utils.createSun();
    scene.add(sky);
    scene.add(sun);   
    // addTexturedClouds()

}

function addTexturedClouds(numClouds = 20) {
    for (let i = 0; i < numClouds; i++) {
        const cloud = createTexturedCloud();
        scene.add(cloud);
    }
}

