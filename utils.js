import * as THREE from 'three';
import { GhibliShader } from './GhibliShader';
export function Lane(idx){
    // var type_of_lane = Math.floor(Math.random() * 5);

    // if(type_of_lane < 4){
        let lane_geometry = new THREE.BoxGeometry(300, 2, 6)
        let lane_material = new THREE.MeshPhongMaterial({color: 0x808080,
                                                            flatShading: true})
        let lane = new THREE.Mesh(lane_geometry, lane_material)
        lane.matrix.copy(translationMatrix(0, 0, -6 * idx))
        lane.matrixAutoUpdate = false;
        lane.castShadow = true;
        lane.receiveShadow = true;

        return lane
    // }
    // else{
    //     return River(idx);
    // }
}

export function River(idx) {
    // Define the geometry
    const river_geometry = new THREE.BoxGeometry(300, 2, 5, 100, 1, 100);

    // Load the texture
    const waterTexture = new THREE.TextureLoader().load('./textures/river_texture.png');
    waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping;
    waterTexture.repeat.set(10, 1);

    // Define the custom shader material with vertex shader and fragment
    const river_material = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec2 vUv;

            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            precision highp float;
            uniform sampler2D waterTexture;
            uniform float time;
            varying vec2 vUv;
            
            // move the texture horizontally in direction of logs
            void main() {
                vec2 uv = vUv;
                uv.x -= time * 0.1; // Animate the texture scrolling
                vec4 texColor = texture2D(waterTexture, uv);
                gl_FragColor = texColor;
            }
        `,
        uniforms: {
            time: { value: 0.0 },
            waterTexture: { value: waterTexture },
            textureWidth: { value: 2048 },
            textureHeight: { value: 2048 }
        },
    });

    const river = new THREE.Mesh(river_geometry, river_material);
    river.matrix.copy(translationMatrix(0, 0, -6 * idx));
    river.matrixAutoUpdate = false;

    return river;
}

export function Log(){
    let log_geometry = new THREE.BoxGeometry(5, 2, 3)
    let log_material = new THREE.MeshPhongMaterial({color: 0x964B00,
                                                        flatShading: true})
    let log = new THREE.Mesh(log_geometry, log_material)
    log.matrix.copy(translationMatrix(0, 0.5, 0))
    log.matrixAutoUpdate = false;

    return log;
}

export function Car(){
    let car_geometry = new THREE.BoxGeometry(5, 3, 4)
    let car_material = new THREE.MeshPhongMaterial({color: 0xB08040,
                                                        flatShading: true})
    let car = new THREE.Mesh(car_geometry, car_material)
    car.matrix.copy(translationMatrix(0, 2, 0))
    car.matrixAutoUpdate = false;

    return car;
}

export function safeLane(idx) {
    let lane_geometry = new THREE.BoxGeometry(300, 2, 6)
    let lane_material = new THREE.MeshPhongMaterial({ color: 0x00FF00, flatShading: true });
    let lane = new THREE.Mesh(lane_geometry, lane_material)
    lane.matrix.copy(translationMatrix(0, 0, -6 * idx))
    lane.matrixAutoUpdate = false;
    
    return lane
}

export function Tree() {    
    let treeHeights = [5, 7, 9];
    let height = treeHeights[Math.floor(Math.random() * treeHeights.length)];

    const treeGeometry = new THREE.BoxGeometry(2, 6, 2);
    const trunkTexture = new THREE.TextureLoader().load('./textures/tree_texture2.png');
    trunkTexture.wrapS = THREE.RepeatWrapping;
    trunkTexture.wrapT = THREE.RepeatWrapping;
    trunkTexture.repeat.set(1, 1);    
    const trunkMaterial = new THREE.MeshPhongMaterial({ map: trunkTexture });
    const trunk = new THREE.Mesh(treeGeometry, trunkMaterial);
    // trunk capture


    // Foliage texture
    const foliageTexture = new THREE.TextureLoader().load('./textures/leaf_texture2.jpg');
    foliageTexture.wrapS = THREE.RepeatWrapping;
    foliageTexture.wrapT = THREE.RepeatWrapping;
    let colors = [new THREE.Color("#32CD32"), new THREE.Color("#228B22"), new THREE.Color("#196F3D"), new THREE.Color("#145A32")]
    
    const foliageMaterial = new THREE.ShaderMaterial({
        vertexShader: GhibliShader.vertexShader,
        fragmentShader: GhibliShader.fragmentShader,
        uniforms: {
          ...THREE.UniformsUtils.clone(GhibliShader.uniforms),
          colorMap: { value: colors },
          brightnessThresholds: { value: [0.8, 0.5, 0.01] },
          lightPosition: { value: new THREE.Vector3(15, 15, 15) },
          leafTexture: { value: foliageTexture },
        },
      });

    const foliageGeometry = new THREE.BoxGeometry(5, height, 5); 
    const leaf = new THREE.Mesh()
    // const foliageMaterial = new THREE.MeshPhongMaterial({ map: foliageTexture });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.y = 6;

    const tree = new THREE.Group();
    tree.add(trunk);
    tree.add(foliage);

    return tree;
}

export function createSky() {
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    const skyMaterial = new THREE.MeshPhongMaterial({
        color: 0x7BD9F6, // Sky blue
        side: THREE.BackSide, // Render inside the sphere
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    return sky;
}

export function createSun() {
    const sunGeometry = new THREE.SphereGeometry(50, 32, 32); // Adjust size
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFF00, // Yellow
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);

    sun.position.set(200, 200, -300);
    return sun;
}

export function createTexturedCloud() {
    const textureLoader = new THREE.TextureLoader();
    const cloudTexture = textureLoader.load("./textures/cloud_texture.avif");
    const cloudMaterial = new THREE.MeshBasicMaterial({
        map: cloudTexture,
        transparent: true,
    });
    const cloudGeometry = new THREE.PlaneGeometry(50, 30);
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);

    cloud.position.set(
        Math.random() * 400 - 200, // X
        Math.random() * 200 + 100, // Y
        Math.random() * 400 - 200  // Z
    );
    cloud.rotation.y = Math.random() * Math.PI * 2;
    return cloud;
}

export function translationMatrix(tx, ty, tz) {
	return new THREE.Matrix4().set(
		1, 0, 0, tx,
		0, 1, 0, ty,
		0, 0, 1, tz,
		0, 0, 0, 1
	);
}

export function rotationMatrixX(theta) {
    return new THREE.Matrix4().set(
        1, 0, 0, 0,
        0, Math.cos(theta), -Math.sin(theta), 0,
        0, Math.sin(theta), Math.cos(theta), 0,
        0, 0, 0, 1
    );
}

export function rotationMatrixY(theta) {
    return new THREE.Matrix4().set(
        Math.cos(theta), 0, Math.sin(theta), 0,
        0, 1, 0, 0,
        -Math.sin(theta), 0, Math.cos(theta), 0,
        0, 0, 0, 1
    );
}

export function rotationMatrixZ(theta) {
	return new THREE.Matrix4().set(
		Math.cos(theta), -Math.sin(theta), 0, 0,
		Math.sin(theta),  Math.cos(theta), 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	);
}

export function getRandomNearLane(currLane, numOfLanes){
    var a = Math.max(0, currLane - 3);
    var b = Math.min(currLane + 3, numOfLanes - 1);
    return Math.floor(Math.random() * (b - a + 1)) + a;
}

export function getRandomFarLane(currLane, numOfLanes){
    var a = Math.min(currLane + 5, numOfLanes - 1);
    var b = Math.min(currLane + 15, numOfLanes - 1);
    return Math.floor(Math.random() * (b - a + 1)) + a;
}