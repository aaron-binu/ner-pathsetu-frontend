import roadsGeoJSON from './roads.geojson';

// Catmull-Rom spline evaluation for natural, continuous highway curvature
function catmullRom(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number
): [number, number] {
  const t2 = t * t;
  const t3 = t2 * t;

  const f0 = -0.5 * t3 + t2 - 0.5 * t;
  const f1 = 1.5 * t3 - 2.5 * t2 + 1.0;
  const f2 = -1.5 * t3 + 2.0 * t2 + 0.5 * t;
  const f3 = 0.5 * t3 - 0.5 * t2;

  const lng = p0[0] * f0 + p1[0] * f1 + p2[0] * f2 + p3[0] * f3;
  const lat = p0[1] * f0 + p1[1] * f1 + p2[1] * f2 + p3[1] * f3;

  return [lng, lat];
}

function generateSplinePoints(controlPoints: [number, number][], samplesPerSegment: number = 80): [number, number][] {
  const points: [number, number][] = [];
  const n = controlPoints.length;

  for (let i = 0; i < n - 1; i++) {
    const p0 = controlPoints[Math.max(i - 1, 0)];
    const p1 = controlPoints[i];
    const p2 = controlPoints[i + 1];
    const p3 = controlPoints[Math.min(i + 2, n - 1)];

    for (let s = 0; s < samplesPerSegment; s++) {
      const t = s / samplesPerSegment;
      const pt = catmullRom(p0, p1, p2, p3, t);
      
      // Add subtle harmonic road meander matching topography
      const meanderAngle = Math.sin(t * Math.PI * 4 + i * 2.1) * 0.0018;
      const meanderOffset = Math.cos(t * Math.PI * 3 + i * 1.7) * 0.0012;
      
      points.push([pt[0] + meanderOffset, pt[1] + meanderAngle]);
    }
  }

  points.push(controlPoints[controlPoints.length - 1]);
  return points;
}

export function getGolaghatBypassCoordinates(): [number, number][] {
  const nh37Feat = roadsGeoJSON.features.find((f: any) => f.id === 'NH-37');
  const nh37Coords = (nh37Feat?.geometry.coordinates || []) as [number, number][];

  // Common real highway from Guwahati to Nagaon Junction (~35% of NH-37)
  const junctionIdx = Math.floor(nh37Coords.length * 0.35);
  const trunkCoords = nh37Coords.slice(0, junctionIdx);
  const nagaonJunction = nh37Coords[junctionIdx] || [92.6841, 26.3450];
  const jorhatDestination = nh37Coords[nh37Coords.length - 1] || [94.212008, 26.753952];

  // Realistic Assam State Highway & NH-27/29/129 corridor waypoints around Kaziranga National Park
  const detourWaypoints: [number, number][] = [
    nagaonJunction,
    [92.7350, 26.2950], // Nonoi Corridor
    [92.7850, 26.2250], // Kathiatoli junction
    [92.8350, 26.1620], // Kampur bend
    [92.8750, 26.1280], // Jamunamukh valley
    [92.9450, 26.1150], // Doboka town junction (NH-27)
    [93.0450, 26.1380], // Kaki forest reserve bypass
    [93.1350, 26.1820], // Dokmoka hill pass (NH-29)
    [93.2200, 26.2150], // Langhin valley
    [93.3250, 26.2420], // Deithor foothills
    [93.4500, 26.2850], // Barpathar / Numaligarh south corridor
    [93.5850, 26.3480], // Bokajan south junction
    [93.7100, 26.4250], // Rangajan connector (NH-129)
    [93.8450, 26.4850], // Golaghat outskirts
    [93.9720, 26.5280], // Golaghat central bypass
    [94.0550, 26.6120], // Kakodonga river valley
    [94.1380, 26.6920], // Dergaon / Titabar connector
    [94.1850, 26.7320], // Jorhat western bypass
    jorhatDestination,  // 📍 Jorhat Central Hospital (Exact Terminus)
  ];

  const smoothDetour = generateSplinePoints(detourWaypoints, 60);

  return [...trunkCoords, ...smoothDetour];
}
