/// <reference path="typings/three.d.ts" />
var WIDTH = 500;
var HEIGHT = 500;

var Viewer = (function () {
    function Viewer() {
        this.prevTimestamp = null;
        this.scene = new THREE.Scene();

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(WIDTH, HEIGHT);
        this.renderer.setClearColor(0xeeeeee);

        document.body.appendChild(this.renderer.domElement);

        var geometry = new THREE.TorusKnotGeometry(400, 50, 100, 16);
        var material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        this.robot = new THREE.Mesh(geometry, material);

        var light = new THREE.DirectionalLight(0xffffff);
        light.position.set(-1000, 1000, 0);

        this.scene.add(this.robot);
        this.scene.add(light);

        this.camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 10000);
        this.camera.position.set(-1000, 1000, 0);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    }
    Viewer.prototype.animate = function (timestamp) {
        this.render();

        if (this.prevTimestamp) {
        }
        this.update();
        this.prevTimestamp = timestamp;
    };

    Viewer.prototype.render = function () {
        this.renderer.render(this.scene, this.camera);
    };

    Viewer.prototype.update = function () {
        this.robot.rotation.x += 0.03;
        this.robot.rotation.y += 0.02;
    };
    return Viewer;
})();

window.onload = function () {
    var viewer = new Viewer();

    function viewerLoop(timestamp) {
        requestAnimationFrame(viewerLoop);
        viewer.animate(timestamp);
    }
    requestAnimationFrame(viewerLoop);
};
//# sourceMappingURL=app.js.map
