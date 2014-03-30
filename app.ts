/// <reference path="typings/three.d.ts" />

var WIDTH = 500;
var HEIGHT = 500;

class Viewer {
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    robot: THREE.Mesh;
    currentRotation: THREE.Quaternion;
    oldRotation: THREE.Quaternion;
    mouseStartPos: THREE.Vector3;

    prevTimestamp: number = null;

    constructor() {
        this.mouseStartPos = new THREE.Vector3(0, 0, 0);
        this.oldRotation = new THREE.Quaternion(0, 0, 0, 1);
        this.currentRotation = new THREE.Quaternion(0, 0, 0, 1);

        this.scene = new THREE.Scene();

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(WIDTH, HEIGHT);
        this.renderer.setClearColor(0xeeeeee);
        

        var geometry = new THREE.TorusGeometry(300, 50, 100, 16);
        var material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        this.robot = new THREE.Mesh(geometry, material);

        var light = new THREE.DirectionalLight(0xffffff);
        light.position.set(0, 0, 1000);

        this.scene.add(this.robot);
        this.scene.add(light);


        this.camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 10000);
        this.camera.position.set(0, 0, 1000);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        document.body.appendChild(this.renderer.domElement);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.renderer.domElement.addEventListener("mousedown", this.onMouseDown);
        this.renderer.domElement.addEventListener("mouseleave", this.onMouseLeave);
        this.renderer.domElement.addEventListener("mouseup", this.onMouseUp);
    }

    onMouseDown(e: MouseEvent) {
        this.renderer.domElement.addEventListener("mousemove", this.onMouseMove);
        this.mouseStartPos = this.calculatePoint(e.clientX, e.clientY);
    }

    onMouseUp() {
        this.renderer.domElement.removeEventListener("mousemove", this.onMouseMove);
        this.oldRotation = this.currentRotation.clone();
    }

    onMouseLeave() {
        this.renderer.domElement.removeEventListener("mousemove", this.onMouseMove);
        this.oldRotation = this.currentRotation.clone();
    }

    onMouseMove(e: MouseEvent) {
        var p: THREE.Vector3 = this.calculatePoint(e.clientX, e.clientY);
        var d = p.dot(this.mouseStartPos);
        p.cross(this.mouseStartPos);

        this.currentRotation.set(p.x, p.y, p.z, d)
            .multiply(this.oldRotation).normalize();
    }

    calculatePoint(x: number, y: number) {
        var p: THREE.Vector3 = new THREE.Vector3(
            -((x / (WIDTH - 1)) * 2 - 1),
            (y / (HEIGHT - 1)) * 2 - 1,
            0);

        if (p.lengthSq() <= 0.5) {
            p.z = Math.sqrt(1 - p.lengthSq());
        }
        else {
            p.z = 1.0 / (2 * Math.sqrt(p.lengthSq()));
            p.normalize();
        }

        return p;
    }

    animate(timestamp: number) {
        this.render();

        this.update();

        this.prevTimestamp = timestamp;
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    update() {
        this.robot.quaternion = this.currentRotation;
    }
}

window.onload = () => {
    var viewer: Viewer = new Viewer();

    function viewerLoop(timestamp: number) {
        requestAnimationFrame(viewerLoop);
        viewer.animate(timestamp);
    }
    requestAnimationFrame(viewerLoop);
}
