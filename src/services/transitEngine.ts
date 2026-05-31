import { trafficMatrix, TransitConnection, RandomEvent } from '../constants/mockData';

export interface JourneyResult {
  actualTime: number;
  actualFare: number;
  actualStress: number;
  explanations: string[];
}

export interface PlayerSkills {
  fastWalking: number;        // Level 0-3 (reduces walking time)
  cozySeating: number;        // Level 0-3 (reduces stress on all modes)
  teaSimitLover: number;      // Level 0-3 (boosts ferry stress healing)
  bargainHunter: number;      // Level 0-3 (discounts fares slightly or optimizes subscription)
}

export const calculateJourney = (
  connection: TransitConnection,
  currentHour: number,
  weather: 'Sunny' | 'Rainy' | 'Snowy',
  activeEvents: RandomEvent[],
  skills: PlayerSkills,
  hasActiveTransfer: boolean // İstanbulkart transfer discount within 2 hours
): JourneyResult => {
  let timeMultiplier = 1.0;
  let stressModifier = 0;
  let fare = connection.baseFare;
  let explanations: string[] = [];

  const hourFloor = Math.floor(currentHour) % 24;
  const trafficMultiplier = trafficMatrix[hourFloor] || 1.0;

  // 1. Vehicle Type specifics & Traffic Simulator
  switch (connection.type) {
    case 'Bus':
      // Buses are heavily affected by baseline municipal traffic
      timeMultiplier *= trafficMultiplier;
      if (trafficMultiplier > 1.5) {
        explanations.push(`Trafik yoğunluğu seyahati zorlaştırıyor (x${trafficMultiplier.toFixed(1)})`);
      }
      if (weather === 'Rainy') {
        timeMultiplier *= 1.3;
        stressModifier += 5;
        explanations.push('Yağmur nedeniyle karayolu trafiği ek kilitlendi.');
      }
      break;

    case 'Metrobus':
      // Metrobus has its own dedicated lane, so traffic affects it less, but peak density spikes stress
      timeMultiplier *= 1.0 + (trafficMultiplier - 1.0) * 0.25; 
      if (trafficMultiplier > 1.5) {
        stressModifier += 10;
        explanations.push('Metrobüs istasyonlarında yoğun izdiham var, stres arttı.');
      }
      break;

    case 'Ferry':
      // Ferries are immune to road traffic, but highly sensitive to sea conditions (lodos / wind)
      if (weather === 'Rainy') {
        timeMultiplier *= 1.1;
      }
      break;

    case 'Metro':
    case 'Marmaray':
      // Immune to weather and road traffic, minor crowd stress during peak rush hour
      if (trafficMultiplier > 1.7) {
        stressModifier += 6;
        explanations.push('Metro pik saatte çok kalabalık ve havasız.');
      }
      break;

    case 'Walking':
      // Walking duration is reduced by RPG walking speed skill
      const walkingReduction = skills.fastWalking * 0.15; // up to 45% faster
      timeMultiplier *= (1.0 - walkingReduction);
      if (skills.fastWalking > 0) {
        explanations.push(`Hızlı Yürüme yeteneği yürüme süresini azalttı (-%${skills.fastWalking * 15})`);
      }
      break;
  }

  // 2. Process active global random events
  for (const event of activeEvents) {
    if (event.affectedType === connection.type || !event.affectedType) {
      timeMultiplier *= event.timeModifierMultiplier;
      stressModifier += event.stressModifier;
      explanations.push(`${event.title} Aktif: ${event.description}`);
    }
  }

  // 3. Apply skill modifications to Stress & Fare
  let dynamicStress = connection.baseStress;

  // Ferry Stress Healing (Tea & Simit bonus)
  if (connection.type === 'Ferry') {
    if (skills.teaSimitLover > 0) {
      dynamicStress -= skills.teaSimitLover * 8; // increases recovery
      explanations.push(`Vapurda Simit/Çay keyfi stresi ekstra azalttı!`);
    }
  }

  // General cozy seating reducing stress impact
  if (skills.cozySeating > 0 && dynamicStress > 0) {
    const stressReduction = skills.cozySeating * 0.15; // up to 45% less stress
    dynamicStress = dynamicStress * (1.0 - stressReduction);
  }

  // 4. Calculate Final Bakiye Fare (Istanbulkart Aktarma ve Yetenekleri)
  if (connection.type === 'Walking') {
    fare = 0;
  } else {
    // İstanbulkart transfer system
    if (hasActiveTransfer) {
      fare = Math.max(connection.baseFare * 0.4, 8.5); // around 60% discount
      explanations.push('İstanbulkart Aktarma İndirimi uygulandı!');
    }

    if (skills.bargainHunter > 0) {
      const discount = skills.bargainHunter * 0.08; // up to 24% discount
      fare = fare * (1.0 - discount);
    }
  }

  const finalTime = Math.round(connection.baseTimeMinutes * timeMultiplier);
  const finalStress = Math.round(dynamicStress + stressModifier);

  return {
    actualTime: Math.max(1, finalTime),
    actualFare: parseFloat(fare.toFixed(2)),
    actualStress: finalStress,
    explanations
  };
};
