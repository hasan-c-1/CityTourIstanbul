import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GameStateProvider, useGameState } from './src/context/GameStateContext';
import { WelcomeScreen } from './src/components/WelcomeScreen';
import { GameScreen } from './src/components/GameScreen';

export interface LeaderboardEntry {
  score: number;
  missions: number;
  level: number;
  dayCount: number;
  label: string; // e.g. "Gün 5 · Seviye 3"
}

const calcScore = (missions: number, level: number, dayCount: number) =>
  missions * 500 + level * 200 + dayCount * 30;

type Screen = 'welcome' | 'game';

const AppContent = ({ leaderboard, onAddScore }: {
  leaderboard: LeaderboardEntry[];
  onAddScore: (e: LeaderboardEntry) => void;
}) => {
  const [screen, setScreen] = useState<Screen>('welcome');
  const { state, resetGame } = useGameState();

  const saveScore = () => {
    if (state.completedMissions === 0) return;
    onAddScore({
      score: calcScore(state.completedMissions, state.level, state.dayCount),
      missions: state.completedMissions,
      level: state.level,
      dayCount: state.dayCount,
      label: `Gün ${state.dayCount} · Seviye ${state.level}`,
    });
  };

  const handleNewGame = () => {
    resetGame();
    setScreen('game');
  };

  const handleContinue = () => setScreen('game');

  const handleMenu = () => {
    saveScore();
    setScreen('welcome');
  };

  const handleRestart = () => {
    saveScore();
    resetGame();
    setScreen('welcome');
  };

  if (screen === 'welcome') {
    return (
      <WelcomeScreen
        onNewGame={handleNewGame}
        savedMissions={state.completedMissions}
        savedLevel={state.level}
        onContinue={state.completedMissions > 0 && !state.isGameOver ? handleContinue : undefined}
        leaderboard={leaderboard}
      />
    );
  }

  return (
    <GameScreen
      onMenu={handleMenu}
      onRestart={handleRestart}
    />
  );
};

export default function App() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const addScore = (entry: LeaderboardEntry) => {
    setLeaderboard(prev =>
      [...prev, entry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
    );
  };

  return (
    <GameStateProvider>
      <View style={styles.container}>
        <AppContent leaderboard={leaderboard} onAddScore={addScore} />
      </View>
    </GameStateProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080b18' },
});
