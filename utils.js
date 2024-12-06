import * as THREE from 'three';
import { GhibliShader } from './GhibliShader';

//constants for functions
const vechicleColors = [0x2774AE, 0xF2A900, 0x990000, 0xFFCC00, 0x2D68C4];
const treeHeights = [5, 7, 9, 11];
const zoom = 0.175;
// vehicle textures
const carFrontTexture = new Texture(40,80,[{x: 0, y: 10, w: 30, h: 60 }]);
const carBackTexture = new Texture(40,80,[{x: 10, y: 10, w: 30, h: 60 }]);
const carRightSideTexture = new Texture(110,40,[{x: 10, y: 0, w: 50, h: 30 }, {x: 70, y: 0, w: 30, h: 30 }]);
const carLeftSideTexture = new Texture(110,40,[{x: 10, y: 10, w: 50, h: 30 }, {x: 70, y: 10, w: 30, h: 30 }]);

const truckFrontTexture = new Texture(30,30,[{x: 15, y: 0, w: 10, h: 30 }]);
const truckRightSideTexture = new Texture(25,30,[{x: 0, y: 15, w: 10, h: 10 }]);
const truckLeftSideTexture = new Texture(25,30,[{x: 0, y: 5, w: 10, h: 10 }]);

function Texture(width, height, rects) {
const canvas = document.createElement( "canvas" );
canvas.width = width;
canvas.height = height;
const context = canvas.getContext( "2d" );
context.fillStyle = "#ffffff";
context.fillRect( 0, 0, width, height );
context.fillStyle = "rgba(0,0,0,0.6)";  
rects.forEach(rect => {
    context.fillRect(rect.x, rect.y, rect.w, rect.h);
});
return new THREE.CanvasTexture(canvas);
}
  
function Wheel() {
const wheel = new THREE.Mesh( 
    new THREE.BoxGeometry( 12*zoom, 33*zoom, 12*zoom ), 
    new THREE.MeshLambertMaterial( { color: 0x333333, flatShading: true } ) 
);
wheel.position.z = 6*zoom;
return wheel;
}

// player creation
export function createBruin() {
    const bruin = new THREE.Group();

    // Body (main cuboid)
    const bodyGeometry = new THREE.BoxGeometry(2, 2, 2);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513, flatShading: true }); // Brown color
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    bruin.add(body);

    // Ears (outer dark brown cubes)
    const earGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.5);
    const earMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);

    leftEar.position.set(-0.8, 1.3, 0); // Left ear
    rightEar.position.set(0.8, 1.3, 0); // Right ear

    bruin.add(leftEar);
    bruin.add(rightEar);

    // Inner part of the ears (light brown cubes)
    const innerEarGeometry = new THREE.BoxGeometry(0.3, 0.55, 0.1);
    const innerEarMaterial = new THREE.MeshPhongMaterial({ color: 0xD2B48C }); // Light brown
    const leftInnerEar = new THREE.Mesh(innerEarGeometry, innerEarMaterial);
    const rightInnerEar = new THREE.Mesh(innerEarGeometry, innerEarMaterial);

    leftInnerEar.position.set(-0.8, 1.3, 0.25); // Slightly in front of the left ear
    rightInnerEar.position.set(0.8, 1.3, 0.25); // Slightly in front of the right ear

    bruin.add(leftInnerEar);
    bruin.add(rightInnerEar);

    // Snout (light-colored mouth area)
    const snoutGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.4);
    const snoutMaterial = new THREE.MeshPhongMaterial({ color: 0xD2B48C }); // Lighter tan color
    const snout = new THREE.Mesh(snoutGeometry, snoutMaterial);
    snout.position.set(0, -0.3, 1.1); // Front of the body
    bruin.add(snout);

    // Nose (small black rectangle)
    const noseGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.1);
    const noseMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 }); // Black
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, -0.1, 1.35); // Centered on the snout
    bruin.add(nose);

    // Mouth
    const mouthGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const mouthMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 }); // Black
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, -0.25, 1.35);
    bruin.add(mouth);

    const mouth2Geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const mouth2Material = new THREE.MeshPhongMaterial({ color: 0x000000 }); // Black
    const mouth2 = new THREE.Mesh(mouth2Geometry, mouth2Material);
    mouth2.position.set(-0.1, -0.35, 1.35);
    bruin.add(mouth2);

    const mouth3Geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const mouth3Material = new THREE.MeshPhongMaterial({ color: 0x000000 }); // Black
    const mouth3 = new THREE.Mesh(mouth3Geometry, mouth3Material);
    mouth3.position.set(0.1, -0.35, 1.35);
    bruin.add(mouth3);

    // Eyes (small black rectangles)
    const eyeGeometry = new THREE.BoxGeometry(0.2, 0.4, 0.1);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 }); // Black
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);

    leftEye.position.set(-0.4, 0.5, 1.1); // Left eye
    rightEye.position.set(0.4, 0.5, 1.1); // Right eye

    bruin.add(leftEye);
    bruin.add(rightEye);
    bruin.position.set(0,2,0);
    return bruin;
}

export function applyDeathState(model) {
    model.scale.set(2.5, 0.2, 2.5); // Flatten along y-axis and expand x/z for a circular effect
    model.position.y = 1.5; // Ensure it doesn't go below ground level
}

// lane generation
export function Lane(idx){
    const roadTexture = new THREE.TextureLoader().load('./textures/road_texture.png');
    roadTexture.wrapS = THREE.RepeatWrapping;
    roadTexture.wrapT = THREE.RepeatWrapping;    
    roadTexture.repeat.set(20, 1);
    let lane_geometry = new THREE.BoxGeometry(360, 2, 6)
    let lane_material = new THREE.MeshPhongMaterial({color: 0x636363, flatShading: true, map : roadTexture});
    let lane = new THREE.Mesh(lane_geometry, lane_material)
    lane.matrix.copy(translationMatrix(0, 0, -6 * idx))
    lane.matrixAutoUpdate = false;
    lane.castShadow = false;
    lane.receiveShadow = true;

    return lane
    // }
    // else{
    //     return River(idx);
    // }
}

export function River(idx) {
    // Define the geometry
    const river_geometry = new THREE.BoxGeometry(360, 2, 5, 100, 1, 100);

    // Load the texture
    const waterTexture = new THREE.TextureLoader().load('./textures/river_texture.png');
    waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping;
    waterTexture.repeat.set(20, 1);

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
            uniform vec3 blendColor; // Dark blue color
            uniform float blendFactor; // Factor to control blending            

            // move the texture horizontally in direction of logs
            void main() {
                vec2 uv = vUv;
                uv.x -= time * 0.1; // Animate the texture scrolling
                vec4 texColor = texture2D(waterTexture, uv);

                vec3 blendedColor = mix(texColor.rgb, blendColor, blendFactor);
                gl_FragColor = texColor;
            }
        `,
        uniforms: {
            time: { value: 0.0 },
            waterTexture: { value: waterTexture },
            textureWidth: { value: 4096 },
            textureHeight: { value: 4096 },
            blendColor: { value: new THREE.Color(0x00008B).toArray()},
            blendFactor: { value: 0.75 },
        },
    });

    const river = new THREE.Mesh(river_geometry, river_material);
    river.receiveShadow = true;
    river.castShadow = false;
    river.matrix.copy(translationMatrix(0, 0, -6 * idx));
    river.matrixAutoUpdate = false;

    return river;
}

export function Log() {
    // // Create a cylindrical geometry
    let log_lengths = [5, 6, 7, 8, 9];
    let length = log_lengths[Math.floor(Math.random() * log_lengths.length)];
    // let log_geometry = new THREE.CylinderGeometry(1.5, 1.5, length, 256);

    // let log_material = new THREE.MeshPhongMaterial({
    //     color: 0x964B00,
    //     flatShading: true
    // });

    // let log = new THREE.Mesh(log_geometry, log_material);
    // log.rotateZ(Math.PI / 2);
    // log.position.set(0, 0.5, 0);
    // log.matrixAutoUpdate = false;
    // log.updateMatrix();

    // return log;

    let log_geometry = new THREE.BoxGeometry(length, 2, 3);
    const palletTexture = new THREE.TextureLoader().load('./textures/pallet_texture.png');
    palletTexture.wrapS = THREE.RepeatWrapping;
    palletTexture.wrapT = THREE.RepeatWrapping;    
    let log_material = new THREE.MeshPhongMaterial({color: 0x964B00,
                                                        flatShading: true, map : palletTexture})
    let log = new THREE.Mesh(log_geometry, log_material)
    log.matrix.copy(translationMatrix(0, 0.5, 0))
    log.matrixAutoUpdate = false;

    return log;
}

export function Car(dir) {
    const car = new THREE.Group();
    const color = vechicleColors[Math.floor(Math.random() * vechicleColors.length)];

    const main = new THREE.Mesh(
    new THREE.BoxGeometry( 60*zoom, 30*zoom, 15*zoom ), 
    new THREE.MeshPhongMaterial( { color, flatShading: true } )
    );
    main.position.z = 12*zoom;
    main.castShadow = true;
    main.receiveShadow = true;
    car.add(main)

    const cabin = new THREE.Mesh(
    new THREE.BoxGeometry( 33*zoom, 24*zoom, 12*zoom ), 
    [
        new THREE.MeshPhongMaterial( { color: 0xcccccc, flatShading: true, map: carBackTexture } ),
        new THREE.MeshPhongMaterial( { color: 0xcccccc, flatShading: true, map: carFrontTexture } ),
        new THREE.MeshPhongMaterial( { color: 0xcccccc, flatShading: true, map: carRightSideTexture } ),
        new THREE.MeshPhongMaterial( { color: 0xcccccc, flatShading: true, map: carLeftSideTexture } ),
        new THREE.MeshPhongMaterial( { color: 0xcccccc, flatShading: true } ), // top
        new THREE.MeshPhongMaterial( { color: 0xcccccc, flatShading: true } ) // bottom
    ]
    );
    cabin.position.x = 6*zoom;
    cabin.position.z = 25.5*zoom;
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    car.add( cabin );

    const frontWheel = new Wheel();
    frontWheel.position.x = -18*zoom;
    car.add( frontWheel );

    const backWheel = new Wheel();
    backWheel.position.x = 18*zoom;
    car.add( backWheel );

    car.matrix.copy(translationMatrix(0, 0, 0));
    car.matrix.multiply(rotationMatrixX(-Math.PI / 2));
    if (dir == 1) {
        car.matrix.multiply(rotationMatrixY(Math.PI));
        car.matrix.multiply(rotationMatrixX(Math.PI));
    }

    car.matrixAutoUpdate = false;
    car.castShadow = true;
    car.receiveShadow = false;
  
  return car;  
}

export function Truck(dir) {
    const truck = new THREE.Group();
    const color = vechicleColors[Math.floor(Math.random() * vechicleColors.length)];
  
  
    const base = new THREE.Mesh(
      new THREE.BoxGeometry( 100*zoom, 25*zoom, 5*zoom ), 
      new THREE.MeshLambertMaterial( { color: 0xb4c6fc, flatShading: true } )
    );
    base.position.z = 10*zoom;
    truck.add(base)
  
    const cargo = new THREE.Mesh(
      new THREE.BoxGeometry( 75*zoom, 35*zoom, 40*zoom ), 
      new THREE.MeshPhongMaterial( { color: 0xb4c6fc, flatShading: true } )
    );
    cargo.position.x = 15*zoom;
    cargo.position.z = 30*zoom;
    cargo.castShadow = true;
    cargo.receiveShadow = true;
    truck.add(cargo)
  
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry( 25*zoom, 30*zoom, 30*zoom ), 
      [
        new THREE.MeshPhongMaterial( { color, flatShading: true } ), // back
        new THREE.MeshPhongMaterial( { color, flatShading: true, map: truckFrontTexture } ),
        new THREE.MeshPhongMaterial( { color, flatShading: true, map: truckRightSideTexture } ),
        new THREE.MeshPhongMaterial( { color, flatShading: true, map: truckLeftSideTexture } ),
        new THREE.MeshPhongMaterial( { color, flatShading: true } ), // top
        new THREE.MeshPhongMaterial( { color, flatShading: true } ) // bottom
      ]
    );
    cabin.position.x = -40*zoom;
    cabin.position.z = 20*zoom;
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    truck.add( cabin );
  
    const frontWheel = new Wheel();
    frontWheel.position.x = -38*zoom;
    truck.add( frontWheel );
  
    const middleWheel = new Wheel();
    middleWheel.position.x = -10*zoom;
    truck.add( middleWheel );
  
    const backWheel = new Wheel();
    backWheel.position.x = 30*zoom;
    truck.add( backWheel );
  
    truck.matrix.copy(translationMatrix(0, 0, 0));
    truck.matrix.multiply(rotationMatrixX(-Math.PI / 2));
    if (dir == 1) {
        truck.matrix.multiply(rotationMatrixY(Math.PI));
        truck.matrix.multiply(rotationMatrixX(Math.PI));
    }

    truck.matrixAutoUpdate = false;
    truck.castShadow = true;
    truck.receiveShadow = false;    
    return truck;  
}


export function safeLane(idx) {
    const grassTexture = new THREE.TextureLoader().load('./textures/grass_texture3.png');
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;    
    grassTexture.repeat.set(20, 1);

    let lane_geometry = new THREE.BoxGeometry(360, 2, 6, 20, 20, );
    let lane_material = new THREE.MeshPhongMaterial({ color: 0x7CFC00, flatShading: true, map : grassTexture});
    let lane = new THREE.Mesh(lane_geometry, lane_material)
    lane.matrix.copy(translationMatrix(0, 0, -6 * idx))
    lane.matrixAutoUpdate = false;
    lane.receiveShadow = true;
    lane.castShadow = false;
    return lane
}

export function Tree() {    
    let height = treeHeights[Math.floor(Math.random() * treeHeights.length)];

    const treeGeometry = new THREE.BoxGeometry(2, 6, 2);
    const trunkTexture = new THREE.TextureLoader().load('./textures/tree_texture.png');
    trunkTexture.wrapS = THREE.RepeatWrapping;
    trunkTexture.wrapT = THREE.RepeatWrapping;
    trunkTexture.repeat.set(1, 1);    
    const trunkMaterial = new THREE.MeshPhongMaterial({ color : 0x964B00, map: trunkTexture,emissive: 0x552200,
    emissiveIntensity: 0.1});
    const trunk = new THREE.Mesh(treeGeometry, trunkMaterial);
    // trunk capture


    // Foliage texture
    const foliageTexture = new THREE.TextureLoader().load('./textures/leaf_texture.png');
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
          opacity: { value: 0.8 },
        },
        transparent: true,
        depthWrite: false,
        depthTest: true,
      });

    const foliageGeometry = new THREE.BoxGeometry(5, height, 5); 
    // const foliageMaterial = new THREE.MeshPhongMaterial({ map: foliageTexture });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    foliage.position.y = 5;

    const tree = new THREE.Group();
    tree.add(trunk);
    tree.add(foliage);

    return tree;
}

export function createSky() {
    const skyGeometry = new THREE.SphereGeometry(1000, 32, 32);
    
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

export function createCloud() {
    const cloudGroup = new THREE.Group();

    const material = new THREE.MeshPhongMaterial({
        color: 0xffffff,       
        transparent: true, 
        opacity: 0.8,          
    });

    // Generate a random number of spheres (10 to 15)
    const numSpheres = Math.floor(Math.random() * 6) + 10;

    // Create spheres and position them closely together
    for (let i = 0; i < numSpheres; i++) {
        const size = Math.random() * 4 + 6; // Randomize size slightly

        const x = Math.random() * 20 - 10;
        const y = Math.random() * 10 - 5;  
        const z = Math.random() * 20 - 10; 

        const sphereGeometry = new THREE.SphereGeometry(size, 16, 16);
        const sphere = new THREE.Mesh(sphereGeometry, material);

        // Set the position of each sphere
        sphere.position.set(x, y, z);

        // Add to the cloud group
        cloudGroup.add(sphere);
    }

    // Position the entire cloud group in the scene
    cloudGroup.position.set(
        Math.random() * 400 - 200, 
        Math.random() * 200 + 100,
        Math.random() * 400 - 200  
    );

    return cloudGroup;
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