import React, { useState, useEffect } from 'react'

interface DashboardProps {
  // Props will be defined as we develop
}

interface DomainData {
  id: string
  name: string
  status: 'active' | 'warning' | 'error'
  totalRequests: number
  botRequests: number
  lastCheck: string
}

interface StatsData {
  totalDomains: number
  activeDomains: number
  totalRequests: number
  botRequests: number
}

const Dashboard: React.FC<DashboardProps> = () => {
  // State management
  const [domains, setDomains] = useState<DomainData[]>([])
  const [stats, setStats] = useState<StatsData>({
    totalDomains: 0,
    activeDomains: 0,
    totalRequests: 0,
    botRequests: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('domains')

  // Load data on component mount
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load domains
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
        const activeDomains = data.domains?.filter((d: DomainData) => d.status === 'active').length || 0
        const totalRequests = data.domains?.reduce((sum: number, d: DomainData) => sum + (d.totalRequests || 0), 0) || 0
        const botRequests = data.domains?.reduce((sum: number, d: DomainData) => sum + (d.botRequests || 0), 0) || 0
        
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

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold">
                <i className="fas fa-shield-alt mr-2 text-blue-400"></i>
                Traffic Management
              </h1>
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex space-x-4">
              {[
                { id: 'domains', icon: 'fas fa-globe', label: 'Domains' },
                { id: 'traffic', icon: 'fas fa-chart-line', label: 'Traffic' },
                { id: 'dns', icon: 'fas fa-network-wired', label: 'DNS' },
                { id: 'nginx', icon: 'fas fa-server', label: 'NGINX' },
                { id: 'deploy', icon: 'fas fa-rocket', label: 'Deploy' },
                { id: 'security', icon: 'fas fa-lock', label: 'Security' },
                { id: 'settings', icon: 'fas fa-cog', label: 'Settings' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeSection === item.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <i className={`${item.icon} mr-2`}></i>
                  {item.label}
                </button>
              ))}
            </div>
            
            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
                    localStorage.removeItem('authToken')
                    window.location.href = '/'
                  }
                }}
                className="text-gray-400 hover:text-white"
              >
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon="fas fa-globe"
            title="Total Domains"
            value={stats.totalDomains}
            color="blue"
          />
          <StatsCard
            icon="fas fa-check-circle"
            title="Active Domains"
            value={stats.activeDomains}
            color="green"
          />
          <StatsCard
            icon="fas fa-chart-bar"
            title="Total Requests"
            value={stats.totalRequests.toLocaleString()}
            color="purple"
          />
          <StatsCard
            icon="fas fa-robot"
            title="Bot Requests"
            value={stats.botRequests.toLocaleString()}
            color="red"
          />
        </div>

        {/* Domains Section */}
        {activeSection === 'domains' && (
          <DomainsSection domains={domains} onRefresh={loadDashboardData} />
        )}

        {/* Other Sections */}
        {activeSection === 'traffic' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Traffic Analytics</h2>
            <p className="text-gray-400">Traffic analytics component will be implemented here</p>
          </div>
        )}

        {activeSection === 'dns' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">DNS Management</h2>
            <p className="text-gray-400">DNS management component will be implemented here</p>
          </div>
        )}

        {/* Placeholder for other sections */}
        {!['domains', 'traffic', 'dns'].includes(activeSection) && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h2>
            <p className="text-gray-400">This section will be implemented in the next phase</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Stats Card Component
interface StatsCardProps {
  icon: string
  title: string
  value: string | number
  color: 'blue' | 'green' | 'purple' | 'red'
}

const StatsCard: React.FC<StatsCardProps> = ({ icon, title, value, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600'
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} p-6 rounded-lg text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-blue-100 text-sm opacity-90">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="bg-white bg-opacity-20 p-3 rounded-full">
          <i className={`${icon} text-2xl`}></i>
        </div>
      </div>
    </div>
  )
}

// Domains Section Component
interface DomainsSectionProps {
  domains: DomainData[]
  onRefresh: () => void
}

const DomainsSection: React.FC<DomainsSectionProps> = ({ domains, onRefresh }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          <i className="fas fa-globe mr-2 text-blue-400"></i>
          Domain Management
        </h2>
        <div className="flex space-x-3">
          <button
            onClick={onRefresh}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            <i className="fas fa-sync-alt mr-2"></i>Refresh
          </button>
          <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors">
            <i className="fas fa-plus mr-2"></i>Add Domain
          </button>
        </div>
      </div>

      {/* Domain List */}
      <div className="space-y-4">
        {domains.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-globe text-4xl text-gray-500 mb-4"></i>
            <h3 className="text-lg font-medium text-white mb-2">No Domains</h3>
            <p className="text-gray-400 mb-4">Get started by adding your first domain</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
              Add Your First Domain
            </button>
          </div>
        ) : (
          domains.map(domain => (
            <DomainCard key={domain.id} domain={domain} />
          ))
        )}
      </div>
    </div>
  )
}

// Domain Card Component
interface DomainCardProps {
  domain: DomainData
}

const DomainCard: React.FC<DomainCardProps> = ({ domain }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400'
      case 'warning': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active'
      case 'warning': return 'Warning'
      case 'error': return 'Error'
      default: return 'Unknown'
    }
  }

  return (
    <div className="bg-gray-700 p-4 rounded-lg">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <h3 className="font-semibold text-white">{domain.name}</h3>
            <div className="flex items-center space-x-4 mt-2 text-sm">
              <span className={`flex items-center ${getStatusColor(domain.status)}`}>
                <i className="fas fa-circle mr-1 text-xs"></i>
                {getStatusText(domain.status)}
              </span>
              <span className="text-gray-400">
                <i className="fas fa-chart-line mr-1"></i>
                {domain.totalRequests || 0} requests
              </span>
              <span className="text-gray-400">
                <i className="fas fa-robot mr-1"></i>
                {domain.botRequests || 0} bots
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm" title="Analytics">
            <i className="fas fa-chart-bar"></i>
          </button>
          <button className="bg-cyan-600 hover:bg-cyan-700 px-3 py-1 rounded text-sm" title="Bot Analytics">
            <i className="fas fa-robot"></i>
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm" title="IP Rules">
            <i className="fas fa-shield-alt"></i>
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm" title="Settings">
            <i className="fas fa-cog"></i>
          </button>
          <button className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm" title="Delete">
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard