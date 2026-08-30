import fs from 'fs';

async function fetchRoute(coordinates) {
  // coordinates format: "lng1,lat1;lng2,lat2;lng3,lat3"
  const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
  console.log(`Fetching route from OSRM: ${url}`);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Failed response: ${res.status}`);
      return null;
    }
    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      return {
        coordinates: data.routes[0].geometry.coordinates,
        distanceKm: Math.round(data.routes[0].distance / 1000),
      };
    }
  } catch (err) {
    console.error('Error fetching route:', err);
  }
  return null;
}

async function main() {
  const routesConfig = [
    {
      id: 'NH-37',
      name: 'NH-37 (Guwahati – Nagaon – Kaziranga – Jorhat)',
      type: 'National Highway',
      status: 'OPEN',
      criticality: 'HIGH',
      source: 'OpenStreetMap / OSRM Verified Highway Trace',
      isSimulated: false,
      waypoints: '91.7362,26.1856;92.6841,26.3450;93.3600,26.6200;94.2120,26.7540',
    },
    {
      id: 'NH-27',
      name: 'NH-27 (East-West Corridor / Guwahati Bypass)',
      type: 'National Highway',
      status: 'OPEN',
      criticality: 'NORMAL',
      source: 'OpenStreetMap / OSRM Verified Highway Trace',
      isSimulated: false,
      waypoints: '90.5500,26.4800;91.7362,26.1856;93.1700,25.7500',
    },
    {
      id: 'NH-29',
      name: 'NH-29 (Dimapur – Kohima – Senapati – Imphal Lifeline)',
      type: 'National Highway',
      status: 'OPEN',
      criticality: 'CRITICAL',
      source: 'OpenStreetMap / OSRM Mountain Highway Trace',
      isSimulated: false,
      waypoints: '93.7200,25.9000;94.1100,25.6700;93.9368,24.8170',
    },
    {
      id: 'NH-6',
      name: 'NH-6 (Guwahati – Shillong – Jowai – Silchar Corridor)',
      type: 'National Highway',
      status: 'RESTRICTED',
      criticality: 'HIGH',
      source: 'OpenStreetMap / OSRM Mountain Highway Trace',
      isSimulated: false,
      waypoints: '91.7362,26.1856;91.8800,25.5700;92.2000,25.4500;92.8000,24.8300',
    },
    {
      id: 'ALT-ROUTE-B',
      name: 'Alternative Route B (Morigaon – Hojai – Haflong Bypass)',
      type: 'State Bypass / Alternative Route',
      status: 'OPEN',
      criticality: 'NORMAL',
      source: 'OSRM Computed Bypass Corridor',
      isSimulated: true,
      waypoints: '91.7362,26.1856;92.8500,25.9800;93.0200,25.1700;92.8000,24.8300',
    },
  ];

  const features = [];

  for (const cfg of routesConfig) {
    console.log(`Processing ${cfg.id}...`);
    const route = await fetchRoute(cfg.waypoints);
    if (route && route.coordinates && route.coordinates.length > 0) {
      console.log(`✓ ${cfg.id}: fetched ${route.coordinates.length} dense points, ${route.distanceKm} km`);
      features.push({
        type: 'Feature',
        id: cfg.id,
        properties: {
          id: cfg.id,
          name: cfg.name,
          type: cfg.type,
          status: cfg.status,
          lengthKm: route.distanceKm,
          criticality: cfg.criticality,
          source: cfg.source,
          isSimulated: cfg.isSimulated,
        },
        geometry: {
          type: 'LineString',
          coordinates: route.coordinates,
        },
      });
    } else {
      console.warn(`Failed to fetch route for ${cfg.id}`);
    }
    // Small delay to respect public rate limit
    await new Promise((r) => setTimeout(r, 800));
  }

  const geojson = {
    type: 'FeatureCollection',
    features,
  };

  const outputPath = './src/data/roads.geojson';
  fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2));
  console.log(`Successfully written ${features.length} high-density road corridors to ${outputPath}!`);
}

main();
