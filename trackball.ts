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
class Trackball {
    private camera: THREE.Camera;
    private element: HTMLElement;

    private currentRotation: THREE.Quaternion;
    private oldRotation: THREE.Quaternion;
    private dragStartPos: THREE.Vector3;

    constructor(camera: THREE.Camera, element: HTMLElement) {
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
    public getRotation(): THREE.Quaternion {
        return this.currentRotation;
    }

    public setRotation(rotation: THREE.Quaternion) {
        rotation.normalize();
        this.oldRotation = rotation;
        this.currentRotation = rotation;
    }

    private onMouseDown(e: MouseEvent) {
        this.element.addEventListener("mousemove", this.onMouseMove);
        e.preventDefault();

        var rect = this.element.getBoundingClientRect();
        this.dragStartPos = this.calculatePoint(e.clientX - rect.left, e.clientY - rect.top);
    }

    private onMouseUp(e: MouseEvent) {
        this.element.removeEventListener("mousemove", this.onMouseMove);
        e.preventDefault();

        this.oldRotation = this.currentRotation.clone();
    }

    private onMouseMove(e: MouseEvent) {
        e.preventDefault();

        var rect = this.element.getBoundingClientRect();
        var p: THREE.Vector3 = this.calculatePoint(e.clientX - rect.left, e.clientY - rect.top);
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
            p.z = 1.0 / (2 * p.length());
            p.normalize();
        }

        return p;
    }
} 
