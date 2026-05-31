import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  TransitNode,
  TransitConnection,
  RandomEvent,
  gameNodes,
  gameEvents
} from '../constants/mockData';
import { PlayerSkills, JourneyResult } from '../services/transitEngine';

interface GameState {
  balance: number;
  stressLevel: number;
  currentLocation: string;
  targetLocation: string;
  currentHour: number;
  dayCount: number;
  xp: number;
  level: number;
  skills: PlayerSkills;
  weather: 'Sunny' | 'Rainy';
  activeEvents: RandomEvent[];
  lastTransferTime: number | null;
  isGameOver: boolean;
  gameOverReason: string;
  completedMissions: number;
  currentMissionDetails: {
    rewardXp: number;
    rewardCash: number;
    deadlineHour: number;
  };
}

interface TravelInfo {
  isActive: boolean;
  progress: number;
  destinationId: string;
  transportType: string;
  durationMinutes: number;
}

interface GameContextType {
  state: GameState;
  travel: TravelInfo;
  hasAbonman: boolean;
  resetGame: () => void;
  travelTo: (connection: TransitConnection, journey: JourneyResult) => void;
  rechargeCard: (amount: number) => void;
  upgradeSkill: (skillKey: keyof PlayerSkills) => void;
  buyAbonman: () => void;
  triggerNewMission: () => void;
  triggerRandomEvent: () => void;
}

const initialSkills: PlayerSkills = {
  fastWalking: 0,
  cozySeating: 0,
  teaSimitLover: 0,
  bargainHunter: 0,
};

const initialState: GameState = {
  balance: 150,
  stressLevel: 20,
  currentLocation: 'kadikoy',
  targetLocation: 'mecidiyekoy',
  currentHour: 8.0,
  dayCount: 1,
  xp: 0,
  level: 1,
  skills: initialSkills,
  weather: 'Sunny',
  activeEvents: [],
  lastTransferTime: null,
  isGameOver: false,
  gameOverReason: '',
  completedMissions: 0,
  currentMissionDetails: {
    rewardXp: 150,
    rewardCash: 120,
    deadlineHour: 10.5,
  },
};

const initialTravel: TravelInfo = {
  isActive: false,
  progress: 0,
  destinationId: '',
  transportType: '',
  durationMinutes: 0,
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<GameState>(initialState);
  const [hasAbonman, setHasAbonman] = useState(false);
  const [travel, setTravel] = useState<TravelInfo>(initialTravel);

  const hasAbonmanRef = useRef(hasAbonman);
  const travelTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    hasAbonmanRef.current = hasAbonman;
  }, [hasAbonman]);

  // Game over detection
  useEffect(() => {
    if (travel.isActive) return;
    if (state.stressLevel >= 100) {
      setState(prev => ({
        ...prev,
        isGameOver: true,
        gameOverReason: 'Uzun ve yoğun bir gün seni epey yordu. Bugünlük bu kadar, dinlenme vakti!',
      }));
    } else if (state.currentHour >= 22.0) {
      setState(prev => ({
        ...prev,
        isGameOver: true,
        gameOverReason: 'Gece oldu, şehir uyuyor. Hedefine bugün ulaşamadın — yarın yeni bir şans!',
      }));
    }
  }, [state.stressLevel, state.currentHour, travel.isActive]);

  const applyTravel = (connection: TransitConnection, journey: JourneyResult) => {
    const abonman = hasAbonmanRef.current;
    setState(prev => {
      const hoursPassed = journey.actualTime / 60;
      const nextHour = prev.currentHour + hoursPassed;
      const nextTransferTime = connection.type !== 'Walking' ? prev.currentHour : prev.lastTransferTime;
      const cost = abonman && connection.type !== 'Walking' ? 0 : journey.actualFare;
      const newBalance = Math.max(0, prev.balance - cost);
      const newStress = Math.min(100, Math.max(0, prev.stressLevel + journey.actualStress));
      const reachedTarget = connection.toId === prev.targetLocation;

      let extraXp = 0;
      let extraCash = 0;
      let totalMissions = prev.completedMissions;

      if (reachedTarget) {
        totalMissions += 1;
        if (nextHour <= prev.currentMissionDetails.deadlineHour) {
          extraXp = prev.currentMissionDetails.rewardXp;
          extraCash = prev.currentMissionDetails.rewardCash;
        } else {
          extraXp = Math.floor(prev.currentMissionDetails.rewardXp / 2);
          extraCash = Math.floor(prev.currentMissionDetails.rewardCash / 2);
        }
      }

      const totalXp = prev.xp + 30 + extraXp;
      const xpNeeded = prev.level * 200;
      let finalLevel = prev.level;
      let finalXp = totalXp;
      if (totalXp >= xpNeeded) {
        finalLevel += 1;
        finalXp = totalXp - xpNeeded;
      }

      return {
        ...prev,
        currentLocation: connection.toId,
        balance: newBalance + extraCash,
        stressLevel: newStress,
        currentHour: nextHour,
        xp: finalXp,
        level: finalLevel,
        lastTransferTime: nextTransferTime,
        completedMissions: totalMissions,
      };
    });
  };

  const travelTo = (connection: TransitConnection, journey: JourneyResult) => {
    if (travel.isActive) return;

    // Real-time animation: 1 game minute ≈ 120ms (20 min trip = ~2.4s, 60 min = ~7.2s)
    const animDurationMs = Math.max(1500, Math.min(7000, journey.actualTime * 120));

    setTravel({
      isActive: true,
      progress: 0,
      destinationId: connection.toId,
      transportType: connection.type,
      durationMinutes: journey.actualTime,
    });

    const startTime = Date.now();

    travelTimerRef.current = setInterval(() => {
      const progress = Math.min(100, ((Date.now() - startTime) / animDurationMs) * 100);

      setTravel(prev => ({ ...prev, progress: Math.round(progress) }));

      if (progress >= 100) {
        if (travelTimerRef.current) {
          clearInterval(travelTimerRef.current);
          travelTimerRef.current = null;
        }
        applyTravel(connection, journey);
        setTravel(initialTravel);
      }
    }, 50);
  };

  const resetGame = () => {
    if (travelTimerRef.current) {
      clearInterval(travelTimerRef.current);
      travelTimerRef.current = null;
    }
    setState({ ...initialState });
    setHasAbonman(false);
    setTravel(initialTravel);
  };

  const triggerNewMission = () => {
    const availableNodes = gameNodes.filter((n: TransitNode) => n.id !== state.currentLocation);
    const target = availableNodes[Math.floor(Math.random() * availableNodes.length)].id;
    const weathers: ('Sunny' | 'Rainy')[] = ['Sunny', 'Rainy'];
    const selectedWeather = weathers[Math.floor(Math.random() * weathers.length)];
    const possibleEvents = gameEvents.filter((e: RandomEvent) => e.id !== 'lodos' || selectedWeather !== 'Sunny');
    const triggered: RandomEvent[] = [];
    if (Math.random() < 0.45) {
      triggered.push(possibleEvents[Math.floor(Math.random() * possibleEvents.length)]);
    }

    setState(prev => ({
      ...prev,
      targetLocation: target,
      weather: selectedWeather,
      activeEvents: triggered,
      currentHour: 8.0,
      dayCount: prev.dayCount + 1,
      currentMissionDetails: {
        rewardXp: 150 + prev.level * 25,
        rewardCash: 80 + Math.floor(Math.random() * 80),
        deadlineHour: 10.5 + Math.random() * 2,
      },
    }));
  };

  const triggerRandomEvent = () => {
    if (Math.random() < 0.6) {
      const event = gameEvents[Math.floor(Math.random() * gameEvents.length)];
      if (!state.activeEvents.some((e: RandomEvent) => e.id === event.id)) {
        setState(prev => ({
          ...prev,
          activeEvents: [...prev.activeEvents, event],
          stressLevel: Math.min(100, Math.max(0, prev.stressLevel + (event.type === 'negative' ? 10 : -10))),
        }));
      }
    }
  };

  const rechargeCard = (amount: number) => {
    setState(prev => ({
      ...prev,
      balance: prev.balance + amount,
      currentHour: prev.currentHour + 0.08,
    }));
  };

  const buyAbonman = () => {
    if (state.balance >= 120) {
      setHasAbonman(true);
      setState(prev => ({
        ...prev,
        balance: prev.balance - 120,
        stressLevel: Math.max(0, prev.stressLevel - 5),
      }));
    }
  };

  const upgradeSkill = (skillKey: keyof PlayerSkills) => {
    setState(prev => {
      const current = prev.skills[skillKey];
      if (current < 3 && prev.xp >= 50) {
        return {
          ...prev,
          skills: { ...prev.skills, [skillKey]: current + 1 },
          xp: prev.xp - 50,
        };
      }
      return prev;
    });
  };

  return (
    <GameContext.Provider value={{
      state,
      travel,
      hasAbonman,
      resetGame,
      travelTo,
      rechargeCard,
      upgradeSkill,
      buyAbonman,
      triggerNewMission,
      triggerRandomEvent,
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameState = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGameState must be used within GameStateProvider');
  return context;
};
