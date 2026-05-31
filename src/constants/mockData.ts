export interface TransitNode {
  id: string;
  name: string;
  type: 'Metro' | 'Bus' | 'Ferry' | 'Marmaray' | 'Metrobus' | 'Walking';
  coords: { lat: number; lng: number };
}

export interface TransitConnection {
  fromId: string;
  toId: string;
  type: 'Metro' | 'Bus' | 'Ferry' | 'Marmaray' | 'Metrobus' | 'Walking';
  baseTimeMinutes: number;
  baseFare: number;
  baseStress: number;
}

export interface RandomEvent {
  id: string;
  title: string;
  description: string;
  type: 'negative' | 'positive' | 'neutral';
  affectedType?: 'Metro' | 'Bus' | 'Ferry' | 'Marmaray' | 'Metrobus';
  timeModifierMultiplier: number;
  stressModifier: number;
}

// 24 Hours Traffic Multipliers (00:00 to 23:00)
export const trafficMatrix: Record<number, number> = {
  0: 0.5, 1: 0.4, 2: 0.3, 3: 0.3, 4: 0.4, 5: 0.6,
  6: 0.9, 7: 1.7, 8: 2.2, 9: 1.9, 10: 1.3, 11: 1.2,
  12: 1.2, 13: 1.3, 14: 1.4, 15: 1.6, 16: 1.8, 17: 2.3,
  18: 2.5, 19: 2.1, 20: 1.6, 21: 1.3, 22: 1.0, 23: 0.7
};

export const gameNodes: TransitNode[] = [
  { id: 'kadikoy',      name: 'Kadıköy',       type: 'Ferry',    coords: { lat: 40.9906, lng: 29.0224 } },
  { id: 'sogutlucesme', name: 'Söğütlüçeşme',  type: 'Metrobus', coords: { lat: 40.9939, lng: 29.0355 } },
  { id: 'besiktas',     name: 'Beşiktaş',       type: 'Ferry',    coords: { lat: 41.0432, lng: 29.0049 } },
  { id: 'mecidiyekoy',  name: 'Mecidiyeköy',    type: 'Metro',    coords: { lat: 41.0634, lng: 28.9930 } },
  { id: 'zincirlikuyu', name: 'Zincirlikuyu',   type: 'Metrobus', coords: { lat: 41.0693, lng: 28.9979 } },
  { id: 'uskudar',      name: 'Üsküdar',         type: 'Ferry',    coords: { lat: 41.0234, lng: 29.0183 } },
  { id: 'yenikapi',     name: 'Yenikapı',        type: 'Marmaray', coords: { lat: 41.0053, lng: 28.9504 } },
  { id: 'taksim',       name: 'Taksim',          type: 'Metro',    coords: { lat: 41.0369, lng: 28.9856 } },
  { id: 'kabatas',      name: 'Kabataş',         type: 'Ferry',    coords: { lat: 41.0328, lng: 28.9994 } },
  { id: 'bostanci',     name: 'Bostancı',        type: 'Ferry',    coords: { lat: 40.9625, lng: 29.0877 } },
  { id: 'eminonu',      name: 'Eminönü',         type: 'Ferry',    coords: { lat: 41.0170, lng: 28.9742 } },
  { id: 'avcilar',      name: 'Avcılar',         type: 'Metrobus', coords: { lat: 40.9802, lng: 28.7218 } },
];

export const gameConnections: TransitConnection[] = [
  // Metrobüs Hattı
  { fromId: 'avcilar',      toId: 'sogutlucesme', type: 'Metrobus', baseTimeMinutes: 40, baseFare: 18.50, baseStress: 35 },
  { fromId: 'sogutlucesme', toId: 'zincirlikuyu', type: 'Metrobus', baseTimeMinutes: 15, baseFare: 18.50, baseStress: 15 },
  { fromId: 'zincirlikuyu', toId: 'mecidiyekoy',  type: 'Metrobus', baseTimeMinutes: 8,  baseFare: 15.00, baseStress: 20 },

  // Vapur Hatları
  { fromId: 'kadikoy',  toId: 'besiktas', type: 'Ferry', baseTimeMinutes: 20, baseFare: 23.00, baseStress: -12 },
  { fromId: 'kadikoy',  toId: 'eminonu',  type: 'Ferry', baseTimeMinutes: 20, baseFare: 23.00, baseStress: -10 },
  { fromId: 'kadikoy',  toId: 'kabatas',  type: 'Ferry', baseTimeMinutes: 25, baseFare: 23.00, baseStress: -12 },
  { fromId: 'bostanci', toId: 'kadikoy',  type: 'Ferry', baseTimeMinutes: 30, baseFare: 17.50, baseStress: -8  },
  { fromId: 'uskudar',  toId: 'eminonu',  type: 'Ferry', baseTimeMinutes: 12, baseFare: 17.50, baseStress: -8  },
  { fromId: 'uskudar',  toId: 'besiktas', type: 'Ferry', baseTimeMinutes: 10, baseFare: 17.50, baseStress: -5  },
  { fromId: 'uskudar',  toId: 'kabatas',  type: 'Ferry', baseTimeMinutes: 15, baseFare: 17.50, baseStress: -6  },
  { fromId: 'besiktas', toId: 'eminonu',  type: 'Ferry', baseTimeMinutes: 15, baseFare: 17.50, baseStress: -8  },
  { fromId: 'kabatas',  toId: 'besiktas', type: 'Ferry', baseTimeMinutes: 10, baseFare: 17.50, baseStress: -5  },

  // Metro M2
  { fromId: 'yenikapi',     toId: 'taksim',      type: 'Metro', baseTimeMinutes: 15, baseFare: 17.70, baseStress: 8  },
  { fromId: 'taksim',       toId: 'mecidiyekoy', type: 'Metro', baseTimeMinutes: 7,  baseFare: 17.70, baseStress: 6  },
  { fromId: 'mecidiyekoy',  toId: 'zincirlikuyu',type: 'Metro', baseTimeMinutes: 4,  baseFare: 17.70, baseStress: 5  },
  { fromId: 'kabatas',      toId: 'taksim',      type: 'Metro', baseTimeMinutes: 3,  baseFare: 17.70, baseStress: 3  },

  // Marmaray
  { fromId: 'uskudar',      toId: 'yenikapi',     type: 'Marmaray', baseTimeMinutes: 11, baseFare: 21.00, baseStress: 10 },
  { fromId: 'sogutlucesme', toId: 'yenikapi',     type: 'Marmaray', baseTimeMinutes: 16, baseFare: 24.00, baseStress: 8  },

  // Otobüs
  { fromId: 'besiktas', toId: 'mecidiyekoy', type: 'Bus', baseTimeMinutes: 18, baseFare: 17.70, baseStress: 18 },
  { fromId: 'bostanci', toId: 'sogutlucesme',type: 'Bus', baseTimeMinutes: 25, baseFare: 17.70, baseStress: 22 },
  { fromId: 'eminonu',  toId: 'yenikapi',    type: 'Bus', baseTimeMinutes: 10, baseFare: 17.70, baseStress: 12 },

  // Yürüme Bağlantıları
  { fromId: 'kadikoy',  toId: 'sogutlucesme', type: 'Walking', baseTimeMinutes: 10, baseFare: 0, baseStress: 5  },
  { fromId: 'besiktas', toId: 'kabatas',       type: 'Walking', baseTimeMinutes: 8,  baseFare: 0, baseStress: 3  },
  { fromId: 'taksim',   toId: 'kabatas',       type: 'Walking', baseTimeMinutes: 15, baseFare: 0, baseStress: 5  },
  { fromId: 'eminonu',  toId: 'yenikapi',      type: 'Walking', baseTimeMinutes: 12, baseFare: 0, baseStress: 6  },
];

export const gameEvents: RandomEvent[] = [
  {
    id: 'lodos',
    title: 'Şiddetli Lodos',
    description: 'Boğazda lodos uyarısı var. Vapur seferlerinde aksaklık yaşanabilir.',
    type: 'negative',
    affectedType: 'Ferry',
    timeModifierMultiplier: 4.0,
    stressModifier: 30
  },
  {
    id: 'metrobus_arizasi',
    title: 'Metrobüs Arızası',
    description: 'Metrobüste teknik bir arıza yaşandı, güzergahta yoğunluk artabilir.',
    type: 'negative',
    affectedType: 'Metrobus',
    timeModifierMultiplier: 2.5,
    stressModifier: 25
  },
  {
    id: 'mac_gunu',
    title: 'Derbi Günü',
    description: 'Büyük maç günü! Bu bölgede hareketlilik yoğun, yolculuklar biraz uzayabilir.',
    type: 'neutral',
    affectedType: 'Metrobus',
    timeModifierMultiplier: 1.5,
    stressModifier: 15
  },
  {
    id: 'simit_keyfi',
    title: 'Sıcak Simit & Çay',
    description: 'Vapurda çayının yanına simit aldın. İstanbul esintisi içini ferahlattı.',
    type: 'positive',
    timeModifierMultiplier: 1.0,
    stressModifier: -25
  },
  {
    id: 'yagmur',
    title: 'Aniden Bastıran Sağanak',
    description: "İstanbul'a yağmur yağıyor. Kara yollarında yoğunluk artmış olabilir.",
    type: 'negative',
    affectedType: 'Bus',
    timeModifierMultiplier: 1.8,
    stressModifier: 12
  },
  {
    id: 'metro_arizasi',
    title: 'Metro Sinyalizasyon Arızası',
    description: 'Metro hattında kısa süreli teknik bakım yapılıyor, seferler biraz gecikmeli.',
    type: 'negative',
    affectedType: 'Metro',
    timeModifierMultiplier: 2.0,
    stressModifier: 18
  },
  {
    id: 'konser',
    title: 'Harbiye Konseri',
    description: "Harbiye'de güzel bir konser var! Bu tarafta hareketlilik artmış.",
    type: 'neutral',
    affectedType: 'Bus',
    timeModifierMultiplier: 1.6,
    stressModifier: 10
  }
];
