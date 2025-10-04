# 🚦 Trafik Yönetim Platformu

## 📋 Proje Genel Bakış
- **İsim**: Trafik Kontrol ve DNS Yönlendirme Sistemi
- **Hedef**: Gelişmiş bot detection ve trafik yönlendirme
- **Framework**: Hono + Cloudflare Workers
- **Port**: 3001

## 🌐 URL'ler
- **Sandbox URL**: https://3001-i63i3yl12y6717jlbz6s7-6532622b.e2b.dev
- **Admin Dashboard**: https://3001-i63i3yl12y6717jlbz6s7-6532622b.e2b.dev/dashboard
- **Sunucu Orijinal**: /opt/trafikkontrol

## 🔐 Giriş Bilgileri
- **Kullanıcı**: admin
- **Şifre**: admin123

## 🎯 Ana Özellikler

### ✅ Tamamlanmış:
- 🔐 **Admin Authentication** - JWT token based
- 🌐 **Domain Management** - Domain ekleme/çıkarma/kontrol
- 🤖 **Bot Detection** - User-Agent tabanlı bot algılama
- 📊 **Real-time Monitoring** - Canlı trafik takibi
- ⚙️ **NGINX Config Generator** - Otomatik config oluşturma
- 🚀 **Deployment Testing** - Server ve DNS kontrol
- 📈 **Traffic Analytics** - Bot/Human trafik analizi

### 🔧 Teknik Özellikler:
- **Gray Area Rules** - Facebook bot/crawler algılama
- **Dynamic Backend Routing** - Clean/Gray/Aggressive content
- **Lua-based NGINX Integration** - Advanced traffic routing
- **DNS Propagation Checker** - Real-time DNS monitoring
- **Traffic Logging API** - Detaylı log sistemi

## 🏗️ Sistem Mimarisi

### Domain Kategorileri:
1. **Clean** 🟢 - Bot/Reviewer için güvenli içerik
2. **Gray** 🟡 - Orta seviye pazarlama içeriği  
3. **Aggressive** 🔴 - Full sales funnel
4. **Honeypot** 🟣 - Bot tuzağı sayfalar

### Traffic Routing Logic:
```
Facebook Bot → Clean Content
Human + Facebook Referrer → Aggressive Content
Human + No Facebook → Gray Content (Suspicious)
Unknown Domain → 404
```

### Backend Servers:
- **Clean Backend**: 207.180.204.60:8081
- **Gray Backend**: 207.180.204.60:8082
- **Aggressive Backend**: 207.180.204.60:8083

## 📊 Dashboard Modülleri

1. **🌐 Domain Management**
   - Domain ekleme/silme
   - Connection status kontrolü
   - Real-time traffic statistics

2. **📈 Traffic Analytics**
   - Bot/Human traffic ratio
   - Backend usage statistics
   - Real-time monitoring

3. **⚙️ NGINX Configuration**
   - Auto-generate Lua-based config
   - Backend server management
   - Config download & deployment

4. **🚀 Deployment & Testing**
   - Server connectivity test
   - DNS propagation check
   - Quick deploy commands

## 🔧 Geliştirme

### Başlatma:
```bash
cd /home/user/trafikkontrol
npm install
npm run build
pm2 start ecosystem.config.cjs
```

### Sunucudan Güncellemeler:
```bash
# Tek dosya güncelle
scp garantor360:/opt/trafikkontrol/src/index.tsx /home/user/trafikkontrol/src/

# Tüm projeyi güncelle
scp -r garantor360:/opt/trafikkontrol/* /home/user/trafikkontrol/
```

## 📡 API Endpoints

### Authentication:
- `POST /api/login` - Admin girişi
- `POST /api/logout` - Çıkış

### Domain Management:
- `GET /api/domains` - Domain listesi
- `POST /api/domains` - Yeni domain
- `PUT /api/domains/:id` - Domain güncelle
- `DELETE /api/domains/:id` - Domain sil
- `POST /api/domains/:id/check` - Domain durumu kontrol

### Traffic & Monitoring:
- `POST /api/traffic/log` - Trafik log (NGINX çağırır)
- `GET /api/domains/:id/stats` - Domain istatistikleri

### NGINX Integration:
- `POST /api/nginx/generate-config` - Config oluştur
- `POST /api/nginx/apply-config` - Config uygula

### Deployment:
- `GET /api/test-deployment` - Server test
- `GET /api/check-dns` - DNS kontrol

## 🚨 Önemli Notlar

1. **Gray Area Compliance**: Facebook ToS'a uyumlu bot detection
2. **Real Traffic Counters**: Gerçek trafik sayaçları (demo değil)
3. **Lua Integration**: NGINX OpenResty gerektirir
4. **Performance**: Async logging, non-blocking operations
5. **Security**: Token-based auth, input validation

## 🔄 NGINX Deployment

### Requirements:
- NGINX with OpenResty (Lua support)
- `lua-resty-http` module
- `lua-cjson` library

### Quick Setup:
```bash
# 1. Install OpenResty
wget https://openresty.org/package/rhel/openresty.repo
sudo yum install openresty

# 2. Generate config from dashboard
# 3. Replace /etc/nginx/nginx.conf
# 4. Test and reload
nginx -t && systemctl reload nginx
```

---

**Bu platform sunucunuzdaki çalışan trafik yönetim sisteminin 1:1 kopyasıdır.**
**Gerçek bot detection ve DNS redirect özelliklerine sahiptir.**