import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  Alert,
} from 'react-native';
import { useGameState } from '../context/GameStateContext';
import { useTransit, TravelOption } from '../hooks/useTransit';
import { PlayerSkills } from '../services/transitEngine';
import { gameNodes } from '../constants/mockData';
import { GameMapView, TYPE_COLORS } from './GameMapView';

const formatTime = (h: number) => {
  const hh = Math.floor(h) % 24;
  const mm = Math.floor((h - Math.floor(h)) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

const stressColor = (s: number) =>
  s < 35 ? '#4CAF50' : s < 70 ? '#FF9800' : '#F44336';

const nodeName = (id: string) =>
  gameNodes.find(n => n.id === id)?.name ?? id;

const TRANSPORT_ICONS: Record<string, string> = {
  Metro:    '🟢',
  Ferry:    '🚢',
  Metrobus: '🚌',
  Marmaray: '🚇',
  Bus:      '🚍',
  Walking:  '🚶',
};

interface GameScreenProps {
  onMenu?: () => void;
  onRestart?: () => void;
}

export const GameScreen = ({ onMenu, onRestart }: GameScreenProps) => {
  const { state, travel, hasAbonman, resetGame, rechargeCard, buyAbonman, upgradeSkill, triggerNewMission } = useGameState();
  const { currentLocationName, targetLocationName, availableRoutes, travelToRoute } = useTransit();
  const [skillModal, setSkillModal] = useState(false);

  const availableDestinations = availableRoutes.map(r => r.connection.toId);
  const isMissionDone = state.currentLocation === state.targetLocation && !travel.isActive;
  const timeToDeadline = state.currentMissionDetails.deadlineHour - state.currentHour;
  const isLate = timeToDeadline < 0;

  const handleTravel = (option: TravelOption) => {
    const cost = hasAbonman && option.connection.type !== 'Walking' ? 0 : option.estimated.actualFare;
    if (state.balance < cost) {
      Alert.alert(
        'Yetersiz Bakiye!',
        'İstanbulkart bakiyeniz yetersiz.',
        [
          { text: '50 TL Yükle', onPress: () => rechargeCard(50) },
          { text: 'Kapat', style: 'cancel' },
        ]
      );
      return;
    }
    travelToRoute(option);
  };

  const handleUpgrade = (key: keyof PlayerSkills) => {
    if (state.xp < 50) {
      Alert.alert('Yetersiz XP', 'Yetenek geliştirmek için en az 50 XP gerekiyor.');
      return;
    }
    upgradeSkill(key);
  };

  const handleCardMenu = () => {
    Alert.alert('İstanbulkart', `Mevcut bakiye: ${state.balance.toFixed(2)} TL`, [
      { text: '50 TL Yükle (~5 dk)', onPress: () => rechargeCard(50) },
      { text: '100 TL Yükle (~5 dk)', onPress: () => rechargeCard(100) },
      {
        text: `Abonman Al (120 TL)${hasAbonman ? ' ✓ Aktif' : ''}`,
        onPress: () => {
          if (hasAbonman) { Alert.alert('Abonman zaten aktif!'); return; }
          if (state.balance < 120) { Alert.alert('Bakiye yetersiz'); return; }
          buyAbonman();
          Alert.alert('Abonman alındı!', 'Tüm hatlar şimdi ücretsiz.');
        },
      },
      { text: 'Geri', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.root}>
      {/* ── MAP LAYER ── */}
      <GameMapView availableDestinations={availableDestinations} />

      {/* Slight dark vignette so UI pops */}
      <View style={styles.vignette} pointerEvents="none" />

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">

        {/* ── TOP HUD ── */}
        <View style={styles.hud}>
          <View style={styles.hudLeft}>
            {onMenu && (
              <TouchableOpacity onPress={onMenu} style={styles.menuBtn}>
                <Text style={styles.menuBtnText}>⌂</Text>
              </TouchableOpacity>
            )}
            <View style={styles.lvlBadge}>
              <Text style={styles.lvlLabel}>LVL</Text>
              <Text style={styles.lvlNum}>{state.level}</Text>
            </View>
            <View>
              <Text style={styles.dayLabel}>Gün {state.dayCount}</Text>
              <Text style={styles.weatherLabel}>
                {state.weather === 'Sunny' ? '☀️ Güneşli' : '🌧 Yağmur'}
              </Text>
            </View>
          </View>

          <View style={styles.hudStats}>
            <View style={styles.hudStat}>
              <Text style={styles.hudStatLabel}>💳</Text>
              <Text style={styles.hudStatValue}>{state.balance.toFixed(0)} ₺</Text>
            </View>
            <View style={styles.hudStat}>
              <Text style={styles.hudStatLabel}>⏰</Text>
              <Text style={styles.hudStatValue}>{formatTime(state.currentHour)}</Text>
            </View>
            <View style={styles.hudStat}>
              <Text style={styles.hudStatLabel}>🧠</Text>
              <Text style={[styles.hudStatValue, { color: stressColor(state.stressLevel) }]}>
                {state.stressLevel}%
              </Text>
            </View>
          </View>
        </View>

        {/* Stress bar (full width, just below HUD) */}
        <View style={styles.stressBarTrack} pointerEvents="none">
          <View style={[styles.stressBarFill, {
            width: `${state.stressLevel}%` as any,
            backgroundColor: stressColor(state.stressLevel),
          }]} />
        </View>

        {/* ── EVENT BANNER ── */}
        {state.activeEvents.length > 0 && (
          <View style={styles.eventBanner}>
            <Text style={styles.eventIcon}>⚠️</Text>
            <View style={{ flex: 1 }}>
              {state.activeEvents.map((e, i) => (
                <Text key={i} style={styles.eventText} numberOfLines={1}>
                  {e.title}: {e.description}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* ── SPACER (transparent middle) ── */}
        <View style={{ flex: 1 }} pointerEvents="none" />

        {/* ── TRAVEL OVERLAY (bottom panel replacement while traveling) ── */}
        {travel.isActive && (
          <View style={styles.travelPanel}>
            <View style={styles.travelHeader}>
              <Text style={styles.travelMode}>
                {TRANSPORT_ICONS[travel.transportType]} {travel.transportType}
              </Text>
              <Text style={styles.travelDest}>
                → {nodeName(travel.destinationId)}
              </Text>
              <Text style={styles.travelEta}>{travel.durationMinutes} dk</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, {
                width: `${travel.progress}%` as any,
                backgroundColor: TYPE_COLORS[travel.transportType] ?? '#FF9800',
              }]} />
            </View>
            <Text style={styles.travelHint}>Seyahat ediliyor... {travel.progress}%</Text>
          </View>
        )}

        {/* ── BOTTOM PANEL (routes + actions) ── */}
        {!travel.isActive && (
          <View style={styles.bottomPanel}>
            {/* Mission strip */}
            <View style={styles.missionStrip}>
              <View style={{ flex: 1 }}>
                <Text style={styles.missionRoute} numberOfLines={1}>
                  📍 {currentLocationName}
                  <Text style={styles.missionArrow}> → </Text>
                  <Text style={styles.missionTarget}>{targetLocationName}</Text>
                </Text>
                <Text style={[styles.deadlineText, { color: isLate ? '#F44336' : '#FFD54F' }]}>
                  {isLate
                    ? `⚡ ${Math.abs(timeToDeadline * 60).toFixed(0)} dk geç kaldın!`
                    : `🏁 Deadline: ${formatTime(state.currentMissionDetails.deadlineHour)} · ${(timeToDeadline * 60).toFixed(0)} dk kaldı`}
                </Text>
              </View>
              <View style={styles.rewardBadge}>
                <Text style={styles.rewardText}>+{state.currentMissionDetails.rewardXp} XP</Text>
                <Text style={styles.rewardText}>+{state.currentMissionDetails.rewardCash} ₺</Text>
              </View>
            </View>

            {/* Routes (horizontal scroll) */}
            {availableRoutes.length === 0 ? (
              <View style={styles.noRoutes}>
                <Text style={styles.noRoutesText}>Bu konumdan erişilebilir hat yok.</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.routeScroll}
              >
                {availableRoutes.map((route, idx) => {
                  const fareText = route.connection.type === 'Walking'
                    ? 'Ücretsiz'
                    : hasAbonman
                      ? 'Abonman'
                      : `${route.estimated.actualFare.toFixed(0)} ₺`;
                  const stress = route.estimated.actualStress;
                  const lineColor = TYPE_COLORS[route.connection.type] ?? '#fff';

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.routeCard, { borderTopColor: lineColor }]}
                      onPress={() => handleTravel(route)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.routeCardTop}>
                        <Text style={[styles.routeTypeBadge, { backgroundColor: lineColor }]}>
                          {route.connection.type.toUpperCase()}
                        </Text>
                        <Text style={styles.routeTime}>{route.estimated.actualTime}dk</Text>
                      </View>
                      <Text style={styles.routeDest} numberOfLines={1}>
                        {TRANSPORT_ICONS[route.connection.type]} {nodeName(route.connection.toId)}
                      </Text>
                      <View style={styles.routeStats}>
                        <Text style={styles.routeFare}>💳 {fareText}</Text>
                        <Text style={[styles.routeStress, { color: stress > 0 ? '#FF5252' : '#4CAF50' }]}>
                          🧠 {stress > 0 ? '+' : ''}{stress}
                        </Text>
                      </View>
                      {route.estimated.explanations.length > 0 && (
                        <Text style={styles.routeNote} numberOfLines={1}>
                          ⚡ {route.estimated.explanations[0]}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Action buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#1a1f36' }]} onPress={() => setSkillModal(true)}>
                <Text style={styles.actionBtnText}>🎓 Yetenekler</Text>
                <Text style={styles.actionBtnSub}>{state.xp} XP</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0d3a6b' }]} onPress={handleCardMenu}>
                <Text style={styles.actionBtnText}>💳 Kart</Text>
                <Text style={styles.actionBtnSub}>{hasAbonman ? 'Abonman ✓' : `${state.balance.toFixed(0)} ₺`}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* ── MISSION SUCCESS MODAL ── */}
      <Modal visible={isMissionDone} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.successCard}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successTitle}>HEDEFE ULAŞTINIZ!</Text>
            <Text style={styles.successSub}>
              {currentLocationName} → {targetLocationName}
            </Text>
            <Text style={styles.successDetail}>
              Gün {state.dayCount} · Saat {formatTime(state.currentHour)}
            </Text>
            <View style={styles.successRewards}>
              <Text style={styles.successRewardItem}>⭐ +{state.currentMissionDetails.rewardXp} XP</Text>
              <Text style={styles.successRewardItem}>💰 +{state.currentMissionDetails.rewardCash} ₺</Text>
            </View>
            <TouchableOpacity style={styles.nextBtn} onPress={triggerNewMission}>
              <Text style={styles.nextBtnText}>Sonraki Görev →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── GAME OVER MODAL ── */}
      <Modal visible={state.isGameOver} transparent={false} animationType="slide">
        <SafeAreaView style={styles.gameOverBg}>
          <Text style={styles.gameOverTitle}>OYUN BİTTİ</Text>
          <Text style={styles.gameOverSub}>İstanbul Sokaklarında Kayboldun…</Text>
          <Text style={styles.gameOverReason}>{state.gameOverReason}</Text>
          <View style={styles.gameOverStats}>
            <Text style={styles.gameOverStat}>Tamamlanan Görev: {state.completedMissions}</Text>
            <Text style={styles.gameOverStat}>Ulaşılan Seviye: {state.level}</Text>
            <Text style={styles.gameOverStat}>Geçen Gün: {state.dayCount}</Text>
          </View>
          <TouchableOpacity style={styles.restartBtn} onPress={onRestart ?? resetGame}>
            <Text style={styles.restartBtnText}>Yeniden Başla</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      {/* ── SKILL TREE MODAL ── */}
      <Modal visible={skillModal} transparent animationType="slide" onRequestClose={() => setSkillModal(false)}>
        <View style={styles.modalBg}>
          <View style={styles.skillCard}>
            <View style={styles.skillCardHeader}>
              <Text style={styles.skillCardTitle}>🎓 Yetenek Ağacı</Text>
              <TouchableOpacity onPress={() => setSkillModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.xpInfo}>Mevcut XP: {state.xp} · Geliştirme maliyeti: 50 XP</Text>

            {([
              { key: 'fastWalking',   icon: '🏃', name: 'Hızlı Yürüme',         desc: 'Yürüme süresi her kademe için %15 azalır.' },
              { key: 'cozySeating',   icon: '🛋️', name: 'Koltuk Bulma Sanatı',   desc: 'Toplu taşımada stres etkisi %15/kademe azalır.' },
              { key: 'teaSimitLover', icon: '🚢', name: 'Vapurda Çay & Simit',   desc: 'Vapur seyahatinin stres düşürme etkisi artar.' },
              { key: 'bargainHunter', icon: '💡', name: 'Akıllı Kart Kullanımı', desc: 'Tüm ücretler %8/kademe daha ucuz olur.' },
            ] as const).map(skill => {
              const level = state.skills[skill.key as keyof PlayerSkills];
              const maxed = level >= 3;
              return (
                <View key={skill.key} style={styles.skillRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.skillName}>
                      {skill.icon} {skill.name}
                      <Text style={styles.skillLevel}> Lvl {level}/3</Text>
                    </Text>
                    <Text style={styles.skillDesc}>{skill.desc}</Text>
                    <View style={styles.skillPips}>
                      {[0,1,2].map(i => (
                        <View key={i} style={[styles.pip, i < level && styles.pipFilled]} />
                      ))}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.upgradeBtn, (maxed || state.xp < 50) && styles.upgradeBtnDisabled]}
                    disabled={maxed || state.xp < 50}
                    onPress={() => handleUpgrade(skill.key as keyof PlayerSkills)}
                  >
                    <Text style={styles.upgradeBtnText}>{maxed ? 'MAX' : 'Geliştir'}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0c0f1d' },

  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // subtle gradient-like darkening handled by map's mutedStandard + card backgrounds
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },

  // ── HUD ──
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(10,13,30,0.88)',
    borderBottomWidth: 1,
    borderBottomColor: '#1e2540',
  },
  hudLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  menuBtnText: { fontSize: 20, color: '#718096' },
  lvlBadge: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    marginRight: 8,
  },
  lvlLabel: { fontSize: 8, fontWeight: 'bold', color: '#000' },
  lvlNum: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  dayLabel: { fontSize: 13, fontWeight: 'bold', color: '#e2e8f0' },
  weatherLabel: { fontSize: 11, color: '#718096' },
  hudStats: { flexDirection: 'row', gap: 12 },
  hudStat: { alignItems: 'center' },
  hudStatLabel: { fontSize: 11 },
  hudStatValue: { fontSize: 13, fontWeight: 'bold', color: '#fff' },

  stressBarTrack: {
    height: 3,
    backgroundColor: '#1a1a2e',
    width: '100%',
  },
  stressBarFill: {
    height: 3,
  },

  // ── EVENT BANNER ──
  eventBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(180,0,0,0.85)',
    marginHorizontal: 10,
    marginTop: 8,
    borderRadius: 10,
    padding: 8,
    gap: 6,
  },
  eventIcon: { fontSize: 16 },
  eventText: { fontSize: 11, color: '#fff', fontWeight: '600' },

  // ── TRAVEL PANEL ──
  travelPanel: {
    backgroundColor: 'rgba(10,13,30,0.95)',
    margin: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2d3753',
  },
  travelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  travelMode: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  travelDest: { flex: 1, fontSize: 15, color: '#e2e8f0' },
  travelEta: { fontSize: 13, color: '#aaa', fontStyle: 'italic' },
  progressTrack: {
    height: 10,
    backgroundColor: '#1a1f36',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: '100%', borderRadius: 5 },
  travelHint: { fontSize: 11, color: '#718096', textAlign: 'center' },

  // ── BOTTOM PANEL ──
  bottomPanel: {
    backgroundColor: 'rgba(10,13,30,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#1e2540',
    paddingTop: 10,
    paddingBottom: 4,
  },

  missionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e2540',
    gap: 8,
  },
  missionRoute: { fontSize: 14, color: '#e2e8f0', fontWeight: '600' },
  missionArrow: { color: '#718096' },
  missionTarget: { color: '#FF9800', fontWeight: 'bold' },
  deadlineText: { fontSize: 11, marginTop: 2 },
  rewardBadge: {
    backgroundColor: '#1a2a14',
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2e5c1e',
  },
  rewardText: { fontSize: 11, color: '#81C784', fontWeight: 'bold' },

  noRoutes: { padding: 20, alignItems: 'center' },
  noRoutesText: { color: '#718096', fontStyle: 'italic' },

  routeScroll: { paddingHorizontal: 10, paddingVertical: 10, gap: 8 },
  routeCard: {
    width: 160,
    backgroundColor: '#131726',
    borderRadius: 12,
    padding: 12,
    borderTopWidth: 4,
    borderWidth: 1,
    borderColor: '#1e2540',
  },
  routeCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  routeTypeBadge: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  routeTime: { fontSize: 18, fontWeight: 'bold', color: '#FFD54F' },
  routeDest: { fontSize: 13, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  routeStats: { flexDirection: 'row', gap: 8 },
  routeFare: { fontSize: 11, color: '#a0aec0' },
  routeStress: { fontSize: 11, fontWeight: 'bold' },
  routeNote: { fontSize: 9, color: '#FF9800', marginTop: 4, fontStyle: 'italic' },

  actionRow: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8, gap: 8 },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d3753',
  },
  actionBtnText: { fontSize: 13, fontWeight: 'bold', color: '#fff' },
  actionBtnSub: { fontSize: 10, color: '#718096', marginTop: 2 },

  // ── MODALS ──
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  successCard: {
    width: '85%',
    backgroundColor: '#0e2418',
    borderWidth: 2,
    borderColor: '#2e7d32',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  successEmoji: { fontSize: 48, marginBottom: 8 },
  successTitle: { fontSize: 22, fontWeight: 'bold', color: '#81C784', marginBottom: 4 },
  successSub: { fontSize: 14, color: '#a0aec0', marginBottom: 4 },
  successDetail: { fontSize: 12, color: '#718096', marginBottom: 16 },
  successRewards: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  successRewardItem: { fontSize: 16, fontWeight: 'bold', color: '#FFD54F' },
  nextBtn: { backgroundColor: '#1b5e20', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  nextBtnText: { fontSize: 15, fontWeight: 'bold', color: '#fff' },

  gameOverBg: {
    flex: 1,
    backgroundColor: '#0c0f1d',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  gameOverTitle: { fontSize: 32, fontWeight: 'bold', color: '#F44336', marginBottom: 8 },
  gameOverSub: { fontSize: 16, color: '#a0aec0', marginBottom: 16, textAlign: 'center' },
  gameOverReason: { fontSize: 14, color: '#cbd5e0', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  gameOverStats: { backgroundColor: '#161b30', padding: 16, borderRadius: 12, width: '100%', marginBottom: 24 },
  gameOverStat: { fontSize: 14, color: '#e2e8f0', textAlign: 'center', marginVertical: 4 },
  restartBtn: { backgroundColor: '#F44336', paddingHorizontal: 36, paddingVertical: 14, borderRadius: 12 },
  restartBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },

  skillCard: {
    width: '90%',
    backgroundColor: '#141829',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2d3753',
  },
  skillCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e2540',
  },
  skillCardTitle: { fontSize: 18, fontWeight: 'bold', color: '#FF9800' },
  closeBtn: { fontSize: 18, color: '#718096', padding: 4 },
  xpInfo: { fontSize: 12, color: '#4FC3F7', marginBottom: 16 },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2035',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    gap: 10,
  },
  skillName: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  skillLevel: { fontSize: 12, color: '#718096' },
  skillDesc: { fontSize: 11, color: '#a0aec0', marginTop: 2, marginBottom: 6 },
  skillPips: { flexDirection: 'row', gap: 4 },
  pip: { width: 16, height: 6, borderRadius: 3, backgroundColor: '#2d3753' },
  pipFilled: { backgroundColor: '#FF9800' },
  upgradeBtn: { backgroundColor: '#2e7d32', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  upgradeBtnDisabled: { backgroundColor: '#2d3753', opacity: 0.5 },
  upgradeBtnText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
});
