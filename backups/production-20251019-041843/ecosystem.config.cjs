module.exports = {
  apps: [
    {
      name: 'hurriyet-server',
      script: './server.cjs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: 8080
      },
      error_file: '/root/.pm2/logs/hurriyet-server-error.log',
      out_file: '/root/.pm2/logs/hurriyet-server-out.log',
      log_file: '/root/.pm2/logs/hurriyet-server-combined.log',
      time: true
    },
    {
      name: 'log-monitor',
      script: './log-parser.cjs',
      args: 'monitor',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '100M',
      error_file: '/root/.pm2/logs/log-monitor-error.log',
      out_file: '/root/.pm2/logs/log-monitor-out.log',
      log_file: '/root/.pm2/logs/log-monitor-combined.log',
      time: true
    }
  ]
};
