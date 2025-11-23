import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import HeatMap from './components/HeatMap';
import StatsPanel from './components/StatsPanel';
import { esp32Nodes, detectedDevices, updateDevicePositions } from './data/mockData';
import './App.css';

// WebSocket server URL - change if running on different host
const SOCKET_URL = 'http://localhost:5001';

function App() {
  const [devices, setDevices] = useState(detectedDevices);
  const [nodes, setNodes] = useState(esp32Nodes);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log('Attempting to connect to WebSocket server at', SOCKET_URL);

    // Connect to WebSocket server
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('✅ Connected to CrowdMap backend!');
      setConnectionStatus('connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from backend');
      setConnectionStatus('disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.log('Connection error:', error.message);
      setConnectionStatus('error');
      setIsConnected(false);
    });

    socket.on('connection_status', (data) => {
      console.log('Backend status:', data);
    });

    socket.on('map_update', (data) => {
      // Receive real-time data from backend
      if (data.nodes && data.devices) {
        console.log('📡 Received update:', data.devices.length, 'devices');
        setNodes(data.nodes);
        setDevices(data.devices);
      }
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  // Mock data animation when not connected to backend
  useEffect(() => {
    if (!isConnected) {
      console.log('🔄 Using mock data animation');
      const interval = setInterval(() => {
        const updatedDevices = updateDevicePositions();
        setDevices([...updatedDevices]);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isConnected]);

  return (
    <div className="app">
      <div className="main-content">
        <HeatMap devices={devices} nodes={nodes} />
        <div className="connection-indicator">
          <div className={`status-dot ${connectionStatus}`}></div>
          <span>
            {connectionStatus === 'connected'
              ? '🟢 Live Data'
              : connectionStatus === 'error'
              ? '🔴 Connection Error'
              : '🟡 Using Mock Data'}
          </span>
        </div>
      </div>
      <div className="side-panel">
        <StatsPanel devices={devices} nodes={nodes} />
      </div>
    </div>
  );
}

export default App;
