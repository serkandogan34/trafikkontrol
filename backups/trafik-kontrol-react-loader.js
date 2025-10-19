// React Loader - Feature Flag System
// Bu dosya mevcut sistem ile React arasında köprü görevi görür

class ReactFeatureManager {
  constructor() {
    this.features = {
      reactUI: false, // Varsayılan olarak kapalı
      modernDashboard: false,
      reactComponents: false
    }
    
    // LocalStorage'dan feature flag durumlarını yükle
    this.loadFeatureFlags()
    
    // Debug mode için window'a ekle
    window.ReactFeatures = this
  }
  
  loadFeatureFlags() {
    try {
      const saved = localStorage.getItem('reactFeatureFlags')
      if (saved) {
        const flags = JSON.parse(saved)
        this.features = { ...this.features, ...flags }
      }
    } catch (error) {
      console.warn('Feature flags yüklenemedi:', error)
    }
  }
  
  saveFeatureFlags() {
    try {
      localStorage.setItem('reactFeatureFlags', JSON.stringify(this.features))
    } catch (error) {
      console.warn('Feature flags kaydedilemedi:', error)
    }
  }
  
  enable(featureName) {
    if (this.features.hasOwnProperty(featureName)) {
      this.features[featureName] = true
      this.saveFeatureFlags()
      console.log(`✅ Feature enabled: ${featureName}`)
      return true
    }
    console.warn(`❌ Unknown feature: ${featureName}`)
    return false
  }
  
  disable(featureName) {
    if (this.features.hasOwnProperty(featureName)) {
      this.features[featureName] = false
      this.saveFeatureFlags()
      
      // React UI kapatılıyor - vanilla dashboard'ı geri getir
      if (featureName === 'reactUI') {
        const container = document.getElementById('react-dashboard-root')
        if (container) {
          container.innerHTML = ''
          container.style.display = 'none'
        }
        
        // Vanilla dashboard'ı geri göster
        const mainContainer = document.querySelector('.max-w-7xl.mx-auto')
        if (mainContainer) {
          mainContainer.style.display = 'block'
        }
        
        // Navigation'ı da geri göster
        const navigation = document.querySelector('nav.bg-gray-800')
        if (navigation) {
          navigation.style.display = 'block'
        }
      }
      
      console.log(`❌ Feature disabled: ${featureName}`)
      return true
    }
    return false
  }
  
  isEnabled(featureName) {
    return this.features[featureName] === true
  }
  
  toggle(featureName) {
    if (this.isEnabled(featureName)) {
      return this.disable(featureName)
    } else {
      return this.enable(featureName)
    }
  }
  
  // Tüm feature durumlarını göster
  status() {
    console.table(this.features)
    return this.features
  }
}

// Global instance
window.reactFeatures = new ReactFeatureManager()

// Kolay kullanım fonksiyonları
window.enableReact = () => window.reactFeatures.enable('reactUI')
window.disableReact = () => window.reactFeatures.disable('reactUI')
window.toggleReact = () => window.reactFeatures.toggle('reactUI')

// React yükleme fonksiyonu
async function loadReactIfEnabled() {
  if (window.reactFeatures.isEnabled('reactUI')) {
    console.log('🚀 React UI loading...')
    
    // React scripts dinamik olarak yükle
    if (!window.React) {
      try {
        // React development bundle'ı yükle
        await loadScript('https://unpkg.com/react@18/umd/react.development.js')
        await loadScript('https://unpkg.com/react-dom@18/umd/react-dom.development.js')
        
        // Babel standalone for JSX transformation
        await loadScript('https://unpkg.com/@babel/standalone/babel.min.js')
        
        console.log('✅ React libraries loaded')
        
        // React components'i yükle
        loadReactComponents()
        
      } catch (error) {
        console.error('❌ React yüklenemedi:', error)
        window.reactFeatures.disable('reactUI')
      }
    }
  } else {
    console.log('📋 Using vanilla JS dashboard')
  }
}

// Script yükleme helper
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

// React components loader
function loadReactComponents() {
  console.log('🔧 React components loading...')
  
  // Mevcut dashboard'ı React ile değiştirmek için
  if (document.getElementById('react-dashboard-root')) {
    initReactDashboard()
  }
}

// React Dashboard başlatma
async function initReactDashboard() {
  console.log('🎯 React Dashboard initializing...')
  
  const container = document.getElementById('react-dashboard-root')
  
  if (container && window.React && window.ReactDOM) {
    try {
      // Modern React Dashboard component'ini yükle
      console.log('📦 Loading React Dashboard component...')
      
      // Dinamik import ile React App yükle
      const response = await fetch('/static/ReactApp.js')
      if (!response.ok) {
        throw new Error('Failed to load React App')
      }
      
      const reactAppCode = await response.text()
      
      // React App'i dinamik olarak çalıştır
      eval(reactAppCode)
      
      console.log('✅ React Dashboard loaded successfully')
      
      // Mevcut vanilla dashboard'ı gizle
      const mainContainer = document.querySelector('.max-w-7xl.mx-auto')
      if (mainContainer) {
        mainContainer.style.display = 'none'
      }
      
      // Navigation'ı da gizle
      const navigation = document.querySelector('nav.bg-gray-800')
      if (navigation) {
        navigation.style.display = 'none'
      }
      
    } catch (error) {
      console.error('❌ Failed to load React Dashboard:', error)
      
      // Fallback: Basit React component
      const FallbackComponent = React.createElement('div', {
        style: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          margin: '10px 0',
          textAlign: 'center'
        }
      }, 
        React.createElement('h3', null, '🚀 React UI Active!'),
        React.createElement('p', null, 'Modern React Dashboard loading...'),
        React.createElement('button', {
          onClick: () => window.disableReact(),
          style: {
            background: '#ff4757',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '10px'
          }
        }, 'Switch to Vanilla JS')
      )
      
      ReactDOM.render(FallbackComponent, container)
    }
  }
}

// Sayfa yüklendiğinde feature check yap
document.addEventListener('DOMContentLoaded', loadReactIfEnabled)

// Console helpers için bilgi
console.log(`
🎯 React Feature Manager Yüklendi!

Kullanım:
enableReact()     - React UI'ı aktifleştir
disableReact()    - Vanilla JS'e dön  
toggleReact()     - React/Vanilla arası geçiş yap
reactFeatures.status() - Durum kontrolü

Mevcut durum: ${window.reactFeatures.isEnabled('reactUI') ? 'React UI' : 'Vanilla JS'}
`)