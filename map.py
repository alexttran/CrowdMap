import asyncio
import json
import re
from bleak import BleakClient, BleakScanner
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
import numpy as np


# UUIDs - must match ESP32
SERVICE_UUID = "12345678-1234-1234-1234-1234567890ab"
CHAR_UUID = "87654321-4321-4321-4321-abcdefabcdef"


# ESP32 devices to connect to
ESP32_DEVICES = [
    "ESP32_Crowd_Node_1",
    "ESP32_Crowd_Node_2",
    "ESP32_Crowd_Node_3"
]


class ESP32Receiver:
    def __init__(self, name):
        self.name = name
        self.address = None
        self.client = None
        self.chunk_buffer = {}
        self.total_chunks = 0
        self.latest_data = {}
        self.receiving = False
        self.first_data_received = False  # NEW: Track first data
       
    def notification_handler(self, sender, data):
        """Handle chunked JSON data"""
        try:
            raw_str = data.decode('utf-8')
           
            if not raw_str:
                return
           
            # Mark that we've received data
            if not self.first_data_received:
                self.first_data_received = True
                print(f"🎉 [{self.name}] First data received!")
           
            # Check if this is chunked data: [1/3]data
            chunk_match = re.match(r'\[(\d+)/(\d+)\](.*)', raw_str, re.DOTALL)
           
            if chunk_match:
                chunk_num = int(chunk_match.group(1))
                total_chunks = int(chunk_match.group(2))
                chunk_data = chunk_match.group(3)
               
                # New session
                if chunk_num == 1:
                    self.chunk_buffer = {}
                    self.total_chunks = total_chunks
                    self.receiving = True
                    print(f"📦 [{self.name}] Receiving {total_chunks} chunks...")
               
                # Store chunk
                self.chunk_buffer[chunk_num] = chunk_data
               
                # Progress indicator for large transfers
                if chunk_num % 10 == 0 or chunk_num == total_chunks:
                    print(f"  [{self.name}] Progress: {chunk_num}/{total_chunks} chunks")
               
                # Check if we have all chunks
                if len(self.chunk_buffer) == total_chunks:
                    print(f"  [{self.name}] Reassembling {total_chunks} chunks...")
                   
                    # Reassemble
                    full_data = ''.join([self.chunk_buffer[i] for i in sorted(self.chunk_buffer.keys())])
                   
                    # Parse and store
                    try:
                        json_data = json.loads(full_data)
                        self.process_data(json_data)
                        print(f"✓ [{self.name}] Complete: {len(self.latest_data)} devices\n")
                    except json.JSONDecodeError as e:
                        print(f"⚠ [{self.name}] JSON Error: {e}")
                        print(f"  Data length: {len(full_data)} bytes")
                   
                    # Clear buffer
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
       
        # Find device
        for device in devices:
            if device.name == self.name:
                self.address = device.address
                print(f"✓ Found: {self.name} ({self.address})")
                break
       
        if not self.address:
            print(f"✗ {self.name} not found")
            return False
       
        # Connect
        try:
            print(f"🔗 Connecting to {self.name}...")
            self.client = BleakClient(self.address, timeout=20.0)
            await self.client.connect()
           
            if self.client.is_connected:
                print(f"✓ {self.name} connected!")
               
                # CRITICAL: Wait before subscribing
                await asyncio.sleep(0.5)
               
                # Subscribe to notifications
                print(f"📡 [{self.name}] Subscribing to notifications...")
                await self.client.start_notify(CHAR_UUID, self.notification_handler)
                print(f"✓ [{self.name}] Subscribed!")
               
                # Wait a bit for ESP32 to register subscription
                await asyncio.sleep(1.0)
               
                return True
        except Exception as e:
            print(f"✗ {self.name} connection failed: {e}")
            import traceback
            traceback.print_exc()
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


class TriangulationPlotter:
    def __init__(self, receiver1, receiver2, receiver3):
        self.receiver1 = receiver1
        self.receiver2 = receiver2
        self.receiver3 = receiver3
       
        # ESP32 positions (you can adjust these based on your actual setup)
        # Forming a triangle for better triangulation
        self.esp1_pos = np.array([0, 0])      # Bottom left
        self.esp2_pos = np.array([10, 0])     # Bottom right
        self.esp3_pos = np.array([5, 8.66])   # Top (equilateral triangle)
       
        # Setup plot
        self.fig, self.ax = plt.subplots(figsize=(12, 10))
        self.ax.set_xlabel('X Position (meters)', fontsize=12)
        self.ax.set_ylabel('Y Position (meters)', fontsize=12)
        self.ax.set_title('Device Triangulation Map', fontsize=14, fontweight='bold')
        self.ax.grid(True, alpha=0.3)
        self.ax.set_aspect('equal')
       
        # Set axis limits
        self.ax.set_xlim(-2, 12)
        self.ax.set_ylim(-2, 11)
       
        # Scatter plot for devices
        self.scatter = self.ax.scatter([], [], c='red', s=100, alpha=0.6,
                                      edgecolors='black', label='Devices')
       
        # Info text
        self.info_text = self.ax.text(
            0.02, 0.98, '', transform=self.ax.transAxes,
            verticalalignment='top', fontsize=10,
            bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.8)
        )
       
        # ESP32 markers
        self.ax.scatter([self.esp1_pos[0]], [self.esp1_pos[1]], c='blue', s=300,
                       marker='s', edgecolors='black', linewidths=2,
                       label=receiver1.name, zorder=10)
        self.ax.text(self.esp1_pos[0]+0.3, self.esp1_pos[1]+0.3, 'ESP1',
                    fontsize=9, fontweight='bold', color='blue')
       
        self.ax.scatter([self.esp2_pos[0]], [self.esp2_pos[1]], c='green', s=300,
                       marker='s', edgecolors='black', linewidths=2,
                       label=receiver2.name, zorder=10)
        self.ax.text(self.esp2_pos[0]+0.3, self.esp2_pos[1]+0.3, 'ESP2',
                    fontsize=9, fontweight='bold', color='green')
       
        self.ax.scatter([self.esp3_pos[0]], [self.esp3_pos[1]], c='purple', s=300,
                       marker='s', edgecolors='black', linewidths=2,
                       label=receiver3.name, zorder=10)
        self.ax.text(self.esp3_pos[0]+0.3, self.esp3_pos[1]+0.3, 'ESP3',
                    fontsize=9, fontweight='bold', color='purple')
       
        self.ax.legend(loc='upper right')
   
    def triangulate(self, d1, d2, d3):
        """
        Triangulate position using three distance measurements
        Returns (x, y) position or None if triangulation fails
        """
        # Using trilateration algorithm
        # https://en.wikipedia.org/wiki/True_range_multilateration
       
        p1 = self.esp1_pos
        p2 = self.esp2_pos
        p3 = self.esp3_pos
       
        # Vector from p1 to p2
        ex = (p2 - p1) / np.linalg.norm(p2 - p1)
       
        # Signed magnitude of the x component
        i = np.dot(ex, p3 - p1)
       
        # The y component
        ey = (p3 - p1 - i * ex) / np.linalg.norm(p3 - p1 - i * ex)
       
        # The z component (perpendicular to both)
        ez = np.cross(ex, ey)
       
        # Distance between p1 and p2
        d = np.linalg.norm(p2 - p1)
       
        # Distance of p3 along ex
        j = np.dot(ey, p3 - p1)
       
        # Coordinates in the new coordinate system
        x = (d1**2 - d2**2 + d**2) / (2 * d)
        y = (d1**2 - d3**2 + i**2 + j**2) / (2 * j) - (i / j) * x
       
        # Convert back to original coordinate system
        position = p1 + x * ex + y * ey
       
        # Basic sanity check
        if np.isnan(position).any() or np.isinf(position).any():
            return None
       
        return position
   
    def update_plot(self, frame):
        """Update the scatter plot with triangulated positions"""
        # Find common devices across all three ESP32s
        macs1 = set(self.receiver1.latest_data.keys())
        macs2 = set(self.receiver2.latest_data.keys())
        macs3 = set(self.receiver3.latest_data.keys())
        common_macs = macs1.intersection(macs2).intersection(macs3)
       
        # Update info text
        data_status = "Waiting..." if not (self.receiver1.first_data_received and
                                           self.receiver2.first_data_received and
                                           self.receiver3.first_data_received) else "Receiving"
        info = f"Status: {data_status}\n"
        info += f"ESP1 Devices: {len(macs1)}\n"
        info += f"ESP2 Devices: {len(macs2)}\n"
        info += f"ESP3 Devices: {len(macs3)}\n"
        info += f"Common Devices: {len(common_macs)}\n"
       
        if not common_macs:
            if not (self.receiver1.first_data_received and
                   self.receiver2.first_data_received and
                   self.receiver3.first_data_received):
                info += "Waiting for first scan..."
            else:
                info += "No common devices yet"
            self.info_text.set_text(info)
            return [self.scatter, self.info_text]
       
        # Triangulate positions
        positions = []
       
        for mac in common_macs:
            d1 = self.receiver1.latest_data[mac]['distance']
            d2 = self.receiver2.latest_data[mac]['distance']
            d3 = self.receiver3.latest_data[mac]['distance']
           
            pos = self.triangulate(d1, d2, d3)
            if pos is not None:
                positions.append(pos)
       
        if positions:
            positions = np.array(positions)
            self.scatter.set_offsets(positions)
            info += f"Triangulated: {len(positions)}"
        else:
            info += "No valid triangulations"
       
        self.info_text.set_text(info)
       
        return [self.scatter, self.info_text]


async def connect_all(receivers):
    """Connect to all ESP32s"""
    print("Connecting to all ESP32 devices...\n")
    connection_tasks = [receiver.find_and_connect() for receiver in receivers]
    results = await asyncio.gather(*connection_tasks)
   
    connected_count = sum(results)
    print(f"\n✓ Connected to {connected_count}/{len(ESP32_DEVICES)} devices\n")
   
    return connected_count > 0


async def main():
    print("="*70)
    print("Triple ESP32 Triangulation Map")
    print("="*70 + "\n")
   
    # Create receiver objects
    receiver1 = ESP32Receiver(ESP32_DEVICES[0])
    receiver2 = ESP32Receiver(ESP32_DEVICES[1])
    receiver3 = ESP32Receiver(ESP32_DEVICES[2])
   
    # Connect to devices
    if not await connect_all([receiver1, receiver2, receiver3]):
        print("❌ No devices connected. Exiting.")
        return
   
    print("⏳ Waiting for ESP32s to start scanning (3-5 seconds)...")
    await asyncio.sleep(5)  # Give ESP32s time to start their first scan
   
    print("🎨 Launching visualization...")
   
    # Create plotter
    plotter = TriangulationPlotter(receiver1, receiver2, receiver3)
   
    # Setup non-blocking plot
    plt.ion()
    plt.show(block=False)
   
    # Keep updating
    try:
        while plt.fignum_exists(plotter.fig.number):
            plotter.update_plot(None)
            plt.pause(1.0)
            await asyncio.sleep(0.01)
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping...")
    finally:
        print("Disconnecting devices...")
        await receiver1.disconnect()
        await receiver2.disconnect()
        await receiver3.disconnect()
        print("✓ Disconnected")
        plt.close('all')


if __name__ == "__main__":
    try:
        import matplotlib
        import numpy
        from bleak import BleakClient
    except ImportError as e:
        print("❌ Missing required package!")
        print("\nPlease install:")
        print("  pip install bleak numpy matplotlib")
        exit(1)
   
    asyncio.run(main())
