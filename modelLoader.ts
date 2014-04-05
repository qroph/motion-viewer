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
module ModelLoader {
    export function load(filename: string, color: number, callback: (mesh: THREE.Mesh) => void) {
        var req: XMLHttpRequest = new XMLHttpRequest();

        req.onload = (e: Event) => {
            var mesh: THREE.Mesh = parseModel((<XMLHttpRequest>e.target).responseText, color);
            callback(mesh);
        };

        req.open("GET", filename, true);
        req.send();
    }

    function parseModel(text: string, color: number): THREE.Mesh {
        var geometry: THREE.Geometry = new THREE.Geometry();

        var lines: string[] = text.split("\n");
        for (var i: number = 0; i < lines.length; ++i) {
            var line: string = lines[i].trim();

            if (line.length === 0 || line.charAt(0) === "#") {
                continue;
            }

            var items: string[] = line.split(' ');
            if (items[0] === "v" && items.length === 4) {
                geometry.vertices.push(new THREE.Vector3(
                    parseFloat(items[1]),
                    parseFloat(items[2]),
                    parseFloat(items[3])));
            } else if (items[0] === "f" && items.length === 4) {
                geometry.faces.push(new THREE.Face3(
                    parseInt(items[1].split('/')[0]) - 1,
                    parseInt(items[2].split('/')[0]) - 1,
                    parseInt(items[3].split('/')[0]) - 1));
            }
        }

        geometry.computeCentroids();
        geometry.computeFaceNormals();
        geometry.computeBoundingSphere();

        var mesh: THREE.Mesh = 
            new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: color }));
        
        return mesh;
    }
}
 