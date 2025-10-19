const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;

// Mock API responses
const mockAPI = {
  '/api/login': { success: true, token: 'demo-token-123' },
  '/api/domains': { 
    success: true, 
    domains: [
      { id: '1', name: 'example.com', status: 'active', totalVisits: 1250, totalRequests: 5430 },
      { id: '2', name: 'test.com', status: 'warning', totalVisits: 890, totalRequests: 3200 }
    ],
    total: 2
  },
  '/api/node-health': {
    success: true,
    status: 'healthy',
    service: 'Traffic Management Platform Test',
    version: '3.0',
    timestamp: new Date().toISOString(),
    uptime: 3600,
    environment: 'test'
  }
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // API endpoints
  if (req.url.startsWith('/api/')) {
    const apiPath = req.url.split('?')[0];
    
    if (mockAPI[apiPath]) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockAPI[apiPath]));
      return;
    }
    
    // Generic API response
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: true, 
      message: 'Mock API response',
      endpoint: apiPath 
    }));
    return;
  }
  
  // Serve dashboard
  if (req.url === '/' || req.url === '/dashboard') {
    fs.readFile('./dashboard.html', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading dashboard');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }
  
  // Serve static files
  const filePath = '.' + req.url;
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    const contentType = {
      '.js': 'application/javascript',
      '.html': 'text/html',
      '.css': 'text/css'
    }[ext] || 'text/plain';
    
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
    return;
  }
  
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Dashboard Test Server Running!`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`📍 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`\n📊 Available API Endpoints:`);
  Object.keys(mockAPI).forEach(endpoint => {
    console.log(`   - ${endpoint}`);
  });
  console.log(`\n✅ Ready to test!\n`);
});
