// WebSocket Real-time Manager
// Bu dosya dashboard ile backend arasında real-time bağlantı sağlar

class WebSocketManager {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectInterval = 3000
    this.isConnected = false
    this.eventHandlers = new Map()
    this.messageQueue = []
    
    // Feature flag check
    this.enabled = false
    
    // Debug mode
    window.WSManager = this
  }
  
  // WebSocket özelliğini etkinleştir
  enable() {
    this.enabled = true
    this.connect()
    console.log('🔄 WebSocket real-time updates enabled')
  }
  
  // WebSocket özelliğini devre dışı bırak
  disable() {
    this.enabled = false
    this.isConnected = false
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    // Status'ü hemen güncelle
    this.updateConnectionStatus('disabled')
    console.log('❌ WebSocket real-time updates disabled')
  }
  
  // Real-time bağlantısı kur (SSE fallback for Cloudflare Pages)
  connect() {
    if (!this.enabled) return
    
    try {
      // Server-Sent Events kullan (auth token ile)
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.error('❌ Auth token not found')
        this.updateConnectionStatus('error')
        return
      }
      
      const sseUrl = `${window.location.origin}/api/events?token=${encodeURIComponent(token)}`
      
      console.log('🔌 SSE connecting to:', sseUrl)
      this.ws = new EventSource(sseUrl)
      
      this.ws.onopen = (event) => {
        console.log('✅ SSE connected successfully')
        this.isConnected = true
        this.reconnectAttempts = 0
        
        // UI'da connection status'u göster
        this.updateConnectionStatus('connected')
        
        // Queued messages'ları gönder
        this.flushMessageQueue()
      }
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (error) {
          console.error('SSE message parse error:', error)
        }
      }
      
      this.ws.onerror = (error) => {
        console.error('❌ SSE error:', error)
        this.isConnected = false
        this.updateConnectionStatus('error')
        
        // Bağlantıyı kapat ve yeniden dene
        this.ws.close()
      }
      
      this.ws.addEventListener('close', (event) => {
        console.log('🔌 SSE connection closed')
        this.isConnected = false
        this.updateConnectionStatus('disconnected')
        
        // Otomatik yeniden bağlanma
        if (this.enabled && this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log(`🔄 Reconnecting in ${this.reconnectInterval}ms... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`)
          setTimeout(() => {
            this.reconnectAttempts++
            this.connect()
          }, this.reconnectInterval)
        }
      })

      
    } catch (error) {
      console.error('WebSocket connection failed:', error)
      this.updateConnectionStatus('error')
    }
  }
  
  // Message gönder (SSE is read-only, so we'll use HTTP POST for sending)
  send(data) {
    if (this.isConnected) {
      // SSE sadece okuma için, gönderim için HTTP POST kullan
      fetch('/api/events/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(data)
      }).catch(error => {
        console.warn('Failed to send SSE message:', error)
      })
    } else {
      // Bağlantı yoksa queue'ya ekle
      this.messageQueue.push(data)
    }
  }
  
  // Queue'daki mesajları gönder
  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      this.send(message)
    }
  }
  
  // Gelen mesajları işle
  handleMessage(data) {
    const { type, payload } = data
    
    switch (type) {
      case 'domain_update':
        this.handleDomainUpdate(payload)
        break
      
      case 'visitor_new':
        this.handleNewVisitor(payload)
        break
        
      case 'bot_detected':
        this.handleBotDetection(payload)
        break
        
      case 'stats_update':
        this.handleStatsUpdate(payload)
        break
        
      case 'alert':
        this.handleAlert(payload)
        break
        
      default:
        console.log('Unknown WebSocket message type:', type, payload)
    }
    
    // Custom event handlers'ı çalıştır
    if (this.eventHandlers.has(type)) {
      this.eventHandlers.get(type).forEach(handler => {
        try {
          handler(payload)
        } catch (error) {
          console.error('Event handler error:', error)
        }
      })
    }
  }
  
  // Event handler ekle
  on(eventType, handler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, [])
    }
    this.eventHandlers.get(eventType).push(handler)
  }
  
  // Event handler kaldır
  off(eventType, handler) {
    if (this.eventHandlers.has(eventType)) {
      const handlers = this.eventHandlers.get(eventType)
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }
  
  // Domain güncelleme işle
  handleDomainUpdate(data) {
    console.log('📊 Real-time domain update:', data)
    
    // Domain listesini güncelle (eğer domains section görünürse)
    if (typeof loadDomains === 'function' && document.getElementById('section-domains').style.display !== 'none') {
      loadDomains()
    }
  }
  
  // Yeni visitor işle
  handleNewVisitor(data) {
    console.log('👥 New visitor detected:', data)
    
    // Visitor counter'ı artır
    this.incrementCounter('traffic-unique-visitors')
    
    // Real-time visitor notification
    this.showVisitorNotification(data)
  }
  
  // Bot detection işle
  handleBotDetection(data) {
    console.log('🤖 Bot detected:', data)
    
    // Bot counter'ı artır
    this.incrementCounter('traffic-bot-requests')
    
    // Bot alert göster
    this.showBotAlert(data)
  }
  
  // Stats güncelleme işle
  handleStatsUpdate(data) {
    console.log('📈 Stats update:', data)
    
    // Dashboard stats'larını güncelle
    if (data.totalRequests) {
      this.updateCounter('traffic-total-requests', data.totalRequests)
    }
    if (data.uniqueVisitors) {
      this.updateCounter('traffic-unique-visitors', data.uniqueVisitors)
    }
    if (data.botRequests) {
      this.updateCounter('traffic-bot-requests', data.botRequests)
    }
  }
  
  // Alert işle
  handleAlert(data) {
    console.log('🚨 Real-time alert:', data)
    
    // Dashboard notification göster
    if (typeof showNotification === 'function') {
      showNotification(`🔴 ${data.message}`, data.type || 'warning')
    }
  }
  
  // Counter'ı artır (animasyonlu)
  incrementCounter(elementId, amount = 1) {
    const element = document.getElementById(elementId)
    if (element) {
      const currentValue = parseInt(element.textContent) || 0
      const newValue = currentValue + amount
      this.animateCounter(element, currentValue, newValue)
    }
  }
  
  // Counter güncelle (animasyonlu)
  updateCounter(elementId, newValue) {
    const element = document.getElementById(elementId)
    if (element) {
      const currentValue = parseInt(element.textContent) || 0
      if (newValue !== currentValue) {
        this.animateCounter(element, currentValue, newValue)
      }
    }
  }
  
  // Counter animasyonu
  animateCounter(element, from, to) {
    const duration = 800
    const start = Date.now()
    const diff = to - from
    
    const animate = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(from + diff * easeOut)
      
      element.textContent = current.toLocaleString()
      element.style.transform = 'scale(1.1)'
      element.style.color = '#10B981' // Green flash
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // Animation tamamlandı, normal duruma dön
        setTimeout(() => {
          element.style.transform = 'scale(1)'
          element.style.color = ''
        }, 200)
      }
    }
    
    animate()
  }
  
  // Visitor notification göster
  showVisitorNotification(data) {
    const notification = document.createElement('div')
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: linear-gradient(135deg, #10B981, #059669);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(16,185,129,0.4);
      z-index: 10000;
      font-size: 13px;
      transform: translateX(300px);
      transition: transform 0.3s ease;
    `
    
    notification.innerHTML = `
      <div style="font-weight: 600;">👥 New Visitor</div>
      <div style="font-size: 11px; opacity: 0.9;">${data.ip || 'Unknown'} • ${data.country || 'Unknown'}</div>
    `
    
    document.body.appendChild(notification)
    
    // Slide in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)'
    }, 100)
    
    // Auto remove
    setTimeout(() => {
      notification.style.transform = 'translateX(300px)'
      setTimeout(() => notification.remove(), 300)
    }, 4000)
  }
  
  // Bot alert göster
  showBotAlert(data) {
    const notification = document.createElement('div')
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: linear-gradient(135deg, #EF4444, #DC2626);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(239,68,68,0.4);
      z-index: 10000;
      font-size: 13px;
      transform: translateX(300px);
      transition: transform 0.3s ease;
    `
    
    notification.innerHTML = `
      <div style="font-weight: 600;">🤖 Bot Detected</div>
      <div style="font-size: 11px; opacity: 0.9;">${data.type || 'Unknown'} • ${data.confidence || 0}% confidence</div>
    `
    
    document.body.appendChild(notification)
    
    // Slide in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)'
    }, 100)
    
    // Auto remove
    setTimeout(() => {
      notification.style.transform = 'translateX(300px)'
      setTimeout(() => notification.remove(), 300)
    }, 5000)
  }
  
  // Connection status güncelle
  updateConnectionStatus(status) {
    // Gerçek duruma göre status belirle
    let statusText = ''
    let statusColor = ''
    
    // wsManager'ın gerçek durumuna bak
    if (this.enabled && this.isConnected) {
      // Gerçekten aktif ve bağlı
      statusText = '🟢 Live Updates Active'
      statusColor = '#10B981'
    } else if (this.enabled && !this.isConnected) {
      // Aktif ama bağlantı yok
      statusText = '🟡 Connecting...'
      statusColor = '#F59E0B'
    } else {
      // Deaktif
      statusText = '⭕ Real-time Disabled'
      statusColor = '#6B7280'
    }
    
    // Control panel'e WebSocket status ekle
    const controlPanel = document.getElementById('react-controls')
    if (controlPanel) {
      let statusDiv = document.getElementById('ws-status')
      if (!statusDiv) {
        statusDiv = document.createElement('div')
        statusDiv.id = 'ws-status'
        statusDiv.style.cssText = 'margin-top: 8px; font-size: 10px; text-align: center; font-weight: 500;'
        controlPanel.appendChild(statusDiv)
      }
      
      statusDiv.textContent = statusText
      statusDiv.style.color = statusColor
    }
  }
  
  // Status bilgisi
  getStatus() {
    return {
      enabled: this.enabled,
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      messageQueue: this.messageQueue.length
    }
  }
}

// Global WebSocket manager instance
window.wsManager = new WebSocketManager()

// Kolay kullanım fonksiyonları
window.enableWebSocket = () => window.wsManager.enable()
window.disableWebSocket = () => window.wsManager.disable()
window.wsStatus = () => window.wsManager.getStatus()

// Console helper
console.log(`
🔌 WebSocket Manager Yüklendi!

Kullanım:
enableWebSocket()   - Real-time updates aktif
disableWebSocket()  - Polling moduna dön
wsStatus()          - WebSocket durumu

Mevcut durum: ${window.wsManager.enabled ? 'Enabled' : 'Disabled'}
`)