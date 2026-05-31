# Istanbul Transit Master - Core Strategy Game Engine 🚌⚓️🚇

**Istanbul Transit Master**, İstanbul’un kendine has ulaşım kaosunu, trafiğini, İETT/Metro İstanbul/Şehir Hatları hatlarını ve İstanbulkart bütçe yönetimini RPG elementleri ve kriz yönetimiyle birleştiren mobil tabanlı bir strateji oyunudur. 

Bu repositör, oyunun **çekirdek mekaniklerini (Core Game Logic), trafik/hava durumu simülasyon sistemini, İstanbulkart entegre ekonomi motorunu ve React Native/TypeScript ile kodlanmış MVP arayüz iskeletini** içerir.

---

## 🎮 Temel Oyun Döngüsü (Core Loop)
1. **Görevi Al:** Her gün veya turda oyuncunun başlangıç noktasından (Örn: Kadıköy) hedef bir noktaya (Örn: Mecidiyeköy) belirli bir saate kadar (Mülakat/Ders saati) ulaşması gerekir.
2. **Rota Tasarla ve Karar Ver:** Oyuncu, gerçekçi İstanbul aktarma zincirlerini andıran farklı rotaları (Vapur, Metrobüs, Metro, Marmaray vb.) süre, fiyat ve stres maliyetlerine göre inceler.
3. **Krizleri Yönet (RNG):** Seyahat esnasında tetiklenen rastgele olaylar (Lodos nedeniyle vapur iptali, Metrobüs arızası, taraftar yoğunluğu) rotayı baştan aşağı değiştirmenizi gerektirir.
4. **RPG İlerlemesi (Level & XP):** Seferi başarıyla veya zamanında tamamlayarak XP kazanın. Sınırları aşarak kazandığınız XP puanlarıyla yeni kalıcı yetenekler açın.

---

## 🛠 Proje Klasör Yapısı (Folder Structure)

Proje, temiz mimari (Clean Architecture) ve React modeline uygun şekilde organize edilmiştir:

```text
CityTourIstanbul/
├── App.tsx                     # Ana Uygulama Giriş Noktası (Root Root wrapper)
└── src/
    ├── constants/
    │   └── mockData.ts         # Duraklar, Hatlar, Bağlantılar, RNG Olayları ve Trafik Matrisi
    ├── services/
    │   └── transitEngine.ts    # Zaman bağımlı yolculuk, bütçe ve stres hesaplama algoritması
    ├── context/
    │   └── GameStateContext.tsx# Küresel oyun durum yöneticisi (Bakiye, seviye, hava, aktif krizler)
    ├── hooks/
    │   └── useTransit.ts       # Bulunulan duraktan gidebilecek yolları filtreleyip hesaplayan custom hook
    └── components/
        └── GameScreen.tsx      # HUD, Stres Barı, Aktif Görev, Rota Seçimleri ve Yetenek Ağacı Arayüzü
```

---

## ⚙️ Çekirdek Sistemler ve Algoritmalar

### 1. Trafik ve Ulaşım Motoru (Transit & Traffic Engine)
Gerçek zamanlı Google Maps API maliyetinden kaçınmak için oyun, dinamik bir **Tarihsel Trafik Matrisi** ve hava durumu/araç tipi çarpanlarını birleştiren formüllerle çalışır:

- ** trafficMatrix (24 Saatlik Çarpanlar):** Sabah `08:00 (2.2x)` ve akşam `18:00 (2.5x)` saatlerinde kara yolları tam kapasite çalışırken, gece `03:00 (0.3x)` trafik tamamen açık kabul edilir.
- **Araç Türü Reaksiyonu:**
  - `Bus (İETT)`: Trafik çarpanından tam etkilenir. Yağmurlu havada fazladan `%30` gecikme ve ek stres üretir.
  - `Metro/Marmaray`: Trafik ve hava şartlarından etkilenmez ancak zirve saatlerde aşırı kalabalık nedeniyle yüksek stres üretir.
  - `Ferry (Vapur)`: Karayolu trafiğinden etkilenmez ancak kötü hava şartlarında (Örn: Lodos) sefer süreleri kilitlenir.
  - `Walking`: Trafikten etkilenmez fakat yürüme süresi oyuncunun **Hızlı Yürüme** yetenek seviyesiyle azaltılabilir.

### 2. İstanbulkart Ekonomi ve Stres Mekaniği
- **Aktarma İndirimi:** İlk binişten sonraki 2 saat (game hours) içindeki aktarmalarda ücretlerde otomatik indirim sağlanır.
- **Abonman Kartı:** Oyuncu toplu 120 TL biriktirerek sınırız biniş hakkı (gün boyu) tanıyan Abonman satın alabilir. Bu oyuncuya stratejik bütçe üstünlüğü kazandırır.
- **Akıl Sağlığı & Stres Barı (%0 - %100):** Sadece süreye değil, kalabalık ve bekleme süresine göre artar. Stres %100'e ulaşırsa oyuncu panik atak geçirir ve oyun sonlanır (GameOver).

### 3. RPG Yetenekleri (Progression Tree)
Oyuncular turlardan kazandığı XP'leri harcayarak 3 seviyeye kadar şu yetenekleri geliştirebilir:
- **Hızlı Yürüme (Fast Walking):** Yaya sürelerini `%15` azaltır.
- **Boş Koltuk Bulma Sanatı (Cozy Seating):** Toplu taşımadaki stres artışını `%15` absorbe eder.
- **Vapurda Çay & Simit (Tea/Simit Lover):** Vapur seyahatlerindeki stres düşürme ve dinginlik oranını katlar.
- **Akıllı Kart (Bargain Hunter):** Aktarma dışında tüm normal biniş ücretlerini `%8` ucuzlatır.

---

## 📦 Kurulum ve Çalıştırma

Kodlar tamamen modüler, saf TypeScript ile React Native uyumlu yazılmıştır.

1. **Bağımlılıkları Yükleme:**
   ```bash
   npm install react react-native typescript
   ```
2. **Expo veya Hazır React Native Workspace Entegrasyonu:**
   Yukarıda oluşturulan dosyaları doğrudan mevcut Expo/React Native klasörünüze entegre edebilir, `App.tsx` dosyasını ana dosya olarak gösterip `npm run start` diyerek simülatörde veya gerçek cihazda test edebilirsiniz.
