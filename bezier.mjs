import * as turf from '@turf/turf';

const from = [79.8612, 6.9271]; // Colombo
const to = [80.8251, 6.4632]; // Udawalawe

const line = turf.lineString([from, to]);
const length = turf.length(line);
const midpoint = turf.midpoint(from, to);
const bearing = turf.bearing(from, to);

const offsetDistance = length * 0.2;
const controlPoint = turf.destination(midpoint, offsetDistance, bearing - 90);

const curvedLine = turf.bezierSpline(turf.lineString([
  from,
  controlPoint.geometry.coordinates,
  to
]));

console.log("Points:", curvedLine.geometry.coordinates.length);
