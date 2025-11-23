"""
WebSocket Server Integration for CrowdMap
Sends real-time triangulation data to the React frontend
"""

import asyncio
import json
import re
from bleak import BleakClient, BleakScanner
import numpy as np
from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS


# UUIDs - must match ESP32
SERVICE_UUID = "12345678-1234-1234-1234-1234567890ab"
CHAR_UUID = "87654321-4321-4321-4321-abcdefabcdef"

# ESP32 devices to connect to
ESP32_DEVICES = [
    "ESP32_Crowd_Node_1",
    "ESP32_Crowd_Node_2",
    "ESP32_Crowd_Node_3"
]


# Flask app for WebSocket server
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')


class ESP32Receiver:
    def __init__(self, name):
        self.name = name
        self.address = None
        self.client = None
        self.chunk_buffer = {}
        self.total_chunks = 0
        self.latest_data = {}
        self.receiving = False
        self.first_data_received = False

    def notification_handler(self, sender, data):
        """Handle chunked JSON data"""
        try:
            raw_str = data.decode('utf-8')

            if not raw_str:
                return

            if not self.first_data_received:
                self.first_data_received = True
                print(f"🎉 [{self.name}] First data received!")

            # Check if this is chunked data: [1/3]data
            chunk_match = re.match(r'\[(\d+)/(\d+)\](.*)', raw_str, re.DOTALL)

            if chunk_match:
                chunk_num = int(chunk_match.group(1))
                total_chunks = int(chunk_match.group(2))
                chunk_data = chunk_match.group(3)

                if chunk_num == 1:
                    self.chunk_buffer = {}
                    self.total_chunks = total_chunks
                    self.receiving = True
                    print(f"📦 [{self.name}] Receiving {total_chunks} chunks...")

                self.chunk_buffer[chunk_num] = chunk_data

                if chunk_num % 10 == 0 or chunk_num == total_chunks:
                    print(f"  [{self.name}] Progress: {chunk_num}/{total_chunks} chunks")

                if len(self.chunk_buffer) == total_chunks:
                    print(f"  [{self.name}] Reassembling {total_chunks} chunks...")

                    full_data = ''.join([self.chunk_buffer[i] for i in sorted(self.chunk_buffer.keys())])

                    try:
                        json_data = json.loads(full_data)
                        self.process_data(json_data)
                        print(f"✓ [{self.name}] Complete: {len(self.latest_data)} devices\n")
                    except json.JSONDecodeError as e:
                        print(f"⚠ [{self.name}] JSON Error: {e}")

                    self.chunk_buffer = {}
                    self.receiving = False
            else:
                # Not chunked, process directly
                json_data = json.loads(raw_str)
                self.process_data(json_data)

        except Exception as e:
            print(f"⚠ [{self.name}] Error: {e}")

    def process_data(self, json_data):
        """Store device data indexed by MAC"""
        self.latest_data = {}
        for device in json_data.get('devices', []):
            mac = device['mac']
            self.latest_data[mac] = {
                'distance': device['distance'],
                'rssi': device['rssi'],
                'id': device['id']
            }

    async def find_and_connect(self):
        """Find and connect to ESP32"""
        print(f"🔍 Scanning for '{self.name}'...")
        devices = await BleakScanner.discover(timeout=10.0)

        for device in devices:
            if device.name == self.name:
                self.address = device.address
                print(f"✓ Found: {self.name} ({self.address})")
                break

        if not self.address:
            print(f"✗ {self.name} not found")
            return False

        try:
            print(f"🔗 Connecting to {self.name}...")
            self.client = BleakClient(self.address, timeout=20.0)
            await self.client.connect()

            if self.client.is_connected:
                print(f"✓ {self.name} connected!")
                await asyncio.sleep(0.5)

                print(f"📡 [{self.name}] Subscribing to notifications...")
                await self.client.start_notify(CHAR_UUID, self.notification_handler)
                print(f"✓ [{self.name}] Subscribed!")
                await asyncio.sleep(1.0)

                return True
        except Exception as e:
            print(f"✗ {self.name} connection failed: {e}")
            return False

        return False

    async def disconnect(self):
        """Disconnect from ESP32"""
        if self.client and self.client.is_connected:
            try:
                await self.client.stop_notify(CHAR_UUID)
                await self.client.disconnect()
            except:
                pass


class TriangulationEngine:
    def __init__(self, receiver1, receiver2, receiver3):
        self.receiver1 = receiver1
        self.receiver2 = receiver2
        self.receiver3 = receiver3

        # ESP32 positions - matching frontend coordinates
        self.esp1_pos = np.array([10, 10])
        self.esp2_pos = np.array([90, 10])
        self.esp3_pos = np.array([50, 80])

    def get_node_positions(self):
        """Get ESP32 node positions for frontend"""
        return [
            {
                'id': 'ESP32-A',
                'name': 'Node 1',
                'position': [float(self.esp1_pos[0]), float(self.esp1_pos[1])],
                'status': 'online' if self.receiver1.client and self.receiver1.client.is_connected else 'offline',
                'rssiAvg': -65,
                'devicesDetected': len(self.receiver1.latest_data)
            },
            {
                'id': 'ESP32-B',
                'name': 'Node 2',
                'position': [float(self.esp2_pos[0]), float(self.esp2_pos[1])],
                'status': 'online' if self.receiver2.client and self.receiver2.client.is_connected else 'offline',
                'rssiAvg': -58,
                'devicesDetected': len(self.receiver2.latest_data)
            },
            {
                'id': 'ESP32-C',
                'name': 'Node 3',
                'position': [float(self.esp3_pos[0]), float(self.esp3_pos[1])],
                'status': 'online' if self.receiver3.client and self.receiver3.client.is_connected else 'offline',
                'rssiAvg': -62,
                'devicesDetected': len(self.receiver3.latest_data)
            }
        ]

    def triangulate(self, d1, d2, d3):
        """Triangulate position using three distance measurements"""
        p1 = self.esp1_pos
        p2 = self.esp2_pos
        p3 = self.esp3_pos

        try:
            ex = (p2 - p1) / np.linalg.norm(p2 - p1)
            i = np.dot(ex, p3 - p1)
            ey = (p3 - p1 - i * ex) / np.linalg.norm(p3 - p1 - i * ex)
            d = np.linalg.norm(p2 - p1)
            j = np.dot(ey, p3 - p1)

            x = (d1**2 - d2**2 + d**2) / (2 * d)
            y = (d1**2 - d3**2 + i**2 + j**2) / (2 * j) - (i / j) * x

            position = p1 + x * ex + y * ey

            if np.isnan(position).any() or np.isinf(position).any():
                return None

            return position
        except:
            return None

    def get_triangulated_devices(self):
        """Get triangulated device positions for frontend"""
        macs1 = set(self.receiver1.latest_data.keys())
        macs2 = set(self.receiver2.latest_data.keys())
        macs3 = set(self.receiver3.latest_data.keys())
        common_macs = macs1.intersection(macs2).intersection(macs3)

        devices = []
        device_id = 0

        for mac in common_macs:
            d1 = self.receiver1.latest_data[mac]['distance']
            d2 = self.receiver2.latest_data[mac]['distance']
            d3 = self.receiver3.latest_data[mac]['distance']

            pos = self.triangulate(d1, d2, d3)
            if pos is not None:
                # Get average RSSI
                rssi_avg = (
                    self.receiver1.latest_data[mac]['rssi'] +
                    self.receiver2.latest_data[mac]['rssi'] +
                    self.receiver3.latest_data[mac]['rssi']
                ) / 3

                devices.append({
                    'id': f'device-{device_id}',
                    'hashedId': self.receiver1.latest_data[mac]['id'][:8],
                    'position': [float(pos[0]), float(pos[1])],
                    'lastSeen': 0,
                    'rssi': {
                        'ESP32-A': self.receiver1.latest_data[mac]['rssi'],
                        'ESP32-B': self.receiver2.latest_data[mac]['rssi'],
                        'ESP32-C': self.receiver3.latest_data[mac]['rssi']
                    }
                })
                device_id += 1

        return devices


# Global instances
receiver1 = None
receiver2 = None
receiver3 = None
triangulation = None


@socketio.on('connect')
def handle_connect():
    print('🌐 Frontend connected!')
    socketio.emit('connection_status', {'status': 'connected'})


@socketio.on('disconnect')
def handle_disconnect():
    print('🌐 Frontend disconnected')


def broadcast_data():
    """Broadcast triangulation data to all connected clients"""
    if triangulation:
        data = {
            'nodes': triangulation.get_node_positions(),
            'devices': triangulation.get_triangulated_devices()
        }
        socketio.emit('map_update', data)




async def connect_all(receivers):
    """Connect to all ESP32s"""
    print("Connecting to all ESP32 devices...\n")
    connection_tasks = [receiver.find_and_connect() for receiver in receivers]
    results = await asyncio.gather(*connection_tasks)

    connected_count = sum(results)
    print(f"\n✓ Connected to {connected_count}/{len(ESP32_DEVICES)} devices\n")

    return connected_count > 0


async def esp32_loop():
    """Main ESP32 connection and data loop"""
    global receiver1, receiver2, receiver3, triangulation

    print("\n" + "="*70)
    print("Connecting to ESP32 devices...")
    print("="*70 + "\n")

    receiver1 = ESP32Receiver(ESP32_DEVICES[0])
    receiver2 = ESP32Receiver(ESP32_DEVICES[1])
    receiver3 = ESP32Receiver(ESP32_DEVICES[2])

    if not await connect_all([receiver1, receiver2, receiver3]):
        print("❌ No ESP32s connected. Server will still run but show no data.")
    else:
        print("⏳ Waiting for ESP32s to start scanning (3-5 seconds)...")
        await asyncio.sleep(5)

    triangulation = TriangulationEngine(receiver1, receiver2, receiver3)

    print("📡 Broadcasting data to frontend...\n")

    # Broadcast loop
    try:
        while True:
            broadcast_data()
            await asyncio.sleep(2)  # Update every 2 seconds
    except Exception as e:
        print(f"Error in broadcast loop: {e}")


def start_background_loop(loop):
    """Start the asyncio event loop in background"""
    asyncio.set_event_loop(loop)
    loop.run_until_complete(esp32_loop())


if __name__ == "__main__":
    try:
        # Check dependencies
        import flask
        import flask_socketio
        import flask_cors
    except ImportError:
        print("❌ Missing required packages!")
        print("\nInstall with:")
        print("  pip install flask flask-socketio flask-cors python-socketio bleak numpy")
        exit(1)

    print("="*70)
    print("CrowdMap WebSocket Server")
    print("="*70)

    # Use port 5001 to avoid conflicts
    PORT = 5001

    print(f"\n🚀 Starting WebSocket server on port {PORT}...")
    print(f"📱 Frontend should connect to: http://localhost:{PORT}\n")

    # Start ESP32 loop in background
    import threading
    loop = asyncio.new_event_loop()
    esp32_thread = threading.Thread(target=start_background_loop, args=(loop,), daemon=True)
    esp32_thread.start()

    # Give ESP32s time to connect before starting server
    import time
    time.sleep(2)

    # Run Flask-SocketIO server (blocking)
    try:
        socketio.run(app, host='0.0.0.0', port=PORT, debug=False, use_reloader=False, allow_unsafe_werkzeug=True)
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping...")
    finally:
        if receiver1:
            loop.run_until_complete(receiver1.disconnect())
        if receiver2:
            loop.run_until_complete(receiver2.disconnect())
        if receiver3:
            loop.run_until_complete(receiver3.disconnect())
        print("✓ Disconnected")
