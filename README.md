# CrowdMap

CrowdMap is a low-cost indoor positioning system built with three ESP32 devices. By scanning for nearby Bluetooth devices and sharing RSSI data between nodes, CrowdMap estimates the 2D position of each detected device using trilateration. The system generates a live map showing where people are located within a space.

No cameras. No personal data. Everything runs locally.

---

## What It Does

- Uses three ESP32 nodes placed in fixed locations.
- Continuously scans for Bluetooth Low Energy (BLE) devices.
- Measures RSSI (signal strength) from each detected device at each node.
- Sends RSSI readings from all nodes to a central coordinator ESP32.
- Calculates estimated device positions using trilateration.
- Hosts a local web dashboard that displays:
  - A 2D map with live device locations.
  - Total detected devices.
  - Per-node signal data and system health.

CrowdMap creates a real-time indoor people map using only BLE signals.

---

## How It Works

### 1. BLE Scanning
Each ESP32 performs active BLE scans and logs:
- A hashed device identifier.
- The RSSI value.
- A timestamp.

### 2. Node Communication
Nodes transmit all RSSI readings to a central coordinator via ESP-NOW or Wi-Fi.

### 3. Distance Estimation
RSSI values are converted into approximate distances using:
- A log-distance path-loss model.

### 4. Trilateration
With distance estimates from three known positions:
- Node A → distance d1
- Node B → distance d2
- Node C → distance d3

The coordinator solves for the (x, y) position of each device.

### 5. Web Dashboard
The coordinator serves a webpage showing:
- A map or grid layout.
- Live device positions.
- Device counts.
- Node status and RSSI diagnostics.

Everything runs directly on the ESP32 network.

---

## Use Case

CrowdMap is designed for situations where you need a real-time understanding of where people are located without using cameras:

- Monitoring room or hallway occupancy.
- Visualizing crowd distribution at events.
- Smart-building foot traffic analytics.
- Classroom or lab occupancy tracking.
- Retail movement or hotspot detection.
- Safety and evacuation pattern visualization.

CrowdMap provides a simple, privacy-safe method for mapping people indoors using only three ESP32 d
