# CrowdMap Real-Time Integration Setup

This guide shows how to connect the Python backend with the React frontend for real-time triangulation visualization.

## Architecture

```
ESP32s → Python Backend → WebSocket Server → React Frontend
  (BLE)     (map_websocket.py)   (port 5000)    (port 5173)
```

## Installation

### 1. Install Python Dependencies

```bash
pip install flask flask-socketio flask-cors python-socketio bleak numpy
```

### 2. Install Frontend Dependencies

Already installed! (socket.io-client)

## Running the System

### Step 1: Start the Python Backend

In one terminal:

```bash
cd /Users/alextran/Personal-Projects/CrowdSensor
python map_websocket.py
```

You should see:
```
Connecting to all ESP32 devices...
✓ Connected to X/3 devices
🚀 WebSocket server running at http://localhost:5000
📡 Broadcasting data to frontend...
```

### Step 2: Start the React Frontend

In another terminal (already running):

```bash
cd /Users/alextran/Personal-Projects/CrowdSensor/frontend
npm run dev
```

Frontend is at: http://localhost:5173

## What You'll See

### Frontend Interface

1. **Main Map Area**:
   - Shows ESP32 nodes as pulsing cyan markers
   - Displays detected devices as white dots with pulse animation
   - Heatmap overlay showing device density

2. **Connection Indicator** (top-left):
   - 🟢 **Live Data**: Connected to backend, receiving real data
   - 🟡 **Using Mock Data**: Not connected, showing placeholder data
   - 🔴 **Connection Error**: Failed to connect

3. **Stats Panel** (right side):
   - Total devices detected
   - Active nodes status
   - Average signal strength
   - System uptime

### Backend Console

You'll see:
```
🎉 [ESP32_Crowd_Node_1] First data received!
📦 [ESP32_Crowd_Node_1] Receiving 45 chunks...
✓ [ESP32_Crowd_Node_1] Complete: 123 devices

🌐 Frontend connected!
```

## Data Flow

1. **ESP32s scan** for BLE devices (every 2-5 seconds)
2. **Python backend**:
   - Receives device data from all 3 ESP32s
   - Matches devices by MAC address
   - Calculates positions using trilateration
   - Broadcasts to WebSocket every 2 seconds

3. **React frontend**:
   - Connects to WebSocket on load
   - Receives `map_update` events with:
     ```json
     {
       "nodes": [
         {"id": "ESP32-A", "position": [10, 10], "status": "online", ...},
         ...
       ],
       "devices": [
         {"id": "device-0", "position": [45.2, 38.7], ...},
         ...
       ]
     }
     ```
   - Updates visualization in real-time

## Coordinate System

Both backend and frontend use the same coordinate system:

```
       ESP3 (50, 80)
          /\
         /  \
        /    \
       /      \
      /        \
     /          \
ESP1 (10,10) ---- ESP2 (90,10)
```

- **X-axis**: 0-100 meters (horizontal)
- **Y-axis**: 0-100 meters (vertical)
- **ESP32 positions** are fixed and match on both sides

## Troubleshooting

### Frontend shows "Using Mock Data"

**Cause**: Can't connect to backend

**Fix**:
1. Make sure Python backend is running
2. Check backend console for errors
3. Verify WebSocket URL in frontend/src/App.jsx (should be `http://localhost:5000`)

### Backend shows "No devices connected"

**Cause**: ESP32s not found or not sending JSON

**Fix**:
1. Make sure ESP32s are powered on
2. Verify ESP32s are sending JSON format (not old integer format)
3. Check ESP32 BLE names match: `ESP32_Crowd_Node_1`, `ESP32_Crowd_Node_2`, `ESP32_Crowd_Node_3`

### Devices not appearing on map

**Cause**: No common devices detected by all 3 ESP32s

**Fix**:
1. Wait a few scan cycles (10-15 seconds)
2. Make sure all 3 ESP32s can see the same BLE devices
3. Check ESP32 positions - they need to be spread out enough

### CORS errors in browser console

**Cause**: CORS not configured

**Fix**: Already handled! flask-cors is configured with `cors_allowed_origins="*"`

## Configuration

### Change WebSocket Port

**Backend** (map_websocket.py:299):
```python
socketio.run(app, host='0.0.0.0', port=5000, ...)
```

**Frontend** (frontend/src/App.jsx:9):
```javascript
const SOCKET_URL = 'http://localhost:5000';
```

### Adjust ESP32 Positions

**Backend** (map_websocket.py:179-181):
```python
self.esp1_pos = np.array([10, 10])
self.esp2_pos = np.array([90, 10])
self.esp3_pos = np.array([50, 80])
```

**Frontend**: Will automatically update from backend data!

### Change Update Frequency

**Backend** (map_websocket.py:252):
```python
await asyncio.sleep(2)  # Update every 2 seconds
```

## Testing Without ESP32s

For testing without hardware, you can modify the backend to send fake triangulated data:

```python
# In map_websocket.py, modify get_triangulated_devices():
def get_triangulated_devices(self):
    # Add fake devices for testing
    return [
        {'id': 'test-1', 'position': [30, 40], 'hashedId': 'ABC123', ...},
        {'id': 'test-2', 'position': [60, 50], 'hashedId': 'DEF456', ...},
    ]
```

## Performance

- **Update Rate**: 2 seconds (configurable)
- **WebSocket Latency**: ~10-50ms
- **Browser Memory**: ~50-100MB
- **Network**: ~1-5 KB/s (depends on device count)

## Next Steps

1. ✅ Backend sends real triangulated positions
2. ✅ Frontend receives and displays real-time data
3. ✅ Connection status indicator
4. 🔄 Add device labels with IDs
5. 🔄 Historical tracking/trails
6. 🔄 Click device to see details
7. 🔄 Export data to CSV/JSON
