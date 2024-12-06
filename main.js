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
// let bear = new THREE.Group();
// // Load a resource
// loader.load(
//     // resource URL
//     'models/bear.obj',
//     // called when resource is loaded
//     function ( object ) {
//         bear = object;
//         object.position.set(0, 1, -7);
//         object.scale.set(0.007, 0.007, -0.007)
//         console.log(object);
//         scene.add( object );

//     },
//     // called when loading is in progresses
//     function ( xhr ) {

//         console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

//     },
//     // called when loading has errors
//     function ( error ) {

//         console.log( 'An error happened' );

//     }
// );

camera.position.set(25, 75, 75);
camera.lookAt(0, 0, 0);

// Retry if dead
document.addEventListener("click", (e) => {
    if(e.target.tagName === "BUTTON") window.location.reload();
})

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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

// Provisional Data
let lanes = [];
let lane_speeds = [];
let boundingBoxes = {};
let trees = [];
let safeLanes = [0];
let lastSafeLane = 0;
let rivers = [];
let lastRiver = 0;
let river_meshes = [];
let cars = [];
let car_direction = [];
let logs = [];
let clouds = [];
let death = false;
let attached_log = null;
const carSpeeds = [0.03, 0.04, 0.05];

// Adding lanes
let curr_lane_ = 0;
addBackground();
addLanes();

// Score Calculation
let max_distance = 0;

// Adding character
let player = utils.createBruin();

// let player = utils.createBruin();
scene.add(player)

const bruinBoundingBox = new THREE.Box3(
    new THREE.Vector3(-1, -1, -1),
    new THREE.Vector3(1, 1, 1)
);

function updateBoundingBox(model, boundingBox) {
    // Translate the fixed bounding box to match the model's position
    const modelPosition = new THREE.Vector3();
    model.getWorldPosition(modelPosition); // Get world position of the model
    boundingBox.min.set(modelPosition.x - 1, modelPosition.y - 1, modelPosition.z - 1);
    boundingBox.max.set(modelPosition.x + 1, modelPosition.y + 1, modelPosition.z + 1);
}

// Adding Ambient Light
let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.5);
scene.add(hemiLight)

// Adding Directional Light
let directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(25, 75, 75);
directionalLight.castShadow = true;

directionalLight.target = player;
directionalLight.shadow.mapSize.width = 4069;
directionalLight.shadow.mapSize.height = 4069;
directionalLight.shadow.camera.left = - 50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = - 50;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 1000;
scene.add(directionalLight)

// Adding backlight
const backLight = new THREE.DirectionalLight(0x444444, 0.4);
backLight.position.set(200, 200, 50);
backLight.castShadow = false;
scene.add(backLight);

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
    console.log(player.position);
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
    animateClouds(clouds);
    // console.log(player.position)
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
            const new_lightPosition = new THREE.Vector3();
            new_lightPosition.addVectors(directionalLight.position, up); 

            directionalLight.position.lerp(new_lightPosition, 0.6);
            player.position.lerp(new_targetPosition, 0.6); // Smoothly update player position   
        }
        // If time is second part, we jump down.
        else{
            new_targetPosition.addVectors(targetPosition, down);
            new_cam_targetPosition.addVectors(cam_targetPosition, down);
            const new_lightPosition = new THREE.Vector3();
            new_lightPosition.addVectors(directionalLight.position, down);
            directionalLight.position.lerp(new_lightPosition, 0.6);            
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
    cars.forEach(([t, c, d, s], idx) => {
        var d_x = 0;
        if (d == 1) {
            d_x = s * (time - t);
        }
        else {
            d_x = -s * (time - t);
        }
        var d_x_M = utils.translationMatrix(d_x, 0, 0);
        c.matrix.premultiply(d_x_M);

        // Collision Detection for cars and player
        var car_box = computeCarBB(c);
        var player_box = computePlayerBB();
        if(car_box.intersectsBox(player_box)) {
            console.log("Game Over");
            death = true;
            utils.applyDeathState(player);
        }
    })   
    
    var lane_box = computeCarBB(lanes[curr_lane_]) // Lanes, logs, and cars are basically the same thing
    var player_box = computePlayerBB();

    // Moving our logs
    logs.forEach(([t, l, s], idx) => {
        var d_x = 0.05 * (time - t);
        var d_x_M = utils.translationMatrix(d_x, 0, 0);
        l.matrix.premultiply(d_x_M);

        // Attaching a car
        var log_box = computeLogBB(l)
        //if the log goes out of bounds kick the player

        if (attached_log && Math.round(attached_log.position.x) >= 48) {
            attached_log.remove( player );
            player.matrixWorld.decompose( player.position, player.quaternion, player.scale );
            player.position.set(player.position.x, player.position.y - 0.5, player.position.z)
            targetPosition.copy(player.position)
            cam_targetPosition.copy(camera.position)
            scene.add(player)
            attached_log = null
        }
        else if(log_box.intersectsBox(player_box) && !isMoving ) {
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
            utils.applyDeathState(player);
        }
    }

    if(lanes.length - 15 <= curr_lane_) addLanes();

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
        if (car_position.x >= 120 || car_position.x <= -160) {
            // Remove from the scene
            scene.remove(c);

            // Dispose of geometry and materials
            c.traverse((child) => {
                if (child.isMesh) {
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach((material) => material.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                    if (child.geometry) {
                        child.geometry.dispose();
                    }
                }
            });

            // Remove from the cars array
            cars.splice(i, 1);
        }
    }

    // If logs go out of bounds, we cull them out
    for(var i = logs.length - 1; i>=0; i--){
        var [t, l] = logs[i];
        let log_position = new THREE.Vector3();
        l.matrix.decompose(log_position, new THREE.Quaternion(), new THREE.Vector3());
        if(log_position.x >= 120){
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
            lane_speeds[i] = carSpeeds[Math.floor(Math.random() * carSpeeds.length)];
            lastRiver = i;
        }
        else{
            var lane = utils.Lane(i)
            //safe lanes
            if (isSafe || i == 0) {
                var safeLane = utils.safeLane(i);
                const numTrees = Math.floor(Math.random() * 7) + 1;
                
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
                lane_speeds[i] = carSpeeds[Math.floor(Math.random() * carSpeeds.length)];            
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
    var toStartOfLane = utils.translationMatrix(-105, 0, 0);
    var toEndOfLane = utils.translationMatrix(65, 0, 0);
    var carType = Math.random() < 0.8 ? 0 : 1;
    console.log(carType);
    function isCarOverlap(newCarBox, existingCars) {
        for (const [_, car] of existingCars) {
            const existingCarBox = computeCarBB(car);
            if (newCarBox.intersectsBox(existingCarBox)) {
                return true; // Overlap detected
            }
        }
        return false;
    }    
    // Get a near lane to place a car
    var lane = utils.getRandomNearLane(curr_lane_, lanes.length);
    // Guarantees that we find a near lane.
    while(safeLanes.includes(lane) || rivers.includes(lane))lane = utils.getRandomNearLane(curr_lane_, lanes.length);
    var car = null    
    if (carType == 0) {
       car = utils.Car(car_direction[lane]);
    }
    else {
        car = utils.Truck(car_direction[lane]);
    }
    car.applyMatrix4(lanes[lane].matrix);
    car_direction[lane] == 1 ? car.applyMatrix4(toStartOfLane) : car.applyMatrix4(toEndOfLane);

    const newCarBox = computeCarBB(car);

    if (!isCarOverlap(newCarBox, cars)) {
    scene.add(car);
    cars.push([clock.getElapsedTime(), car, car_direction[lane], lane_speeds[lane]]);    
    }

    if (!isCarOverlap(newCarBox, cars)) {
        scene.add(car);
        cars.push([clock.getElapsedTime(), car, car_direction[lane], lane_speeds[lane]]);
    } 
    // Placing a car in a farther lane
    for(var i = 0; i<4; i++){
        var lane = utils.getRandomFarLane(curr_lane_, lanes.length);
        if (!safeLanes.includes(lane) && !rivers.includes(lane)) {
            var car = utils.Car(car_direction[lane]);
            car.applyMatrix4(lanes[lane].matrix);
            car_direction[lane] == 1 ? car.applyMatrix4(toStartOfLane) : car.applyMatrix4(toEndOfLane);
            const newCarBox2 = computeCarBB(car);
            if (!isCarOverlap(newCarBox2, cars)) {
                scene.add(car);
                cars.push([clock.getElapsedTime(), car, car_direction[lane], lane_speeds[lane]]);    
            } 
        }        
    }

    // For logs
    if(rivers.length > 0){
        var lane = Math.floor(Math.random() * rivers.length);
        var log = utils.Log();
        log.matrix.multiply(lanes[rivers[lane]].matrix);
        log.matrix.premultiply(toStartOfLane);
        scene.add(log);

        logs.push([clock.getElapsedTime(), log, lane_speeds[lane]]);
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
    var car_box = new THREE.Box3().setFromObject(car);
    return car_box;
}

function computeLogBB(log){
    log.matrix.decompose(log.position, log.quaternion, log.scale)

    // Compute bounding box to use
    log.geometry.computeBoundingBox();

    // Change bounding box to be relative to position of log
    var log_box = log.geometry.boundingBox.clone();
    log_box.translate(log.position);

    return log_box;
}

function computePlayerBB(){
    updateBoundingBox(player, bruinBoundingBox);
    return bruinBoundingBox;
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
    addTexturedClouds(150);

}

function addTexturedClouds(numClouds = 20) {
    const skyWidth = 1000; // Approximate width of the skybox
    const skyHeight = 500; // Approximate height range for clouds
    const skyDepth = 1000; // Approximate depth of the scene

    for (let i = 0; i < numClouds; i++) {
        const cloud = utils.createCloud();

        // Randomly position the clouds within the scene bounds
        cloud.position.set(
            Math.random() * skyWidth - skyWidth / 2, // X position
            Math.random() * skyHeight + 150,         // Y position (above ground level)
            Math.random() * skyDepth - skyDepth / 2 // Z position
        );

        // Randomly rotate the cloud for variety
        cloud.rotation.y = Math.random() * Math.PI * 2;
        clouds.push(cloud);
        scene.add(cloud);
    }
}

function animateClouds(clouds) {
    clouds.forEach(cloud => {
        cloud.position.x += 0.015; 
        if (cloud.position.x > 500) {
            cloud.position.x = -1000; // Wrap around
        }
    });
}