# Quick Start Guide

## 🚀 Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/warframe-trade-helper.git
cd warframe-trade-helper

# Start the application
./start.sh

# Open in browser
http://localhost:3000
```

---

## 🌐 Deploy to VPS (Recommended)

### Option 1: Hetzner Cloud (Cheapest - €3.79/month)

1. **Create account**: https://hetzner.cloud
2. **Create server**: 
   - Ubuntu 22.04
   - CX11 (2GB RAM, 40GB SSD)
   - Select location closest to you
3. **SSH into server**:
   ```bash
   ssh root@YOUR_SERVER_IP
   ```
4. **Deploy**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/warframe-trade-helper.git
   cd warframe-trade-helper
   chmod +x deploy-vps.sh
   ./deploy-vps.sh
   ```
5. **Access**: http://YOUR_SERVER_IP:3000

### Option 2: DigitalOcean (Most Popular - $6/month)

Same steps as Hetzner, but create droplet at: https://digitalocean.com

---

## 🎯 Deploy to Railway (Easiest - Free/$5)

1. **Push to GitHub**: 
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy on Railway**:
   - Go to https://railway.app
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects Docker Compose
   - Wait for deployment (~5 minutes)
   - Railway provides a URL

---

## 📋 Environment Variables

For production, update in Railway/VPS:

```env
PLATFORM=ps4                          # or pc, xbox, switch
STRATEGY=aggressive                   # or balanced, conservative
REFRESH_INTERVAL_SECONDS=90          # Update frequency
BACKEND_CORS_ORIGINS=["https://yourdomain.com"]
```

---

## 🔒 Setup HTTPS (VPS only)

After deploying on VPS:

1. **Point domain to server IP**
2. **Install Nginx**:
   ```bash
   apt install nginx certbot python3-certbot-nginx -y
   ```
3. **Copy Nginx config**:
   ```bash
   cp nginx.conf.example /etc/nginx/sites-available/warframe-trade-helper
   # Edit the file and replace "yourdomain.com" with your actual domain
   nano /etc/nginx/sites-available/warframe-trade-helper
   ```
4. **Enable site**:
   ```bash
   ln -s /etc/nginx/sites-available/warframe-trade-helper /etc/nginx/sites-enabled/
   nginx -t
   systemctl reload nginx
   ```
5. **Get SSL certificate**:
   ```bash
   certbot --nginx -d yourdomain.com
   ```

---

## 🛠️ Common Commands

```bash
# Local development
./start.sh                                    # Start app
docker compose --profile no-db logs -f        # View logs
docker compose --profile no-db down           # Stop app
docker compose --profile no-db restart        # Restart app

# VPS deployment
./deploy-vps.sh                              # Initial deployment
git pull && docker compose --profile no-db up -d --build  # Update app
docker compose --profile no-db logs -f       # View logs
```

---

## 📊 What You Get

- **10 Popular Prime Warframes** tracked for arbitrage opportunities
- **Real-time prices** from warframe.market API (90-second refresh)
- **Real seller usernames** for instant trading
- **Copy-to-clipboard** trade messages
- **Dark theme** matching Warframe aesthetic
- **Cross-platform** support (PC, PS4, Xbox, Switch)

---

## 💰 Hosting Cost Summary

| Provider | Cost/Month | Best For |
|----------|------------|----------|
| Railway Free | $0 | Testing |
| Hetzner VPS | $4 | Best value |
| DigitalOcean | $6 | Most popular |
| Railway Paid | $5 | Easiest setup |

---

## 📚 Full Documentation

- **DEPLOYMENT.md** - Detailed hosting guide
- **README.md** - Project overview
- **deploy-vps.sh** - Automated VPS deployment script
- **nginx.conf.example** - Production Nginx config

---

## 🆘 Troubleshooting

**Issue**: No opportunities showing
- **Solution**: Wait 90 seconds for first data fetch

**Issue**: Rate limit errors in logs
- **Solution**: App is optimized for 10 warframes, should not happen

**Issue**: Container won't start
- **Solution**: Check logs with `docker compose logs -f`

**Issue**: Port already in use
- **Solution**: Check what's using port with `lsof -i :8000` and kill it

---

## 🎉 You're All Set!

Access your application and start finding profitable trades! 🚀

