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
 