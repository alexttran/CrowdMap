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
  // Devices spread across center area - roughly balanced from all nodes but with variation
  // Node positions: A(20,90), B(100,80), C(30,10)

  // Tight center cluster
  { deviceId: 'A1B2C3D4', mac: '01:23:45:67:89:ab', measurements: { 'ESP32-A': { id: 'A1B2C3D4', mac: '01:23:45:67:89:ab', rssi: -74, distance: 42.4 }, 'ESP32-B': { id: 'A1B2C3D4', mac: '01:23:45:67:89:ab', rssi: -83, distance: 53.9 }, 'ESP32-C': { id: 'A1B2C3D4', mac: '01:23:45:67:89:ab', rssi: -83, distance: 53.9 } } },
  { deviceId: 'E5F6G7H8', mac: '02:34:56:78:9a:bc', measurements: { 'ESP32-A': { id: 'E5F6G7H8', mac: '02:34:56:78:9a:bc', rssi: -72, distance: 40.3 }, 'ESP32-B': { id: 'E5F6G7H8', mac: '02:34:56:78:9a:bc', rssi: -81, distance: 51.2 }, 'ESP32-C': { id: 'E5F6G7H8', mac: '02:34:56:78:9a:bc', rssi: -79, distance: 49.5 } } },
  { deviceId: 'I9J0K1L2', mac: '03:45:67:89:ab:cd', measurements: { 'ESP32-A': { id: 'I9J0K1L2', mac: '03:45:67:89:ab:cd', rssi: -70, distance: 38.8 }, 'ESP32-B': { id: 'I9J0K1L2', mac: '03:45:67:89:ab:cd', rssi: -80, distance: 50.4 }, 'ESP32-C': { id: 'I9J0K1L2', mac: '03:45:67:89:ab:cd', rssi: -82, distance: 52.2 } } },

  // Spread toward Node A side
  { deviceId: 'M3N4O5P6', mac: '04:56:78:9a:bc:de', measurements: { 'ESP32-A': { id: 'M3N4O5P6', mac: '04:56:78:9a:bc:de', rssi: -62, distance: 28.1 }, 'ESP32-B': { id: 'M3N4O5P6', mac: '04:56:78:9a:bc:de', rssi: -75, distance: 45.0 }, 'ESP32-C': { id: 'M3N4O5P6', mac: '04:56:78:9a:bc:de', rssi: -78, distance: 48.5 } } },
  { deviceId: 'Q7R8S9T0', mac: '05:67:89:ab:cd:ef', measurements: { 'ESP32-A': { id: 'Q7R8S9T0', mac: '05:67:89:ab:cd:ef', rssi: -65, distance: 31.6 }, 'ESP32-B': { id: 'Q7R8S9T0', mac: '05:67:89:ab:cd:ef', rssi: -78, distance: 48.8 }, 'ESP32-C': { id: 'Q7R8S9T0', mac: '05:67:89:ab:cd:ef', rssi: -80, distance: 50.1 } } },
  { deviceId: 'U1V2W3X4', mac: '06:78:9a:bc:de:f0', measurements: { 'ESP32-A': { id: 'U1V2W3X4', mac: '06:78:9a:bc:de:f0', rssi: -58, distance: 23.2 }, 'ESP32-B': { id: 'U1V2W3X4', mac: '06:78:9a:bc:de:f0', rssi: -82, distance: 52.8 }, 'ESP32-C': { id: 'U1V2W3X4', mac: '06:78:9a:bc:de:f0', rssi: -85, distance: 56.3 } } },

  // Spread toward Node B side
  { deviceId: 'Y5Z6A7B8', mac: '07:89:ab:cd:ef:01', measurements: { 'ESP32-A': { id: 'Y5Z6A7B8', mac: '07:89:ab:cd:ef:01', rssi: -78, distance: 48.5 }, 'ESP32-B': { id: 'Y5Z6A7B8', mac: '07:89:ab:cd:ef:01', rssi: -64, distance: 29.3 }, 'ESP32-C': { id: 'Y5Z6A7B8', mac: '07:89:ab:cd:ef:01', rssi: -73, distance: 42.8 } } },
  { deviceId: 'C9D0E1F2', mac: '08:9a:bc:de:f0:12', measurements: { 'ESP32-A': { id: 'C9D0E1F2', mac: '08:9a:bc:de:f0:12', rssi: -82, distance: 52.5 }, 'ESP32-B': { id: 'C9D0E1F2', mac: '08:9a:bc:de:f0:12', rssi: -60, distance: 25.7 }, 'ESP32-C': { id: 'C9D0E1F2', mac: '08:9a:bc:de:f0:12', rssi: -76, distance: 46.4 } } },
  { deviceId: 'K7L8M9N0', mac: '0a:bc:de:f0:12:34', measurements: { 'ESP32-A': { id: 'K7L8M9N0', mac: '0a:bc:de:f0:12:34', rssi: -85, distance: 56.2 }, 'ESP32-B': { id: 'K7L8M9N0', mac: '0a:bc:de:f0:12:34', rssi: -57, distance: 22.1 }, 'ESP32-C': { id: 'K7L8M9N0', mac: '0a:bc:de:f0:12:34', rssi: -79, distance: 49.6 } } },

  // Spread toward Node C side
  { deviceId: 'O1P2Q3R4', mac: '0b:cd:ef:01:23:45', measurements: { 'ESP32-A': { id: 'O1P2Q3R4', mac: '0b:cd:ef:01:23:45', rssi: -76, distance: 46.1 }, 'ESP32-B': { id: 'O1P2Q3R4', mac: '0b:cd:ef:01:23:45', rssi: -79, distance: 49.2 }, 'ESP32-C': { id: 'O1P2Q3R4', mac: '0b:cd:ef:01:23:45', rssi: -61, distance: 26.0 } } },
  { deviceId: 'D1E2F3G4', mac: '0c:11:22:33:44:55', measurements: { 'ESP32-A': { id: 'D1E2F3G4', mac: '0c:11:22:33:44:55', rssi: -80, distance: 50.8 }, 'ESP32-B': { id: 'D1E2F3G4', mac: '0c:11:22:33:44:55', rssi: -82, distance: 52.7 }, 'ESP32-C': { id: 'D1E2F3G4', mac: '0c:11:22:33:44:55', rssi: -59, distance: 24.9 } } },
  { deviceId: 'H5I6J7K8', mac: '0d:22:33:44:55:66', measurements: { 'ESP32-A': { id: 'H5I6J7K8', mac: '0d:22:33:44:55:66', rssi: -83, distance: 53.5 }, 'ESP32-B': { id: 'H5I6J7K8', mac: '0d:22:33:44:55:66', rssi: -85, distance: 56.5 }, 'ESP32-C': { id: 'H5I6J7K8', mac: '0d:22:33:44:55:66', rssi: -56, distance: 20.8 } } },

  // Mid-range spread - various positions
  { deviceId: 'L9M0N1O2', mac: '0e:33:44:55:66:77', measurements: { 'ESP32-A': { id: 'L9M0N1O2', mac: '0e:33:44:55:66:77', rssi: -68, distance: 35.0 }, 'ESP32-B': { id: 'L9M0N1O2', mac: '0e:33:44:55:66:77', rssi: -76, distance: 46.3 }, 'ESP32-C': { id: 'L9M0N1O2', mac: '0e:33:44:55:66:77', rssi: -72, distance: 41.6 } } },
  { deviceId: 'P3Q4R5S6', mac: '0f:44:55:66:77:88', measurements: { 'ESP32-A': { id: 'P3Q4R5S6', mac: '0f:44:55:66:77:88', rssi: -71, distance: 39.7 }, 'ESP32-B': { id: 'P3Q4R5S6', mac: '0f:44:55:66:77:88', rssi: -70, distance: 38.1 }, 'ESP32-C': { id: 'P3Q4R5S6', mac: '0f:44:55:66:77:88', rssi: -77, distance: 47.8 } } },
  { deviceId: 'T7U8V9W0', mac: '10:55:66:77:88:99', measurements: { 'ESP32-A': { id: 'T7U8V9W0', mac: '10:55:66:77:88:99', rssi: -75, distance: 44.9 }, 'ESP32-B': { id: 'T7U8V9W0', mac: '10:55:66:77:88:99', rssi: -73, distance: 42.7 }, 'ESP32-C': { id: 'T7U8V9W0', mac: '10:55:66:77:88:99', rssi: -69, distance: 37.0 } } },
  { deviceId: 'X1Y2Z3A4', mac: '11:66:77:88:99:aa', measurements: { 'ESP32-A': { id: 'X1Y2Z3A4', mac: '11:66:77:88:99:aa', rssi: -67, distance: 33.3 }, 'ESP32-B': { id: 'X1Y2Z3A4', mac: '11:66:77:88:99:aa', rssi: -81, distance: 51.6 }, 'ESP32-C': { id: 'X1Y2Z3A4', mac: '11:66:77:88:99:aa', rssi: -74, distance: 43.5 } } },
  { deviceId: 'B5C6D7E8', mac: '12:77:88:99:aa:bb', measurements: { 'ESP32-A': { id: 'B5C6D7E8', mac: '12:77:88:99:aa:bb', rssi: -77, distance: 47.8 }, 'ESP32-B': { id: 'B5C6D7E8', mac: '12:77:88:99:aa:bb', rssi: -68, distance: 35.5 }, 'ESP32-C': { id: 'B5C6D7E8', mac: '12:77:88:99:aa:bb', rssi: -71, distance: 40.9 } } },
  { deviceId: 'F9G0H1I2', mac: '13:88:99:aa:bb:cc', measurements: { 'ESP32-A': { id: 'F9G0H1I2', mac: '13:88:99:aa:bb:cc', rssi: -69, distance: 36.5 }, 'ESP32-B': { id: 'F9G0H1I2', mac: '13:88:99:aa:bb:cc', rssi: -77, distance: 47.7 }, 'ESP32-C': { id: 'F9G0H1I2', mac: '13:88:99:aa:bb:cc', rssi: -75, distance: 45.4 } } },
  { deviceId: 'J3K4L5M6', mac: '14:99:aa:bb:cc:dd', measurements: { 'ESP32-A': { id: 'J3K4L5M6', mac: '14:99:aa:bb:cc:dd', rssi: -73, distance: 42.9 }, 'ESP32-B': { id: 'J3K4L5M6', mac: '14:99:aa:bb:cc:dd', rssi: -72, distance: 41.2 }, 'ESP32-C': { id: 'J3K4L5M6', mac: '14:99:aa:bb:cc:dd', rssi: -78, distance: 48.9 } } },
  { deviceId: 'N7O8P9Q0', mac: '15:aa:bb:cc:dd:ee', measurements: { 'ESP32-A': { id: 'N7O8P9Q0', mac: '15:aa:bb:cc:dd:ee', rssi: -66, distance: 32.0 }, 'ESP32-B': { id: 'N7O8P9Q0', mac: '15:aa:bb:cc:dd:ee', rssi: -79, distance: 49.8 }, 'ESP32-C': { id: 'N7O8P9Q0', mac: '15:aa:bb:cc:dd:ee', rssi: -81, distance: 51.1 } } },

  // More scattered positions
  { deviceId: 'R1S2T3U4', mac: '16:bb:cc:dd:ee:ff', measurements: { 'ESP32-A': { id: 'R1S2T3U4', mac: '16:bb:cc:dd:ee:ff', rssi: -79, distance: 49.8 }, 'ESP32-B': { id: 'R1S2T3U4', mac: '16:bb:cc:dd:ee:ff', rssi: -74, distance: 43.6 }, 'ESP32-C': { id: 'R1S2T3U4', mac: '16:bb:cc:dd:ee:ff', rssi: -67, distance: 34.3 } } },
  { deviceId: 'V5W6X7Y8', mac: '17:cc:dd:ee:ff:00', measurements: { 'ESP32-A': { id: 'V5W6X7Y8', mac: '17:cc:dd:ee:ff:00', rssi: -63, distance: 29.5 }, 'ESP32-B': { id: 'V5W6X7Y8', mac: '17:cc:dd:ee:ff:00', rssi: -83, distance: 53.9 }, 'ESP32-C': { id: 'V5W6X7Y8', mac: '17:cc:dd:ee:ff:00', rssi: -76, distance: 46.6 } } },
  { deviceId: 'Z9A0B1C2', mac: '18:dd:ee:ff:00:11', measurements: { 'ESP32-A': { id: 'Z9A0B1C2', mac: '18:dd:ee:ff:00:11', rssi: -81, distance: 51.6 }, 'ESP32-B': { id: 'Z9A0B1C2', mac: '18:dd:ee:ff:00:11', rssi: -66, distance: 32.3 }, 'ESP32-C': { id: 'Z9A0B1C2', mac: '18:dd:ee:ff:00:11', rssi: -70, distance: 39.7 } } },
  { deviceId: 'D3E4F5G6', mac: '19:ee:ff:00:11:22', measurements: { 'ESP32-A': { id: 'D3E4F5G6', mac: '19:ee:ff:00:11:22', rssi: -72, distance: 41.6 }, 'ESP32-B': { id: 'D3E4F5G6', mac: '19:ee:ff:00:11:22', rssi: -78, distance: 48.0 }, 'ESP32-C': { id: 'D3E4F5G6', mac: '19:ee:ff:00:11:22', rssi: -68, distance: 35.7 } } },
  { deviceId: 'H7I8J9K0', mac: '1a:ff:00:11:22:33', measurements: { 'ESP32-A': { id: 'H7I8J9K0', mac: '1a:ff:00:11:22:33', rssi: -70, distance: 38.5 }, 'ESP32-B': { id: 'H7I8J9K0', mac: '1a:ff:00:11:22:33', rssi: -75, distance: 45.4 }, 'ESP32-C': { id: 'H7I8J9K0', mac: '1a:ff:00:11:22:33', rssi: -80, distance: 50.7 } } },
  { deviceId: 'L1M2N3O4', mac: '1b:00:11:22:33:44', measurements: { 'ESP32-A': { id: 'L1M2N3O4', mac: '1b:00:11:22:33:44', rssi: -64, distance: 30.9 }, 'ESP32-B': { id: 'L1M2N3O4', mac: '1b:00:11:22:33:44', rssi: -71, distance: 40.5 }, 'ESP32-C': { id: 'L1M2N3O4', mac: '1b:00:11:22:33:44', rssi: -77, distance: 47.2 } } },
  { deviceId: 'P5Q6R7S8', mac: '1c:11:22:33:44:55', measurements: { 'ESP32-A': { id: 'P5Q6R7S8', mac: '1c:11:22:33:44:55', rssi: -84, distance: 55.7 }, 'ESP32-B': { id: 'P5Q6R7S8', mac: '1c:11:22:33:44:55', rssi: -69, distance: 37.5 }, 'ESP32-C': { id: 'P5Q6R7S8', mac: '1c:11:22:33:44:55', rssi: -73, distance: 42.9 } } },
  { deviceId: 'T9U0V1W2', mac: '1d:22:33:44:55:66', measurements: { 'ESP32-A': { id: 'T9U0V1W2', mac: '1d:22:33:44:55:66', rssi: -74, distance: 44.1 }, 'ESP32-B': { id: 'T9U0V1W2', mac: '1d:22:33:44:55:66', rssi: -80, distance: 50.5 }, 'ESP32-C': { id: 'T9U0V1W2', mac: '1d:22:33:44:55:66', rssi: -71, distance: 40.2 } } },

  // Additional diverse positions
  { deviceId: 'X3Y4Z5A6', mac: '1e:33:44:55:66:77', measurements: { 'ESP32-A': { id: 'X3Y4Z5A6', mac: '1e:33:44:55:66:77', rssi: -61, distance: 27.0 }, 'ESP32-B': { id: 'X3Y4Z5A6', mac: '1e:33:44:55:66:77', rssi: -84, distance: 54.8 }, 'ESP32-C': { id: 'X3Y4Z5A6', mac: '1e:33:44:55:66:77', rssi: -78, distance: 48.1 } } },
  { deviceId: 'B7C8D9E0', mac: '1f:44:55:66:77:88', measurements: { 'ESP32-A': { id: 'B7C8D9E0', mac: '1f:44:55:66:77:88', rssi: -86, distance: 58.0 }, 'ESP32-B': { id: 'B7C8D9E0', mac: '1f:44:55:66:77:88', rssi: -62, distance: 28.3 }, 'ESP32-C': { id: 'B7C8D9E0', mac: '1f:44:55:66:77:88', rssi: -75, distance: 45.0 } } },
  { deviceId: 'F1G2H3I4', mac: '20:55:66:77:88:99', measurements: { 'ESP32-A': { id: 'F1G2H3I4', mac: '20:55:66:77:88:99', rssi: -76, distance: 46.8 }, 'ESP32-B': { id: 'F1G2H3I4', mac: '20:55:66:77:88:99', rssi: -71, distance: 40.6 }, 'ESP32-C': { id: 'F1G2H3I4', mac: '20:55:66:77:88:99', rssi: -65, distance: 31.9 } } },
  { deviceId: 'J5K6L7M8', mac: '21:66:77:88:99:aa', measurements: { 'ESP32-A': { id: 'J5K6L7M8', mac: '21:66:77:88:99:aa', rssi: -59, distance: 24.2 }, 'ESP32-B': { id: 'J5K6L7M8', mac: '21:66:77:88:99:aa', rssi: -87, distance: 59.9 }, 'ESP32-C': { id: 'J5K6L7M8', mac: '21:66:77:88:99:aa', rssi: -81, distance: 51.7 } } },
  { deviceId: 'N9O0P1Q2', mac: '22:77:88:99:aa:bb', measurements: { 'ESP32-A': { id: 'N9O0P1Q2', mac: '22:77:88:99:aa:bb', rssi: -82, distance: 52.2 }, 'ESP32-B': { id: 'N9O0P1Q2', mac: '22:77:88:99:aa:bb', rssi: -76, distance: 46.4 }, 'ESP32-C': { id: 'N9O0P1Q2', mac: '22:77:88:99:aa:bb', rssi: -63, distance: 29.1 } } },
  { deviceId: 'R3S4T5U6', mac: '23:88:99:aa:bb:cc', measurements: { 'ESP32-A': { id: 'R3S4T5U6', mac: '23:88:99:aa:bb:cc', rssi: -65, distance: 31.3 }, 'ESP32-B': { id: 'R3S4T5U6', mac: '23:88:99:aa:bb:cc', rssi: -73, distance: 42.0 }, 'ESP32-C': { id: 'R3S4T5U6', mac: '23:88:99:aa:bb:cc', rssi: -79, distance: 49.3 } } },
  { deviceId: 'V7W8X9Y0', mac: '24:99:aa:bb:cc:dd', measurements: { 'ESP32-A': { id: 'V7W8X9Y0', mac: '24:99:aa:bb:cc:dd', rssi: -78, distance: 48.7 }, 'ESP32-B': { id: 'V7W8X9Y0', mac: '24:99:aa:bb:cc:dd', rssi: -67, distance: 34.1 }, 'ESP32-C': { id: 'V7W8X9Y0', mac: '24:99:aa:bb:cc:dd', rssi: -74, distance: 44.8 } } },
  { deviceId: 'Z1A2B3C4', mac: '25:aa:bb:cc:dd:ee', measurements: { 'ESP32-A': { id: 'Z1A2B3C4', mac: '25:aa:bb:cc:dd:ee', rssi: -69, distance: 37.2 }, 'ESP32-B': { id: 'Z1A2B3C4', mac: '25:aa:bb:cc:dd:ee', rssi: -74, distance: 44.0 }, 'ESP32-C': { id: 'Z1A2B3C4', mac: '25:aa:bb:cc:dd:ee', rssi: -70, distance: 39.2 } } },
  { deviceId: 'D5E6F7G8', mac: '26:bb:cc:dd:ee:ff', measurements: { 'ESP32-A': { id: 'D5E6F7G8', mac: '26:bb:cc:dd:ee:ff', rssi: -75, distance: 45.0 }, 'ESP32-B': { id: 'D5E6F7G8', mac: '26:bb:cc:dd:ee:ff', rssi: -70, distance: 38.3 }, 'ESP32-C': { id: 'D5E6F7G8', mac: '26:bb:cc:dd:ee:ff', rssi: -72, distance: 41.1 } } },
  { deviceId: 'H9I0J1K2', mac: '27:cc:dd:ee:ff:00', measurements: { 'ESP32-A': { id: 'H9I0J1K2', mac: '27:cc:dd:ee:ff:00', rssi: -80, distance: 50.3 }, 'ESP32-B': { id: 'H9I0J1K2', mac: '27:cc:dd:ee:ff:00', rssi: -75, distance: 45.2 }, 'ESP32-C': { id: 'H9I0J1K2', mac: '27:cc:dd:ee:ff:00', rssi: -60, distance: 25.5 } } },
  { deviceId: 'L3M4N5O6', mac: '28:dd:ee:ff:00:11', measurements: { 'ESP32-A': { id: 'L3M4N5O6', mac: '28:dd:ee:ff:00:11', rssi: -68, distance: 35.3 }, 'ESP32-B': { id: 'L3M4N5O6', mac: '28:dd:ee:ff:00:11', rssi: -79, distance: 49.7 }, 'ESP32-C': { id: 'L3M4N5O6', mac: '28:dd:ee:ff:00:11', rssi: -73, distance: 42.4 } } },
  { deviceId: 'P7Q8R9S0', mac: '29:ee:ff:00:11:22', measurements: { 'ESP32-A': { id: 'P7Q8R9S0', mac: '29:ee:ff:00:11:22', rssi: -60, distance: 25.5 }, 'ESP32-B': { id: 'P7Q8R9S0', mac: '29:ee:ff:00:11:22', rssi: -85, distance: 56.2 }, 'ESP32-C': { id: 'P7Q8R9S0', mac: '29:ee:ff:00:11:22', rssi: -77, distance: 47.6 } } },
  { deviceId: 'T1U2V3W4', mac: '2a:ff:00:11:22:33', measurements: { 'ESP32-A': { id: 'T1U2V3W4', mac: '2a:ff:00:11:22:33', rssi: -83, distance: 53.3 }, 'ESP32-B': { id: 'T1U2V3W4', mac: '2a:ff:00:11:22:33', rssi: -65, distance: 31.0 }, 'ESP32-C': { id: 'T1U2V3W4', mac: '2a:ff:00:11:22:33', rssi: -71, distance: 40.0 } } },
  { deviceId: 'X5Y6Z7A8', mac: '2b:00:11:22:33:44', measurements: { 'ESP32-A': { id: 'X5Y6Z7A8', mac: '2b:00:11:22:33:44', rssi: -71, distance: 40.0 }, 'ESP32-B': { id: 'X5Y6Z7A8', mac: '2b:00:11:22:33:44', rssi: -77, distance: 47.3 }, 'ESP32-C': { id: 'X5Y6Z7A8', mac: '2b:00:11:22:33:44', rssi: -66, distance: 32.0 } } },
  { deviceId: 'B9C0D1E2', mac: '2c:11:22:33:44:55', measurements: { 'ESP32-A': { id: 'B9C0D1E2', mac: '2c:11:22:33:44:55', rssi: -77, distance: 47.1 }, 'ESP32-B': { id: 'B9C0D1E2', mac: '2c:11:22:33:44:55', rssi: -72, distance: 41.9 }, 'ESP32-C': { id: 'B9C0D1E2', mac: '2c:11:22:33:44:55', rssi: -69, distance: 37.3 } } },
  { deviceId: 'F3G4H5I6', mac: '2d:22:33:44:55:66', measurements: { 'ESP32-A': { id: 'F3G4H5I6', mac: '2d:22:33:44:55:66', rssi: -62, distance: 28.3 }, 'ESP32-B': { id: 'F3G4H5I6', mac: '2d:22:33:44:55:66', rssi: -80, distance: 50.8 }, 'ESP32-C': { id: 'F3G4H5I6', mac: '2d:22:33:44:55:66', rssi: -75, distance: 45.6 } } },
  { deviceId: 'J7K8L9M0', mac: '2e:33:44:55:66:77', measurements: { 'ESP32-A': { id: 'J7K8L9M0', mac: '2e:33:44:55:66:77', rssi: -81, distance: 51.9 }, 'ESP32-B': { id: 'J7K8L9M0', mac: '2e:33:44:55:66:77', rssi: -78, distance: 48.8 }, 'ESP32-C': { id: 'J7K8L9M0', mac: '2e:33:44:55:66:77', rssi: -58, distance: 23.1 } } },
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
