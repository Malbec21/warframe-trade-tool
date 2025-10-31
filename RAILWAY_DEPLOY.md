# 🚂 Railway.app Deployment Guide

## Step-by-Step Deployment to Railway.app

### Prerequisites
- GitHub account
- Railway.app account (sign up at https://railway.app)

---

## 📋 Step 1: Push to GitHub

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Warframe Trade Helper v1.0"

# Create main branch
git branch -M main

# Add your GitHub repository (create one first on github.com)
git remote add origin https://github.com/YOUR_USERNAME/warframe-trade-helper.git

# Push to GitHub
git push -u origin main
```

---

## 🚂 Step 2: Deploy on Railway

### 2.1 Create Railway Project

1. Go to https://railway.app
2. Click **"Login"** and sign in with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Authorize Railway to access your repositories
6. Select your **warframe-trade-helper** repository

### 2.2 Railway Auto-Detection

Railway will automatically detect your `docker-compose.yml` and create services for:
- ✅ Backend (FastAPI)
- ✅ Frontend (React/Nginx)

---

## ⚙️ Step 3: Configure Services

### 3.1 Configure Backend Service

1. Click on the **backend** service
2. Go to **Variables** tab
3. Add these environment variables:

```env
WM_BASE_URL=https://api.warframe.market/v1
PLATFORM=ps4
STRATEGY=aggressive
REFRESH_INTERVAL_SECONDS=90
USE_DB=false
PLATFORM_FEE_PCT=0
BACKEND_CORS_ORIGINS=["${{RAILWAY_PUBLIC_DOMAIN}}"]
```

4. Go to **Settings** tab
5. Click **Generate Domain** under "Networking"
6. Copy the generated domain (e.g., `backend-production-xxxx.up.railway.app`)

### 3.2 Configure Frontend Service

1. Click on the **frontend** service
2. Go to **Variables** tab
3. Add these build-time variables:

```env
VITE_API_URL=https://YOUR_BACKEND_DOMAIN
VITE_WS_URL=wss://YOUR_BACKEND_DOMAIN
```

Replace `YOUR_BACKEND_DOMAIN` with the backend domain you copied above.

4. Go to **Settings** tab
5. Click **Generate Domain** under "Networking"
6. This is your app's public URL! 🎉

---

## 🔧 Step 4: Fix CORS (Important!)

After getting your frontend domain:

1. Go back to **backend** service
2. Update the `BACKEND_CORS_ORIGINS` variable:

```env
BACKEND_CORS_ORIGINS=["https://YOUR_FRONTEND_DOMAIN.railway.app"]
```

3. Backend will automatically redeploy

---

## 🎉 Step 5: Access Your App

Your app is now live at:
```
https://YOUR_FRONTEND_DOMAIN.railway.app
```

---

## 💰 Pricing

### Free Tier
- **500 hours/month** of usage
- Enough for 24/7 operation for ~20 days
- Perfect for testing and personal use

### Paid Plans
- **$5/month** for the first service
- **$5/month** for each additional service
- Total: **$10/month** for both services (backend + frontend)

### Tips to Stay in Free Tier
- Remove the frontend service (access backend API only)
- Use Railway only for backend, host frontend elsewhere (Vercel/Netlify)
- Pause services when not in use

---

## 🔍 Monitoring & Logs

### View Logs
1. Click on a service
2. Go to **Deployments** tab
3. Click on the latest deployment
4. View real-time logs

### Check Status
- Green dot = Running ✅
- Red dot = Error ❌
- Yellow dot = Building 🔨

---

## 🔄 Updating Your App

### Method 1: Git Push (Automatic)
```bash
# Make changes to your code
git add .
git commit -m "Update: description of changes"
git push

# Railway automatically detects and redeploys! 🚀
```

### Method 2: Manual Redeploy
1. Go to Railway dashboard
2. Click on service
3. Click **"Redeploy"**

---

## 🛠️ Troubleshooting

### Issue: Backend won't start
**Solution**: Check environment variables are set correctly
```bash
# View logs in Railway dashboard
# Look for missing environment variable errors
```

### Issue: Frontend can't connect to backend
**Solution**: Update CORS settings
1. Make sure `BACKEND_CORS_ORIGINS` includes your frontend domain
2. Check `VITE_API_URL` points to correct backend domain

### Issue: "No opportunities available"
**Solution**: 
- Wait 90 seconds for first data fetch
- Check backend logs for rate limit errors
- Verify `PLATFORM` is set to `ps4` or `pc`

### Issue: Hitting 500 hour limit
**Solutions**:
1. Upgrade to paid plan ($5/month per service)
2. Host frontend on Vercel (free) and only use Railway for backend
3. Use VPS instead (Hetzner - $4/month for both services)

---

## 🎯 Alternative: Railway + Vercel (Cheaper)

To stay in free tier:

### Backend on Railway (Free)
- Deploy only the backend service
- Use Railway free tier

### Frontend on Vercel (Free)
1. Push to GitHub
2. Go to https://vercel.com
3. Import repository
4. Set environment variables:
   ```env
   VITE_API_URL=https://YOUR_RAILWAY_BACKEND_DOMAIN
   VITE_WS_URL=wss://YOUR_RAILWAY_BACKEND_DOMAIN
   ```
5. Deploy

**Result**: Completely free! 🎉

---

## 📊 Performance Tips

### Enable Caching
Railway automatically caches Docker layers for faster builds.

### Reduce Build Time
- Railway builds typically take 2-3 minutes
- Subsequent builds are faster due to layer caching

### Monitor Resources
- Check CPU/Memory usage in Railway dashboard
- Basic plan (512MB RAM) is sufficient for this app

---

## 🔐 Security Best Practices

1. **Never commit secrets** to Git
   - Use Railway environment variables
   - Keep `.env` in `.gitignore`

2. **Use HTTPS only**
   - Railway provides SSL certificates automatically
   - Always use `https://` URLs

3. **Update CORS origins**
   - Only allow your frontend domain
   - Don't use `["*"]` in production

4. **Regular updates**
   - Keep dependencies updated
   - Monitor Railway service status

---

## 📞 Support

### Railway Support
- **Docs**: https://docs.railway.app
- **Discord**: https://discord.gg/railway
- **Status**: https://railway.app/status

### App Issues
- Check logs in Railway dashboard
- View GitHub Issues
- Review DEPLOYMENT.md for troubleshooting

---

## 🎊 Success Checklist

- [ ] Code pushed to GitHub
- [ ] Railway project created
- [ ] Backend service deployed
- [ ] Frontend service deployed
- [ ] Environment variables configured
- [ ] CORS properly set up
- [ ] Both services have domains
- [ ] App accessible via frontend URL
- [ ] Real-time data loading (wait 90 seconds)
- [ ] Copy trade message works

---

## 🚀 You're Live!

Your Warframe Trade Helper is now running on Railway! 

Share your URL:
```
https://YOUR-APP.up.railway.app
```

Happy trading, Tenno! 🎮✨

