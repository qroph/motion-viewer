/// <reference path="typings/three.d.ts" />
/// <reference path="trackball.ts" />
/// <reference path="modelLoader.ts" />
/// <reference path="taskLoader.ts" />

var WIDTH = 800;
var HEIGHT = 600;

class Viewer {
    private scene: THREE.Scene;
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private robot: THREE.Mesh;
    
    private trackball: Trackball;
    private zoom: number;
    private task: TaskLoader.Task;
    private currentCfg: number;
    private maxCfg: number;

    constructor() {
        this.zoom = 1000;
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(WIDTH, HEIGHT);
        this.renderer.setClearColor(0xffffff);

        document.body.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(30, WIDTH / HEIGHT, 0.1, 10000);
        this.trackball = new Trackball(this.camera, this.renderer.domElement, new THREE.Quaternion(0.5, 0, 0, 0.866));

        this.animate = this.animate.bind(this);

        var light1 = new THREE.DirectionalLight(0xffffff);
        light1.position.set(1, 2, 0.5).normalize();
        this.scene.add(light1);

        var light2 = new THREE.DirectionalLight(0xffffff);
        light2.position.set(-1, -2, 1).normalize();
        this.scene.add(light2);

        var ambientLight = new THREE.AmbientLight(0x222222);
        this.scene.add(ambientLight);

        this.onWheel = this.onWheel.bind(this);
        this.renderer.domElement.addEventListener("mousewheel", this.onWheel, false);
        this.renderer.domElement.addEventListener("DOMMouseScroll", this.onWheel, false);


        TaskLoader.load("envs/task.ini", "envs/path.txt", (task: TaskLoader.Task) => {
            ModelLoader.load("envs/" + task.robotFilename, 0xff0000, (mesh: THREE.Mesh) => {
                mesh.position = task.pathPositions[0];
                mesh.quaternion = task.pathRotations[0];
                this.robot = mesh;
                this.scene.add(mesh);
            });

            task["obstacleFilenames"].forEach(obstacle => {
                ModelLoader.load("envs/" + obstacle, 0xdddddd, (mesh: THREE.Mesh) => {
                    mesh.position = task.obstaclePosition;
                    this.scene.add(mesh);
                })
            });

            this.task = task;
            this.maxCfg = task.pathPositions.length - 1;
            this.currentCfg = 0;

            requestAnimationFrame(this.animate);
        });
    }

    private onWheel(e: any) {
        var d = Math.max(-1, Math.min(1, -e.wheelDelta || e.detail));
        this.zoom += d * 25;

        if (this.zoom < 500) {
            this.zoom = 500;
        }
        if (this.zoom > 2000) {
            this.zoom = 2000;
        }
    }

    private animate() {
        requestAnimationFrame(this.animate);
        this.update();
        this.render();
    }

    private update() {
        this.robot.position = this.task.pathPositions[Math.abs(this.currentCfg)];
        this.robot.quaternion = this.task.pathRotations[Math.abs(this.currentCfg)];
        
        ++this.currentCfg;
        if (this.currentCfg >= this.maxCfg) {
            this.currentCfg = -this.maxCfg;
        }

        this.camera.position.set(0, 0, this.zoom)
            .applyQuaternion(this.trackball.getRotation());
        this.camera.quaternion = this.trackball.getRotation().clone();
    }

    private render() {
        this.renderer.render(this.scene, this.camera);
    }
}

window.onload = () => {
    var viewer: Viewer = new Viewer();
}
