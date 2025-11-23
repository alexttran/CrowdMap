// Mock data for 3 ESP32 nodes with fixed initial positions
// These can be updated when nodes are dragged
export let esp32Nodes = [
  {
    id: 'ESP32-A',
    name: 'Node 1',
    position: [20, 90], // coordinates in meters
    status: 'online',
    rssiAvg: -65,
    devicesDetected: 8
  },
  {
    id: 'ESP32-B',
    name: 'Node 2',
    position: [100, 80],
    status: 'online',
    rssiAvg: -58,
    devicesDetected: 12
  },
  {
    id: 'ESP32-C',
    name: 'Node 3',
    position: [30, 10], // forms triangle
    status: 'online',
    rssiAvg: -62,
    devicesDetected: 10
  }
];

// Function to update node positions (called when dragging)
export const updateNodePosition = (nodeId, newPosition) => {
  const nodeIndex = esp32Nodes.findIndex(n => n.id === nodeId);
  if (nodeIndex !== -1) {
    esp32Nodes[nodeIndex].position = newPosition;
  }
};

// Triangulation function (same logic as backend)
const triangulate = (d1, d2, d3, p1, p2, p3) => {
  try {
    // Vector from p1 to p2
    const p2p1 = [p2[0] - p1[0], p2[1] - p1[1]];
    const d = Math.sqrt(p2p1[0] ** 2 + p2p1[1] ** 2);

    if (d === 0) return null;

    // Unit vector from p1 to p2
    const ex = [p2p1[0] / d, p2p1[1] / d];

    // Vector from p1 to p3
    const p3p1 = [p3[0] - p1[0], p3[1] - p1[1]];

    // Signed distance along ex
    const i = ex[0] * p3p1[0] + ex[1] * p3p1[1];

    // Vector perpendicular to ex in the plane
    const p3p1_proj = [p3p1[0] - i * ex[0], p3p1[1] - i * ex[1]];
    const j = Math.sqrt(p3p1_proj[0] ** 2 + p3p1_proj[1] ** 2);

    if (j === 0) return null;

    const ey = [p3p1_proj[0] / j, p3p1_proj[1] / j];

    // Coordinates of the intersection point
    const x = (d1 ** 2 - d2 ** 2 + d ** 2) / (2 * d);
    const y = (d1 ** 2 - d3 ** 2 + i ** 2 + j ** 2) / (2 * j) - (i / j) * x;

    // Check for invalid values
    if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
      return null;
    }

    // Calculate position
    const position = [
      p1[0] + x * ex[0] + y * ey[0],
      p1[1] + x * ex[1] + y * ey[1]
    ];

    return position;
  } catch (e) {
    return null;
  }
};

// Mock ESP32 measurements - format matches real ESP32 data
// Each device has 3 distance measurements (one from each ESP32 node)
// Position is ONLY calculated from these distances via triangulation
const MOCK_ESP32_DATA = [
  // Device 1 - Cluster near Node 1
  {
    deviceId: 'A1B2C3D4',
    mac: '01:23:45:67:89:ab',
    measurements: {
      'ESP32-A': { id: 'A1B2C3D4', mac: '01:23:45:67:89:ab', rssi: -46, distance: 7.07 },
      'ESP32-B': { id: 'A1B2C3D4', mac: '01:23:45:67:89:ab', rssi: -96, distance: 70.36 },
      'ESP32-C': { id: 'A1B2C3D4', mac: '01:23:45:67:89:ab', rssi: -96, distance: 70.01 }
    }
  },
  {
    deviceId: 'E5F6G7H8',
    mac: '02:34:56:78:9a:bc',
    measurements: {
      'ESP32-A': { id: 'E5F6G7H8', mac: '02:34:56:78:9a:bc', rssi: -45, distance: 5.39 },
      'ESP32-B': { id: 'E5F6G7H8', mac: '02:34:56:78:9a:bc', rssi: -107, distance: 85.44 },
      'ESP32-C': { id: 'E5F6G7H8', mac: '02:34:56:78:9a:bc', rssi: -104, distance: 81.85 }
    }
  },
  {
    deviceId: 'I9J0K1L2',
    mac: '03:45:67:89:ab:cd',
    measurements: {
      'ESP32-A': { id: 'I9J0K1L2', mac: '03:45:67:89:ab:cd', rssi: -44, distance: 5.39 },
      'ESP32-B': { id: 'I9J0K1L2', mac: '03:45:67:89:ab:cd', rssi: -100, distance: 75.17 },
      'ESP32-C': { id: 'I9J0K1L2', mac: '03:45:67:89:ab:cd', rssi: -107, distance: 85.01 }
    }
  },

  // Device 2 - Cluster near Node 2
  {
    deviceId: 'M3N4O5P6',
    mac: '04:56:78:9a:bc:de',
    measurements: {
      'ESP32-A': { id: 'M3N4O5P6', mac: '04:56:78:9a:bc:de', rssi: -99, distance: 74.16 },
      'ESP32-B': { id: 'M3N4O5P6', mac: '04:56:78:9a:bc:de', rssi: -45, distance: 7.07 },
      'ESP32-C': { id: 'M3N4O5P6', mac: '04:56:78:9a:bc:de', rssi: -92, distance: 65.38 }
    }
  },
  {
    deviceId: 'Q7R8S9T0',
    mac: '05:67:89:ab:cd:ef',
    measurements: {
      'ESP32-A': { id: 'Q7R8S9T0', mac: '05:67:89:ab:cd:ef', rssi: -107, distance: 85.44 },
      'ESP32-B': { id: 'Q7R8S9T0', mac: '05:67:89:ab:cd:ef', rssi: -44, distance: 5.39 },
      'ESP32-C': { id: 'Q7R8S9T0', mac: '05:67:89:ab:cd:ef', rssi: -98, distance: 72.69 }
    }
  },
  {
    deviceId: 'U1V2W3X4',
    mac: '06:78:9a:bc:de:f0',
    measurements: {
      'ESP32-A': { id: 'U1V2W3X4', mac: '06:78:9a:bc:de:f0', rssi: -101, distance: 77.62 },
      'ESP32-B': { id: 'U1V2W3X4', mac: '06:78:9a:bc:de:f0', rssi: -47, distance: 8.25 },
      'ESP32-C': { id: 'U1V2W3X4', mac: '06:78:9a:bc:de:f0', rssi: -99, distance: 74.40 }
    }
  },

  // Device 3 - Cluster near Node 3
  {
    deviceId: 'Y5Z6A7B8',
    mac: '07:89:ab:cd:ef:01',
    measurements: {
      'ESP32-A': { id: 'Y5Z6A7B8', mac: '07:89:ab:cd:ef:01', rssi: -96, distance: 70.36 },
      'ESP32-B': { id: 'Y5Z6A7B8', mac: '07:89:ab:cd:ef:01', rssi: -96, distance: 69.46 },
      'ESP32-C': { id: 'Y5Z6A7B8', mac: '07:89:ab:cd:ef:01', rssi: -45, distance: 5.83 }
    }
  },
  {
    deviceId: 'C9D0E1F2',
    mac: '08:9a:bc:de:f0:12',
    measurements: {
      'ESP32-A': { id: 'C9D0E1F2', mac: '08:9a:bc:de:f0:12', rssi: -98, distance: 72.11 },
      'ESP32-B': { id: 'C9D0E1F2', mac: '08:9a:bc:de:f0:12', rssi: -92, distance: 64.78 },
      'ESP32-C': { id: 'C9D0E1F2', mac: '08:9a:bc:de:f0:12', rssi: -44, distance: 5.10 }
    }
  },

  // Middle area devices
  {
    deviceId: 'K7L8M9N0',
    mac: '0a:bc:de:f0:12:34',
    measurements: {
      'ESP32-A': { id: 'K7L8M9N0', mac: '0a:bc:de:f0:12:34', rssi: -63, distance: 28.28 },
      'ESP32-B': { id: 'K7L8M9N0', mac: '0a:bc:de:f0:12:34', rssi: -73, distance: 41.23 },
      'ESP32-C': { id: 'K7L8M9N0', mac: '0a:bc:de:f0:12:34', rssi: -72, distance: 40.31 }
    }
  },
  {
    deviceId: 'O1P2Q3R4',
    mac: '0b:cd:ef:01:23:45',
    measurements: {
      'ESP32-A': { id: 'O1P2Q3R4', mac: '0b:cd:ef:01:23:45', rssi: -73, distance: 41.23 },
      'ESP32-B': { id: 'O1P2Q3R4', mac: '0b:cd:ef:01:23:45', rssi: -64, distance: 30.41 },
      'ESP32-C': { id: 'O1P2Q3R4', mac: '0b:cd:ef:01:23:45', rssi: -72, distance: 40.31 }
    }
  },
];

// Generate devices with triangulated positions from ESP32 measurements
// This simulates what the backend does - receives measurements and triangulates
const generateDevices = () => {
  return MOCK_ESP32_DATA.map(deviceData => {
    // Get current node positions
    const node1Pos = esp32Nodes[0].position;
    const node2Pos = esp32Nodes[1].position;
    const node3Pos = esp32Nodes[2].position;

    // Get distance measurements from each node (matches ESP32 format)
    const d1 = deviceData.measurements['ESP32-A'].distance;
    const d2 = deviceData.measurements['ESP32-B'].distance;
    const d3 = deviceData.measurements['ESP32-C'].distance;

    // Triangulate position from distances (same as backend)
    const position = triangulate(d1, d2, d3, node1Pos, node2Pos, node3Pos);

    // If triangulation fails, skip this device
    if (!position) {
      console.warn(`Triangulation failed for device ${deviceData.deviceId}`);
      return null;
    }

    return {
      id: `device-${deviceData.deviceId}`,
      hashedId: deviceData.deviceId.substring(0, 8).toLowerCase(),
      position: position,
      lastSeen: Date.now(),
      distance: {
        'ESP32-A': d1,
        'ESP32-B': d2,
        'ESP32-C': d3
      },
      rssi: {
        'ESP32-A': deviceData.measurements['ESP32-A'].rssi,
        'ESP32-B': deviceData.measurements['ESP32-B'].rssi,
        'ESP32-C': deviceData.measurements['ESP32-C'].rssi
      }
    };
  }).filter(device => device !== null); // Remove failed triangulations
};

export let detectedDevices = generateDevices();

// Simulate real-time updates (just update timestamp for hardcoded data)
export const updateDevicePositions = () => {
  // Regenerate devices to recalculate distances if nodes were moved
  detectedDevices = generateDevices();
  return detectedDevices;
};
