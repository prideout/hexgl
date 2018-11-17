"use strict";
exports.__esModule = true;
var typed_web_workers_1 = require("typed-web-workers");
function workFn(input, callback) {
    callback(input.x + input.y);
}
function logFn(result) {
    console.log("We received this response from the worker: " + result);
}
var typedWorker = typed_web_workers_1.createWorker(workFn, logFn);
typedWorker.postMessage({ x: 5, y: 5 });
