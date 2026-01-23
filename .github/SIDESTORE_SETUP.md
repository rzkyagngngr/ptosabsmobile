# 🚀 Setup SideStore Auto-Refresh dengan n8n

## 📋 Arsitektur

```
PC/Laptop Anda (Docker)
├── n8n (Orchestrator)
├── Anisette Server (Apple Auth)
└── AltServer (IPA Signing)
     └── Connect ke iPhone via WiFi
```

---

## 🛠️ Step 1: Install Docker Desktop

### Windows:
1. Download: https://www.docker.com/products/docker-desktop/
2. Install Docker Desktop
3. Restart PC
4. Verify: `docker --version`

---

## 🚀 Step 2: Deploy Stack

### Di folder `D:\Tasks\abv2\mobile\app\.github\`:

```powershell
# Start semua services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f n8n
```

**Services yang running:**
- n8n: http://localhost:5678
- Anisette: http://localhost:6969
- AltServer API: http://localhost:8080

---

## ⚙️ Step 3: Configure n8n

### A. Login n8n
1. Buka: http://localhost:5678
2. Login:
   - Username: `admin`
   - Password: `ChangeMeToSecurePassword` (ganti di docker-compose.yml)

### B. Import Workflow
1. Klik **"Workflows"** → **"Import from File"**
2. Upload: `n8n-workflow.json`
3. Workflow "SideStore Auto Refresh" akan muncul

### C. Setup Credentials

#### 1. Apple ID Credentials
- Klik **"Credentials"** → **"New"**
- Type: **Generic Credentials**
- Name: `Apple ID`
- Fields:
  ```
  appleId: rkyagung@gmail.com
  applePassword: YOUR_APPLE_PASSWORD
  ```

#### 2. Telegram Bot (Optional - untuk notifikasi)
- Buat bot: https://t.me/BotFather
- Command: `/newbot`
- Simpan token
- Add credentials di n8n:
  ```
  telegramToken: YOUR_BOT_TOKEN
  telegramChatId: YOUR_CHAT_ID
  ```

### D. Configure Workflow Nodes

1. Buka workflow "SideStore Auto Refresh"
2. Klik node **"Trigger AltServer Refresh"**
3. Update kredensial Apple ID
4. Test node (klik "Execute Node")

---

## 📱 Step 4: Setup iPhone

### A. Install SideStore (One-time dengan PC)

**Opsi 1: Via Sideloadly**
1. Download Sideloadly: https://sideloadly.io
2. Download SideStore IPA: https://sidestore.io
3. Connect iPhone USB
4. Drag SideStore.ipa ke Sideloadly
5. Login Apple ID
6. Install

**Opsi 2: Via AltStore (Mac required)**
1. Download AltStore: https://altstore.io
2. Install AltStore di Mac
3. Install SideStore

### B. Configure SideStore

1. Buka SideStore di iPhone
2. Settings → **Anisette Server**:
   ```
   http://YOUR_PC_IP:6969
   ```
   (Cek IP PC: `ipconfig` di PowerShell, cari IPv4)

3. Settings → **Apple ID**: Login dengan `rkyagung@gmail.com`

### C. Install IPA Pertama Kali

1. Di SideStore, tap **"+"**
2. Paste URL:
   ```
   https://github.com/rzkyagngngr/ptosabsmobile/releases/latest/download/PTOSBatch-unsigned.ipa
   ```
3. Tap **"Install"**
4. Wait 2-5 minutes
5. ✅ App installed!

---

## 🔄 Step 5: Setup Auto-Refresh

### A. Update GitHub Actions

Edit file `.github/workflows/sidestore-refresh.yml`:

```yaml
- name: Trigger n8n Workflow
  run: |
    curl -X POST http://YOUR_PC_IP:5678/webhook/sidestore-refresh
```

**Ganti `YOUR_PC_IP`** dengan IP PC Anda.

### B. Enable Dynamic DNS (Optional)

Jika IP PC berubah-ubah, setup DDNS:

**Opsi 1: No-IP** (Free)
1. Sign up: https://www.noip.com
2. Create hostname: `yourname.ddns.net`
3. Install DUC (Dynamic Update Client)
4. Update GitHub Actions dengan hostname

**Opsi 2: Tailscale** (Recommended)
1. Install Tailscale: https://tailscale.com
2. Login di PC dan iPhone
3. Use Tailscale IP (static): `100.x.x.x`

---

## 🧪 Step 6: Test Auto-Refresh

### Manual Test:

```powershell
# Trigger n8n workflow manually
curl -X POST http://localhost:5678/webhook/sidestore-refresh
```

Check di n8n UI:
- **Executions** → See workflow run
- Check setiap node sukses/fail

---

## 📅 Step 7: Schedule Auto-Refresh

### Opsi A: Via GitHub Actions (Recommended)

File sudah ada di `.github/workflows/sidestore-refresh.yml`:
- Runs setiap 6 hari otomatis
- Trigger n8n via webhook

### Opsi B: Via n8n Cron (Alternative)

1. Buka workflow n8n
2. Ganti "Webhook" node dengan "Cron" node:
   ```
   Expression: 0 2 */6 * *
   (Every 6 days at 2 AM)
   ```

---

## 🔍 Troubleshooting

### Problem 1: Docker containers tidak start

```powershell
# Check logs
docker-compose logs anisette
docker-compose logs altserver

# Restart
docker-compose restart
```

### Problem 2: iPhone tidak detect

**Check:**
- PC dan iPhone **same WiFi**
- Firewall allow port 8080
- AltServer running: `docker-compose ps`

**Fix:**
```powershell
# Allow firewall
New-NetFirewallRule -DisplayName "AltServer" -Direction Inbound -Port 8080 -Protocol TCP -Action Allow
```

### Problem 3: Refresh gagal di n8n

**Debug:**
1. Test Anisette: http://localhost:6969 (should return data)
2. Test AltServer: 
   ```powershell
   curl http://localhost:8080/status
   ```
3. Check Apple credentials di n8n

### Problem 4: App expire sebelum refresh

**Cause:** PC mati atau offline saat schedule

**Fix:**
- Ensure PC running 24/7, atau
- Use n8n.cloud (managed, always online)
- Use Tailscale for remote access

---

## 🌐 Alternative: n8n.cloud (No PC Needed)

Jika tidak mau PC always on:

1. Sign up: https://n8n.cloud (FREE tier)
2. Import workflow
3. Deploy Anisette + AltServer di cloud:
   - Railway.app (FREE $5 credit/mo)
   - Fly.io (FREE tier)
   - Google Cloud Run (FREE tier)

---

## 💡 Tips & Optimization

### Reduce PC Resource Usage:
```yaml
# docker-compose.yml - add resource limits
services:
  n8n:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

### Auto-start Docker on Boot:
```powershell
# Set Docker Desktop to start on login
# Settings → General → Enable "Start Docker Desktop when you log in"
```

### Monitor Workflow Executions:
- n8n Dashboard: http://localhost:5678/executions
- Setup Telegram notifications (sudah ada di workflow)

---

## 📊 Success Metrics

After setup, you should have:
- ✅ n8n workflow running
- ✅ Anisette server accessible
- ✅ AltServer API working
- ✅ iPhone connected & SideStore installed
- ✅ GitHub Actions trigger every 6 days
- ✅ Telegram notifications working

**Next refresh:** Check "Executions" in n8n after 6 days!

---

## 🆘 Need Help?

- n8n Docs: https://docs.n8n.io
- SideStore Discord: https://discord.gg/sidestore
- AltStore Reddit: r/AltStore

## 📝 Summary

**What you built:**
- Automated iOS app refresh system
- No Apple Developer account needed ($99/yr saved)
- No PC required to be active 24/7 (can use n8n.cloud)
- FREE lifetime solution

**Maintenance:**
- Zero maintenance if PC/cloud always on
- Check execution logs once per month

🎉 **Congratulations!** Your iOS app will auto-refresh every 6 days automatically!
