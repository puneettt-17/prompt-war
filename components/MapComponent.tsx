'use client';

// =============================================================================
// ASTRA-GRID — Leaflet Map Component (client-only, dynamically imported)
// Priority-coded pins, causal cluster zones, and vulnerability rings
// =============================================================================

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CivicReport, VulnerableLandmark } from '@/lib/seedData';
import { CausalCluster } from '@/lib/aiEngine';

// Fix Leaflet default icon paths in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapComponentProps {
  reports: CivicReport[];
  landmarks: VulnerableLandmark[];
  clusters: CausalCluster[];
  showVulnerabilityRings: boolean;
  showClusterZones: boolean;
  onClusterClick: (clusterId: string) => void;
  selectedClusterId: string | null;
}

function getPriorityColor(score: number | null): string {
  if (score === null) return '#9CA3AF';
  if (score >= 80) return '#D92D20';
  if (score >= 60) return '#FF4F00';
  if (score >= 40) return '#D97706';
  return '#059669';
}

function createPriorityIcon(score: number | null, isMerged: boolean): L.DivIcon {
  const color = getPriorityColor(score);
  const size = isMerged ? 10 : 16;
  const opacity = isMerged ? 0.5 : 1;
  return L.divIcon({
    className: '',
    html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${color}; border: 2px solid white;
      border-radius: 50%; opacity: ${opacity};
      box-shadow: 0 0 6px ${color}80;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function createLandmarkIcon(type: string): L.DivIcon {
  const emoji = type === 'Hospital' ? '🏥' : type === 'School' ? '🏫' : type === 'Transit_Terminal' ? '🚏' : '🏪';
  return L.divIcon({
    className: '',
    html: `<div style="
      font-size: 18px; line-height: 1;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
    ">${emoji}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export default function MapComponent({
  reports,
  landmarks,
  clusters,
  showVulnerabilityRings,
  showClusterZones,
  onClusterClick,
  selectedClusterId,
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialize map centered on Mangaluru
    const map = L.map(containerRef.current, {
      center: [12.88, 74.845],
      zoom: 14,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing layers (except tile layer)
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    // Add report markers
    const masterReports = reports.filter(r => r.mergedIntoMasterId === null);
    const mergedReports = reports.filter(r => r.mergedIntoMasterId !== null);

    masterReports.forEach((r) => {
      const marker = L.marker([r.coords.lat, r.coords.lng], {
        icon: createPriorityIcon(r.priorityScore, false),
      }).addTo(map);

      const childCount = mergedReports.filter(c => c.mergedIntoMasterId === r.id).length;

      marker.bindPopup(`
        <div style="font-family: 'Inter', sans-serif; min-width: 200px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <span style="font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 13px;">${r.id}</span>
            <span style="background: ${getPriorityColor(r.priorityScore)}; color: white; padding: 1px 6px; border-radius: 4px; font-size: 11px; font-weight: 600;">
              ${r.priorityScore ?? '—'}
            </span>
          </div>
          <div style="font-size: 11px; color: #9CA3AF; margin-bottom: 4px;">${r.category.replace('_', ' ')} • ${r.status}</div>
          <div style="font-size: 12px; color: #F4F3EF; line-height: 1.4;">${r.rawText.slice(0, 100)}${r.rawText.length > 100 ? '...' : ''}</div>
          ${childCount > 0 ? `<div style="margin-top: 6px; font-size: 10px; color: #FF4F00;">+${childCount} merged report${childCount > 1 ? 's' : ''}</div>` : ''}
          ${r.nearestLandmark ? `<div style="margin-top: 4px; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #6B7280;">📍 ${r.nearestLandmark.distanceMeters}m from landmark</div>` : ''}
        </div>
      `);
    });

    // Add landmark markers
    landmarks.forEach((lm) => {
      const marker = L.marker([lm.coords.lat, lm.coords.lng], {
        icon: createLandmarkIcon(lm.type),
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: 'Inter', sans-serif;">
          <div style="font-weight: 600; font-size: 13px; color: #F4F3EF;">${lm.name}</div>
          <div style="font-size: 11px; color: #9CA3AF; margin-top: 2px;">${lm.type.replace('_', ' ')} • Weight: ${lm.vulnerabilityWeight}</div>
        </div>
      `);

      // Vulnerability rings
      if (showVulnerabilityRings) {
        L.circle([lm.coords.lat, lm.coords.lng], {
          radius: 200,
          color: '#FF4F00',
          fillColor: '#FF4F00',
          fillOpacity: 0.06,
          weight: 1,
          dashArray: '4 4',
        }).addTo(map);

        L.circle([lm.coords.lat, lm.coords.lng], {
          radius: 100,
          color: '#D92D20',
          fillColor: '#D92D20',
          fillOpacity: 0.08,
          weight: 1,
          dashArray: '4 4',
        }).addTo(map);
      }
    });

    // Cluster zones
    if (showClusterZones && clusters.length > 0) {
      clusters.forEach((cluster) => {
        const clusterReports = cluster.nodes.map(n => reports.find(r => r.id === n.reportId)).filter(Boolean) as CivicReport[];
        if (clusterReports.length === 0) return;

        // Calculate centroid
        const centroid = {
          lat: clusterReports.reduce((s, r) => s + r.coords.lat, 0) / clusterReports.length,
          lng: clusterReports.reduce((s, r) => s + r.coords.lng, 0) / clusterReports.length,
        };

        const circle = L.circle([centroid.lat, centroid.lng], {
          radius: 250,
          color: selectedClusterId === cluster.clusterId ? '#FF4F00' : '#D92D20',
          fillColor: selectedClusterId === cluster.clusterId ? '#FF4F00' : '#D92D20',
          fillOpacity: selectedClusterId === cluster.clusterId ? 0.15 : 0.08,
          weight: selectedClusterId === cluster.clusterId ? 2 : 1,
        }).addTo(map);

        circle.bindPopup(`
          <div style="font-family: 'Inter', sans-serif;">
            <div style="font-weight: 600; font-size: 13px; color: #FF4F00;">${cluster.clusterId}</div>
            <div style="font-size: 11px; color: #9CA3AF; margin-top: 2px;">${cluster.affectedReportCount} linked reports</div>
            <div style="font-size: 11px; color: #F4F3EF; margin-top: 4px;">${cluster.crewRoiText.slice(0, 120)}...</div>
          </div>
        `);

        circle.on('click', () => onClusterClick(cluster.clusterId));

        // Draw connecting lines between nodes
        for (const edge of cluster.edges) {
          const from = clusterReports.find(r => r.id === edge.from);
          const to = clusterReports.find(r => r.id === edge.to);
          if (from && to) {
            L.polyline(
              [[from.coords.lat, from.coords.lng], [to.coords.lat, to.coords.lng]],
              { color: '#FF4F00', weight: 2, opacity: 0.6, dashArray: '6 4' }
            ).addTo(map);
          }
        }
      });
    }
  }, [reports, landmarks, clusters, showVulnerabilityRings, showClusterZones, onClusterClick, selectedClusterId]);

  return (
    <div ref={containerRef} className="w-full h-full rounded-lg" style={{ minHeight: '400px' }} />
  );
}

