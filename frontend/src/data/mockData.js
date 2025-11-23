// Mock data for 3 ESP32 nodes with fixed positions
export const esp32Nodes = [
  {
    id: 'ESP32-A',
    name: 'Node 1',
    position: [10, 10], // coordinates in meters
    status: 'online',
    rssiAvg: -65,
    devicesDetected: 8
  },
  {
    id: 'ESP32-B',
    name: 'Node 2',
    position: [90, 10],
    status: 'online',
    rssiAvg: -58,
    devicesDetected: 12
  },
  {
    id: 'ESP32-C',
    name: 'Node 3',
    position: [50, 80], // forms triangle
    status: 'online',
    rssiAvg: -62,
    devicesDetected: 10
  }
];

// Generate random detected devices with positions
const generateDevices = () => {
  const devices = [];
  const numDevices = 25;

  for (let i = 0; i < numDevices; i++) {
    // Random position within the triangle formed by the nodes
    const x = 10 + Math.random() * 80;
    const y = 10 + Math.random() * 70;

    devices.push({
      id: `device-${i}`,
      hashedId: `${Math.random().toString(36).substring(2, 10)}`,
      position: [x, y],
      lastSeen: Date.now() - Math.random() * 10000,
      rssi: {
        'ESP32-A': -(50 + Math.random() * 30),
        'ESP32-B': -(50 + Math.random() * 30),
        'ESP32-C': -(50 + Math.random() * 30)
      }
    });
  }

  return devices;
};

export let detectedDevices = generateDevices();

// Simulate real-time updates
export const updateDevicePositions = () => {
  detectedDevices = detectedDevices.map(device => ({
    ...device,
    position: [
      Math.max(10, Math.min(90, device.position[0] + (Math.random() - 0.5) * 2)),
      Math.max(10, Math.min(80, device.position[1] + (Math.random() - 0.5) * 2))
    ],
    lastSeen: Date.now()
  }));

  // Occasionally add or remove devices
  if (Math.random() > 0.95) {
    if (Math.random() > 0.5 && detectedDevices.length < 40) {
      detectedDevices.push({
        id: `device-${Date.now()}`,
        hashedId: Math.random().toString(36).substring(2, 10),
        position: [10 + Math.random() * 80, 10 + Math.random() * 70],
        lastSeen: Date.now(),
        rssi: {
          'ESP32-A': -(50 + Math.random() * 30),
          'ESP32-B': -(50 + Math.random() * 30),
          'ESP32-C': -(50 + Math.random() * 30)
        }
      });
    } else if (detectedDevices.length > 10) {
      detectedDevices.pop();
    }
  }

  return detectedDevices;
};
