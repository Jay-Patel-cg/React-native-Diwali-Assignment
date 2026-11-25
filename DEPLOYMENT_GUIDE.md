# Samundar Ke Sath (समुंदर के साथ) — Production Deployment Guide

> **Application:** Samundar Ke Sath  
> **Mobile Client:** React Native 0.86, Expo SDK 57, Expo Router, NativeWind (Tailwind CSS)  
> **Backend Server:** Node.js 20+, Express ES Modules, MongoDB Mongoose, Google Gemini 2.5 Flash SDK  
> **Deployment Targets:**  
> - **Backend:** Docker / Railway / Render / AWS ECS / Vercel Serverless  
> - **Database:** MongoDB Atlas (M10+ Dedicated Cluster)  
> - **Mobile Client:** Google Play Store (Android AAB) & Apple App Store (iOS IPA via Expo EAS)  

---

## 1. Prerequisites Checklist

Before proceeding to production deployment, ensure you possess:
1. **Domain Name & SSL:** e.g., `api.samundarkesath.com` with Let's Encrypt or Cloudflare SSL.
2. **MongoDB Atlas Account:** Dedicated cluster (M10+ recommended for connection pooling & replica set failover).
3. **Google Cloud Console Project:**
   - Gemini API Key enabled for `@google/genai`
   - OAuth 2.0 Client IDs for Android (`com.samundarkesath.app`), iOS, and Web.
4. **Expo Account & EAS CLI:** For compiling native Android `.aab` and iOS `.ipa` binary distributions.
5. **Google Play Console & Apple Developer Program Accounts:** For store distribution.

---

## 2. Backend Production Deployment

### 2.1 Production Environment Variables Checklist

Create a secure `.env` on your production host (or populate your cloud environment secrets manager):

| Variable | Description | Example Production Value |
|---|---|---|
| `PORT` | Listening HTTP port | `5000` |
| `NODE_ENV` | Environment mode | `production` |
| `MONGODB_URI` | MongoDB Atlas Replica Set Connection String | `mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/samundar_ke_sath?retryWrites=true&w=majority&maxPoolSize=50` |
| `CLIENT_URL` | Allowed CORS origins (comma-separated) | `https://samundarkesath.com,https://app.samundarkesath.com` |
| `JWT_SECRET` | 256-bit cryptographically random secret | `openssl rand -hex 64` output |
| `JWT_EXPIRES_IN` | Token validity duration | `7d` |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID for server token verification | `xxxxxx.apps.googleusercontent.com` |
| `GEMINI_API_KEY` | Google Gemini API key (Keep strictly private) | `AIzaSy...` |
| `GEMINI_MODEL` | Target Gemini model | `gemini-2.5-flash` |
| `AI_RATE_LIMIT_WINDOW_MS` | AI sliding rate limit window in ms | `900000` (15 mins) |
| `AI_RATE_LIMIT_MAX` | Max AI queries allowed per window per user | `20` |
| `AUTH_RATE_LIMIT_WINDOW_MS` | Auth brute-force rate limit window | `900000` (15 mins) |
| `AUTH_RATE_LIMIT_MAX` | Max login/register attempts per window per IP | `30` |

---

### 2.2 Containerized Deployment (Docker & Docker Compose)

#### `Dockerfile` (Backend Production Container)
```dockerfile
# Multi-stage lightweight Node.js 20 Alpine image
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies in isolated layer
COPY package*.json ./
RUN npm ci --only=production

# Copy application source
COPY src/ ./src/
COPY server.js ./

# Drop privileges to non-root node user
USER node
EXPOSE 5000

ENV NODE_ENV=production
CMD ["node", "server.js"]
```

#### `docker-compose.yml` (Production Stack with Reverse Proxy)
```yaml
version: '3.8'

services:
  api:
    build: .
    restart: always
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

---

### 2.3 Bare-Metal / Ubuntu VPS Deployment (PM2 & Nginx)

1. **Install Node.js 20 & PM2:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs nginx git
   sudo npm install -g pm2
   ```

2. **Clone & Install:**
   ```bash
   git clone <REPO_URL> /var/www/samundar-ke-sath-backend
   cd /var/www/samundar-ke-sath-backend
   npm ci --only=production
   ```

3. **Start Process Manager:**
   ```bash
   pm2 start server.js --name "samundar-api" -i max
   pm2 save
   pm2 startup
   ```

4. **Nginx Reverse Proxy Configuration (`/etc/nginx/sites-available/samundar`):**
   ```nginx
   server {
       server_name api.samundarkesath.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
           proxy_read_timeout 60s;
       }
   }
   ```
   Enable SSL via Certbot:
   ```bash
   sudo certbot --nginx -d api.samundarkesath.com
   ```

---

## 3. Mobile App Production Deployment (Expo EAS)

### 3.1 Install & Configure EAS CLI
```bash
npm install -g eas-cli
cd React-native-Diwali-Assignment/Frontend
eas login
eas project:init
```

### 3.2 `eas.json` Configuration
Create `eas.json` in `Frontend/`:
```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "simulator": false
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.samundarkesath.com/api",
        "EXPO_PUBLIC_APP_NAME": "Samundar Ke Sath"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

### 3.3 Android Production Build (Google Play Store)

1. **Build Android App Bundle (`.aab`):**
   ```bash
   eas build --platform android --profile production
   ```
   *EAS will automatically generate an Android upload keystore and store it securely in Expo Cloud.*

2. **Google Cloud Console OAuth 2.0 Credentials:**
   - Retrieve the SHA-1 fingerprint of the build credential via:
     ```bash
     eas credentials
     ```
   - In Google Cloud Console &rarr; Credentials &rarr; Create OAuth Client ID:
     - Type: **Android**
     - Package name: `com.samundarkesath.app`
     - SHA-1 certificate fingerprint: Paste the EAS generated SHA-1.

3. **Google Play Console Release:**
   - Download the generated `.aab` from your EAS dashboard.
   - Upload to **Production** or **Internal Testing** track in Google Play Console.
   - Submit for app review.

---

### 3.4 iOS Production Build (Apple App Store)

1. **Build iOS Archive (`.ipa`):**
   ```bash
   eas build --platform ios --profile production
   ```
   *EAS interacts with Apple Developer API to create App IDs, Distribution Certificates, and Provisioning Profiles.*

2. **Submit to TestFlight / App Store:**
   ```bash
   eas submit --platform ios
   ```
   - Log into App Store Connect.
   - Configure App Privacy, Screenshots, Description, and submit for review.

---

## 4. Post-Deployment Monitoring & Health Checks

### 4.1 Health Check Endpoint
A dedicated health endpoint is available at `GET /api/health`:
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-11-24T22:00:00.000Z",
    "uptime": "14h 22m 10s",
    "services": {
      "database": "connected",
      "geminiAi": "configured"
    }
  }
}
```
Configure your uptime monitoring service (e.g. UptimeRobot, BetterUptime, Datadog) to probe `https://api.samundarkesath.com/api/health` every 60 seconds.

### 4.2 Logging & Error Tracking
- **Sentry Integration:** Install `@sentry/react-native` on the frontend and `@sentry/node` on the backend to capture unhandled exceptions with device telemetry and breadcrumbs.
- **Log Rotation:** For PM2, enable `pm2-logrotate` to prevent disk saturation:
  ```bash
  pm2 install pm2-logrotate
  pm2 set pm2-logrotate:max_size 50M
  pm2 set pm2-logrotate:retain 10
  ```

---

## 5. Security & Maintenance Playbook

1. **Database Backups:** Ensure MongoDB Atlas continuous Cloud Backup is enabled with 7-day retention and point-in-time recovery (PITR).
2. **Gemini API Budget Quota Alert:** Set a budget limit in Google Cloud Console &rarr; Billing &rarr; Budgets & Alerts to prevent unexpected billing surges.
3. **Over-The-Air (OTA) Instant Updates:**
   Deploy urgent UI patches and bug fixes instantly to users without waiting for app store reviews using Expo EAS Update:
   ```bash
   eas update --branch production --message "Bugfix: resolve packing list edge case"
   ```
