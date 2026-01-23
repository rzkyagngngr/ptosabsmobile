# React Native Web Docker Deployment

## Prerequisites

- Docker installed
- Node.js 18+ (for local development)

## Build Instructions

### 1. Install Dependencies (Local Development)

```bash
cd mobile/app
npm install
```

### 2. Test Web Build Locally

```bash
# Build web version
npm run build:web

# Serve locally to test
npm run serve:web
```

Open `http://localhost:5000` to verify the build.

### 3. Build Docker Image

```bash
# From mobile/app directory
docker build -t ptos-batch-web:latest .
```

### 4. Run Container

#### Using Docker Run:

```bash
docker run -d \
  --name ptos-batch-web \
  -p 8080:8080 \
  ptos-batch-web:latest
```

#### Using Docker Compose (Recommended):

```bash
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### 5. Access the Application

Open your browser: `http://localhost:8080`

## API Configuration

The web app needs to connect to your backend API. Update the API endpoint in:

**File:** `src/services/api.js`

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
```

### Using Environment Variables

Create `.env` file:

```bash
REACT_APP_API_URL=https://your-api-domain.com
```

Rebuild after changing environment variables:

```bash
npm run build:web
docker build -t ptos-batch-web:latest .
```

## Deployment Options

### Option 1: Dokploy

1. Push image to Docker Hub:
   ```bash
   docker tag ptos-batch-web:latest your-username/ptos-batch-web:latest
   docker push your-username/ptos-batch-web:latest
   ```

2. Deploy in Dokploy:
   - Create new service
   - Use Docker image: `your-username/ptos-batch-web:latest`
   - Map port 8080
   - Set environment variables

### Option 2: Docker Compose with Backend

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: absensi-backend
    ports:
      - "3000:3000"
    volumes:
      - ./uploads:/app/uploads
      - ./gambar:/app/gambar
      - ./database.json:/app/database.json
    networks:
      - app-network

  frontend:
    build:
      context: ./mobile/app
      dockerfile: Dockerfile
    container_name: ptos-batch-web
    ports:
      - "8080:8080"
    environment:
      - REACT_APP_API_URL=http://backend:3000
    depends_on:
      - backend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

Run both services:

```bash
docker-compose up -d
```

### Option 3: Reverse Proxy with Nginx

For production, use a reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Production Considerations

### 1. Environment Variables

Set production API URL:

```bash
docker run -d \
  -p 8080:8080 \
  -e REACT_APP_API_URL=https://api.your-domain.com \
  ptos-batch-web:latest
```

### 2. HTTPS/SSL

- Use Nginx or Traefik as reverse proxy
- Configure SSL certificates (Let's Encrypt recommended)
- Update CORS settings in backend

### 3. Build Optimization

The Docker image is optimized:
- Multi-stage build (build + nginx)
- Gzip compression enabled
- Static asset caching (1 year)
- Small Alpine-based images

### 4. Monitoring

Check container health:

```bash
docker inspect --format='{{.State.Health.Status}}' ptos-batch-web
```

View logs:

```bash
docker logs -f ptos-batch-web
```

### 5. Updates

To update the application:

```bash
# Rebuild
docker build -t ptos-batch-web:latest .

# Stop old container
docker stop ptos-batch-web
docker rm ptos-batch-web

# Start new container
docker run -d --name ptos-batch-web -p 8080:8080 ptos-batch-web:latest
```

Or with Docker Compose:

```bash
docker-compose build
docker-compose up -d
```

## Troubleshooting

### Build Fails

```bash
# Clean npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build:web
```

### Port Already in Use

```bash
# Use different port
docker run -d -p 9090:8080 ptos-batch-web:latest
```

### Can't Connect to Backend

1. Check API URL in browser console
2. Verify CORS settings in backend
3. Ensure backend is running and accessible
4. Check Docker network connectivity

### Container Exits Immediately

```bash
# Check logs
docker logs ptos-batch-web

# Run interactively
docker run -it ptos-batch-web:latest sh
```

## Performance Tips

1. **Enable CDN**: Serve static assets via CDN
2. **Image Optimization**: Compress images before build
3. **Code Splitting**: Expo handles this automatically
4. **Resource Limits**: Set memory/CPU limits in production

```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 256M
```

## Security Best Practices

1. ✅ Non-root user in Docker image
2. ✅ Security headers configured in nginx
3. ✅ Gzip compression enabled
4. ✅ Static asset caching
5. ⚠️ Configure HTTPS in production
6. ⚠️ Set proper CORS policies
7. ⚠️ Use secrets management for API keys

## Support

For issues related to:
- **Expo**: Check [Expo documentation](https://docs.expo.dev/)
- **React Native Web**: Check [RN Web docs](https://necolas.github.io/react-native-web/)
- **Docker**: Check container logs and health status
