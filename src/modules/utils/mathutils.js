import numeric from "numeric";

export function nextPow2(v) {
  v -= 1;
  var p = 2;
  while (v >>= 1) { p <<= 1; }
  return p;
}

export function predict(features, weights) {
  if (features.length !== weights.length) {
    throw new Error(
      "features and weights must be equal in length. " +
      "Features length: " + features.length + ". Weights length: " + weights.length
    );
  }
  var sum = 0;
  for (var i = 0; i < features.length; i++) {
    sum += features[i] * weights[i];
  }
  return sum;
}

export function mapToScale(value, sourceMin, sourceMax, destMin, destMax) {
  return (value - sourceMin) / (sourceMax - sourceMin) * (destMax - destMin) + destMin;
}

export function findPeaks(values, numPeaks) {
  var peaks = [];
  for (var i = 1; i < values.length - 1 && peaks.length < numPeaks; i++) {
    var previousNum = values[i - 1] || -Infinity;
    var currentNum = values[i];
    var nextNum = values[i + 1] || -Infinity;
    if (currentNum > previousNum && currentNum > nextNum) {
      peaks.push(i);
    }
  }
  return peaks;
}

export function arrayAbs(y) {
  for (var i = 0; i < y.length; i++) {
    y[i] = Math.abs(y[i]);
  }
  return y;
}

export function negArrayAddValue(y, value) {
  for (var i = 0; i < y.length; i++) {
    y[i] = -y[i] + value;
  }
  return y;
}

export function addToArray(y, value) {
  for (var i = 0; i < y.length; i++) {
    y[i] = y[i] + value;
  }
  return y;
}

export function concatenate() {
  var p = [];
  for (var i = 0; i < arguments.length; i++) {
    for (var j = 0; j < arguments[i].length; j++) {
      p.push(arguments[i][j]);
    }
  }
  return p;
}

export function flipArray(y) {
  var p = [];
  for (var i = y.length - 1; i > -1; i--) {
    p.push(y[i]);
  }
  return p;
}

/**
 * Finds the pseudo-inverse of the given matrix via SVD.
 * Requires the numeric library.
 */
export function pinv(A) {
  var z = numeric.svd(A), foo = z.S[0];
  var U = z.U, S = z.S, V = z.V;
  var m = A.length, n = A[0].length, tol = Math.max(m, n) * numeric.epsilon * foo, M = S.length;
  var Sinv = new Array(M);
  for (var i = M - 1; i !== -1; i--) {
    Sinv[i] = S[i] > tol ? 1 / S[i] : 0;
  }
  return numeric.dot(numeric.dot(V, numeric.diag(Sinv)), numeric.transpose(U));
}
