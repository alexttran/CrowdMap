import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import './HeatMap.css';

const HeatMap = ({ devices, nodes }) => {
  const mapRef = useRef(null);
  const heatLayerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create a custom CRS (Coordinate Reference System) for indoor mapping
    const bounds = [[0, 0], [100, 120]];

    // Initialize map
    const map = L.map(mapRef.current, {
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 10,
      zoomControl: true,
      attributionControl: false
    });

    // Set view to center of the area
    map.fitBounds(bounds);

    // Add a dark custom tile layer (grid background)
    const gridLayer = L.layerGroup();
    map.addLayer(gridLayer);

    mapInstanceRef.current = map;

    // Add ESP32 node markers
    nodes.forEach(node => {
      const icon = L.divIcon({
        className: 'node-marker',
        html: `
          <div class="node-marker-inner ${node.status}">
            <div class="node-pulse"></div>
            <div class="node-label">${node.name}</div>
          </div>
        `,
        iconSize: [40, 40]
      });

      L.marker([node.position[1], node.position[0]], { icon })
        .addTo(map)
        .bindPopup(`
          <div class="node-popup">
            <strong>${node.name}</strong><br/>
            Status: ${node.status}<br/>
            Avg RSSI: ${node.rssiAvg} dBm<br/>
            Devices: ${node.devicesDetected}
          </div>
        `);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [nodes]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    console.log('🔥 Heatmap Effect Running');
    console.log('📊 Devices count:', devices.length);
    console.log('📍 Device positions:', devices.slice(0, 3).map(d => d.position));
    console.log('🗺️ L.heatLayer available:', typeof L.heatLayer);

    // Remove old heat layer
    if (heatLayerRef.current) {
      mapInstanceRef.current.removeLayer(heatLayerRef.current);
    }

    if (devices.length === 0) {
      console.warn('⚠️ No devices to display on heatmap');
      return;
    }

    // Create heat map data points [lat, lng, intensity]
    const heatData = devices.map(device => [
      device.position[1], // lat (y)
      device.position[0], // lng (x)
      1.0 // max intensity
    ]);

    console.log('🔥 Heat data sample:', heatData.slice(0, 3));

    // Check if L.heatLayer exists
    if (!L.heatLayer) {
      console.error('❌ L.heatLayer is not available! leaflet.heat not loaded');
      return;
    }

    // Add heat layer with MAXIMUM visibility for debugging
    heatLayerRef.current = L.heatLayer(heatData, {
      radius: 80,          // Much larger radius
      blur: 40,            // Less blur for sharper visibility
      maxZoom: 10,
      max: 1.0,            // Maximum intensity
      minOpacity: 0.3,     // Minimum opacity so it's always visible
      gradient: {
        0.0: '#0000ff',    // Bright blue (fully opaque for testing)
        0.5: '#ff00ff',    // Bright magenta
        1.0: '#ff0000'     // Bright red
      }
    });

    console.log('✅ Heatmap layer created:', heatLayerRef.current);
    heatLayerRef.current.addTo(mapInstanceRef.current);
    console.log('✅ Heatmap layer added to map');
  }, [devices]);

  return (
    <div className="heatmap-container">
      <div ref={mapRef} className="leaflet-map" />

      {/* Heatmap Legend */}
      <div className="heatmap-legend">
        <div className="legend-title">Device Density</div>
        <div className="legend-scale">
          <div className="legend-labels">
            <span>High</span>
            <span>Medium</span>
            <span>Low</span>
            <span>None</span>
          </div>
          <div className="legend-gradient"></div>
        </div>
        <div className="legend-info">
          {devices.length} devices detected
        </div>
      </div>
    </div>
  );
};

export default HeatMap;
