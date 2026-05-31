import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// ── Istanbul skyline (pure View-based silhouette) ────────────────────────────

const Minaret = ({ h, style }: { h: number; style?: object }) => (
  <View style={[{ alignItems: 'center' }, style]}>
    <View style={{ width: 3, height: h * 0.25, backgroundColor: '#e55' }} />
    <View style={{ width: 7, height: h * 0.05, backgroundColor: '#1d2240', borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
    <View style={{ width: 4, height: h * 0.7, backgroundColor: '#1d2240' }} />
  </View>
);

const Dome = ({ w, h }: { w: number; h: number }) => (
  <View style={{ alignItems: 'center' }}>
    <View style={{ width: w, height: h * 0.55, borderTopLeftRadius: w / 2, borderTopRightRadius: w / 2, backgroundColor: '#1d2240' }} />
    <View style={{ width: w * 0.7, height: h * 0.45, backgroundColor: '#1d2240' }} />
  </View>
);

const Building = ({ w, h, radius = 0 }: { w: number; h: number; radius?: number }) => (
  <View style={{ width: w, height: h, backgroundColor: '#1a1e38', borderTopLeftRadius: radius, borderTopRightRadius: radius }} />
);

const Skyline = () => (
  <View style={styles.skylineContainer}>
    {/* Water */}
    <View style={styles.water} />

    {/* City layer */}
    <View style={styles.buildings}>
      {/* Far left */}
      <Building w={18} h={45} />
      <Minaret h={70} />
      <Building w={14} h={35} />
      <Dome w={38} h={50} />
      <Building w={10} h={28} />

      {/* Bridge towers */}
      <View style={styles.bridgeTower} />
      <View style={styles.bridgeCable} />
      <View style={styles.bridgeTower} />

      {/* Center right */}
      <Building w={12} h={30} />
      <Dome w={44} h={58} />
      <Minaret h={80} />
      <Building w={16} h={42} />
      <Dome w={32} h={44} />
      <Building w={20} h={50} />
      <Building w={12} h={32} />
      <Minaret h={65} />
      <Building w={18} h={38} />
    </View>

    {/* Water reflection shimmer */}
    <View style={styles.waterReflection}>
      {[...Array(8)].map((_, i) => (
        <View key={i} style={[styles.shimmer, { width: 20 + i * 8, opacity: 0.06 + i * 0.02 }]} />
      ))}
    </View>
  </View>
);

// ── Animated star dot ─────────────────────────────────────────────────────────

const Star = ({ x, y, delay }: { x: number; y: number; delay: number }) => {
  const opacity = useRef(new Animated.Value(0.2)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.2, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[styles.star, { left: x, top: y, opacity }]} />;
};

const STARS = [
  { x: 30, y: 60 }, { x: 80, y: 40 }, { x: 150, y: 90 }, { x: 220, y: 55 },
  { x: 280, y: 30 }, { x: 320, y: 80 }, { x: 50, y: 130 }, { x: 340, y: 120 },
];

// ── How to play content ───────────────────────────────────────────────────────

const HowToPlay = ({ onClose }: { onClose: () => void }) => (
  <View style={styles.howModal}>
    <View style={styles.howCard}>
      <Text style={styles.howTitle}>📖 Nasıl Oynanır?</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {[
          { icon: '📍', title: 'Görev', text: 'Her günün başında bir başlangıç noktası ve hedef verilir. Deadline\'dan önce hedefe ulaş.' },
          { icon: '🚇', title: 'Ulaşım', text: 'Alt paneldeki rota kartlarına bas. Metro, vapur, metrobüs, otobüs veya yürüyerek ilerle.' },
          { icon: '💳', title: 'İstanbulkart', text: 'Her binişte ücret kesilir. Bakiyen bitmeden dolum yap ya da abonman al.' },
          { icon: '🧠', title: 'Stres', text: 'Kalabalık hatlar ve trafik stresi artırır. Vapur seyahati stres azaltır. %100\'e ulaşırsan oyun biter!' },
          { icon: '⭐', title: 'XP & Seviye', text: 'Başarılı yolculuklar XP kazandırır. XP ile yetenek ağacını geliştir.' },
          { icon: '⚠️', title: 'Olaylar', text: 'Lodos, metrobüs arızası, yağmur… İstanbul\'un sürprizlerine hazır ol!' },
          { icon: '🏁', title: 'Deadline', text: 'Hedef saatinden önce varırsan tam ödül, sonra varırsan yarım ödül alırsın.' },
        ].map(item => (
          <View key={item.title} style={styles.howItem}>
            <Text style={styles.howIcon}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.howItemTitle}>{item.title}</Text>
              <Text style={styles.howItemText}>{item.text}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.howClose} onPress={onClose}>
        <Text style={styles.howCloseText}>Anladım →</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ── Main WelcomeScreen ────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  score: number;
  missions: number;
  level: number;
  dayCount: number;
  label: string;
}

interface Props {
  onNewGame: () => void;
  savedMissions?: number;
  savedLevel?: number;
  onContinue?: () => void;
  leaderboard?: LeaderboardEntry[];
}

export const WelcomeScreen = ({ onNewGame, savedMissions, savedLevel, onContinue, leaderboard = [] }: Props) => {
  const [howVisible, setHowVisible] = useState(false);
  const [lbVisible, setLbVisible] = useState(false);

  const fade   = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,      { toValue: 1, duration: 1100, useNativeDriver: true }),
      Animated.spring(slideY,    { toValue: 0, friction: 7, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      {/* Starfield */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {STARS.map((s, i) => <Star key={i} x={s.x * (width / 360)} y={s.y} delay={i * 300} />)}
      </View>

      <Animated.View style={[styles.content, { opacity: fade, transform: [{ translateY: slideY }] }]}>
        {/* Moon accent */}
        <Text style={styles.moon}>🌙</Text>

        {/* Game logo */}
        <Animated.View style={[styles.logoBox, { transform: [{ scale: logoScale }] }]}>
          <Text style={styles.logoTop}>İSTANBUL</Text>
          <Text style={styles.logoBottom}>TRANSİT MASTER</Text>
          <View style={styles.logoDivider} />
          <Text style={styles.logoTagline}>Şehrin nabzını hisset</Text>
        </Animated.View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.btnPrimary} onPress={onNewGame} activeOpacity={0.8}>
            <Text style={styles.btnPrimaryIcon}>🎮</Text>
            <Text style={styles.btnPrimaryText}>YENİ OYUN</Text>
          </TouchableOpacity>

          {savedMissions !== undefined && savedMissions > 0 && onContinue && (
            <TouchableOpacity style={styles.btnSecondary} onPress={onContinue} activeOpacity={0.8}>
              <Text style={styles.btnSecondaryText}>▶ DEVAM ET</Text>
              <Text style={styles.btnSecondaryMeta}>Seviye {savedLevel} · {savedMissions} görev</Text>
            </TouchableOpacity>
          )}

          <View style={styles.ghostRow}>
            <TouchableOpacity style={styles.btnGhostHalf} onPress={() => setHowVisible(true)} activeOpacity={0.8}>
              <Text style={styles.btnGhostText}>📖 Nasıl Oynanır?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnGhostHalf} onPress={() => setLbVisible(true)} activeOpacity={0.8}>
              <Text style={styles.btnGhostText}>🏆 Skorlar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Version tag */}
        <Text style={styles.version}>v1.0 · İstanbul 2025</Text>
      </Animated.View>

      {/* Istanbul skyline at bottom */}
      <View style={styles.skylineWrapper} pointerEvents="none">
        <Skyline />
      </View>

      {/* How to play modal */}
      <Modal visible={howVisible} transparent animationType="slide" onRequestClose={() => setHowVisible(false)}>
        <HowToPlay onClose={() => setHowVisible(false)} />
      </Modal>

      {/* Leaderboard modal */}
      <Modal visible={lbVisible} transparent animationType="slide" onRequestClose={() => setLbVisible(false)}>
        <View style={styles.howModal}>
          <View style={styles.howCard}>
            <Text style={styles.howTitle}>🏆 En İyi Skorlar</Text>
            {leaderboard.length === 0 ? (
              <View style={styles.lbEmpty}>
                <Text style={styles.lbEmptyIcon}>🎮</Text>
                <Text style={styles.lbEmptyText}>Henüz tamamlanmış oyun yok.</Text>
                <Text style={styles.lbEmptyHint}>Bir oyun bitirince skorun burada görünecek.</Text>
              </View>
            ) : (
              leaderboard.map((entry, i) => (
                <View key={i} style={[styles.lbRow, i === 0 && styles.lbRowFirst]}>
                  <Text style={styles.lbRank}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lbLabel}>{entry.label}</Text>
                    <Text style={styles.lbMeta}>{entry.missions} görev · Seviye {entry.level}</Text>
                  </View>
                  <Text style={[styles.lbScore, i === 0 && styles.lbScoreFirst]}>
                    {entry.score.toLocaleString('tr-TR')}
                  </Text>
                </View>
              ))
            )}
            <TouchableOpacity style={styles.howClose} onPress={() => setLbVisible(false)}>
              <Text style={styles.howCloseText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#080b18',
    justifyContent: 'space-between',
  },

  star: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#fff',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 20,
  },

  moon: {
    fontSize: 36,
    marginBottom: 20,
  },

  logoBox: {
    alignItems: 'center',
    marginBottom: 52,
  },
  logoTop: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FF9800',
    letterSpacing: 6,
    textShadowColor: '#FF9800',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  logoBottom: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e2e8f0',
    letterSpacing: 5,
    marginTop: 2,
  },
  logoDivider: {
    width: 60,
    height: 2,
    backgroundColor: '#FF9800',
    marginVertical: 14,
    opacity: 0.6,
  },
  logoTagline: {
    fontSize: 13,
    color: '#718096',
    fontStyle: 'italic',
    letterSpacing: 1,
  },

  buttons: {
    width: '100%',
    gap: 12,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  btnPrimaryIcon: { fontSize: 20 },
  btnPrimaryText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 2,
  },
  btnSecondary: {
    backgroundColor: '#1a2035',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d3753',
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  btnSecondaryMeta: {
    fontSize: 11,
    color: '#718096',
    marginTop: 2,
  },
  btnGhost: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  btnGhostHalf: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  btnGhostText: {
    fontSize: 14,
    color: '#718096',
  },

  version: {
    fontSize: 11,
    color: '#2d3753',
    marginTop: 24,
  },

  // ── Skyline ──
  skylineWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  skylineContainer: {
    width: '100%',
  },
  buildings: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 2,
  },
  bridgeTower: {
    width: 6,
    height: 72,
    backgroundColor: '#243060',
    marginHorizontal: 2,
  },
  bridgeCable: {
    position: 'absolute',
    // A simple horizontal bar for the bridge roadway — positioned via margins
    width: 60,
    height: 5,
    backgroundColor: '#1c2550',
    marginBottom: 12,
  },
  water: {
    width: '100%',
    height: 12,
    backgroundColor: '#0d1533',
    marginTop: 2,
  },
  waterReflection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: '#080b18',
  },
  shimmer: {
    height: 4,
    backgroundColor: '#FF9800',
    borderRadius: 2,
  },

  // ── How to play ──
  howModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  howCard: {
    backgroundColor: '#111527',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: height * 0.82,
    borderTopWidth: 1,
    borderTopColor: '#1e2540',
  },
  howTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 20,
    textAlign: 'center',
  },
  howItem: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18,
    alignItems: 'flex-start',
  },
  howIcon: { fontSize: 22, marginTop: 2 },
  howItemTitle: { fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 3 },
  howItemText: { fontSize: 13, color: '#a0aec0', lineHeight: 18 },
  lbEmpty: { alignItems: 'center', paddingVertical: 28 },
  lbEmptyIcon: { fontSize: 40, marginBottom: 10 },
  lbEmptyText: { fontSize: 15, color: '#e2e8f0', fontWeight: '600', marginBottom: 4 },
  lbEmptyHint: { fontSize: 12, color: '#718096', textAlign: 'center' },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2035',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  lbRowFirst: { backgroundColor: '#2a2010', borderWidth: 1, borderColor: '#FF9800' },
  lbRank: { fontSize: 20, width: 32, textAlign: 'center' },
  lbLabel: { fontSize: 13, fontWeight: '700', color: '#fff' },
  lbMeta: { fontSize: 11, color: '#718096', marginTop: 2 },
  lbScore: { fontSize: 18, fontWeight: '900', color: '#a0aec0' },
  lbScoreFirst: { color: '#FF9800' },

  howClose: {
    backgroundColor: '#FF9800',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  howCloseText: { fontSize: 15, fontWeight: 'bold', color: '#000' },
});
