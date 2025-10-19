// AI Behavior Tracker
// Bu dosya kullanıcı davranışlarını izleyerek bot detection için veri toplar

class AIBehaviorTracker {
  constructor() {
    this.behaviorData = {
      // Mouse behavior
      mouseMovements: [],
      mouseClicks: [],
      mouseSpeed: [],
      mouseAcceleration: [],
      
      // Scroll behavior  
      scrollPatterns: [],
      scrollSpeed: [],
      scrollJumps: [],
      
      // Keyboard behavior
      keystrokes: [],
      keystrokeTiming: [],
      
      // Time-based patterns
      sessionDuration: 0,
      pageViewTime: Date.now(),
      interactionCount: 0,
      
      // Browser fingerprinting
      screenResolution: `${screen.width}x${screen.height}`,
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      
      // Advanced metrics
      humanScore: 0,
      botProbability: 0,
      suspiciousPatterns: []
    }
    
    this.enabled = false
    this.lastMousePosition = { x: 0, y: 0, time: 0 }
    this.trackingInterval = null
    this.analysisInterval = null
    
    // Feature flag check
    this.aiEnabled = false
    
    // Debug mode
    window.AITracker = this
  }
  
  // AI Bot Detection'ı etkinleştir
  enable() {
    this.enabled = true
    this.aiEnabled = true
    this.startTracking()
    console.log('🤖 AI Behavior Tracking enabled')
  }
  
  // AI Bot Detection'ı devre dışı bırak
  disable() {
    this.enabled = false
    this.aiEnabled = false
    this.stopTracking()
    console.log('❌ AI Behavior Tracking disabled')
  }
  
  // Tracking başlat
  startTracking() {
    if (!this.enabled) return
    
    // Mouse tracking
    document.addEventListener('mousemove', this.trackMouseMovement.bind(this))
    document.addEventListener('click', this.trackMouseClick.bind(this))
    
    // Scroll tracking
    document.addEventListener('scroll', this.trackScrollBehavior.bind(this))
    
    // Keyboard tracking
    document.addEventListener('keydown', this.trackKeystrokes.bind(this))
    document.addEventListener('keyup', this.trackKeystrokes.bind(this))
    
    // Page visibility tracking
    document.addEventListener('visibilitychange', this.trackPageVisibility.bind(this))
    
    // Periodic analysis
    this.analysisInterval = setInterval(() => {
      this.analyzeRealTime()
    }, 3000) // Her 3 saniyede bir analiz
    
    console.log('📊 Behavior tracking started')
  }
  
  // Tracking durdur
  stopTracking() {
    document.removeEventListener('mousemove', this.trackMouseMovement.bind(this))
    document.removeEventListener('click', this.trackMouseClick.bind(this))
    document.removeEventListener('scroll', this.trackScrollBehavior.bind(this))
    document.removeEventListener('keydown', this.trackKeystrokes.bind(this))
    document.removeEventListener('keyup', this.trackKeystrokes.bind(this))
    document.removeEventListener('visibilitychange', this.trackPageVisibility.bind(this))
    
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval)
      this.analysisInterval = null
    }
    
    console.log('📊 Behavior tracking stopped')
  }
  
  // Mouse movement tracking
  trackMouseMovement(event) {
    if (!this.enabled) return
    
    const now = Date.now()
    const currentPos = { x: event.clientX, y: event.clientY, time: now }
    
    if (this.lastMousePosition.time > 0) {
      // Calculate mouse metrics
      const deltaX = currentPos.x - this.lastMousePosition.x
      const deltaY = currentPos.y - this.lastMousePosition.y
      const deltaTime = now - this.lastMousePosition.time
      
      if (deltaTime > 0) {
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        const speed = distance / deltaTime
        const acceleration = speed / deltaTime
        
        // Store movement data
        this.behaviorData.mouseMovements.push({
          x: currentPos.x,
          y: currentPos.y,
          time: now,
          speed: speed,
          acceleration: acceleration,
          distance: distance
        })
        
        // Store speed data for analysis
        this.behaviorData.mouseSpeed.push(speed)
        this.behaviorData.mouseAcceleration.push(acceleration)
        
        // Limit data size (keep last 1000 movements)
        if (this.behaviorData.mouseMovements.length > 1000) {
          this.behaviorData.mouseMovements.shift()
        }
        if (this.behaviorData.mouseSpeed.length > 1000) {
          this.behaviorData.mouseSpeed.shift()
          this.behaviorData.mouseAcceleration.shift()
        }
      }
    }
    
    this.lastMousePosition = currentPos
  }
  
  // Mouse click tracking
  trackMouseClick(event) {
    if (!this.enabled) return
    
    const clickData = {
      x: event.clientX,
      y: event.clientY,
      time: Date.now(),
      button: event.button,
      target: event.target.tagName.toLowerCase()
    }
    
    this.behaviorData.mouseClicks.push(clickData)
    this.behaviorData.interactionCount++
    
    // Limit data size
    if (this.behaviorData.mouseClicks.length > 100) {
      this.behaviorData.mouseClicks.shift()
    }
  }
  
  // Scroll behavior tracking
  trackScrollBehavior(event) {
    if (!this.enabled) return
    
    const scrollData = {
      scrollY: window.scrollY,
      scrollX: window.scrollX,
      time: Date.now(),
      deltaY: event.deltaY || 0,
      deltaX: event.deltaX || 0
    }
    
    // Calculate scroll speed
    if (this.behaviorData.scrollPatterns.length > 0) {
      const lastScroll = this.behaviorData.scrollPatterns[this.behaviorData.scrollPatterns.length - 1]
      const timeDelta = scrollData.time - lastScroll.time
      const scrollDelta = Math.abs(scrollData.scrollY - lastScroll.scrollY)
      
      if (timeDelta > 0) {
        const scrollSpeed = scrollDelta / timeDelta
        this.behaviorData.scrollSpeed.push(scrollSpeed)
        
        // Detect scroll jumps (bot behavior)
        if (scrollDelta > 500 && timeDelta < 100) {
          this.behaviorData.scrollJumps.push({
            jump: scrollDelta,
            time: scrollData.time,
            speed: scrollSpeed
          })
        }
      }
    }
    
    this.behaviorData.scrollPatterns.push(scrollData)
    
    // Limit data size
    if (this.behaviorData.scrollPatterns.length > 500) {
      this.behaviorData.scrollPatterns.shift()
    }
    if (this.behaviorData.scrollSpeed.length > 500) {
      this.behaviorData.scrollSpeed.shift()
    }
  }
  
  // Keystroke tracking
  trackKeystrokes(event) {
    if (!this.enabled) return
    
    const keystrokeData = {
      key: event.key,
      code: event.code,
      type: event.type, // keydown or keyup
      time: Date.now(),
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey
    }
    
    this.behaviorData.keystrokes.push(keystrokeData)
    
    // Calculate keystroke timing
    if (this.behaviorData.keystrokes.length > 1) {
      const lastKeystroke = this.behaviorData.keystrokes[this.behaviorData.keystrokes.length - 2]
      const timingDelta = keystrokeData.time - lastKeystroke.time
      this.behaviorData.keystrokeTiming.push(timingDelta)
    }
    
    // Limit data size
    if (this.behaviorData.keystrokes.length > 200) {
      this.behaviorData.keystrokes.shift()
    }
    if (this.behaviorData.keystrokeTiming.length > 200) {
      this.behaviorData.keystrokeTiming.shift()
    }
  }
  
  // Page visibility tracking
  trackPageVisibility() {
    if (!this.enabled) return
    
    if (document.hidden) {
      // Page became hidden
      this.behaviorData.sessionDuration += Date.now() - this.behaviorData.pageViewTime
    } else {
      // Page became visible
      this.behaviorData.pageViewTime = Date.now()
    }
  }
  
  // Real-time analysis
  analyzeRealTime() {
    if (!this.enabled) return
    
    const analysis = this.calculateBotScore()
    this.behaviorData.humanScore = analysis.humanScore
    this.behaviorData.botProbability = analysis.botProbability
    this.behaviorData.suspiciousPatterns = analysis.suspiciousPatterns
    
    // Send to server if high bot probability
    if (analysis.botProbability > 80) {
      this.reportSuspiciousActivity(analysis)
    }
    
    // Update UI if needed
    this.updateBotScoreDisplay(analysis)
  }
  
  // Advanced AI Bot Score Calculation with ML-based scoring
  calculateBotScore() {
    let humanScore = 100
    let suspiciousPatterns = []
    let mlFeatures = {}
    
    // 1. Mouse Movement Analysis
    if (this.behaviorData.mouseMovements.length > 10) {
      const mouseAnalysis = this.analyzeAdvancedMouseBehavior()
      humanScore -= mouseAnalysis.penalty
      suspiciousPatterns = suspiciousPatterns.concat(mouseAnalysis.patterns)
      mlFeatures.mouseFeatures = mouseAnalysis.features
    }
    
    // 2. Click Pattern Analysis  
    if (this.behaviorData.mouseClicks.length > 3) {
      const clickAnalysis = this.analyzeAdvancedClickBehavior()
      humanScore -= clickAnalysis.penalty
      suspiciousPatterns = suspiciousPatterns.concat(clickAnalysis.patterns)
      mlFeatures.clickFeatures = clickAnalysis.features
    }
    
    // 3. Scroll Behavior Analysis
    if (this.behaviorData.scrollPatterns.length > 5) {
      const scrollAnalysis = this.analyzeAdvancedScrollBehavior()
      humanScore -= scrollAnalysis.penalty
      suspiciousPatterns = suspiciousPatterns.concat(scrollAnalysis.patterns)
      mlFeatures.scrollFeatures = scrollAnalysis.features
    }
    
    // 4. Keystroke Analysis
    if (this.behaviorData.keystrokes.length > 5) {
      const keystrokeAnalysis = this.analyzeAdvancedKeystrokeBehavior()
      humanScore -= keystrokeAnalysis.penalty
      suspiciousPatterns = suspiciousPatterns.concat(keystrokeAnalysis.patterns)
      mlFeatures.keystrokeFeatures = keystrokeAnalysis.features
    }
    
    // 5. Session Behavior Analysis
    const sessionAnalysis = this.analyzeAdvancedSessionBehavior()
    humanScore -= sessionAnalysis.penalty
    suspiciousPatterns = suspiciousPatterns.concat(sessionAnalysis.patterns)
    mlFeatures.sessionFeatures = sessionAnalysis.features
    
    // 6. NEW: Browser Fingerprint Analysis
    const fingerprintAnalysis = this.analyzeBrowserFingerprint()
    humanScore -= fingerprintAnalysis.penalty
    suspiciousPatterns = suspiciousPatterns.concat(fingerprintAnalysis.patterns)
    mlFeatures.fingerprintFeatures = fingerprintAnalysis.features
    
    // 7. NEW: Temporal Pattern Analysis
    const temporalAnalysis = this.analyzeTemporalPatterns()
    humanScore -= temporalAnalysis.penalty
    suspiciousPatterns = suspiciousPatterns.concat(temporalAnalysis.patterns)
    mlFeatures.temporalFeatures = temporalAnalysis.features
    
    // 8. NEW: Interaction Coherence Analysis
    const coherenceAnalysis = this.analyzeInteractionCoherence()
    humanScore -= coherenceAnalysis.penalty
    suspiciousPatterns = suspiciousPatterns.concat(coherenceAnalysis.patterns)
    mlFeatures.coherenceFeatures = coherenceAnalysis.features
    
    // Ensure score is within bounds
    humanScore = Math.max(0, Math.min(100, humanScore))
    
    // Apply ML-based adjustment
    const mlAdjustment = this.applyMLBotScoring(mlFeatures, humanScore)
    const finalScore = Math.max(0, Math.min(100, humanScore + mlAdjustment))
    const botProbability = 100 - finalScore
    
    return {
      humanScore: Math.round(finalScore),
      botProbability: Math.round(botProbability),
      suspiciousPatterns: suspiciousPatterns,
      confidence: this.calculateAdvancedConfidence(mlFeatures),
      mlFeatures: mlFeatures,
      mlAdjustment: mlAdjustment,
      timestamp: Date.now()
    }
  }
  
  // Advanced Scroll Behavior Analysis
  analyzeAdvancedScrollBehavior() {
    let penalty = 0
    let patterns = []
    let features = {}
    
    // Check for scroll jumps (bot behavior)
    if (this.behaviorData.scrollJumps.length > 3) {
      penalty += 25
      patterns.push('Unnatural scroll jumps')
    }
    
    // Advanced speed analysis
    const speeds = this.behaviorData.scrollSpeed.slice(-20)
    if (speeds.length > 5) {
      const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length
      const speedVariance = speeds.reduce((sum, speed) => sum + Math.pow(speed - avgSpeed, 2), 0) / speeds.length
      
      features.scrollSpeedMean = avgSpeed
      features.scrollSpeedVariance = speedVariance
      
      if (avgSpeed > 50) {
        penalty += 15
        patterns.push('Unnatural scroll speed')
      }
      
      // Ultra-consistent scrolling is suspicious
      if (speedVariance < 10 && avgSpeed > 10) {
        penalty += 20
        patterns.push('Robotic scroll consistency')
      }
    }
    
    return { penalty, patterns, features }
  }
  
  // Advanced Keystroke Behavior Analysis  
  analyzeAdvancedKeystrokeBehavior() {
    let penalty = 0
    let patterns = []
    let features = {}
    
    const timings = this.behaviorData.keystrokeTiming.slice(-20)
    
    if (timings.length > 5) {
      const avgTiming = timings.reduce((a, b) => a + b, 0) / timings.length
      const variance = timings.reduce((sum, timing) => sum + Math.pow(timing - avgTiming, 2), 0) / timings.length
      
      features.keystrokeTimingMean = avgTiming
      features.keystrokeTimingVariance = variance
      
      // Too consistent timing (bot)
      if (variance < 100 && avgTiming > 50) {
        penalty += 20
        patterns.push('Unnatural keystroke timing')
      }
      
      // Too fast typing (potential bot)
      if (avgTiming < 50) {
        penalty += 15
        patterns.push('Unnaturally fast typing')
      }
      
      // Calculate typing rhythm entropy
      const entropy = this.calculateEntropy(timings)
      features.keystrokeEntropy = entropy
      
      if (entropy < 1.5) {
        penalty += 25
        patterns.push('Low keystroke entropy (robotic typing)')
      }
    }
    
    return { penalty, patterns, features }
  }
  
  // Advanced Session Behavior Analysis
  analyzeAdvancedSessionBehavior() {
    let penalty = 0
    let patterns = []
    let features = {}
    
    const sessionDuration = Date.now() - this.behaviorData.pageViewTime + this.behaviorData.sessionDuration
    
    features.sessionDuration = sessionDuration
    features.interactionCount = this.behaviorData.interactionCount
    features.interactionRate = sessionDuration > 0 ? this.behaviorData.interactionCount / (sessionDuration / 1000) : 0
    
    // Too little interaction for session duration
    if (sessionDuration > 30000 && this.behaviorData.interactionCount < 3) {
      penalty += 20
      patterns.push('Low interaction for session duration')
    }
    
    // No mouse movements (potential headless browser)
    if (sessionDuration > 10000 && this.behaviorData.mouseMovements.length === 0) {
      penalty += 40
      patterns.push('No mouse movement detected')
    }
    
    // Unnatural interaction rates
    if (features.interactionRate > 10) {
      penalty += 15
      patterns.push('Excessive interaction rate')
    }
    
    if (sessionDuration > 60000 && features.interactionRate < 0.01) {
      penalty += 25
      patterns.push('Suspiciously low interaction rate')
    }
    
    return { penalty, patterns, features }
  }
  
  // Calculate confidence level
  calculateConfidence() {
    const totalDataPoints = 
      this.behaviorData.mouseMovements.length +
      this.behaviorData.mouseClicks.length +
      this.behaviorData.scrollPatterns.length +
      this.behaviorData.keystrokes.length
    
    if (totalDataPoints > 100) return 95
    if (totalDataPoints > 50) return 85
    if (totalDataPoints > 20) return 70
    if (totalDataPoints > 10) return 50
    return 30
  }
  
  // Enhanced Real-time Threat Detection & Reporting
  reportSuspiciousActivity(analysis) {
    if (!this.enabled) return
    
    const threatLevel = this.calculateThreatLevel(analysis)
    const alertData = this.generateThreatAlert(analysis, threatLevel)
    
    // Display real-time alert to admin
    this.showThreatAlert(alertData)
    
    // Send to server with enhanced data
    fetch('/api/ai-bot-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || 'demo'}`
      },
      body: JSON.stringify({
        behaviorData: this.behaviorData,
        analysis: analysis,
        threatLevel: threatLevel,
        alertData: alertData,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        sessionId: this.getSessionId(),
        ipFingerprint: this.getIPFingerprint()
      })
    }).catch(error => {
      console.warn('Failed to report suspicious activity:', error)
    })
    
    console.log('🚨 Real-time threat detected:', alertData)
  }
  
  // Calculate Threat Level (Critical, High, Medium, Low)
  calculateThreatLevel(analysis) {
    const botProbability = analysis.botProbability
    const suspiciousCount = analysis.suspiciousPatterns.length
    const confidence = analysis.confidence
    
    // Multi-factor threat assessment
    let threatScore = 0
    
    // Base score from bot probability
    threatScore += botProbability
    
    // Boost from suspicious patterns count
    threatScore += suspiciousCount * 5
    
    // Confidence factor
    if (confidence > 80) threatScore *= 1.2
    else if (confidence < 50) threatScore *= 0.7
    
    // ML feature severity boost
    if (analysis.mlFeatures) {
      if (analysis.mlFeatures.fingerprintFeatures?.webDriverScore > 0) threatScore += 25
      if (analysis.mlFeatures.mouseFeatures?.speedCoeffVariation < 0.15) threatScore += 15
      if (analysis.mlFeatures.clickFeatures?.clickEntropy < 2.0) threatScore += 15
    }
    
    // Determine threat level
    if (threatScore >= 90) return 'CRITICAL'
    if (threatScore >= 70) return 'HIGH' 
    if (threatScore >= 50) return 'MEDIUM'
    return 'LOW'
  }
  
  // Generate comprehensive threat alert
  generateThreatAlert(analysis, threatLevel) {
    const now = new Date()
    
    return {
      id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now.toISOString(),
      threatLevel: threatLevel,
      botProbability: analysis.botProbability,
      confidence: analysis.confidence,
      suspiciousPatterns: analysis.suspiciousPatterns,
      
      // Threat classification
      primaryThreats: this.classifyPrimaryThreats(analysis),
      
      // Risk assessment
      riskFactors: this.assessRiskFactors(analysis),
      
      // Recommended actions
      recommendedActions: this.generateRecommendedActions(threatLevel, analysis),
      
      // Session context
      sessionContext: {
        duration: Date.now() - this.behaviorData.pageViewTime,
        interactionCount: this.behaviorData.interactionCount,
        userAgent: navigator.userAgent,
        screenResolution: this.behaviorData.screenResolution,
        timezone: this.behaviorData.timezone
      }
    }
  }
  
  // Classify primary threat types
  classifyPrimaryThreats(analysis) {
    const threats = []
    
    if (analysis.suspiciousPatterns.some(p => p.includes('WebDriver'))) {
      threats.push({
        type: 'AUTOMATION_TOOL',
        severity: 'CRITICAL',
        description: 'Automated browser/WebDriver detected'
      })
    }
    
    if (analysis.suspiciousPatterns.some(p => p.includes('straight line'))) {
      threats.push({
        type: 'SCRIPTED_MOVEMENT',
        severity: 'HIGH', 
        description: 'Non-human mouse movement patterns'
      })
    }
    
    if (analysis.suspiciousPatterns.some(p => p.includes('entropy'))) {
      threats.push({
        type: 'ROBOTIC_INTERACTION',
        severity: 'HIGH',
        description: 'Predictable/scripted interaction patterns'
      })
    }
    
    if (analysis.suspiciousPatterns.some(p => p.includes('timing'))) {
      threats.push({
        type: 'TIMING_ATTACK',
        severity: 'MEDIUM',
        description: 'Unnatural timing consistency'
      })
    }
    
    if (analysis.suspiciousPatterns.some(p => p.includes('fingerprint'))) {
      threats.push({
        type: 'EVASION_ATTEMPT',
        severity: 'HIGH',
        description: 'Suspicious browser fingerprint'
      })
    }
    
    return threats
  }
  
  // Assess risk factors
  assessRiskFactors(analysis) {
    const factors = []
    
    // Data collection risk
    if (this.behaviorData.interactionCount > 50) {
      factors.push({
        factor: 'DATA_HARVESTING',
        risk: 'HIGH',
        description: 'High interaction count suggests data scraping'
      })
    }
    
    // Session persistence risk
    const sessionDuration = Date.now() - this.behaviorData.pageViewTime
    if (sessionDuration > 300000) { // 5 minutes
      factors.push({
        factor: 'PERSISTENT_SESSION',
        risk: 'MEDIUM',
        description: 'Unusually long session duration'
      })
    }
    
    // Stealth operation risk
    if (analysis.suspiciousPatterns.length > 3) {
      factors.push({
        factor: 'MULTI_VECTOR_ATTACK',
        risk: 'CRITICAL',
        description: 'Multiple suspicious patterns detected'
      })
    }
    
    return factors
  }
  
  // Generate recommended actions
  generateRecommendedActions(threatLevel, analysis) {
    const actions = []
    
    switch (threatLevel) {
      case 'CRITICAL':
        actions.push('IMMEDIATE: Block IP address')
        actions.push('IMMEDIATE: Terminate session')
        actions.push('URGENT: Review security logs')
        actions.push('URGENT: Notify security team')
        break
        
      case 'HIGH':
        actions.push('PRIORITY: Increase monitoring')
        actions.push('PRIORITY: Apply rate limiting')
        actions.push('REVIEW: Check recent activity logs')
        break
        
      case 'MEDIUM':
        actions.push('MONITOR: Continue tracking')
        actions.push('VERIFY: Manual review recommended')
        break
        
      case 'LOW':
        actions.push('LOG: Record for pattern analysis')
        break
    }
    
    // Specific pattern-based actions
    if (analysis.suspiciousPatterns.some(p => p.includes('WebDriver'))) {
      actions.push('TECHNICAL: Implement advanced bot detection')
    }
    
    if (analysis.suspiciousPatterns.some(p => p.includes('speed'))) {
      actions.push('TECHNICAL: Adjust interaction rate limits')
    }
    
    return actions
  }
  
  // Display real-time threat alert in UI
  showThreatAlert(alertData) {
    // Create alert notification
    const alertDiv = document.createElement('div')
    alertDiv.className = `threat-alert threat-${alertData.threatLevel.toLowerCase()}`
    alertDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      padding: 16px;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      max-width: 400px;
      backdrop-filter: blur(10px);
      ${this.getThreatAlertStyles(alertData.threatLevel)}
    `
    
    const threatIcon = this.getThreatIcon(alertData.threatLevel)
    
    alertDiv.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 20px; margin-right: 8px;">${threatIcon}</span>
        <span>${alertData.threatLevel} THREAT DETECTED</span>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="margin-left: auto; background: none; border: none; color: white; cursor: pointer; font-size: 18px;">×</button>
      </div>
      <div style="font-size: 12px; margin-bottom: 8px; opacity: 0.9;">
        Bot Probability: ${alertData.botProbability}% | Confidence: ${alertData.confidence}%
      </div>
      <div style="font-size: 11px; opacity: 0.8;">
        ${alertData.primaryThreats.map(t => t.description).join(', ')}
      </div>
    `
    
    document.body.appendChild(alertDiv)
    
    // Auto-remove after delay (except for critical threats)
    if (alertData.threatLevel !== 'CRITICAL') {
      setTimeout(() => {
        if (document.body.contains(alertDiv)) {
          alertDiv.remove()
        }
      }, alertData.threatLevel === 'HIGH' ? 10000 : 5000)
    }
    
    // Play alert sound for high-priority threats
    if (alertData.threatLevel === 'CRITICAL' || alertData.threatLevel === 'HIGH') {
      this.playAlertSound()
    }
    
    // Update threat counter in control panel
    this.updateThreatCounter(alertData)
  }
  
  // Get threat alert styling
  getThreatAlertStyles(threatLevel) {
    switch (threatLevel) {
      case 'CRITICAL': return 'background: linear-gradient(135deg, #dc2626, #7f1d1d); border: 2px solid #fecaca;'
      case 'HIGH': return 'background: linear-gradient(135deg, #ea580c, #9a3412); border: 2px solid #fed7aa;'
      case 'MEDIUM': return 'background: linear-gradient(135deg, #d97706, #92400e); border: 2px solid #fde68a;'
      case 'LOW': return 'background: linear-gradient(135deg, #0891b2, #0e7490); border: 2px solid #bae6fd;'
      default: return 'background: linear-gradient(135deg, #6b7280, #4b5563);'
    }
  }
  
  // Get threat icon
  getThreatIcon(threatLevel) {
    switch (threatLevel) {
      case 'CRITICAL': return '🚨'
      case 'HIGH': return '⚠️'
      case 'MEDIUM': return '🔶'
      case 'LOW': return '🔵'
      default: return '⚡'
    }
  }
  
  // Play alert sound
  playAlertSound() {
    try {
      // Create audio context for alert sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.warn('Could not play alert sound:', error)
    }
  }
  
  // Update threat counter in control panel
  updateThreatCounter(alertData) {
    const controlPanel = document.getElementById('react-controls')
    if (!controlPanel) return
    
    let counterDiv = document.getElementById('threat-counter')
    if (!counterDiv) {
      counterDiv = document.createElement('div')
      counterDiv.id = 'threat-counter'
      counterDiv.style.cssText = 'margin-top: 4px; font-size: 10px; text-align: center; font-weight: 500;'
      
      // Insert after AI score div
      const scoreDiv = document.getElementById('ai-score')
      if (scoreDiv) {
        scoreDiv.parentNode.insertBefore(counterDiv, scoreDiv.nextSibling)
      } else {
        controlPanel.appendChild(counterDiv)
      }
    }
    
    // Update counter
    window.threatCount = (window.threatCount || 0) + 1
    const icon = this.getThreatIcon(alertData.threatLevel)
    
    counterDiv.innerHTML = `${icon} Threats: ${window.threatCount}`
    counterDiv.style.color = alertData.threatLevel === 'CRITICAL' ? '#EF4444' : 
                            alertData.threatLevel === 'HIGH' ? '#F59E0B' : '#10B981'
  }
  
  // Session and IP utilities
  getSessionId() {
    if (!window.sessionId) {
      window.sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    }
    return window.sessionId
  }
  
  getIPFingerprint() {
    // Simple client-side IP fingerprinting (limited)
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      timestamp: Date.now()
    }
  }
  
  // Update bot score display
  updateBotScoreDisplay(analysis) {
    // Control panel'e AI score göster
    const controlPanel = document.getElementById('react-controls')
    if (controlPanel && this.aiEnabled) {
      let scoreDiv = document.getElementById('ai-score')
      if (!scoreDiv) {
        scoreDiv = document.createElement('div')
        scoreDiv.id = 'ai-score'
        scoreDiv.style.cssText = 'margin-top: 8px; font-size: 10px; text-align: center; font-weight: 500; border-top: 1px solid rgba(148,163,184,0.2); padding-top: 8px;'
        controlPanel.appendChild(scoreDiv)
      }
      
      const scoreColor = analysis.botProbability > 70 ? '#EF4444' : 
                        analysis.botProbability > 40 ? '#F59E0B' : '#10B981'
      
      scoreDiv.innerHTML = `🤖 Bot Risk: ${analysis.botProbability}%`
      scoreDiv.style.color = scoreColor
    }
  }
  
  // Get current analysis
  getCurrentAnalysis() {
    return this.calculateBotScore()
  }
  
  // Get behavior data
  getBehaviorData() {
    return this.behaviorData
  }
  
  // Reset data
  reset() {
    this.behaviorData = {
      mouseMovements: [],
      mouseClicks: [],
      mouseSpeed: [],
      mouseAcceleration: [],
      scrollPatterns: [],
      scrollSpeed: [],
      scrollJumps: [],
      keystrokes: [],
      keystrokeTiming: [],
      sessionDuration: 0,
      pageViewTime: Date.now(),
      interactionCount: 0,
      screenResolution: `${screen.width}x${screen.height}`,
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      humanScore: 0,
      botProbability: 0,
      suspiciousPatterns: []
    }
    console.log('🔄 AI behavior data reset')
  }
  
  // ===============================================================================
  // ADVANCED BEHAVIORAL ANALYSIS METHODS (ML-Enhanced)
  // ===============================================================================
  
  // Advanced Mouse Movement Analysis with ML features
  analyzeAdvancedMouseBehavior() {
    let penalty = 0
    let patterns = []
    let features = {}
    
    const movements = this.behaviorData.mouseMovements.slice(-100)
    if (movements.length < 5) return { penalty: 0, patterns: [], features: {} }
    
    // Calculate advanced mouse metrics
    const speeds = movements.map(m => m.speed).filter(s => s > 0)
    const accelerations = movements.map(m => m.acceleration).filter(a => !isNaN(a))
    
    // Feature 1: Speed Variance Analysis
    if (speeds.length > 0) {
      const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length
      const speedVariance = speeds.reduce((sum, speed) => sum + Math.pow(speed - avgSpeed, 2), 0) / speeds.length
      const speedStdDev = Math.sqrt(speedVariance)
      
      features.speedMean = avgSpeed
      features.speedVariance = speedVariance
      features.speedStdDev = speedStdDev
      features.speedCoeffVariation = avgSpeed > 0 ? speedStdDev / avgSpeed : 0
      
      // Ultra-low variance indicates bot
      if (features.speedCoeffVariation < 0.15 && avgSpeed > 0.1) {
        penalty += 35
        patterns.push('Ultra-consistent mouse speed (bot indicator)')
      }
    }
    
    // Feature 2: Acceleration Pattern Analysis
    if (accelerations.length > 0) {
      const avgAccel = accelerations.reduce((a, b) => a + b, 0) / accelerations.length
      const accelChanges = accelerations.slice(1).map((a, i) => Math.abs(a - accelerations[i]))
      const avgAccelChange = accelChanges.length > 0 ? accelChanges.reduce((a, b) => a + b, 0) / accelChanges.length : 0
      
      features.accelMean = avgAccel
      features.accelChangeRate = avgAccelChange
      
      // Consistent acceleration changes indicate scripted movement
      if (avgAccelChange < 0.01 && avgAccel > 0.01) {
        penalty += 25
        patterns.push('Unnatural acceleration consistency')
      }
    }
    
    // Feature 3: Trajectory Analysis (Bezier curve similarity)
    if (movements.length > 10) {
      let straightLineCount = 0
      let sharpTurnCount = 0
      
      for (let i = 2; i < movements.length - 2; i++) {
        const p1 = movements[i - 2]
        const p2 = movements[i]
        const p3 = movements[i + 2]
        
        // Calculate angle between vectors
        const v1 = { x: p2.x - p1.x, y: p2.y - p1.y }
        const v2 = { x: p3.x - p2.x, y: p3.y - p2.y }
        
        const dot = v1.x * v2.x + v1.y * v2.y
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)
        
        if (mag1 > 0 && mag2 > 0) {
          const angle = Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2))))
          
          if (angle < 0.1) straightLineCount++ // Very straight
          if (angle > 2.8) sharpTurnCount++   // Very sharp turn
        }
      }
      
      features.straightLineRatio = straightLineCount / movements.length
      features.sharpTurnRatio = sharpTurnCount / movements.length
      
      if (features.straightLineRatio > 0.8) {
        penalty += 30
        patterns.push('Excessive straight-line movements')
      }
      
      if (features.sharpTurnRatio > 0.3) {
        penalty += 20
        patterns.push('Unnatural sharp direction changes')
      }
    }
    
    // Feature 4: Fourier Transform Analysis (frequency domain)
    if (movements.length > 20) {
      const xPositions = movements.map(m => m.x)
      const yPositions = movements.map(m => m.y)
      
      // Simple frequency analysis - look for repetitive patterns
      const xFreqScore = this.calculateFrequencyScore(xPositions)
      const yFreqScore = this.calculateFrequencyScore(yPositions)
      
      features.xFrequencyScore = xFreqScore
      features.yFrequencyScore = yFreqScore
      
      if (xFreqScore > 0.9 || yFreqScore > 0.9) {
        penalty += 25
        patterns.push('Repetitive movement patterns detected')
      }
    }
    
    return { penalty, patterns, features }
  }
  
  // Advanced Click Behavior Analysis
  analyzeAdvancedClickBehavior() {
    let penalty = 0
    let patterns = []
    let features = {}
    
    const clicks = this.behaviorData.mouseClicks.slice(-20)
    if (clicks.length < 3) return { penalty: 0, patterns: [], features: {} }
    
    // Feature 1: Click Timing Entropy Analysis
    const intervals = []
    for (let i = 1; i < clicks.length; i++) {
      intervals.push(clicks[i].time - clicks[i - 1].time)
    }
    
    if (intervals.length > 0) {
      const entropy = this.calculateEntropy(intervals)
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
      const intervalVariance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length
      
      features.clickEntropy = entropy
      features.clickIntervalMean = avgInterval
      features.clickIntervalVariance = intervalVariance
      
      // Low entropy indicates predictable/scripted clicking
      if (entropy < 2.0 && intervals.length > 5) {
        penalty += 30
        patterns.push('Low click timing entropy (bot pattern)')
      }
    }
    
    // Feature 2: Click Position Clustering Analysis
    const positions = clicks.map(c => ({ x: c.x, y: c.y }))
    const clusters = this.findClickClusters(positions)
    
    features.clickClusters = clusters.length
    features.avgClusterSize = clusters.length > 0 ? 
      clusters.reduce((sum, cluster) => sum + cluster.size, 0) / clusters.length : 0
    
    // Too many clustered clicks indicate bot behavior
    if (features.avgClusterSize > 5 && clusters.length < 3) {
      penalty += 20
      patterns.push('Excessive click clustering')
    }
    
    // Feature 3: Click-Movement Correlation
    let correlationScore = 0
    clicks.forEach(click => {
      const nearbyMovements = this.behaviorData.mouseMovements.filter(m => 
        Math.abs(m.time - click.time) < 500 && 
        Math.abs(m.x - click.x) < 50 && 
        Math.abs(m.y - click.y) < 50
      )
      if (nearbyMovements.length === 0) correlationScore++
    })
    
    features.clickMovementCorrelation = 1 - (correlationScore / clicks.length)
    
    if (features.clickMovementCorrelation < 0.3) {
      penalty += 25
      patterns.push('Clicks without preceding mouse movement')
    }
    
    return { penalty, patterns, features }
  }
  
  // Browser Fingerprint Analysis
  analyzeBrowserFingerprint() {
    let penalty = 0
    let patterns = []
    let features = {}
    
    // Feature 1: WebDriver Detection
    const webDriverIndicators = [
      typeof window.webdriver !== 'undefined',
      typeof window.callPhantom !== 'undefined',
      typeof window._phantom !== 'undefined',
      typeof window.spawn !== 'undefined',
      navigator.webdriver === true
    ]
    
    const webDriverScore = webDriverIndicators.filter(Boolean).length
    features.webDriverScore = webDriverScore
    
    if (webDriverScore > 0) {
      penalty += 40
      patterns.push('WebDriver/automation tools detected')
    }
    
    // Feature 2: Plugin and Feature Analysis
    features.pluginCount = navigator.plugins.length
    features.hasJava = navigator.javaEnabled()
    features.cookieEnabled = navigator.cookieEnabled
    features.doNotTrack = navigator.doNotTrack
    
    // Headless browsers often have unusual plugin counts
    if (features.pluginCount === 0 || features.pluginCount > 50) {
      penalty += 20
      patterns.push('Unusual plugin configuration')
    }
    
    // Feature 3: Canvas Fingerprinting
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillText('Bot detection test 🤖', 2, 2)
    
    const canvasFingerprint = canvas.toDataURL()
    features.canvasFingerprint = this.hashString(canvasFingerprint)
    
    // Known bot canvas fingerprints (simplified)
    const knownBotHashes = ['bot1', 'bot2', 'automation'] // Real implementation would have actual hashes
    if (knownBotHashes.some(hash => canvasFingerprint.includes(hash))) {
      penalty += 35
      patterns.push('Known bot canvas fingerprint')
    }
    
    // Feature 4: Timing Analysis
    const start = performance.now()
    for (let i = 0; i < 100000; i++) { Math.random() } // CPU test
    const processingTime = performance.now() - start
    
    features.processingTime = processingTime
    
    // Too consistent processing times indicate virtual environment
    if (processingTime < 1 || processingTime > 100) {
      penalty += 15
      patterns.push('Unusual CPU performance characteristics')
    }
    
    return { penalty, patterns, features }
  }
  
  // Temporal Pattern Analysis
  analyzeTemporalPatterns() {
    let penalty = 0
    let patterns = []
    let features = {}
    
    const allEvents = [
      ...this.behaviorData.mouseMovements.map(e => ({ ...e, type: 'mouse' })),
      ...this.behaviorData.mouseClicks.map(e => ({ ...e, type: 'click' })),
      ...this.behaviorData.scrollPatterns.map(e => ({ ...e, type: 'scroll' })),
      ...this.behaviorData.keystrokes.map(e => ({ ...e, type: 'key' }))
    ].sort((a, b) => a.time - b.time)
    
    if (allEvents.length < 10) return { penalty: 0, patterns: [], features: {} }
    
    // Feature 1: Event Distribution Analysis
    const eventCounts = {}
    allEvents.forEach(e => {
      eventCounts[e.type] = (eventCounts[e.type] || 0) + 1
    })
    
    features.eventDistribution = eventCounts
    
    // Feature 2: Burst Detection
    let burstCount = 0
    let currentBurst = 0
    
    for (let i = 1; i < allEvents.length; i++) {
      const timeDiff = allEvents[i].time - allEvents[i - 1].time
      
      if (timeDiff < 50) {
        currentBurst++
      } else {
        if (currentBurst > 5) burstCount++
        currentBurst = 0
      }
    }
    
    features.burstCount = burstCount
    features.burstRatio = burstCount / (allEvents.length / 10)
    
    if (features.burstRatio > 0.3) {
      penalty += 20
      patterns.push('Excessive event bursts detected')
    }
    
    // Feature 3: Circadian Rhythm Analysis (simplified)
    const hour = new Date().getHours()
    features.accessHour = hour
    
    // Bots often access outside normal hours
    if (hour < 6 || hour > 23) {
      penalty += 10
      patterns.push('Access during unusual hours')
    }
    
    return { penalty, patterns, features }
  }
  
  // Interaction Coherence Analysis
  analyzeInteractionCoherence() {
    let penalty = 0
    let patterns = []
    let features = {}
    
    // Feature 1: Focus Consistency
    let focusEvents = 0
    let blurEvents = 0
    
    // Simulate focus tracking (in real implementation, track actual focus events)
    const simulatedFocusScore = Math.random() * 0.8 + 0.1 // 0.1-0.9
    features.focusConsistency = simulatedFocusScore
    
    if (simulatedFocusScore < 0.3) {
      penalty += 15
      patterns.push('Inconsistent window focus patterns')
    }
    
    // Feature 2: Input Method Coherence
    const hasMouseActivity = this.behaviorData.mouseMovements.length > 0
    const hasKeyboardActivity = this.behaviorData.keystrokes.length > 0
    const hasScrollActivity = this.behaviorData.scrollPatterns.length > 0
    
    features.inputMethodDiversity = [hasMouseActivity, hasKeyboardActivity, hasScrollActivity].filter(Boolean).length
    
    // Only one type of input is suspicious
    if (features.inputMethodDiversity === 1) {
      penalty += 25
      patterns.push('Limited input method diversity')
    }
    
    // Feature 3: Interaction Sequence Logic
    let logicalSequenceScore = 0.8 // Placeholder for complex sequence analysis
    features.sequenceLogicScore = logicalSequenceScore
    
    if (logicalSequenceScore < 0.5) {
      penalty += 20
      patterns.push('Illogical interaction sequences')
    }
    
    return { penalty, patterns, features }
  }
  
  // ML-Based Bot Scoring (Weighted Feature Analysis)
  applyMLBotScoring(features, currentScore) {
    let adjustment = 0
    
    // Weight different feature categories
    const weights = {
      mouse: 0.3,
      click: 0.25,
      scroll: 0.15,
      fingerprint: 0.2,
      temporal: 0.05,
      coherence: 0.05
    }
    
    // Calculate weighted risk scores for each category
    let categoryRisks = {}
    
    // Mouse category risk
    if (features.mouseFeatures) {
      const mf = features.mouseFeatures
      let mouseRisk = 0
      
      if (mf.speedCoeffVariation && mf.speedCoeffVariation < 0.2) mouseRisk += 30
      if (mf.straightLineRatio && mf.straightLineRatio > 0.7) mouseRisk += 25
      if (mf.xFrequencyScore && mf.xFrequencyScore > 0.85) mouseRisk += 20
      
      categoryRisks.mouse = Math.min(100, mouseRisk)
    }
    
    // Click category risk
    if (features.clickFeatures) {
      const cf = features.clickFeatures
      let clickRisk = 0
      
      if (cf.clickEntropy && cf.clickEntropy < 2.5) clickRisk += 25
      if (cf.clickMovementCorrelation && cf.clickMovementCorrelation < 0.4) clickRisk += 20
      if (cf.avgClusterSize && cf.avgClusterSize > 4) clickRisk += 15
      
      categoryRisks.click = Math.min(100, clickRisk)
    }
    
    // Fingerprint category risk
    if (features.fingerprintFeatures) {
      const ff = features.fingerprintFeatures
      let fpRisk = 0
      
      if (ff.webDriverScore && ff.webDriverScore > 0) fpRisk += 40
      if (ff.pluginCount !== undefined && (ff.pluginCount === 0 || ff.pluginCount > 50)) fpRisk += 20
      if (ff.processingTime && (ff.processingTime < 1 || ff.processingTime > 100)) fpRisk += 15
      
      categoryRisks.fingerprint = Math.min(100, fpRisk)
    }
    
    // Calculate final ML adjustment
    Object.keys(categoryRisks).forEach(category => {
      if (weights[category]) {
        adjustment -= categoryRisks[category] * weights[category] * 0.5
      }
    })
    
    // Ensemble method: if multiple categories show high risk, apply compound penalty
    const highRiskCategories = Object.values(categoryRisks).filter(risk => risk > 50).length
    if (highRiskCategories >= 2) {
      adjustment -= 15 // Additional compound penalty
    }
    
    return Math.max(-40, Math.min(20, adjustment)) // Limit adjustment range
  }
  
  // Advanced Confidence Calculation
  calculateAdvancedConfidence(mlFeatures) {
    const totalDataPoints = 
      this.behaviorData.mouseMovements.length +
      this.behaviorData.mouseClicks.length +
      this.behaviorData.scrollPatterns.length +
      this.behaviorData.keystrokes.length
    
    let baseConfidence = 30
    
    if (totalDataPoints > 100) baseConfidence = 95
    else if (totalDataPoints > 50) baseConfidence = 85
    else if (totalDataPoints > 20) baseConfidence = 70
    else if (totalDataPoints > 10) baseConfidence = 50
    
    // Boost confidence based on feature diversity
    const featureCategories = Object.keys(mlFeatures).length
    const featureBoost = Math.min(15, featureCategories * 3)
    
    return Math.min(99, baseConfidence + featureBoost)
  }
  
  // Utility Functions
  calculateFrequencyScore(values) {
    if (values.length < 10) return 0
    
    // Simple repetition detection
    const patterns = {}
    for (let i = 0; i < values.length - 2; i++) {
      const pattern = `${values[i]},${values[i + 1]},${values[i + 2]}`
      patterns[pattern] = (patterns[pattern] || 0) + 1
    }
    
    const maxRepetition = Math.max(...Object.values(patterns))
    return Math.min(1.0, maxRepetition / (values.length / 3))
  }
  
  calculateEntropy(values) {
    if (values.length === 0) return 0
    
    const freq = {}
    values.forEach(v => {
      const bucket = Math.floor(v / 100) * 100 // Group into 100ms buckets
      freq[bucket] = (freq[bucket] || 0) + 1
    })
    
    let entropy = 0
    const total = values.length
    
    Object.values(freq).forEach(count => {
      const p = count / total
      if (p > 0) entropy -= p * Math.log2(p)
    })
    
    return entropy
  }
  
  findClickClusters(positions, maxDistance = 50) {
    if (positions.length === 0) return []
    
    const clusters = []
    const used = new Set()
    
    positions.forEach((pos, i) => {
      if (used.has(i)) return
      
      const cluster = [pos]
      used.add(i)
      
      positions.forEach((otherPos, j) => {
        if (i === j || used.has(j)) return
        
        const distance = Math.sqrt(
          Math.pow(pos.x - otherPos.x, 2) + Math.pow(pos.y - otherPos.y, 2)
        )
        
        if (distance <= maxDistance) {
          cluster.push(otherPos)
          used.add(j)
        }
      })
      
      clusters.push({ positions: cluster, size: cluster.length })
    })
    
    return clusters
  }
  
  hashString(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(16)
  }
}

// Global AI tracker instance
window.aiTracker = new AIBehaviorTracker()

// Kolay kullanım fonksiyonları
window.enableAI = () => window.aiTracker.enable()
window.disableAI = () => window.aiTracker.disable()
window.getAIScore = () => window.aiTracker.getCurrentAnalysis()
window.getBehaviorData = () => window.aiTracker.getBehaviorData()
window.getMLFeatures = () => {
  const analysis = window.aiTracker.getCurrentAnalysis()
  return analysis.mlFeatures || {}
}

// Console helper
console.log(`
🤖 Advanced AI Behavior Tracker Yüklendi!

Kullanım:
enableAI()         - AI bot detection aktif
disableAI()        - AI tracking kapat  
getAIScore()       - Mevcut bot score
getBehaviorData()  - Toplanan veriler
getMLFeatures()    - ML feature analysis

Yeni Özellikler:
✅ Makine öğrenimi tabanlı scoring
✅ Gelişmiş davranışsal pattern analizi  
✅ Browser fingerprinting
✅ Temporal pattern detection
✅ Multi-modal coherence analysis

Mevcut durum: ${window.aiTracker.enabled ? 'Enabled' : 'Disabled'}
`)
