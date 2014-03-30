/// <reference path="typings/three.d.ts" />
/// <reference path="trackball.ts" />

var WIDTH = 500;
var HEIGHT = 500;

class Viewer {
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    robot: THREE.Mesh;
    
    trackball: Trackball;

    prevTimestamp: number = null;

    constructor() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(WIDTH, HEIGHT);
        this.renderer.setClearColor(0xeeeeee);
        document.body.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 10000);
        this.trackball = new Trackball(this.camera, this.renderer.domElement);

        this.animate = this.animate.bind(this);


        var geometry = new THREE.TorusGeometry(300, 50, 100, 11);
        var material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        this.robot = new THREE.Mesh(geometry, material);
        this.scene.add(this.robot);

        var light1 = new THREE.DirectionalLight(0xffffff);
        light1.position.set(0, 0, 1000);
        this.scene.add(light1);
    }

    animate(timestamp: number) {
        requestAnimationFrame(this.animate);
        this.update();
        this.render();
        this.prevTimestamp = timestamp;
    }

    update() {
        this.camera.quaternion = this.trackball.getRotation().clone();
        this.camera.position = (new THREE.Vector3(0, 0, 1000)).applyQuaternion(this.trackball.getRotation());
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}

window.onload = () => {
    var viewer: Viewer = new Viewer();
    requestAnimationFrame(viewer.animate);
}
