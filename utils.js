import * as THREE from 'three';

export function Lane(idx){
    let lane_geometry = new THREE.BoxGeometry(50, 2, 5)
    let lane_material = new THREE.MeshPhongMaterial({color: 0x808080,
                                                        flatShading: true})
    let lane = new THREE.Mesh(lane_geometry, lane_material)
    lane.matrix.copy(translationMatrix(0, 0, -6 * idx))
    lane.matrixAutoUpdate = false;
    
    return lane
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

export function Tree() {
    const treeGeometry = new THREE.CylinderGeometry(0.5, 2, 6, 12);
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(treeGeometry, trunkMaterial);

    const foliageGeometry = new THREE.SphereGeometry(2, 12, 12); 
    const foliageMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.y = 5;

    const tree = new THREE.Group();
    tree.add(trunk);
    tree.add(foliage);

    return tree;
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