/// <reference path="typings/three.d.ts" />

// Implements a simple virtual trackball
class Trackball {
    private camera: THREE.Camera;
    private element: HTMLElement;

    private currentRotation: THREE.Quaternion;
    private oldRotation: THREE.Quaternion;
    private dragStartPos: THREE.Vector3;

    constructor(camera: THREE.Camera, element: HTMLElement) {
        this.camera = camera;
        this.element = element;

        this.oldRotation = new THREE.Quaternion(0, 0, 0, 1);
        this.currentRotation = new THREE.Quaternion(0, 0, 0, 1);
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
    public getRotation(): THREE.Quaternion {
        return this.currentRotation;
    }

    private onMouseDown(e: MouseEvent) {
        this.element.addEventListener("mousemove", this.onMouseMove);
        e.preventDefault();

        this.dragStartPos = this.calculatePoint(e.clientX, e.clientY);
    }

    private onMouseUp(e: MouseEvent) {
        this.element.removeEventListener("mousemove", this.onMouseMove);
        e.preventDefault();

        this.oldRotation = this.currentRotation.clone();
    }

    private onMouseMove(e: MouseEvent) {
        e.preventDefault();

        var p: THREE.Vector3 = this.calculatePoint(e.clientX, e.clientY);
        var d = p.dot(this.dragStartPos);
        p.cross(this.dragStartPos);

        this.currentRotation = this.oldRotation.clone()
            .multiply(new THREE.Quaternion(p.x, p.y, p.z, d)).normalize();
    }

    private calculatePoint(x: number, y: number) {
        var p: THREE.Vector3 = new THREE.Vector3(
            (x / this.element.offsetWidth) * 2 - 1,
            -((y / this.element.offsetHeight) * 2 - 1),
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
} 
