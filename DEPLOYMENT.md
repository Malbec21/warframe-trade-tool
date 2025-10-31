# Deployment Guide

## 🌐 Hosting Options for Warframe Trade Helper

### Recommended Options (Ranked by Cost & Ease)

#### 1. **Free Tier Options** (Good for testing)

**Railway.app** (Recommended for beginners)
- **Cost**: Free tier: 500 hours/month, $5/month after
- **Pros**: 
  - Easy Docker deployment
  - Auto SSL certificates
  - PostgreSQL included
  - GitHub integration
- **Cons**: Limited free tier hours
- **Deploy**: Connect GitHub repo, Railway auto-detects Docker Compose

**Render.com**
- **Cost**: Free tier available, $7/month for web service
- **Pros**: 
  - Docker support
  - Auto SSL
  - PostgreSQL included
  - Easy to use
- **Cons**: Free tier spins down after inactivity
- **Deploy**: Connect repo, select Docker runtime

**Fly.io**
- **Cost**: Free allowance: 3 VMs, $3-5/month after
- **Pros**: 
  - Great Docker support
  - Global edge network
  - PostgreSQL included
- **Cons**: Requires CLI installation
- **Deploy**: `fly launch` from project directory

---

#### 2. **VPS Options** (Best value for money)

**DigitalOcean Droplet** (Recommended for production)
- **Cost**: $4-6/month (basic droplet)
- **Specs**: 1GB RAM, 25GB SSD, 1TB transfer
- **Pros**:
  - Full control
  - Predictable pricing
  - Great documentation
  - Easy Docker deployment
- **Setup**: See VPS deployment section below

**Linode (Akamai)**
- **Cost**: $5/month (Nanode 1GB)
- **Specs**: Similar to DigitalOcean
- **Pros**: Excellent support, good performance

**AWS Lightsail**
- **Cost**: $3.50/month (512MB RAM)
- **Pros**: AWS ecosystem, good reliability
- **Cons**: Limited free tier (3 months)

**Hetzner Cloud**
- **Cost**: €3.79/month (~$4/month)
- **Specs**: Better specs for price
- **Pros**: Best price/performance ratio
- **Cons**: EU-based (may have higher latency for US users)

---

#### 3. **Container Platforms**

**Google Cloud Run**
- **Cost**: Pay per request, generous free tier
- **Pros**: Scales to zero, only pay when used
- **Cons**: Need to adapt for serverless

---

### 💰 Cost Comparison (Monthly)

| Option | Cost | Best For |
|--------|------|----------|
| Railway Free | $0 | Testing |
| Render Free | $0 | Testing |
| Fly.io Free | $0 | Testing |
| Hetzner VPS | $4 | Best value |
| DigitalOcean | $6 | Production |
| Railway Paid | $5 | Easy deployment |
| Render Paid | $7 | Easy deployment |

---

## 🚀 Quick Deployment Instructions

### Option A: VPS Deployment (DigitalOcean/Linode/Hetzner)

#### 1. Create Droplet/Server
```bash
# Choose: Ubuntu 22.04 LTS, 1GB RAM minimum
```

#### 2. SSH into server
```bash
ssh root@YOUR_SERVER_IP
```

#### 3. Install Docker & Docker Compose
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

#### 4. Clone repository
```bash
git clone https://github.com/YOUR_USERNAME/warframe-trade-helper.git
cd warframe-trade-helper
```

#### 5. Configure environment
```bash
# Copy example env file
cp .env.example .env

# Edit configuration
nano .env
```

#### 6. Deploy
```bash
# Run deployment script
chmod +x deploy-vps.sh
./deploy-vps.sh
```

#### 7. Setup domain (optional)
```bash
# Install Nginx
apt install nginx -y

# Configure reverse proxy (see nginx.conf.example)
```

---

### Option B: Railway.app Deployment

1. **Push code to GitHub**
2. **Connect Railway to GitHub**: https://railway.app
3. **Create new project** → Import from GitHub
4. **Railway auto-detects** docker-compose.yml
5. **Set environment variables** in Railway dashboard
6. **Deploy** → Railway provides URL automatically

---

### Option C: Render.com Deployment

1. **Push code to GitHub**
2. **Create account** on https://render.com
3. **New → Web Service**
4. **Connect repository**
5. **Select Docker** runtime
6. **Configure environment variables**
7. **Deploy**

---

## 🔒 Security Considerations

### Production Checklist

- [ ] Change default passwords
- [ ] Enable firewall (UFW on Ubuntu)
- [ ] Setup SSL certificate (Let's Encrypt)
- [ ] Restrict database access
- [ ] Use environment variables for secrets
- [ ] Enable automatic security updates
- [ ] Setup monitoring/alerts
- [ ] Regular backups

### UFW Firewall Setup
```bash
ufw allow OpenSSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### SSL with Certbot
```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d yourdomain.com
```

---

## 📊 Resource Requirements

### Minimum
- **RAM**: 512MB (no database) / 1GB (with database)
- **CPU**: 1 vCPU
- **Storage**: 10GB
- **Bandwidth**: 500GB/month

### Recommended
- **RAM**: 1-2GB
- **CPU**: 2 vCPU
- **Storage**: 20GB SSD
- **Bandwidth**: 1TB/month

---

## 🔧 Maintenance

### Updating the Application
```bash
cd warframe-trade-helper
git pull
docker compose --profile no-db build
docker compose --profile no-db up -d
```

### Viewing Logs
```bash
docker compose --profile no-db logs -f
```

### Backup Database (if using with-db profile)
```bash
docker exec wth-db pg_dump -U postgres wth > backup.sql
```

---

## 📈 Monitoring

### Simple Health Check
```bash
curl http://localhost:8000/healthz
```

### Resource Usage
```bash
docker stats
```

### Setup Uptime Monitoring
- **UptimeRobot**: Free, monitors every 5 minutes
- **BetterUptime**: Free tier available
- **Healthchecks.io**: Open source option

---

## 💡 Pro Tips

1. **Start with VPS**: Most control, best learning experience
2. **Use Docker Compose profiles**: Switch between with-db and no-db easily
3. **Setup automated backups**: Cron job + S3/BackBlaze B2
4. **Monitor API rate limits**: Check logs regularly
5. **Cache static assets**: Use Nginx for frontend
6. **Enable compression**: Reduce bandwidth usage
7. **Setup log rotation**: Prevent disk space issues

---

## 🆘 Troubleshooting

### Container won't start
```bash
docker compose --profile no-db logs backend-no-db
```

### Port already in use
```bash
# Check what's using the port
lsof -i :8000
# Kill the process or change port in docker-compose.yml
```

### Out of memory
```bash
# Check memory usage
free -h
# Increase swap space or upgrade server
```

---

## 📞 Support

For deployment issues:
1. Check logs: `docker compose logs -f`
2. Verify environment variables: `docker compose config`
3. Test API directly: `curl http://localhost:8000/healthz`

