/**
 * @namespace
 */
var PIXI = {};

/**
 * @namespace
 */
PIXI.Sprite = {};

/**
 * @constructor
 */
PIXI.DisplayObjectContainer = function(){};

PIXI.DisplayObjectContainer.prototype.addChild = function(something){};
PIXI.DisplayObjectContainer.prototype.removeChild = function(something){};
PIXI.DisplayObjectContainer.prototype.children = [];


/**
 * @param {string} url
 * @return sprite
 * @constructor
 */
PIXI.Sprite.fromImage = function(url){};


PIXI.Sprite.fromImage.prototype.position = {x: null, y: null};
/**
 * @type number
 */
PIXI.Sprite.fromImage.prototype.tint;


/**
 * @constructor
 * @param {string|number} str
 * @param {Object} conf
 */
PIXI.Text = function(str, conf){};

/**
 * @type number
 */
PIXI.Text.prototype.width;

/**
 * @type number
 */
PIXI.Text.prototype.height;

PIXI.Text.prototype.position = {x: null, y: null};

/**
 * @name Stage
 * @constructor
 * @param {number} bgcolor
 */
PIXI.Stage = function(bgcolor){};

/**
 * @name Stage
 * @constructor
 */
PIXI.Graphics = function(){};

/**
 * @param {number} x
 * @param {number} y
 */
PIXI.Graphics.prototype.lineTo = function(x,y){};

/**
 * @param {number} size
 * @param {number} color
 */
PIXI.Graphics.prototype.lineStyle = function(size,color){};

/**
 * @param {number} x
 * @param {number} y
 */
PIXI.Graphics.prototype.moveTo = function(x,y){};

PIXI.Stage.prototype.addChild = function(item){};
PIXI.Stage.prototype.removeChild = function(item){};

/**
 * @constructor
 */
var renderer = function(){};

/**
 * @param {PIXI.Stage} stage
 */
renderer.prototype.render = function(stage){};

/**
 * @param {number} width
 * @param {number} height
 * @return renderer
 */
PIXI.autoDetectRenderer = function(width, height){};
