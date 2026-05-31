import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { useGameState } from '../context/GameStateContext';
import { gameNodes, gameConnections } from '../constants/mockData';

const ISTANBUL_REGION = {
  latitude: 41.010,
  longitude: 28.995,
  latitudeDelta: 0.16,
  longitudeDelta: 0.22,
};

export const TYPE_COLORS: Record<string, string> = {
  Metro:    '#4CAF50',
  Ferry:    '#00BCD4',
  Metrobus: '#FF9800',
  Marmaray: '#9C27B0',
  Bus:      '#2196F3',
  Walking:  '#78909C',
};

const PulsingMarker = ({ color, size }: { color: string; size: number }) => {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale,   { toValue: 1.6, duration: 900, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 1,   duration: 900, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0,   duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 900, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={{ width: size + 16, height: size + 16, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute',
        width: size + 16, height: size + 16,
        borderRadius: (size + 16) / 2,
        backgroundColor: color,
        opacity,
        transform: [{ scale }],
      }} />
      <View style={{
        width: size, height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        borderWidth: 2, borderColor: '#fff',
      }} />
    </View>
  );
};

const StationDot = ({ color, size, dim }: { color: string; size: number; dim: boolean }) => (
  <View style={{
    width: size + 6, height: size + 6,
    borderRadius: (size + 6) / 2,
    backgroundColor: dim ? '#1a1a2e' : color,
    borderWidth: 2, borderColor: dim ? '#333' : color,
    opacity: dim ? 0.5 : 1,
    shadowColor: color, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: dim ? 0 : 0.9, shadowRadius: 6,
  }} />
);

interface GameMapViewProps {
  availableDestinations: string[];
}

export const GameMapView = ({ availableDestinations }: GameMapViewProps) => {
  const mapRef = useRef<MapView>(null);
  const { state, travel } = useGameState();

  useEffect(() => {
    if (travel.isActive) return;
    const node = gameNodes.find(n => n.id === state.currentLocation);
    if (node && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude:       node.coords.lat - 0.025,
        longitude:      node.coords.lng,
        latitudeDelta:  0.13,
        longitudeDelta: 0.18,
      }, 1000);
    }
  }, [state.currentLocation, travel.isActive]);

  const availableConnectionIds = new Set(
    gameConnections
      .filter(c => c.fromId === state.currentLocation || c.toId === state.currentLocation)
      .map(c => `${c.fromId}-${c.toId}`)
  );

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFillObject}
      provider={PROVIDER_DEFAULT}
      mapType="mutedStandard"
      initialRegion={ISTANBUL_REGION}
      scrollEnabled={false}
      zoomEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      showsUserLocation={false}
      showsCompass={false}
      showsScale={false}
      showsTraffic={false}
    >
      {gameConnections.map((conn, idx) => {
        const from = gameNodes.find(n => n.id === conn.fromId);
        const to   = gameNodes.find(n => n.id === conn.toId);
        if (!from || !to) return null;
        const key = `${conn.fromId}-${conn.toId}`;
        const isAvailable =
          availableConnectionIds.has(key) ||
          availableConnectionIds.has(`${conn.toId}-${conn.fromId}`);
        return (
          <Polyline
            key={`line-${idx}`}
            coordinates={[
              { latitude: from.coords.lat, longitude: from.coords.lng },
              { latitude: to.coords.lat,   longitude: to.coords.lng   },
            ]}
            strokeColor={isAvailable ? TYPE_COLORS[conn.type] : '#2a2d3a'}
            strokeWidth={isAvailable ? 4 : 2}
            lineDashPattern={conn.type === 'Walking' ? [6, 5] : undefined}
          />
        );
      })}

      {gameNodes.map(node => {
        const isCurrent = node.id === state.currentLocation;
        const isTarget  = node.id === state.targetLocation;
        const isAvail   = availableDestinations.includes(node.id);
        const dim       = !isCurrent && !isTarget && !isAvail;
        return (
          <Marker
            key={node.id}
            coordinate={{ latitude: node.coords.lat, longitude: node.coords.lng }}
            tracksViewChanges={isCurrent || isTarget}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            {isCurrent ? (
              <PulsingMarker color="#FFD700" size={14} />
            ) : isTarget ? (
              <PulsingMarker color="#FF5252" size={14} />
            ) : (
              <StationDot
                color={TYPE_COLORS[node.type] || '#fff'}
                size={isAvail ? 12 : 8}
                dim={dim}
              />
            )}
          </Marker>
        );
      })}
    </MapView>
  );
};
