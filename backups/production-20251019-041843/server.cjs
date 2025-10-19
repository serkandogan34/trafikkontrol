const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = 8080;

// SQLite Veritabanı
const db = new sqlite3.Database('./analytics.db', (err) => {
    if (err) {
        console.error('❌ Veritabanı hatası:', err);
    } else {
        console.log('✅ Analytics veritabanı bağlandı');
        initDatabase();
    }
});

// Veritabanı tablolarını oluştur
function initDatabase() {
    db.run(`CREATE TABLE IF NOT EXISTS visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip TEXT NOT NULL,
        country TEXT,
        city TEXT,
        device_type TEXT,
        browser TEXT,
        os TEXT,
        user_agent TEXT,
        url TEXT,
        referrer TEXT,
        utm_source TEXT,
        utm_medium TEXT,
        utm_campaign TEXT,
        fbclid TEXT,
        variant TEXT,
        status_code INTEGER,
        response_time INTEGER,
        bytes_sent INTEGER
    )`, (err) => {
        if (err) {
            console.error('❌ Tablo oluşturma hatası:', err);
        } else {
            console.log('✅ Visits tablosu hazır');
        }
    });
    
    // Index'ler ekle (hızlı sorgular için)
    db.run(`CREATE INDEX IF NOT EXISTS idx_timestamp ON visits(timestamp)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_ip ON visits(ip)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_device ON visits(device_type)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_utm_source ON visits(utm_source)`);
}

// Meta Conversions API Configuration - DISABLED
const META_PIXEL_ID = '1536997387317312';
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || ''; // Environment variable'dan al
const META_API_VERSION = 'v18.0';
const META_CONVERSIONS_API_ENABLED = false; // CAPI KAPATILDI - Duplicate event sorunu çözümü

// Trust proxy - gerçek IP'yi al
app.set('trust proxy', true);

// JSON middleware for API requests
app.use(express.json());

// Cookie parser middleware (for Meta Pixel fbp/fbc cookies)
app.use(cookieParser());

// IPv4 zorlama fonksiyonu
function forceIPv4(ip) {
    if (!ip) return null;
    
    ip = ip.trim();
    
    // IPv6 wrapped IPv4 (::ffff:192.168.1.1)
    if (ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
    }
    
    // IPv6 localhost
    if (ip === '::1') {
        ip = '127.0.0.1';
    }
    
    // IPv4 validation
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip) ? ip : null;
}

// IP forward middleware
app.use((req, res, next) => {
    // Gerçek kullanıcı IPv4'ünü tespit et
    const possibleIPs = [
        req.headers['cf-connecting-ip'],
        req.headers['x-forwarded-for'],
        req.headers['x-real-ip'],
        req.connection.remoteAddress,
        req.socket.remoteAddress
    ];
    
    let realIPv4 = null;
    
    for (const candidateIP of possibleIPs) {
        if (!candidateIP) continue;
        
        // Multiple IPs durumu
        if (candidateIP.includes(',')) {
            const ips = candidateIP.split(',').map(ip => ip.trim());
            for (const ip of ips) {
                const validIP = forceIPv4(ip);
                if (validIP && !validIP.startsWith('127.') && !validIP.startsWith('192.168.')) {
                    realIPv4 = validIP;
                    break;
                }
            }
            if (realIPv4) break;
        } else {
            const validIP = forceIPv4(candidateIP);
            if (validIP && !validIP.startsWith('127.') && !validIP.startsWith('192.168.')) {
                realIPv4 = validIP;
                break;
            }
        }
    }
    
    // Fallback: local IP'leri de kabul et
    if (!realIPv4) {
        for (const candidateIP of possibleIPs) {
            if (!candidateIP) continue;
            const validIP = forceIPv4(candidateIP);
            if (validIP) {
                realIPv4 = validIP;
                break;
            }
        }
    }
    
    req.realUserIPv4 = realIPv4 || '127.0.0.1';
    console.log('🔍 Detected IPv4:', req.realUserIPv4, 'from headers:', {
        'cf-connecting-ip': req.headers['cf-connecting-ip'],
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-real-ip': req.headers['x-real-ip'],
        'remote': req.connection.remoteAddress
    });
    next();
});

// ============================================
// 🤖 META BOT DETECTION MIDDLEWARE
// ============================================
function isMetaBot(userAgent) {
    if (!userAgent) return false;
    
    const metaBotPatterns = [
        'facebookexternalhit',
        'facebookcatalog',
        'Facebot',
        'FacebookBot',
        'facebook',
        'instagram',
        'WhatsApp'
    ];
    
    const lowerUA = userAgent.toLowerCase();
    return metaBotPatterns.some(pattern => lowerUA.includes(pattern.toLowerCase()));
}

// ============================================
// 🧪 A/B TESTING: Traffic Split (50/50)
// ============================================
function selectVariant(userIP) {
    // MD5 hash of IP for deterministic variant selection
    // Same user always gets same variant
    const ipHash = crypto.createHash('md5').update(userIP).digest('hex');
    
    // Convert first 8 hex chars to integer
    const hashNumber = parseInt(ipHash.substring(0, 8), 16);
    
    // Bucket 0-99 (modulo 100)
    const bucket = hashNumber % 100;
    
    // 50/50 split
    if (bucket < 50) {
        return {
            variant: 'A',
            page: 'index.html',
            group: 'Control',
            description: 'Original landing page'
        };
    } else {
        return {
            variant: 'B',
            page: 'index-variant-b.html',
            group: 'Treatment',
            description: 'NovaDerma landing page'
        };
    }
}

// Serve different content based on User-Agent and DOMAIN - MUST BE BEFORE static files
app.get('/', (req, res) => {
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers['referer'] || req.headers['referrer'] || '';
    const hasFbclid = req.query.fbclid !== undefined; // Facebook Click ID
    const host = req.headers['host'] || '';
    
    // Check if coming from Facebook/Meta platforms (without fbclid)
    const isFromMetaWithoutFbclid = (referer.includes('facebook.com') || 
                                      referer.includes('fb.com') || 
                                      referer.includes('instagram.com') ||
                                      referer.includes('fb.me')) && !hasFbclid;
    
    // Determine which domain: NEW or OLD
    const isNewDomain = host.includes('hurriyetrehberhaber') || host.includes('xn--hrriyetrehberhaber-m6b');
    const isOldDomain = host.includes('sagliksonnhaberler') || host.includes('hriyetsagliksonnhaberler');
    
    console.log('🌐 DOMAIN DETECTION:', {
        host: host,
        isNewDomain: isNewDomain,
        isOldDomain: isOldDomain,
        userAgent: userAgent.substring(0, 50)
    });
    
    // NEW DOMAIN (hürriyetrehberhaber.store) → A/B TESTING
    if (isNewDomain) {
        // Meta bot detection → clean page (NO A/B testing for bots!)
        if (isMetaBot(userAgent)) {
            console.log('🤖 [NEW DOMAIN] META BOT DETECTED');
            console.log('   → Serving clean-new.html (NEW pixel, policy-compliant)');
            return res.sendFile(path.join(__dirname, 'clean-new.html'));
        }
        
        // Meta reviewer → clean page (NO A/B testing for reviewers!)
        if (isFromMetaWithoutFbclid) {
            console.log('👔 [NEW DOMAIN] META REVIEWER (no fbclid)');
            console.log('   → Serving clean-new.html (NEW pixel, policy-compliant)');
            return res.sendFile(path.join(__dirname, 'clean-new.html'));
        }
        
        // ============================================
        // 🧪 A/B TEST: Real users get split 50/50
        // ============================================
        
        // Force variant via URL parameter (?force_variant=A or B or ?variant=A or B)
        const forceVariant = req.query.force_variant || req.query.variant;
        let abTest;
        
        if (forceVariant === 'A' || forceVariant === 'B') {
            abTest = {
                variant: forceVariant,
                page: forceVariant === 'A' ? 'index.html' : 'index-variant-b.html',
                group: forceVariant === 'A' ? 'Control' : 'Treatment',
                description: forceVariant === 'A' ? 'Original (forced)' : 'NovaDerma (forced)'
            };
            console.log('🔧 [A/B TEST] FORCED VARIANT:', forceVariant);
        } else {
            // Normal A/B test based on IP hash
            abTest = selectVariant(req.realUserIPv4);
        }
        
        // Log A/B test decision
        console.log('🧪 [A/B TEST] User assigned to variant:', {
            variant: abTest.variant,
            group: abTest.group,
            page: abTest.page,
            ip: req.realUserIPv4.substring(0, 10) + '...',
            fbclid: hasFbclid ? 'YES' : 'NO',
            timestamp: new Date().toISOString()
        });
        
        // Serve the selected variant
        console.log(`✅ [NEW DOMAIN] A/B Test - Serving ${abTest.description}`);
        return res.sendFile(path.join(__dirname, abTest.page));
    }
    
    // OLD DOMAIN (hüriyetsagliksonnhaberler.site) → ORIGINAL BEHAVIOR
    if (isOldDomain) {
        // Meta bot detection → old clean page
        if (isMetaBot(userAgent)) {
            console.log('🤖 [OLD DOMAIN] META BOT DETECTED');
            console.log('   → Serving clean.html (OLD pixel, policy-compliant)');
            return res.sendFile(path.join(__dirname, 'clean.html'));
        }
        
        // Meta reviewer → old clean page
        if (isFromMetaWithoutFbclid) {
            console.log('👔 [OLD DOMAIN] META REVIEWER (no fbclid)');
            console.log('   → Serving clean.html (OLD pixel, policy-compliant)');
            return res.sendFile(path.join(__dirname, 'clean.html'));
        }
        
        // Real user from Facebook Ad (HAS fbclid) → sales page
        if (hasFbclid) {
            console.log('💰 [OLD DOMAIN] REAL CUSTOMER (with fbclid)');
            console.log('   → Serving index.html (OLD pixel, sales page)');
            return res.sendFile(path.join(__dirname, 'index.html'));
        }
        
        // Direct access → sales page
        console.log('🌐 [OLD DOMAIN] DIRECT ACCESS');
        console.log('   → Serving index.html (OLD pixel, sales page)');
        return res.sendFile(path.join(__dirname, 'index.html'));
    }
    
    // Fallback (unknown domain) → old behavior
    console.log('⚠️ UNKNOWN DOMAIN:', host);
    console.log('   → Serving index.html (fallback)');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Direct access to clean HTML (for testing/preview)
app.get('/preview-clean', (req, res) => {
    console.log('📄 Direct access to clean.html');
    res.sendFile(path.join(__dirname, 'clean.html'));
});

// Test route - bypass all controls
app.get('/test-direct', (req, res) => {
    console.log('🧪 TEST: Direct file access');
    res.sendFile(path.join(__dirname, 'test-direct.html'));
});

// Serve static files (AFTER route definitions)
app.use(express.static('.'));

// API route for order submissions - webhook proxy
app.post('/api/submit-order', async (req, res) => {
    try {
        // Support both formats: Variant A (name, surname) and Variant B (isim, telefon)
        const { name, surname, phone, isim, telefon, address, quantity = 1, analytics, siparisID, ip, cihazBilgisi, gelenSite, zamanDamgasi, webhookUrl, executionMode } = req.body;
        
        // Variant B format support
        const finalName = name || isim || '';
        const finalSurname = surname || '';
        const finalPhone = phone || telefon || '';
        
        // Basic validation
        if (!finalName || !finalPhone) {
            return res.status(400).json({
                success: false,
                message: 'Lütfen tüm alanları doldurun.'
            });
        }
        
        // Analytics verisini logla
        if (analytics) {
            console.log('💎 CUSTOMER ANALYTICS:', {
                name: finalName,
                phone: finalPhone,
                vipTier: analytics.vip?.tier,
                vipScore: analytics.vip?.score,
                vipPriority: analytics.vip?.priority,
                deviceValue: analytics.device?.value,
                deviceModel: analytics.device?.model,
                timeOnPage: analytics.behavior?.timeOnPage,
                scrollDepth: analytics.behavior?.scrollDepth,
                interactions: analytics.behavior?.interactions
            });
        }
        
        // Geldiği yer bilgisini detaylı al
        const referer = req.headers['referer'] || req.headers['referrer'] || '';
        const origin = req.headers['origin'] || '';
        const host = req.headers['host'] || '';
        const fbclid = req.query?.fbclid || ''; // Facebook Click ID (URL parameter)
        const utm_source = req.query?.utm_source || ''; // UTM Source
        
        // Eğer referer varsa onu kullan, yoksa origin, yoksa host, yoksa 'Direkt Erişim'
        let geldigiYer = 'Direkt Erişim';
        
        // Facebook reklamından mı geldi?
        if (fbclid && fbclid !== '') {
            geldigiYer = 'Facebook Reklamı (fbclid: ' + fbclid.substring(0, 20) + ')';
        } 
        // UTM source var mı?
        else if (utm_source && utm_source !== '') {
            geldigiYer = 'UTM Source: ' + utm_source;
        }
        // Referer var mı?
        else if (referer && referer !== '') {
            geldigiYer = referer;
        } 
        // Origin var mı?
        else if (origin && origin !== '') {
            geldigiYer = origin;
        } 
        // Host bilgisi
        else if (host && host !== '') {
            geldigiYer = 'https://' + host + ' (Direkt Erişim)';
        }
        
        console.log('🌐 Geldiği Yer Tespiti:', {
            referer: referer,
            origin: origin,
            host: host,
            sonuc: geldigiYer
        });
        
        // Determine A/B test variant for this user
        const abTest = selectVariant(req.realUserIPv4);
        
        // Prepare webhook data exactly like working site
        const webhookData = {
            siparisID: siparisID || ('SIP-' + new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)),
            isim: finalName, // Webhook expects 'isim' not combined name
            soyisim: finalSurname,
            telefon: finalPhone,
            ip: ip || req.realUserIPv4,
            cihazBilgisi: cihazBilgisi || req.headers['user-agent'] || 'Bilinmeyen',
            gelenSite: gelenSite || geldigiYer, // Geldiği yer bilgisi - detaylı
            zamanDamgasi: zamanDamgasi || new Date().toISOString(),
            webhookUrl: webhookUrl || 'https://n8nwork.dtekai.com/webhook/bc74f59e-54c2-4521-85a1-6e21a0438c31',
            yürütmeModu: executionMode || 'üretme',
            
            // 🧪 A/B TEST DATA (NEW!)
            abTestVariant: abTest.variant,  // 'A' or 'B'
            abTestGroup: abTest.group,      // 'Control' or 'Treatment'
            abTestPage: abTest.page,        // 'index.html' or 'index-variant-b.html'
            abTestDescription: abTest.description,
            
            // Analytics data (VIP Detection)
            vipSeviye: analytics?.vip?.tier || 'NORMAL',
            vipPuan: analytics?.vip?.score || 0,
            oncelik: analytics?.vip?.priority || 1,
            onerilenAksiyon: analytics?.vip?.action || 'standard_followup',
            cihazDegeri: analytics?.device?.value || 0,
            cihazModeli: analytics?.device?.model || 'Bilinmeyen',
            cihazTipi: analytics?.device?.type || 'desktop',
            sayfadaKalisSuresi: analytics?.behavior?.timeOnPage || 0,
            scrollDerinligi: analytics?.behavior?.scrollDepth || 0,
            etkilesimSayisi: analytics?.behavior?.interactions || 0
        };

        console.log('📤 Webhook Data:', webhookData);
        
        // Meta Conversions API: Send Purchase Event (Server-Side)
        if (META_CONVERSIONS_API_ENABLED) {
            try {
                await sendMetaConversionEvent({
                    eventName: 'Purchase',
                    email: '', // Email yoksa boş
                    phone: finalPhone,
                    firstName: finalName,
                    lastName: finalSurname,
                    ip: req.realUserIPv4,
                    userAgent: req.headers['user-agent'],
                    fbp: req.cookies?._fbp || '', // Facebook Browser ID (cookie'den)
                    fbc: req.cookies?._fbc || '', // Facebook Click ID
                    value: 799.00,
                    currency: 'TRY',
                    contentName: 'OZPHYZEN',
                    contentIds: ['OZPHYZEN-001']
                });
                console.log('✅ Meta Conversions API: Purchase event sent');
            } catch (metaError) {
                console.error('⚠️ Meta Conversions API Error (non-critical):', metaError.message);
            }
        } else {
            console.log('⚠️ Meta Conversions API disabled (no access token)');
        }

        // Forward to N8N webhook ONLY
        try {
            const webhookResponse = await fetch('https://n8nwork.dtekai.com/webhook/bc74f59e-54c2-4521-85a1-6e21a0438c31', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': req.headers['user-agent'] || 'Node.js',
                    'X-Forwarded-For': req.realUserIPv4,
                    'X-Real-IP': req.realUserIPv4
                },
                body: JSON.stringify(webhookData)
            });

            const webhookResult = await webhookResponse.text();
            console.log('📥 N8N Webhook Response:', webhookResult);
        } catch (webhookError) {
            console.error('⚠️ N8N Webhook Error (non-critical):', webhookError.message);
        }

        // Return success response
        res.json({
            success: true,
            message: 'Siparişiniz başarıyla alındı! En kısa sürede sizinle iletişime geçeceğiz.',
            orderNumber: webhookData.siparisID,
            estimatedDelivery: '2-3 iş günü'
        });
        
    } catch (error) {
        console.error('❌ Webhook Error:', error);
        res.status(500).json({
            success: false,
            message: 'Bir hata oluştu. Lütfen tekrar deneyin.'
        });
    }
});

// API endpoint to get user's real IP
app.get('/api/get-user-ip', (req, res) => {
    res.json({
        ip: req.realUserIPv4,
        headers: {
            'x-forwarded-for': req.headers['x-forwarded-for'],
            'x-real-ip': req.headers['x-real-ip'],
            'cf-connecting-ip': req.headers['cf-connecting-ip']
        }
    });
});

// API route for tracking abandonment
app.post('/api/track-abandonment', async (req, res) => {
    try {
        const analyticsData = req.body;
        
        console.log('📊 ABANDONMENT ANALYTICS:', {
            sessionId: analyticsData.session?.sessionId,
            vipTier: analyticsData.vip?.tier,
            vipScore: analyticsData.vip?.score,
            abandonReason: analyticsData.abandonment?.analysis?.reason,
            retargetStrategy: analyticsData.abandonment?.analysis?.strategy,
            deviceValue: analyticsData.device?.value,
            timeOnPage: analyticsData.behavior?.timeOnPage
        });
        
        // N8N Webhook'a gönder (Abandonment tracking için - AYRI WEBHOOK)
        try {
            const webhookData = {
                type: 'abandonment',
                sessionId: analyticsData.session?.sessionId,
                vip: analyticsData.vip,
                device: analyticsData.device,
                abandonment: analyticsData.abandonment,
                behavior: analyticsData.behavior,
                timestamp: new Date().toISOString(),
                ip: analyticsData.userIP || analyticsData.session?.userIP || req.realUserIPv4,
                userIP: analyticsData.userIP || analyticsData.session?.userIP || req.realUserIPv4
            };
            
            console.log('📊 Sending abandonment data to separate webhook');
            
            await fetch('https://n8nwork.dtekai.com/webhook/ef297f4c-c137-46aa-8f42-895253fff2c7', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(webhookData)
            });
            
            console.log('✅ Abandonment data sent to N8N (separate webhook)');
        } catch (webhookError) {
            console.error('⚠️ Abandonment webhook error (non-critical):', webhookError.message);
        }
        
        res.json({
            success: true,
            message: 'Analytics tracked successfully'
        });
        
    } catch (error) {
        console.error('❌ Track abandonment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error tracking abandonment'
        });
    }
});

// API route for newsletter subscription
app.post('/api/subscribe-newsletter', (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'E-posta adresi gerekli.'
            });
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Geçerli bir e-posta adresi girin.'
            });
        }
        
        console.log('Newsletter subscription:', { email, timestamp: new Date().toISOString() });
        
        res.json({
            success: true,
            message: 'Bültenimize başarıyla kaydoldunuz!'
        });
        
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Bir hata oluştu. Lütfen tekrar deneyin.'
        });
    }
});

// API route for contact form
app.post('/api/contact', (req, res) => {
    try {
        const { name, email, message } = req.body;
        
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Lütfen tüm alanları doldurun.'
            });
        }
        
        console.log('Contact form submission:', { name, email, message, timestamp: new Date().toISOString() });
        
        res.json({
            success: true,
            message: 'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.'
        });
        
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'Bir hata oluştu. Lütfen tekrar deneyin.'
        });
    }
});

// Meta Conversions API: Send Event Function
async function sendMetaConversionEvent(eventData) {
    if (!META_CONVERSIONS_API_ENABLED) {
        return;
    }
    
    const {
        eventName,
        email,
        phone,
        firstName,
        lastName,
        ip,
        userAgent,
        fbp,
        fbc,
        value,
        currency,
        contentName,
        contentIds
    } = eventData;
    
    // Hash user data (Meta requires SHA256 hashing)
    const hashData = (data) => {
        if (!data) return null;
        return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
    };
    
    // Telefon numarasını temizle (sadece rakamlar)
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
    
    const userData = {
        em: email ? [hashData(email)] : undefined,
        ph: cleanPhone ? [hashData(cleanPhone)] : undefined,
        fn: firstName ? [hashData(firstName)] : undefined,
        ln: lastName ? [hashData(lastName)] : undefined,
        client_ip_address: ip,
        client_user_agent: userAgent,
        fbp: fbp || undefined,
        fbc: fbc || undefined
    };
    
    // Remove undefined fields
    Object.keys(userData).forEach(key => userData[key] === undefined && delete userData[key]);
    
    const eventData_payload = {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: 'http://207.180.204.60:8080/', // Your server URL
        action_source: 'website',
        user_data: userData,
        custom_data: {
            value: value,
            currency: currency,
            content_name: contentName,
            content_ids: contentIds,
            content_type: 'product',
            num_items: 1
        }
    };
    
    const payload = {
        data: [eventData_payload]
    };
    
    const url = `https://graph.facebook.com/${META_API_VERSION}/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (result.error) {
        throw new Error(`Meta API Error: ${result.error.message}`);
    }
    
    console.log('📊 Meta Conversions API Response:', result);
    return result;
}

// =============================================================================
// 📊 ANALYTICS API - Real-Time Dashboard
// =============================================================================

const fs = require('fs');
const { execSync } = require('child_process');

// Analytics API - Get real-time metrics from nginx logs
app.get('/api/analytics/realtime', (req, res) => {
    try {
        const logFile = '/var/log/nginx-hurriyet/hurriyetrehberhaber-store-ssl.access.log';
        
        // Get last 100 lines for real-time view
        const logs = execSync(`tail -n 100 ${logFile} 2>/dev/null || echo ""`).toString();
        const lines = logs.split('\n').filter(line => line.trim());
        
        // Parse logs
        const metrics = {
            totalRequests: lines.length,
            uniqueIPs: new Set(),
            countries: {},
            userAgents: {
                mobile: 0,
                desktop: 0,
                bot: 0
            },
            facebookTraffic: 0,
            utmSources: {},
            pages: {},
            statusCodes: {},
            avgResponseSize: 0,
            recentRequests: []
        };
        
        let totalBytes = 0;
        
        lines.forEach((line, index) => {
            // Parse nginx log format
            const ipMatch = line.match(/^([^\s]+)/);
            const statusMatch = line.match(/HTTP\/[0-9.]+" (\d{3})/);
            const bytesMatch = line.match(/HTTP\/[0-9.]+" \d{3} (\d+)/);
            const uaMatch = line.match(/"([^"]*)"$/);
            const urlMatch = line.match(/"GET ([^"]+) HTTP/);
            const refererMatch = line.match(/"https?:\/\/[^"]*" "([^"]+)"$/);
            
            if (ipMatch) {
                metrics.uniqueIPs.add(ipMatch[1]);
            }
            
            if (statusMatch) {
                const status = statusMatch[1];
                metrics.statusCodes[status] = (metrics.statusCodes[status] || 0) + 1;
            }
            
            if (bytesMatch) {
                totalBytes += parseInt(bytesMatch[1]);
            }
            
            if (uaMatch) {
                const ua = uaMatch[1];
                // Daha detaylı mobil detection (Facebook App, Instagram, WhatsApp dahil)
                if (ua.includes('Mobile') || ua.includes('iPhone') || ua.includes('Android') || 
                    ua.includes('iPad') || ua.includes('iPod') || 
                    ua.includes('FBAN') || ua.includes('FBAV') || ua.includes('Instagram') ||
                    ua.includes('WhatsApp') || ua.includes('webOS') || ua.includes('BlackBerry')) {
                    metrics.userAgents.mobile++;
                } else if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider') || 
                           ua.includes('Bot') || ua.includes('Crawler') || ua.includes('Spider')) {
                    metrics.userAgents.bot++;
                } else {
                    metrics.userAgents.desktop++;
                }
            }
            
            if (urlMatch) {
                const url = urlMatch[1];
                if (url.includes('fbclid')) {
                    metrics.facebookTraffic++;
                }
                
                // Extract UTM source
                const utmMatch = url.match(/utm_source=([^&]+)/);
                if (utmMatch) {
                    const source = utmMatch[1];
                    metrics.utmSources[source] = (metrics.utmSources[source] || 0) + 1;
                }
                
                // Count page views
                const page = url.split('?')[0];
                metrics.pages[page] = (metrics.pages[page] || 0) + 1;
            }
            
            // Add to recent requests (last 10)
            if (index < 10) {
                metrics.recentRequests.push({
                    ip: ipMatch ? ipMatch[1] : 'unknown',
                    status: statusMatch ? statusMatch[1] : 'unknown',
                    url: urlMatch ? urlMatch[1].substring(0, 50) : 'unknown',
                    userAgent: uaMatch ? uaMatch[1].substring(0, 100) : 'unknown'
                });
            }
        });
        
        metrics.uniqueIPs = metrics.uniqueIPs.size;
        metrics.avgResponseSize = lines.length > 0 ? Math.round(totalBytes / lines.length) : 0;
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            timeWindow: 'Last 100 requests',
            metrics
        });
        
    } catch (error) {
        console.error('Analytics error:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Analytics API - Summary stats (last 24h approximation)
app.get('/api/analytics/summary', (req, res) => {
    try {
        const logFile = '/var/log/nginx-hurriyet/hurriyetrehberhaber-store-ssl.access.log';
        
        // Get log stats
        const logStats = execSync(`wc -l ${logFile} 2>/dev/null || echo "0"`).toString();
        const totalLines = parseInt(logStats.trim().split(' ')[0]) || 0;
        
        // Get unique IPs (approximate - last 1000 lines)
        const recentIPs = execSync(`tail -n 1000 ${logFile} 2>/dev/null | awk '{print $1}' | sort -u | wc -l`).toString();
        const uniqueVisitors = parseInt(recentIPs.trim()) || 0;
        
        res.json({
            success: true,
            summary: {
                totalRequests: totalLines,
                uniqueVisitors: uniqueVisitors,
                period: '24 hours (approximate)',
                logFile: logFile
            }
        });
        
    } catch (error) {
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Gelişmiş Analytics API - Filtreleme ve arama
app.get('/api/analytics/search', (req, res) => {
    const {
        startDate,
        endDate,
        deviceType,
        utmSource,
        ip,
        variant,
        limit = 100,
        offset = 0
    } = req.query;
    
    let query = 'SELECT * FROM visits WHERE 1=1';
    const params = [];
    
    if (startDate) {
        query += ' AND timestamp >= ?';
        params.push(startDate);
    }
    
    if (endDate) {
        query += ' AND timestamp <= ?';
        params.push(endDate);
    }
    
    if (deviceType && deviceType !== 'all') {
        query += ' AND device_type = ?';
        params.push(deviceType);
    }
    
    if (utmSource && utmSource !== 'all') {
        query += ' AND utm_source = ?';
        params.push(utmSource);
    }
    
    if (ip) {
        query += ' AND ip LIKE ?';
        params.push(`%${ip}%`);
    }
    
    if (variant && variant !== 'all') {
        query += ' AND variant = ?';
        params.push(variant);
    }
    
    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    db.all(query, params, (err, rows) => {
        if (err) {
            return res.json({ success: false, error: err.message });
        }
        
        // Toplam sayıyı da hesapla
        let countQuery = query.split('ORDER BY')[0].replace('SELECT *', 'SELECT COUNT(*) as total');
        const countParams = params.slice(0, -2); // limit ve offset hariç
        
        db.get(countQuery, countParams, (err, countRow) => {
            res.json({
                success: true,
                visits: rows,
                total: countRow ? countRow.total : rows.length,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
        });
    });
});

// Analytics API - İstatistikler (veritabanından)
app.get('/api/analytics/stats', (req, res) => {
    const { period = '24h' } = req.query;
    
    let timeCondition = '';
    if (period === '1h') {
        timeCondition = "AND timestamp >= datetime('now', '-1 hour')";
    } else if (period === '24h') {
        timeCondition = "AND timestamp >= datetime('now', '-24 hours')";
    } else if (period === '7d') {
        timeCondition = "AND timestamp >= datetime('now', '-7 days')";
    } else if (period === '30d') {
        timeCondition = "AND timestamp >= datetime('now', '-30 days')";
    }
    
    const queries = {
        totalVisits: `SELECT COUNT(*) as count FROM visits WHERE 1=1 ${timeCondition}`,
        uniqueIPs: `SELECT COUNT(DISTINCT ip) as count FROM visits WHERE 1=1 ${timeCondition}`,
        byDevice: `SELECT device_type, COUNT(*) as count FROM visits WHERE 1=1 ${timeCondition} GROUP BY device_type`,
        byDeviceStatus: `SELECT device_type, 
            SUM(CASE WHEN status_code = 200 THEN 1 ELSE 0 END) as success,
            SUM(CASE WHEN status_code != 200 OR status_code IS NULL THEN 1 ELSE 0 END) as blocked,
            COUNT(*) as total
            FROM visits WHERE 1=1 ${timeCondition} GROUP BY device_type`,
        successRate: `SELECT 
            SUM(CASE WHEN status_code = 200 THEN 1 ELSE 0 END) as success,
            SUM(CASE WHEN status_code != 200 OR status_code IS NULL THEN 1 ELSE 0 END) as blocked
            FROM visits WHERE 1=1 ${timeCondition}`,
        byUTMSource: `SELECT utm_source, COUNT(*) as count FROM visits WHERE utm_source IS NOT NULL ${timeCondition} GROUP BY utm_source ORDER BY count DESC LIMIT 10`,
        byVariant: `SELECT variant, COUNT(*) as count FROM visits WHERE variant IS NOT NULL ${timeCondition} GROUP BY variant`,
        topPages: `SELECT url, COUNT(*) as count FROM visits WHERE 1=1 ${timeCondition} GROUP BY url ORDER BY count DESC LIMIT 10`,
        facebookTraffic: `SELECT COUNT(*) as count FROM visits WHERE (fbclid IS NOT NULL OR referrer LIKE '%facebook.com%' OR referrer LIKE '%instagram.com%' OR user_agent LIKE '%FBAN%' OR user_agent LIKE '%FBAV%' OR user_agent LIKE '%Instagram%') ${timeCondition}`
    };
    
    const results = {};
    
    Promise.all([
        new Promise((resolve) => db.get(queries.totalVisits, (err, row) => resolve({ totalVisits: row?.count || 0 }))),
        new Promise((resolve) => db.get(queries.uniqueIPs, (err, row) => resolve({ uniqueIPs: row?.count || 0 }))),
        new Promise((resolve) => db.all(queries.byDevice, (err, rows) => resolve({ byDevice: rows || [] }))),
        new Promise((resolve) => db.all(queries.byDeviceStatus, (err, rows) => resolve({ byDeviceStatus: rows || [] }))),
        new Promise((resolve) => db.get(queries.successRate, (err, row) => resolve({ successRate: row || { success: 0, blocked: 0 } }))),
        new Promise((resolve) => db.all(queries.byUTMSource, (err, rows) => resolve({ byUTMSource: rows || [] }))),
        new Promise((resolve) => db.all(queries.byVariant, (err, rows) => resolve({ byVariant: rows || [] }))),
        new Promise((resolve) => db.all(queries.topPages, (err, rows) => resolve({ topPages: rows || [] }))),
        new Promise((resolve) => db.get(queries.facebookTraffic, (err, row) => resolve({ facebookTraffic: row?.count || 0 })))
    ]).then(data => {
        data.forEach(item => Object.assign(results, item));
        res.json({
            success: true,
            period: period,
            stats: results
        });
    }).catch(error => {
        res.json({ success: false, error: error.message });
    });
});

// Analytics API - Son ziyaretçiler
app.get('/api/analytics/recent', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    
    db.all(`
        SELECT ip, device_type, browser, url, timestamp, utm_source 
        FROM visits 
        ORDER BY timestamp DESC 
        LIMIT ?
    `, [limit], (err, rows) => {
        if (err) {
            return res.json({ success: false, error: err.message });
        }
        
        res.json({
            success: true,
            recentVisits: rows
        });
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Hürriyet Sağlık server running at http://localhost:${PORT}`);
    console.log(`📱 Access from outside: http://0.0.0.0:${PORT}`);
    console.log(`📊 Meta Pixel ID: ${META_PIXEL_ID}`);
    console.log(`🔐 Meta Conversions API: ${META_CONVERSIONS_API_ENABLED ? 'ENABLED ✅' : 'DISABLED (Set META_ACCESS_TOKEN env var)'}`);
});