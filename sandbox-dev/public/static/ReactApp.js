// React Dashboard App - Compiled for Static Loading
// Bu dosya React Dashboard component'ini içeriyor

if (window.React && window.ReactDOM) {
  // Dashboard Component tanımı
  const Dashboard = () => {
    const [domains, setDomains] = React.useState([])
    const [stats, setStats] = React.useState({
      totalDomains: 0,
      activeDomains: 0,
      totalRequests: 0,
      botRequests: 0
    })
    const [loading, setLoading] = React.useState(true)
    const [activeSection, setActiveSection] = React.useState('domains')

    // Data loading effect
    React.useEffect(() => {
      loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
      try {
        setLoading(true)
        
        const token = localStorage.getItem('authToken')
        if (!token) return
        
        const response = await fetch('/api/domains', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        const data = await response.json()
        if (data.success) {
          setDomains(data.domains || [])
          
          // Calculate stats
          const totalDomains = data.domains?.length || 0
          const activeDomains = data.domains?.filter(d => d.status === 'active').length || 0
          const totalRequests = data.domains?.reduce((sum, d) => sum + (d.totalRequests || 0), 0) || 0
          const botRequests = data.domains?.reduce((sum, d) => sum + (d.botRequests || 0), 0) || 0
          
          setStats({
            totalDomains,
            activeDomains,
            totalRequests,
            botRequests
          })
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    const handleSectionChange = (section) => {
      setActiveSection(section)
    }

    // Loading state
    if (loading) {
      return React.createElement('div', {
        className: "flex items-center justify-center min-h-screen bg-gray-900"
      }, 
        React.createElement('div', { className: "text-center" },
          React.createElement('div', { 
            className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4" 
          }),
          React.createElement('p', { className: "text-gray-400" }, "Loading React Dashboard...")
        )
      )
    }

    // Main dashboard render
    return React.createElement('div', { className: "min-h-screen bg-gray-900 text-white" },
      // Top Navigation
      React.createElement('nav', { className: "bg-gray-800 border-b border-gray-700" },
        React.createElement('div', { className: "max-w-7xl mx-auto px-4" },
          React.createElement('div', { className: "flex items-center justify-between h-16" },
            // Logo
            React.createElement('div', { className: "flex items-center" },
              React.createElement('h1', { className: "text-xl font-bold" },
                React.createElement('i', { className: "fas fa-shield-alt mr-2 text-blue-400" }),
                "Traffic Management ",
                React.createElement('span', { 
                  className: "text-green-400 text-sm ml-2"
                }, "⚛️ React")
              )
            ),
            
            // Navigation Buttons  
            React.createElement('div', { className: "flex space-x-4" },
              ['domains', 'traffic', 'dns', 'nginx', 'deploy', 'security', 'settings'].map(item => {
                const icons = {
                  domains: 'fas fa-globe',
                  traffic: 'fas fa-chart-line', 
                  dns: 'fas fa-network-wired',
                  nginx: 'fas fa-server',
                  deploy: 'fas fa-rocket',
                  security: 'fas fa-lock',
                  settings: 'fas fa-cog'
                }
                
                return React.createElement('button', {
                  key: item,
                  onClick: () => handleSectionChange(item),
                  className: `px-4 py-2 rounded-lg transition-colors ${
                    activeSection === item
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`
                },
                  React.createElement('i', { className: `${icons[item]} mr-2` }),
                  item.charAt(0).toUpperCase() + item.slice(1)
                )
              })
            ),
            
            // User Menu
            React.createElement('div', { className: "flex items-center space-x-4" },
              React.createElement('button', {
                onClick: () => {
                  if (confirm('Switch back to Vanilla JS dashboard?')) {
                    window.disableReact()
                  }
                },
                className: "text-gray-400 hover:text-white text-sm"
              }, "⬅️ Vanilla JS"),
              React.createElement('button', {
                onClick: () => {
                  if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
                    localStorage.removeItem('authToken')
                    window.location.href = '/'
                  }
                },
                className: "text-gray-400 hover:text-white"
              },
                React.createElement('i', { className: "fas fa-sign-out-alt" })
              )
            )
          )
        )
      ),

      // Main Content
      React.createElement('div', { className: "max-w-7xl mx-auto px-4 py-8" },
        // Stats Overview
        React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" },
          // Stats Cards
          React.createElement(StatsCard, {
            icon: "fas fa-globe",
            title: "Total Domains", 
            value: stats.totalDomains,
            color: "blue"
          }),
          React.createElement(StatsCard, {
            icon: "fas fa-check-circle",
            title: "Active Domains",
            value: stats.activeDomains, 
            color: "green"
          }),
          React.createElement(StatsCard, {
            icon: "fas fa-chart-bar",
            title: "Total Requests",
            value: stats.totalRequests.toLocaleString(),
            color: "purple"
          }),
          React.createElement(StatsCard, {
            icon: "fas fa-robot", 
            title: "Bot Requests",
            value: stats.botRequests.toLocaleString(),
            color: "red"
          })
        ),

        // Sections
        activeSection === 'domains' && React.createElement(DomainsSection, { 
          domains: domains, 
          onRefresh: loadDashboardData 
        }),

        // Other sections placeholder
        activeSection !== 'domains' && React.createElement('div', { className: "bg-gray-800 rounded-lg p-6" },
          React.createElement('h2', { className: "text-xl font-bold mb-4" },
            activeSection.charAt(0).toUpperCase() + activeSection.slice(1)
          ),
          React.createElement('p', { className: "text-gray-400" },
            `${activeSection} component will be implemented in the next phase`
          )
        )
      )
    )
  }

  // Stats Card Component
  const StatsCard = ({ icon, title, value, color }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600', 
      purple: 'from-purple-500 to-purple-600',
      red: 'from-red-500 to-red-600'
    }

    return React.createElement('div', { 
      className: `bg-gradient-to-br ${colorClasses[color]} p-6 rounded-lg text-white` 
    },
      React.createElement('div', { className: "flex items-center justify-between" },
        React.createElement('div', null,
          React.createElement('p', { className: "text-blue-100 text-sm opacity-90" }, title),
          React.createElement('p', { className: "text-3xl font-bold" }, value)
        ),
        React.createElement('div', { className: "bg-white bg-opacity-20 p-3 rounded-full" },
          React.createElement('i', { className: `${icon} text-2xl` })
        )
      )
    )
  }

  // Domains Section Component
  const DomainsSection = ({ domains, onRefresh }) => {
    return React.createElement('div', { className: "bg-gray-800 rounded-lg p-6" },
      React.createElement('div', { className: "flex items-center justify-between mb-6" },
        React.createElement('h2', { className: "text-2xl font-bold" },
          React.createElement('i', { className: "fas fa-globe mr-2 text-blue-400" }),
          "Domain Management"
        ),
        React.createElement('div', { className: "flex space-x-3" },
          React.createElement('button', {
            onClick: onRefresh,
            className: "bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          },
            React.createElement('i', { className: "fas fa-sync-alt mr-2" }),
            "Refresh"
          ),
          React.createElement('button', { 
            className: "bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors" 
          },
            React.createElement('i', { className: "fas fa-plus mr-2" }),
            "Add Domain"
          )
        )
      ),

      // Domain List
      React.createElement('div', { className: "space-y-4" },
        domains.length === 0 ? 
          React.createElement('div', { className: "text-center py-12" },
            React.createElement('i', { className: "fas fa-globe text-4xl text-gray-500 mb-4" }),
            React.createElement('h3', { className: "text-lg font-medium text-white mb-2" }, "No Domains"),
            React.createElement('p', { className: "text-gray-400 mb-4" }, "Get started by adding your first domain"),
            React.createElement('button', { 
              className: "bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium" 
            }, "Add Your First Domain")
          ) :
          domains.map(domain => React.createElement(DomainCard, { key: domain.id, domain: domain }))
      )
    )
  }

  // Domain Card Component
  const DomainCard = ({ domain }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'active': return 'text-green-400'
        case 'warning': return 'text-yellow-400'
        case 'error': return 'text-red-400'
        default: return 'text-gray-400'
      }
    }

    const getStatusText = (status) => {
      switch (status) {
        case 'active': return 'Active'
        case 'warning': return 'Warning'
        case 'error': return 'Error'
        default: return 'Unknown'
      }
    }

    return React.createElement('div', { className: "bg-gray-700 p-4 rounded-lg" },
      React.createElement('div', { className: "flex justify-between items-center" },
        React.createElement('div', { className: "flex items-center space-x-4" },
          React.createElement('div', { className: "flex-1" },
            React.createElement('h3', { className: "font-semibold text-white" }, domain.name),
            React.createElement('div', { className: "flex items-center space-x-4 mt-2 text-sm" },
              React.createElement('span', { className: `flex items-center ${getStatusColor(domain.status)}` },
                React.createElement('i', { className: "fas fa-circle mr-1 text-xs" }),
                getStatusText(domain.status)
              ),
              React.createElement('span', { className: "text-gray-400" },
                React.createElement('i', { className: "fas fa-chart-line mr-1" }),
                `${domain.totalRequests || 0} requests`
              ),
              React.createElement('span', { className: "text-gray-400" },
                React.createElement('i', { className: "fas fa-robot mr-1" }),
                `${domain.botRequests || 0} bots`
              )
            )
          )
        ),
        
        React.createElement('div', { className: "flex space-x-2" },
          [
            { icon: 'fas fa-chart-bar', color: 'bg-green-600 hover:bg-green-700', title: 'Analytics' },
            { icon: 'fas fa-robot', color: 'bg-cyan-600 hover:bg-cyan-700', title: 'Bot Analytics' },
            { icon: 'fas fa-shield-alt', color: 'bg-purple-600 hover:bg-purple-700', title: 'IP Rules' },
            { icon: 'fas fa-cog', color: 'bg-blue-600 hover:bg-blue-700', title: 'Settings' },
            { icon: 'fas fa-trash', color: 'bg-red-600 hover:bg-red-700', title: 'Delete' }
          ].map((btn, idx) => 
            React.createElement('button', {
              key: idx,
              className: `${btn.color} px-3 py-1 rounded text-sm`,
              title: btn.title
            },
              React.createElement('i', { className: btn.icon })
            )
          )
        )
      )
    )
  }

  // Render React App
  const container = document.getElementById('react-dashboard-root')
  if (container) {
    ReactDOM.render(React.createElement(Dashboard), container)
    console.log('✅ React Dashboard Component rendered')
  }
} else {
  console.error('❌ React or ReactDOM not available')
}