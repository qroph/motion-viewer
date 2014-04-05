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
// Implements a simple virtual trackball
var Trackball = (function () {
    function Trackball(camera, element) {
        this.camera = camera;
        this.element = element;

        this.setRotation(new THREE.Quaternion(0, 0, 0, 1));
        this.dragStartPos = new THREE.Vector3(0, 0, 0);

        // Setup event listeners
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.element.addEventListener("mousedown", this.onMouseDown, false);
        this.element.addEventListener("mouseup", this.onMouseUp, false);
        this.element.addEventListener("mouseleave", this.onMouseUp, false);
    }
    // Returns a rotation quaternion
    Trackball.prototype.getRotation = function () {
        return this.currentRotation;
    };

    Trackball.prototype.setRotation = function (rotation) {
        rotation.normalize();
        this.oldRotation = rotation;
        this.currentRotation = rotation;
    };

    Trackball.prototype.onMouseDown = function (e) {
        this.element.addEventListener("mousemove", this.onMouseMove);
        e.preventDefault();

        var rect = this.element.getBoundingClientRect();
        this.dragStartPos = this.calculatePoint(e.clientX - rect.left, e.clientY - rect.top);
    };

    Trackball.prototype.onMouseUp = function (e) {
        this.element.removeEventListener("mousemove", this.onMouseMove);
        e.preventDefault();

        this.oldRotation = this.currentRotation.clone();
    };

    Trackball.prototype.onMouseMove = function (e) {
        e.preventDefault();

        var rect = this.element.getBoundingClientRect();
        var p = this.calculatePoint(e.clientX - rect.left, e.clientY - rect.top);
        var d = p.dot(this.dragStartPos);
        p.cross(this.dragStartPos);

        this.currentRotation = this.oldRotation.clone().multiply(new THREE.Quaternion(p.x, p.y, p.z, d)).normalize();
    };

    Trackball.prototype.calculatePoint = function (x, y) {
        var p = new THREE.Vector3((x / this.element.offsetWidth) * 2 - 1, -((y / this.element.offsetHeight) * 2 - 1), 0);

        if (p.lengthSq() <= 0.5) {
            p.z = Math.sqrt(1 - p.lengthSq());
        } else {
            p.z = 1.0 / (2 * p.length());
            p.normalize();
        }

        return p;
    };
    return Trackball;
})();
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
// Loads and parses simple .obj files
var ModelLoader;
(function (ModelLoader) {
    function load(filename, color, callback) {
        var req = new XMLHttpRequest();

        req.onload = function (e) {
            var mesh = parseModel(e.target.responseText, color);
            callback(mesh);
        };

        req.open("GET", filename, true);
        req.send();
    }
    ModelLoader.load = load;

    function parseModel(text, color) {
        var geometry = new THREE.Geometry();

        var lines = text.split("\n");
        for (var i = 0; i < lines.length; ++i) {
            var line = lines[i].trim();

            if (line.length === 0 || line.charAt(0) === "#") {
                continue;
            }

            var items = line.split(' ');
            if (items[0] === "v" && items.length === 4) {
                geometry.vertices.push(new THREE.Vector3(parseFloat(items[1]), parseFloat(items[2]), parseFloat(items[3])));
            } else if (items[0] === "f" && items.length === 4) {
                geometry.faces.push(new THREE.Face3(parseInt(items[1].split('/')[0]) - 1, parseInt(items[2].split('/')[0]) - 1, parseInt(items[3].split('/')[0]) - 1));
            }
        }

        geometry.computeCentroids();
        geometry.computeFaceNormals();
        geometry.computeBoundingSphere();

        var mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: color }));

        return mesh;
    }
})(ModelLoader || (ModelLoader = {}));
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
// Loads and parses task and path files
var TaskLoader;
(function (TaskLoader) {
    function load(taskFilename, pathFilename, callback) {
        task = {};

        var reqTask = new XMLHttpRequest();
        var reqPath = new XMLHttpRequest();

        reqTask.onload = function (e) {
            parseTask(e.target.responseText);
            reqPath.open("GET", pathFilename, true);
            reqPath.send();
        };

        reqPath.onload = function (e) {
            parsePath(e.target.responseText);
            callback(task);
        };

        reqTask.open("GET", taskFilename, true);
        reqTask.send();
    }
    TaskLoader.load = load;

    function parseTask(text) {
        var lines = text.split("\n");
        for (var i = 0; i < lines.length; ++i) {
            var line = lines[i].trim();

            if (line.length === 0 || line.charAt(0) === ";") {
                continue;
            }

            var items = line.split(' ');
            if (items[0] === "robotFilename" && items.length === 3) {
                task.robotFilename = items[2];
            } else if (items[0] === "obstacleFilenames" && items.length >= 3) {
                items.splice(0, 2);
                task.obstacleFilenames = items;
            } else if (items[0] === "minX" && items.length === 3) {
                minX = parseFloat(items[2]);
            } else if (items[0] === "minY" && items.length === 3) {
                minY = parseFloat(items[2]);
            } else if (items[0] === "minZ" && items.length === 3) {
                minZ = parseFloat(items[2]);
            } else if (items[0] === "maxX" && items.length === 3) {
                maxX = parseFloat(items[2]);
            } else if (items[0] === "maxY" && items.length === 3) {
                maxY = parseFloat(items[2]);
            } else if (items[0] === "maxZ" && items.length === 3) {
                maxZ = parseFloat(items[2]);
            }
        }

        task.obstaclePosition = new THREE.Vector3(-(minX + maxX) / 2, -(minY + maxY) / 2, -(minZ + maxZ) / 2);
    }

    function parsePath(text) {
        task.pathPositions = [];
        task.pathRotations = [];

        var lines = text.split("\n");
        for (var i = 0; i < lines.length; ++i) {
            var line = lines[i].trim();

            if (line.length === 0) {
                continue;
            }

            var items = line.split(' ');
            if (items.length === 7) {
                task.pathPositions.push(new THREE.Vector3(parseFloat(items[0]) - (minX + maxX) / 2, parseFloat(items[1]) - (minY + maxY) / 2, parseFloat(items[2]) - (minZ + maxZ) / 2));
                task.pathRotations.push(new THREE.Quaternion(parseFloat(items[4]), parseFloat(items[5]), parseFloat(items[6]), parseFloat(items[3])));
            }
        }
    }

    var task;
    var minX;
    var minY;
    var minZ;
    var maxX;
    var maxY;
    var maxZ;
})(TaskLoader || (TaskLoader = {}));
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

var Viewer = (function () {
    function Viewer() {
        this.obstacles = [];
        var canvas = document.getElementById("content");

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
    Viewer.prototype.showTask = function (config) {
        var _this = this;
        if (this.loadingTask) {
            return;
        }

        // Initialize and remove previous models
        this.loadingTask = true;
        this.animating = false;
        this.zoom = config.initialZoom;
        this.trackball.setRotation(config.initialRotation);
        this.scene.remove(this.robot);
        this.obstacles.forEach(function (c) {
            return _this.scene.remove(c);
        });
        this.obstacles = [];

        var remainingModels;

        var finished = function () {
            --remainingModels;
            if (remainingModels === 0) {
                // Start animation
                this.loadingTask = false;
                this.animating = true;
            }
        };
        finished = finished.bind(this);

        // Load the task
        TaskLoader.load(config.taskFilename, config.pathFilename, function (task) {
            _this.task = task;
            _this.maxCfg = task.pathPositions.length - 1;
            _this.currentCfg = 0;
            remainingModels = 1 + task.obstacleFilenames.length;

            // Load a robot
            ModelLoader.load(config.modelDirectory + task.robotFilename, 0xff0000, function (mesh) {
                mesh.position = task.pathPositions[0];
                mesh.quaternion = task.pathRotations[0];
                _this.robot = mesh;
                _this.scene.add(mesh);
                finished();
            });

            // Load obstacles
            task.obstacleFilenames.forEach(function (obstacle) {
                ModelLoader.load(config.modelDirectory + obstacle, 0xdddddd, function (mesh) {
                    mesh.position = task.obstaclePosition;
                    _this.obstacles.push(mesh);
                    _this.scene.add(mesh);
                    finished();
                });
            });
        });
    };

    Viewer.prototype.onWheel = function (e) {
        var d = Math.max(-1, Math.min(1, -e.wheelDelta || e.detail));
        this.zoom += d * 25;

        if (this.zoom < 100) {
            this.zoom = 100;
        }
        if (this.zoom > 2000) {
            this.zoom = 2000;
        }

        e.preventDefault();
    };

    Viewer.prototype.animate = function () {
        requestAnimationFrame(this.animate);

        if (this.animating) {
            this.update();
            this.render();
        }
    };

    Viewer.prototype.update = function () {
        this.robot.position = this.task.pathPositions[Math.abs(this.currentCfg)];
        this.robot.quaternion = this.task.pathRotations[Math.abs(this.currentCfg)];

        ++this.currentCfg;
        if (this.currentCfg >= this.maxCfg) {
            this.currentCfg = -this.maxCfg;
        }

        this.camera.position.set(0, 0, this.zoom).applyQuaternion(this.trackball.getRotation());
        this.camera.quaternion = this.trackball.getRotation().clone();
    };

    Viewer.prototype.render = function () {
        this.renderer.render(this.scene, this.camera);
    };
    return Viewer;
})();

window.onload = function () {
    var viewer = new Viewer();
    var combo = document.getElementById("combo");

    function changeEnvironment() {
        var value = combo.options[combo.selectedIndex].value;
        switch (value) {
            case "asteroids":
                viewer.showTask({
                    taskFilename: "examples/asteroids/task.ini",
                    pathFilename: "examples/asteroids/path.txt",
                    modelDirectory: "examples/asteroids/",
                    initialZoom: 650,
                    initialRotation: new THREE.Quaternion(0.7071, 0, 0, 0.7071) });
                break;

            case "house":
                viewer.showTask({
                    taskFilename: "examples/house/task.ini",
                    pathFilename: "examples/house/path.txt",
                    modelDirectory: "examples/house/",
                    initialZoom: 1000,
                    initialRotation: new THREE.Quaternion(0.6126, -0.1320, -0.1504, 0.7646) });
                break;

            case "wall":
                viewer.showTask({
                    taskFilename: "examples/wall/task.ini",
                    pathFilename: "examples/wall/path.txt",
                    modelDirectory: "examples/wall/",
                    initialZoom: 300,
                    initialRotation: new THREE.Quaternion(0.7044, -0.0616, -0.0616, 0.7044) });
                break;
        }
    }

    combo.addEventListener("change", changeEnvironment, false);
    changeEnvironment();
};
//# sourceMappingURL=viewer.js.map
