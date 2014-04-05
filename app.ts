/*
Copyright (c) 2014 Mika Rantanen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/// <reference path="typings/three.d.ts" />
/// <reference path="trackball.ts" />
/// <reference path="modelLoader.ts" />
/// <reference path="taskLoader.ts" />

var WIDTH = 800;
var HEIGHT = 600;

interface Config {
    taskFilename: string;
    pathFilename: string;
    modelDirectory: string;
    initialZoom: number;
    initialRotation: THREE.Quaternion;
}

class Viewer {
    private scene: THREE.Scene;
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private robot: THREE.Mesh;
    private obstacles: THREE.Mesh[] = [];
    
    private trackball: Trackball;
    private zoom: number;
    private task: TaskLoader.Task;
    private currentCfg: number;
    private maxCfg: number;
    private animating: boolean;
    private loadingTask: boolean;
    
    constructor() {
        var canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("content");

        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.renderer.setClearColor(0xffffff);
        this.renderer.setSize(WIDTH, HEIGHT);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(30, WIDTH / HEIGHT, 0.1, 10000);

        // Create a virtual trackball
        this.trackball = new Trackball(this.camera, this.renderer.domElement);

        // Add lights to the scene
        var light1 = new THREE.DirectionalLight(0xffffff);
        light1.position.set(1, 2, 0.5).normalize();
        this.scene.add(light1);

        var light2 = new THREE.DirectionalLight(0xffffff);
        light2.position.set(-1, -2, 1).normalize();
        this.scene.add(light2);

        var ambientLight = new THREE.AmbientLight(0x222222);
        this.scene.add(ambientLight);

        // Add events for mouse wheel zooming
        this.onWheel = this.onWheel.bind(this);
        this.renderer.domElement.addEventListener("mousewheel", this.onWheel, false);
        this.renderer.domElement.addEventListener("DOMMouseScroll", this.onWheel, false);

        this.loadingTask = false;
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    showTask(config: Config) {
        if (this.loadingTask) {
            return;
        }

        // Initialize and remove previous models
        this.loadingTask = true;
        this.animating = false;
        this.zoom = config.initialZoom;
        this.trackball.setRotation(config.initialRotation);
        this.scene.remove(this.robot);
        this.obstacles.forEach(c => this.scene.remove(c));
        this.obstacles = [];

        var remainingModels: number;

        var finished = function() {
            --remainingModels;
            if (remainingModels === 0) {
                // Start animation
                this.loadingTask = false;
                this.animating = true;
            }
        }
        finished = finished.bind(this);

        // Load the task
        TaskLoader.load(config.taskFilename, config.pathFilename, (task: TaskLoader.Task) => {
            this.task = task;
            this.maxCfg = task.pathPositions.length - 1;
            this.currentCfg = 0;
            remainingModels = 1 + task.obstacleFilenames.length;
            
            // Load a robot
            ModelLoader.load(config.modelDirectory + task.robotFilename, 0xff0000, (mesh: THREE.Mesh) => {
                mesh.position = task.pathPositions[0];
                mesh.quaternion = task.pathRotations[0];
                this.robot = mesh;
                this.scene.add(mesh);
                finished();
            });

            // Load obstacles
            task.obstacleFilenames.forEach((obstacle: string) => {
                ModelLoader.load(config.modelDirectory + obstacle, 0xdddddd, (mesh: THREE.Mesh) => {
                    mesh.position = task.obstaclePosition;
                    this.obstacles.push(mesh);
                    this.scene.add(mesh);
                    finished();
                })
            });
        });
    }

    private onWheel(e: any) {
        var d = Math.max(-1, Math.min(1, -e.wheelDelta || e.detail));
        this.zoom += d * 25;

        if (this.zoom < 100) {
            this.zoom = 100;
        }
        if (this.zoom > 2000) {
            this.zoom = 2000;
        }

        e.preventDefault();
    }

    private animate() {
        requestAnimationFrame(this.animate);

        if (this.animating) {
            this.update();
            this.render();
        }
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
    var combo: HTMLSelectElement = <HTMLSelectElement>document.getElementById("combo");

    function changeEnvironment() {
        var value = combo.options[combo.selectedIndex].value;
        switch (value) {
            case "asteroids":
                viewer.showTask({ taskFilename: "examples/asteroids/task.ini",
                                  pathFilename: "examples/asteroids/path.txt",
                                  modelDirectory: "examples/asteroids/",
                                  initialZoom: 650,
                                  initialRotation: new THREE.Quaternion(0.7071, 0, 0, 0.7071) });
                break;

            case "house":
                viewer.showTask({ taskFilename: "examples/house/task.ini",
                                  pathFilename: "examples/house/path.txt",
                                  modelDirectory: "examples/house/",
                                  initialZoom: 1000,
                                  initialRotation: new THREE.Quaternion(0.6126, -0.1320, -0.1504, 0.7646) });
                break;

            case "wall":
                viewer.showTask({ taskFilename: "examples/wall/task.ini",
                                  pathFilename: "examples/wall/path.txt",
                                  modelDirectory: "examples/wall/",
                                  initialZoom: 300,
                                  initialRotation: new THREE.Quaternion(0.7044, -0.0616, -0.0616, 0.7044) });
                break;
        }
    }

    combo.addEventListener("change", changeEnvironment, false);
    changeEnvironment();
}
