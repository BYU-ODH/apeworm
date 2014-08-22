/**
 * @namespace
 */
var numeric = {};

/**
 * @param {Array.<Array.<number>>} a
 * @return {{
 *  S: Array.<number>, 
 *  U: Array.<number>,
 *  V: Array.<number>
 * }}
 */
numeric.svd = function(a){};

/**
 * @type number
 */
numeric.epsilon;

/**
 * @param {Array.<number>|Array.<Array.<number>>} A
 * @param {Array.<number>|Array.<Array.<number>>} B
 * @return {Array.<Array.<number>>}
 */
numeric.dot = function(A,B){};

/**
 * @param {Array.<number>|Array.<Array.<number>>} A
 * @return {Array.<Array.<number>>}
 */
numeric.diag = function(A){};

/**
 * @param {Array.<number>|Array.<Array.<number>>} A
 * @return {Array.<number>|Array.<Array.<number>>}
 */
numeric.transpose = function(A){};
