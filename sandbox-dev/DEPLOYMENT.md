# Traffic Management Platform - Deployment Guide

Complete deployment guide for production environments.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Logging](#monitoring--logging)
- [Backup & Recovery](#backup--recovery)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### System Requirements

- **OS**: Linux (Ubuntu 20.04+ recommended) or macOS
- **Node.js**: 20.x LTS
- **Memory**: 2GB minimum, 4GB recommended
- **Disk**: 10GB minimum
- **Docker**: 24.0+ (for containerized deployment)
- **Docker Compose**: 2.20+ (optional)

### Network Requirements

- Port 3001 (API server)
- Port 80/443 (if using Nginx)
- Port 6379 (if using Redis)
- Port 9090 (Prometheus - optional)
- Port 3000 (Grafana - optional)

---

## 🌍 Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/serkandogan34/trafikkontrol.git
cd trafikkontrol/sandbox-dev
```

### 2. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit configuration
nano .env
```

**Critical variables to set:**

```bash
# Security - MUST change these!
JWT_SECRET=your-super-secret-jwt-key-here
API_KEYS=your-api-key-1:ClientName:read|write

# Database
DATABASE_PATH=./database/sqlite/traffic_manager.db

# Redis (optional but recommended)
REDIS_ENABLED=true
REDIS_PASSWORD=your-redis-password

# Monitoring
METRICS_ENABLED=true
HEALTH_CHECK_ENABLED=true
```

### 3. Generate Strong Secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate API keys
openssl rand -hex 32
```

---

## 🐳 Docker Deployment (Recommended)

### Quick Start

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Check status
docker-compose ps
```

### Production Deployment

```bash
# Build production image
docker-compose -f docker-compose.yml build

# Start services
docker-compose -f docker-compose.yml up -d

# Scale application (multiple instances)
docker-compose up -d --scale app=3
```

### Service Management

```bash
# Stop services
docker-compose stop

# Restart services
docker-compose restart app

# Remove containers
docker-compose down

# Remove containers and volumes
docker-compose down -v
```

### Health Check

```bash
# Check application health
curl http://localhost:3001/api/v1/health

# Docker health check
docker inspect --format='{{.State.Health.Status}}' traffic-manager-app
```

---

## 🔨 Manual Deployment

### 1. Install Dependencies

```bash
cd sandbox-dev
npm install --production
```

### 2. Initialize Database

```bash
# Run migrations
node database/sqlite/migrations/migrate.js

# Seed initial data (optional)
node database/sqlite/seeds/seed.js
```

### 3. Start Application

```bash
# Development
npm run dev

# Production with PM2
npm install -g pm2
pm2 start integrated-server.js --name traffic-manager
pm2 save
pm2 startup
```

### 4. Process Management with PM2

```bash
# View logs
pm2 logs traffic-manager

# Monitor
pm2 monit

# Restart
pm2 restart traffic-manager

# Stop
pm2 stop traffic-manager

# View status
pm2 status
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

Automated pipeline is configured in `.github/workflows/ci-cd.yml`

**Pipeline stages:**

1. **Test** - Run unit and integration tests
2. **Build** - Build Docker image
3. **Security Scan** - Vulnerability scanning with Trivy
4. **Deploy Staging** - Auto-deploy to staging (on `genspark_ai_developer` branch)
5. **Deploy Production** - Manual approval required (on `main` branch)

### Setup GitHub Secrets

```bash
# Required secrets in GitHub repository settings:
GITHUB_TOKEN        # Automatically provided
PROD_SERVER_HOST    # Production server hostname
PROD_SERVER_USER    # SSH username
PROD_SSH_KEY        # SSH private key
DOCKER_USERNAME     # Docker registry username (optional)
DOCKER_PASSWORD     # Docker registry password (optional)
```

### Manual Deployment

```bash
# Build Docker image
docker build -t traffic-management-platform:latest .

# Push to registry
docker push your-registry/traffic-management-platform:latest

# Pull and deploy on server
ssh user@server "cd /app && docker pull your-registry/traffic-management-platform:latest && docker-compose up -d"
```

---

## 📊 Monitoring & Logging

### Application Logs

```bash
# Docker logs
docker-compose logs -f app

# PM2 logs
pm2 logs traffic-manager

# File logs (if enabled)
tail -f logs/application.log
tail -f logs/error.log
```

### Health Monitoring

```bash
# Health endpoint
curl http://localhost:3001/api/v1/health

# Response should be:
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "2.0.0",
    "database": "connected",
    "timestamp": "2025-10-19T08:00:00.000Z"
  }
}
```

### Metrics with Prometheus

```bash
# Start Prometheus (if using docker-compose)
docker-compose up -d prometheus

# Access Prometheus UI
open http://localhost:9090
```

### Visualization with Grafana

```bash
# Start Grafana (if using docker-compose)
docker-compose up -d grafana

# Access Grafana UI
open http://localhost:3000
# Default credentials: admin/admin
```

---

## 💾 Backup & Recovery

### Automated Backups

```bash
# Run backup script
node scripts/backup.js

# Compress backup
node scripts/backup.js --compress

# List backups
node scripts/backup.js list
```

### Restore from Backup

```bash
# Stop application
docker-compose stop app  # or pm2 stop traffic-manager

# Restore database
node scripts/backup.js restore backups/traffic_manager_2025-10-19_08-00-00.db

# Start application
docker-compose start app  # or pm2 start traffic-manager
```

### Scheduled Backups

```bash
# Add cron job (daily at 2 AM)
crontab -e

# Add this line:
0 2 * * * cd /app/sandbox-dev && node scripts/backup.js --compress
```

### Cloud Backup (AWS S3 Example)

```bash
# Install AWS CLI
pip install awscli

# Configure credentials
aws configure

# Upload backup
aws s3 cp backups/traffic_manager_backup.db.gz s3://your-bucket/backups/

# Download backup
aws s3 cp s3://your-bucket/backups/traffic_manager_backup.db.gz ./backups/
```

---

## 🔒 Security Considerations

### 1. Change Default Secrets

```bash
# Generate new JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Generate new API keys
API_KEY=$(openssl rand -hex 32)
```

### 2. Enable HTTPS

```bash
# Using Nginx with Let's Encrypt
sudo certbot --nginx -d your-domain.com

# Or configure SSL in docker-compose.yml
```

### 3. Firewall Configuration

```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Block direct access to application port
sudo ufw deny 3001/tcp
```

### 4. Database Security

```bash
# Set proper file permissions
chmod 600 database/sqlite/traffic_manager.db
chown app:app database/sqlite/traffic_manager.db
```

### 5. Rate Limiting

Rate limiting is enabled by default. Configure in `.env`:

```bash
RATE_LIMIT_WINDOW_MS=900000       # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100       # 100 requests per window
```

### 6. Security Headers

Security headers are automatically applied:
- Content Security Policy (CSP)
- HSTS
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options

---

## 🐛 Troubleshooting

### Application Won't Start

```bash
# Check logs
docker-compose logs app
# or
pm2 logs traffic-manager

# Check port availability
sudo lsof -i :3001

# Check database permissions
ls -la database/sqlite/
```

### Database Connection Errors

```bash
# Verify database file exists
ls -la database/sqlite/traffic_manager.db

# Check permissions
chmod 600 database/sqlite/traffic_manager.db

# Verify schema
sqlite3 database/sqlite/traffic_manager.db ".schema"
```

### High Memory Usage

```bash
# Check container stats
docker stats traffic-manager-app

# Restart application
docker-compose restart app
# or
pm2 restart traffic-manager

# Increase memory limit
docker-compose up -d --scale app=1 --limit-memory=2g
```

### Slow API Response

```bash
# Check database indexes
sqlite3 database/sqlite/traffic_manager.db ".indexes"

# Analyze slow queries
node database/sqlite/migrations/migrate.js --analyze

# Enable query logging
LOG_LEVEL=debug
```

### Container Won't Stop

```bash
# Force remove
docker-compose down --remove-orphans

# Force stop
docker stop -t 0 traffic-manager-app
```

---

## 📚 Additional Resources

- [API Documentation](./API.md)
- [Architecture Overview](./DEVELOPMENT_NOTES.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Middleware Documentation](./middleware/README.md)

---

## 🆘 Support

For issues and questions:

- GitHub Issues: https://github.com/serkandogan34/trafikkontrol/issues
- Documentation: https://github.com/serkandogan34/trafikkontrol/wiki

---

**Last Updated**: 2025-10-19  
**Version**: 2.0.0
