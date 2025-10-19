# 🚀 Sandbox Development Environment - Hazır!

## ✅ Durum: ÇALIŞIYOR

**Tarih**: 2025-10-19  
**Ortam**: Sandbox Development  
**Port**: 8080  
**Status**: **ONLINE** ✓

---

## 🌐 Sandbox Dashboard Erişim

### **Development Dashboard URL**
```
https://8080-i9h7vc6cfz7i4pxtmkcbs-ad490db5.sandbox.novita.ai/dashboard
```

### **Login Sayfası**
```
https://8080-i9h7vc6cfz7i4pxtmkcbs-ad490db5.sandbox.novita.ai/login
```

### **Giriş Bilgileri**
- **Kullanıcı Adı**: `admin`
- **Şifre**: `admin123`

---

## 📦 Backup ve Restore

### Production Backup
```bash
# Backup Location
/home/user/webapp/production-backups/trafik-kontrol-working-20251019-052559.tar.gz

# Backup Contents
- src/index.js (requireAuth fixed ✓)
- server.js (port configuration updated)
- package.json (all dependencies)
- package-lock.json
```

### Backup Özellikleri
✅ **Çalışan production code** - Tüm hatalar düzeltilmiş  
✅ **requireAuth fix** - Hoisting sorunu çözülmüş  
✅ **Clean HTML** - Backend kodu çıkarılmış  
✅ **Complete dependencies** - Tüm npm paketleri dahil  
✅ **534KB index.js** - Production-ready kod

---

## 🔧 Sandbox Kurulum Detayları

### 1. Backup Alındı ✓
```bash
# Production'dan backup
scp root@207.180.204.60:/home/root/webapp/* .

# Backup boyutu: 428KB (node_modules hariç)
```

### 2. Sandbox'ta Açıldı ✓
```bash
# Extract
cd /home/user/webapp/sandbox-dev
tar -xzf ../production-backups/trafik-kontrol-working-*.tar.gz

# Dependencies install
npm install
# 132 packages installed ✓
```

### 3. Konfigürasyon Düzeltmeleri ✓
```javascript
// server.js - Port configuration
const port = process.env.PORT || 8080  // Was: hardcoded 3000

// Created missing directory
mkdir -p public/
```

### 4. Servis Başlatıldı ✓
```bash
# Running in background
node server.js
# Port 8080 ✓
# No errors ✓
```

---

## 📂 Sandbox Dosya Yapısı

```
/home/user/webapp/sandbox-dev/
├── server.js                          # Entry point (port 8080)
├── package.json                       # Dependencies
├── package-lock.json                  # Lock file
├── public/                            # Static files directory
├── node_modules/                      # 132 packages
└── src/
    ├── index.js                       # Main app (requireAuth fixed ✓)
    ├── index.js.backup-20251019-064117  # Backup copy
    ├── index.tsx                      # TypeScript version
    ├── ReactApp.tsx                   # React component
    └── components/                    # Component directory
```

---

## 🎯 Production vs Sandbox

| Özellik | Production (207.180.204.60) | Sandbox (Novita) |
|---------|----------------------------|------------------|
| **URL** | http://207.180.204.60:3000 | https://8080-..sandbox.novita.ai |
| **Port** | 3000 | 8080 |
| **Durum** | ÇALIŞIYOR - DOKUNMA! ✓ | GELİŞTİRME İÇİN HAZIR ✓ |
| **Amaç** | Production - Canlı Sistem | Development - Test ve Geliştirme |
| **Data** | Gerçek veriler | Test verileri |
| **Changes** | ❌ Yapma! | ✅ İstediğin gibi değiştir! |
| **Process Manager** | PM2 | Node.js directly |
| **Backup** | ✅ Alındı ve güvende | ✅ Git'te versiyonlanıyor |

---

## 🔨 Sandbox'ta Geliştirme Yapma

### Quick Start
```bash
# Sandbox dizinine git
cd /home/user/webapp/sandbox-dev

# Kod değişikliği yap
nano src/index.js

# Servisi yeniden başlat
pkill -f "node server.js"
node server.js &

# Test et
curl https://8080-i9h7vc6cfz7i4pxtmkcbs-ad490db5.sandbox.novita.ai/dashboard
```

### Değişiklikleri Commit Etme
```bash
# Git'e ekle
git add sandbox-dev/

# Commit
git commit -m "feat: Sandbox'ta yeni özellik eklendi"

# Push
git push origin main
```

### Production'a Deploy (Dikkatli!)
```bash
# 1. Sandbox'ta test et - TAM çalıştığından emin ol
# 2. Production backup al (her zaman!)
# 3. Değişiklikleri production'a kopyala
scp sandbox-dev/src/index.js root@207.180.204.60:/home/root/webapp/src/

# 4. Production'da restart
ssh root@207.180.204.60 "pm2 restart trafik-kontrol"

# 5. Logs kontrol et
ssh root@207.180.204.60 "pm2 logs trafik-kontrol --lines 20"
```

---

## 🎨 Geliştirme İpuçları

### 1. Hot Reload İçin
```bash
# Nodemon kullan (isteğe bağlı)
npm install -g nodemon
nodemon server.js
```

### 2. Debug Mode
```javascript
// index.js'e ekle
console.log('[DEBUG]', 'Your debug message')

// Veya
app.use('*', async (c, next) => {
  console.log('[REQUEST]', c.req.method, c.req.url)
  await next()
})
```

### 3. Test Data Ekleme
```javascript
// Test domains ekle
const testDomains = [
  {
    name: 'test.example.com',
    status: 'active',
    cleanBackend: 'http://clean.example.com',
    grayBackend: 'http://gray.example.com'
  }
]
```

---

## 🔍 Sandbox Test Checklist

### Dashboard Kontrolü
- [ ] Login sayfası açılıyor
- [ ] admin/admin123 ile giriş yapılıyor
- [ ] 7 sekme görünüyor (Domains, Traffic, DNS, NGINX, Deploy, Security, Settings)
- [ ] Backend kodu GÖRÜNMÜYORBackup ve güvenlik
- [ ] Butonlar çalışıyor
- [ ] API endpoint'leri yanıt veriyor

### API Endpoint Test
```bash
SANDBOX_URL="https://8080-i9h7vc6cfz7i4pxtmkcbs-ad490db5.sandbox.novita.ai"

# Health check
curl $SANDBOX_URL/api/node-health

# Domains (requires auth)
curl -H "Cookie: session=YOUR_SESSION" $SANDBOX_URL/api/domains

# Traffic stats
curl -H "Cookie: session=YOUR_SESSION" $SANDBOX_URL/api/traffic/stats
```

### Performance Test
```bash
# Response time
time curl -s $SANDBOX_URL/dashboard > /dev/null

# Multiple requests
for i in {1..10}; do
  curl -s -o /dev/null -w "Request $i: %{time_total}s\n" $SANDBOX_URL/dashboard
done
```

---

## 💾 Backup Stratejisi

### Otomatik Backup
```bash
# Production backup script (her gün çalışabilir)
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ssh root@207.180.204.60 "cd /home/root/webapp && \
  tar -czf /tmp/prod-backup-${TIMESTAMP}.tar.gz \
  --exclude='node_modules' src/ server.js package.json"
scp root@207.180.204.60:/tmp/prod-backup-${TIMESTAMP}.tar.gz \
  /home/user/webapp/production-backups/
```

### Git Versioning
```bash
# Her önemli değişiklikten önce
cd /home/user/webapp
git add sandbox-dev/
git commit -m "snapshot: Özellik X'den önce çalışan versyon"
git tag v1.0-stable
git push origin main --tags
```

---

## 🚨 Sorun Giderme

### Sandbox Servis Başlamıyorsa
```bash
# Port kontrolü
lsof -i:8080

# Process'i öldür
pkill -f "node server.js"

# Logs kontrol et
cd /home/user/webapp/sandbox-dev
node server.js 2>&1 | tee server.log

# Hataları oku
cat server.log
```

### RequireAuth Hatası
```bash
# requireAuth'un doğru yerde olduğunu kontrol et
grep -n "const requireAuth" sandbox-dev/src/index.js
# Çıktı: 184:const requireAuth = async (c, next) => {

# İlk kullanımı kontrol et
grep -n "requireAuth" sandbox-dev/src/index.js | head -5
# İlk kullanım 184'ten SONRA olmalı (örn: 4485)
```

### Port Conflict
```bash
# Farklı port kullan
PORT=9000 node server.js

# Veya server.js'i düzenle
nano server.js
# const port = process.env.PORT || 9000
```

---

## 📊 Monitoring

### Service Status
```bash
# Process kontrolü
ps aux | grep "node server.js"

# Port kontrolü
netstat -tlnp | grep 8080

# Memory kullanımı
ps -o pid,user,%mem,command ax | grep "node server.js"
```

### Logs
```bash
# Real-time logs
tail -f sandbox-dev/server.log

# Last 50 lines
tail -50 sandbox-dev/server.log

# Search for errors
grep -i "error\|warning" sandbox-dev/server.log
```

---

## 🎯 Sonraki Adımlar

### Hemen Yapılacaklar
1. ✅ **Sandbox'ı test et** - Dashboard'u aç ve kontrol et
2. ✅ **Butonları dene** - Her özelliğin çalıştığından emin ol
3. 📋 **Yeni özellik ekle** - Sandbox'ta geliştirmeye başla
4. 📋 **Test et** - Her değişikliği kapsamlı test et
5. 📋 **Production'a deploy** - Çalıştığından emin olduktan sonra

### Geliştirme Fikirleri
- [ ] Hürriyet Health özelliklerini entegre et (SQLite, A/B testing)
- [ ] Real-time WebSocket updates ekle
- [ ] Dashboard UI/UX iyileştirmeleri
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Unit tests ve integration tests
- [ ] Performance optimizations
- [ ] Monitoring ve alerting sistemi

---

## 📞 Yardım ve Destek

### Hızlı Komutlar
```bash
# Sandbox başlat
cd /home/user/webapp/sandbox-dev && node server.js &

# Sandbox durdur
pkill -f "node server.js"

# Yeniden başlat
pkill -f "node server.js" && cd /home/user/webapp/sandbox-dev && node server.js &

# Logs göster
tail -f sandbox-dev/server.log
```

### Dosya Lokasyonları
- **Sandbox Code**: `/home/user/webapp/sandbox-dev/`
- **Production Backups**: `/home/user/webapp/production-backups/`
- **Git Repository**: `/home/user/webapp/` (main branch)
- **Documentation**: `/home/user/webapp/*.md`

---

## ✨ Özet

🎊 **Sandbox ortamınız hazır ve çalışıyor!**

**Sandbox URL**: https://8080-i9h7vc6cfz7i4pxtmkcbs-ad490db5.sandbox.novita.ai/dashboard  
**Login**: admin / admin123  
**Status**: **ONLINE** ✓

### Ne Yaptık?
✅ Production'dan tam backup alındı (428KB)  
✅ Sandbox'ta extract edildi ve npm install yapıldı  
✅ Port configuration düzeltildi (3000 → 8080)  
✅ Servis başlatıldı ve test edildi  
✅ Public URL alındı ve paylaşıldı  
✅ Comprehensive documentation oluşturuldu

### Neden Sandbox?
🔒 **Production güvende** - Canlı sistem hiç dokunulmadı  
🚀 **Özgürce geliştir** - İstediğin her değişikliği yap  
🧪 **Test et** - Her özelliği güvenle test et  
📦 **Backup var** - Her zaman production'a dönebilirsin  
🔄 **Deploy kolay** - Çalışan kodları production'a kopyala

---

**Artık sandbox'ta istediğin gibi geliştirme yapabilirsin!** 🚀

**NOT**: Production (207.180.204.60:3000) hala çalışıyor ve değiştirilmedi. Oraya DOKUNMA! ⚠️
