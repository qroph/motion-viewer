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
module TaskLoader {
    export interface Task {
        robotFilename?: string;
        obstacleFilenames?: string[];
        obstaclePosition?: THREE.Vector3;
        pathPositions?: THREE.Vector3[];
        pathRotations?: THREE.Quaternion[];
    }

    export function load(taskFilename: string, pathFilename: string, callback: (task: Task) => void) {
        task = {};

        var reqTask: XMLHttpRequest = new XMLHttpRequest();
        var reqPath: XMLHttpRequest = new XMLHttpRequest();

        reqTask.onload = (e: Event) => {
            parseTask((<XMLHttpRequest>e.target).responseText);
            reqPath.open("GET", pathFilename, true);
            reqPath.send();
        };

        reqPath.onload = (e: Event) => {
            parsePath((<XMLHttpRequest>e.target).responseText);
            callback(task);
        };

        reqTask.open("GET", taskFilename, true);
        reqTask.send();
    }

    function parseTask(text: string) {
        var lines: string[] = text.split("\n");
        for (var i: number = 0; i < lines.length; ++i) {
            var line: string = lines[i].trim();

            if (line.length === 0 || line.charAt(0) === ";") {
                continue;
            }

            var items: string[] = line.split(' ');
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

        task.obstaclePosition = 
            new THREE.Vector3(-(minX + maxX) / 2, -(minY + maxY) / 2, -(minZ + maxZ) / 2);
    }

    function parsePath(text: string) {
        task.pathPositions = [];
        task.pathRotations = [];

        var lines: string[] = text.split("\n");
        for (var i: number = 0; i < lines.length; ++i) {
            var line: string = lines[i].trim();

            if (line.length === 0) {
                continue;
            }

            var items: string[] = line.split(' ');
            if (items.length === 7) {
                task.pathPositions.push(new THREE.Vector3(
                    parseFloat(items[0]) - (minX + maxX) / 2,
                    parseFloat(items[1]) - (minY + maxY) / 2,
                    parseFloat(items[2]) - (minZ + maxZ) / 2));
                task.pathRotations.push(new THREE.Quaternion(
                    parseFloat(items[4]),
                    parseFloat(items[5]),
                    parseFloat(items[6]),
                    parseFloat(items[3])));
            }
        }
    }

    var task: Task;
    var minX: number;
    var minY: number;
    var minZ: number;
    var maxX: number;
    var maxY: number;
    var maxZ: number;
}
  