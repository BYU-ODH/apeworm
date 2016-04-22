(function(numeric){
    "use strict";

    /**
     * @namespace
     * @const
     * @ignore
     */
    var MathUtils = {};

    /**
     * @namespace
     * @name VowelWorm
     */
    window.MathUtils = MathUtils;

    /**
     * Extends Math class to include log10
     * @type {Function|*}
     */
    Math.log10 = Math.log10 || function (x) {
        return Math.log(x) / Math.LN10;
    }

    /**
     * Returns the next power of 2 number above the given value
     * http://stackoverflow.com/questions/26965171/fast-nearest-power-of-2-in-javascript
     */
    MathUtils.nextPow2 = function(v) {
        v -= 1;
        var p = 2;
        while (v >>= 1) {p <<= 1;}
        return p;
    }

    /**
     * Predicts an output using linear regression with the given features and weights.
     */
    MathUtils.predict = function(features, weights) {
        if (features.length !== weights.length) {
            throw new Error("features and weights must be equal in " +
                "length when using the regression prediction method. " +
                "Features length: " + features.length + ". Weights length: " +
                weights.length);
        }
        var sum = 0;
        for (var i = 0; i < features.length; i++) {
            sum += features[i] * weights[i];
        }
        return sum;
    }

    /**
     *  Maps a value from an old scale to a new scale.
     */
    MathUtils.mapToScale = function(value, sourceMin, sourceMax, destMin, destMax) {
        return (value - sourceMin) / (sourceMax - sourceMin) * (destMax - destMin) + destMin;
    }

    /**
     * Finds the positions of first specified number of peaks of the curve.
     * Assumes the first and last values are not a peak.
     * @param {Array.<number>} values
     * @param {number} numPeaks the number of peaks to search for
     * @return {Array.<number>} the positions of all the peaks found, in Hz
     * @memberof VowelWorm.instance
     * @private
     */
    MathUtils.findPeaks = function (values, numPeaks) {
        var peaks = [];
        var previousNum;
        var currentNum;
        var nextNum;

        for (var i = 1; i < values.length - 1 && peaks.length < numPeaks; i++) {

            previousNum = values[i - 1] || -Infinity;
            currentNum = values[i];
            nextNum = values[i + 1] || -Infinity;

            if (currentNum > previousNum && currentNum > nextNum) {
                peaks.push(i);
            }
        }
        return peaks;
    };

    /**
     * Iterates through an array, applying the absolute value to each item
     * @param {Array.<number>} y The array to map
     * @return {Array.<number>} the original array, transformed
     */
    MathUtils.arrayAbs = function(y) {
        for (var i = 0; i < y.length; i++) {
            y[i] = Math.abs(y[i]);
        }
        return y;
    };

    /**
     * Iterates through an array, inverting each item and adding a given number
     * @param {Array.<number>} y The array to map
     * @param {number} value the amount to add to each inverted item of the array
     * @return {Array.<number>} the original array, transformed
     */
    MathUtils.negArrayAddValue = function(y, value) {
        for (var i = 0; i < y.length; i++) {
            y[i] = -y[i] + value;
        }
        return y;
    };

    /**
     * Iterates through an array, adding the given value to each item
     * @param {Array.<number>} y The array to map
     * @param {number} value the amount to add to each each item in the array
     * @return {Array.<number>} the original array, transformed
     */
    MathUtils.addToArray = function(y, value) {
        for (var i = 0; i < y.length; i++) {
            y[i] = y[i] + value;
        }
        return y;
    };

    /**
     * Combines numeric arrays together
     * @param {...Array.<number>} args any number of arrays to join together
     * @return {Array.<number>} a new array combining all submitted values
     * @nosideeffects
     */
    MathUtils.concatenate = function(args) {
        var p = new Array();
        for (var i = 0; i < arguments.length; i++) {
            for (var j = 0; j < arguments[i].length; j++) {
                p.push(arguments[i][j]);
            }
        }
        return p;
    };

    /**
     * Reverses an array
     * @param {Array.<number>} y The array to reverse
     * @return {Array.<number>} p A copy of the passed-in array, reversed
     */
    MathUtils.flipArray = function(y) {
        var p = new Array();
        for (var i = y.length - 1; i > -1; i--) {
            p.push(y[i]);
        }
        return p;
    };

    /**
     * @license
     *
     * Psuedo-inverse function from Sébastien Loisel, found in a Google Groups
     * discussion {@link https://groups.google.com/d/msg/numericjs/spFVVp1Fy60/6wuN3-vl1IkJ}
     * Sébastien linked to work he had done in the NumericJS Workshop, found here
     * {@link http://www.numericjs.com/workshop.php?link=aacea378e9958c51af91f9eadd5bc7446e0c4616fc7161b384e5ca6d4ec036c7}
     *
     */
    /**
     * Finds the pseudo-inverse of the given array
     * Requires NumericJS to be loaded
     * @param {Array.<Array.<number>>} A The array to apply the psuedo-inverse to
     * @return {Array.<Array.<number>>} The psuedo-inverse applied to the array
     */
    MathUtils.pinv = function(A) {
        var z = numeric.svd(A), foo = z.S[0];
        var U = z.U, S = z.S, V = z.V;
        var m = A.length, n = A[0].length, tol = Math.max(m, n) * numeric.epsilon * foo, M = S.length;
        var i, Sinv = new Array(M);
        for (i = M - 1; i !== -1; i--) {
            if (S[i] > tol) Sinv[i] = 1 / S[i]; else Sinv[i] = 0;
        }
        return numeric.dot(numeric.dot(V, numeric.diag(Sinv)), numeric.transpose(U))
    };

}(window.numeric));