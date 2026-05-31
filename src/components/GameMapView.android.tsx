/**
 * Android map alternative: Metro-style network diagram.
 * No Google Maps API key required.
 */
import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Animated, Dimensions, Text } from 'react-native';
import { useGameState } from '../context/GameStateContext';
import { gameNodes, gameConnections } from '../constants/mockData';

const { width: SW, height: SH } = Dimensions.get('window');

export const TYPE_COLORS: Record<string, string> = {
  Metro:    '#4CAF50',
  Ferry:    '#00BCD4',
  Metrobus: '#FF9800',
  Marmaray: '#9C27B0',
  Bus:      '#2196F3',
  Walking:  '#78909C',
};

// Istanbul bounding box → screen coords
const LAT_MIN = 40.95, LAT_MAX = 41.10;
const LNG_MIN = 28.70, LNG_MAX = 29.12;
const PAD = 40;

const toScreen = (lat: number, lng: number) => ({
  x: PAD + ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * (SW - PAD * 2),
  y: PAD + ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * (SH * 0.55 - PAD * 2),
});

interface GameMapViewProps {
  availableDestinations: string[];
}

const PulsingDot = ({ color, size }: { color: string; size: number }) => {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale,   { toValue: 2,   duration: 800, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 1,   duration: 800, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0,   duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.5, duration: 800, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute',
        width: size, height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ scale }],
      }} />
      <View style={{
        width: size * 0.55, height: size * 0.55,
        borderRadius: size / 2,
        backgroundColor: color,
        borderWidth: 2, borderColor: '#fff',
      }} />
    </View>
  );
};

export const GameMapView = ({ availableDestinations }: GameMapViewProps) => {
  const { state } = useGameState();

  const availableSet = new Set(
    gameConnections
      .filter(c => c.fromId === state.currentLocation || c.toId === state.currentLocation)
      .map(c => `${c.fromId}-${c.toId}`)
  );

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Dark gradient background */}
      <View style={styles.bg} />

      {/* Grid lines for atmosphere */}
      {[...Array(8)].map((_, i) => (
        <View key={`h${i}`} style={[styles.gridLine, { top: (SH / 8) * i, width: SW }]} />
      ))}
      {[...Array(6)].map((_, i) => (
        <View key={`v${i}`} style={[styles.gridLine, { left: (SW / 6) * i, height: SH, width: 1 }]} />
      ))}

      {/* Transit connections */}
      {gameConnections.map((conn, idx) => {
        const from = gameNodes.find(n => n.id === conn.fromId);
        const to   = gameNodes.find(n => n.id === conn.toId);
        if (!from || !to) return null;

        const fp = toScreen(from.coords.lat, from.coords.lng);
        const tp = toScreen(to.coords.lat,   to.coords.lng);
        const key = `${conn.fromId}-${conn.toId}`;
        const isAvail =
          availableSet.has(key) || availableSet.has(`${conn.toId}-${conn.fromId}`);

        const dx = tp.x - fp.x;
        const dy = tp.y - fp.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle  = Math.atan2(dy, dx) * (180 / Math.PI);

        return (
          <View
            key={`conn-${idx}`}
            style={{
              position: 'absolute',
              left: fp.x,
              top:  fp.y,
              width: length,
              height: isAvail ? 3 : 1.5,
              backgroundColor: isAvail ? TYPE_COLORS[conn.type] : '#252840',
              opacity: isAvail ? 0.9 : 0.4,
              transform: [{ rotate: `${angle}deg` }],
              transformOrigin: 'left center',
            }}
          />
        );
      })}

      {/* Station nodes */}
      {gameNodes.map(node => {
        const pos       = toScreen(node.coords.lat, node.coords.lng);
        const isCurrent = node.id === state.currentLocation;
        const isTarget  = node.id === state.targetLocation;
        const isAvail   = availableDestinations.includes(node.id);
        const color     = isCurrent
          ? '#FFD700'
          : isTarget
            ? '#FF5252'
            : TYPE_COLORS[node.type] || '#fff';
        const nodeSize  = isCurrent || isTarget ? 22 : isAvail ? 16 : 10;

        return (
          <View
            key={node.id}
            style={{
              position: 'absolute',
              left: pos.x - nodeSize / 2,
              top:  pos.y - nodeSize / 2,
            }}
          >
            {isCurrent || isTarget ? (
              <PulsingDot color={color} size={nodeSize} />
            ) : (
              <View style={{
                width: nodeSize, height: nodeSize,
                borderRadius: nodeSize / 2,
                backgroundColor: color,
                opacity: isAvail ? 1 : 0.35,
                borderWidth: isAvail ? 2 : 1,
                borderColor: isAvail ? color : '#333',
              }} />
            )}
            {(isAvail || isCurrent || isTarget) && (
              <Text style={[styles.label, { color: isCurrent ? '#FFD700' : isTarget ? '#FF5252' : '#ccc' }]}>
                {node.name}
              </Text>
            )}
          </View>
        );
      })}

      {/* Bosphorus label */}
      <Text style={styles.bosphorusLabel}>— BOĞAZ —</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#080d1a',
  },
  gridLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: '#0d1330',
  },
  label: {
    position: 'absolute',
    top: 18,
    left: -20,
    width: 80,
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  bosphorusLabel: {
    position: 'absolute',
    top: SH * 0.27,
    width: SW,
    textAlign: 'center',
    fontSize: 11,
    color: '#00BCD420',
    letterSpacing: 6,
    fontWeight: '600',
  },
});
