// Generated by BUCKLESCRIPT VERSION 5.0.4, PLEASE EDIT WITH CARE
'use strict';

var Curry = require("bs-platform/lib/js/curry.js");
var CamlinternalOO = require("bs-platform/lib/js/camlinternalOO.js");

var class_tables = [
  0,
  0,
  0
];

var class_tables$1 = [
  0,
  0,
  0
];

function createShader(gl, sType, source) {
  if (sType) {
    if (!class_tables$1[0]) {
      var $$class = CamlinternalOO.create_table(0);
      var env = CamlinternalOO.new_variable($$class, "");
      var env_init = function (env$1) {
        var self = CamlinternalOO.create_object_opt(0, $$class);
        self[env] = env$1;
        return self;
      };
      CamlinternalOO.init_class($$class);
      class_tables$1[0] = env_init;
    }
    return Curry._1(class_tables$1[0], 0);
  } else {
    if (!class_tables[0]) {
      var $$class$1 = CamlinternalOO.create_table(0);
      var env$1 = CamlinternalOO.new_variable($$class$1, "");
      var env_init$1 = function (env$2) {
        var self = CamlinternalOO.create_object_opt(0, $$class$1);
        self[env$1] = env$2;
        return self;
      };
      CamlinternalOO.init_class($$class$1);
      class_tables[0] = env_init$1;
    }
    return Curry._1(class_tables[0], 0);
  }
}

function init(gl) {
  console.log("ready");
  return /* () */0;
}

var canvasNode = "webgl-canvas";

function setupContext(canvas) {
  var match = canvas.getContext("webgl2");
  if (match !== null) {
    console.log("ready");
    return /* () */0;
  } else {
    console.log("webgl2 context could not be created");
    return /* () */0;
  }
}

var match = document.getElementById(canvasNode);

if (match !== null) {
  setupContext(match);
} else {
  console.log("webgl-canvas element not found");
}

exports.createShader = createShader;
exports.init = init;
exports.canvasNode = canvasNode;
exports.setupContext = setupContext;
/* match Not a pure module */
