# Docker Setup Guide

This guide explains how to build and run Open Playlist using Docker.

## Prerequisites

- Docker installed on your system ([Get Docker](https://docs.docker.com/get-docker/))
- Spotify Developer credentials (Client ID and Secret)

## Quick Start

### 1. Prepare Environment Variables

Create a `.env` file in the project root with your Spotify credentials:

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
PORT=5173
HOST_PIN=0000
AUTO_REFRESH=1
LOG_LEVEL=INFO
```

**Important:** If running Docker on a different host or port, update `SPOTIFY_REDIRECT_URI` accordingly and ensure it matches your Spotify Developer Dashboard settings.

### 2. Build the Docker Image

```bash
docker build -t open-playlist:latest .
```

This creates an image tagged as `open-playlist:latest`.

### 3. Run the Container

#### Basic Run (No Persistence)

```bash
docker run -d \
  --name open-playlist \
  -p 5173:5173 \
  --env-file .env \
  open-playlist:latest
```

#### Run with Data Persistence (Recommended)

To persist session and queue data across container restarts:

```bash
docker run -d \
  --name open-playlist \
  -p 5173:5173 \
  --env-file .env \
  -v spotify-data:/app/storage \
  -e SESSION_STORE=/app/storage/session_store.json \
  -e QUEUE_STORE=/app/storage/queue_store.json \
  open-playlist:latest
```

### 4. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

## Docker Commands Reference

### View Container Logs

```bash
# Follow logs in real-time
docker logs -f open-playlist

# View last 100 lines
docker logs --tail 100 open-playlist
```

### Stop the Container

```bash
docker stop open-playlist
```

### Start the Container

```bash
docker start open-playlist
```

### Remove the Container

```bash
docker rm -f open-playlist
```

### Rebuild After Code Changes

```bash
# Stop and remove old container
docker rm -f open-playlist

# Rebuild image
docker build -t open-playlist:latest .

# Run new container
docker run -d \
  --name open-playlist \
  -p 5173:5173 \
  --env-file .env \
  -v spotify-data:/app/data \
  open-playlist:latest
```

## Advanced Configuration

### Custom Port Mapping

To run on a different host port (e.g., 8080):

```bash
docker run -d \
  --name open-playlist \
  -p 8080:5173 \
  --env-file .env \
  open-playlist:latest
```

Update your `.env` file:
```env
SPOTIFY_REDIRECT_URI=http://localhost:8080/callback
```

### Environment Variables Override

Override specific environment variables at runtime:

```bash
docker run -d \
  --name open-playlist \
  -p 5173:5173 \
  --env-file .env \
  -e LOG_LEVEL=DEBUG \
  -e AUTO_REFRESH=0 \
  open-playlist:latest
```

### Inspect Container

```bash
# View container details
docker inspect open-playlist

# Execute commands inside container
docker exec -it open-playlist sh

# Check health status
docker inspect --format='{{.State.Health.Status}}' open-playlist
```

## Docker Compose (Alternative)

For easier management, create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  open-playlist:
    build: .
    container_name: open-playlist
    ports:
      - "5173:5173"
    env_file:
      - .env
    volumes:
      - spotify-data:/app/storage
    environment:
      - SESSION_STORE=/app/storage/session_store.json
      - QUEUE_STORE=/app/storage/queue_store.json
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:5173/status', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s

volumes:
  spotify-data:
```

### Using Docker Compose

```bash
# Start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs for errors
docker logs open-playlist

# Verify environment variables
docker exec open-playlist env | grep SPOTIFY
```

### Port Already in Use

```bash
# Find what's using port 5173
netstat -ano | findstr :5173  # Windows
lsof -i :5173                  # Linux/Mac

# Use a different port
docker run -d --name open-playlist -p 8080:5173 --env-file .env open-playlist:latest
```

### Permission Issues

```bash
# Ensure volume has correct permissions
docker volume inspect spotify-data

# Remove and recreate volume if needed
docker volume rm spotify-data
```

### Access from Network

To access from other devices on your network:

```bash
docker run -d \
  --name open-playlist \
  -p 0.0.0.0:5173:5173 \
  --env-file .env \
  open-playlist:latest
```

Update `.env`:
```env
SPOTIFY_REDIRECT_URI=http://YOUR_IP_ADDRESS:5173/callback
```

## Security Notes

- Never commit `.env` file to version control
- Keep `SPOTIFY_CLIENT_SECRET` secure
- Use strong `HOST_PIN` values in production
- Run container behind reverse proxy (nginx/traefik) for HTTPS in production
- Consider using Docker secrets for sensitive data in production

## Production Deployment

For production environments, consider:

1. **Use HTTPS**: Run behind a reverse proxy with SSL/TLS
2. **Persistent Storage**: Use named volumes or bind mounts
3. **Restart Policy**: Use `--restart unless-stopped` or Docker Compose
4. **Resource Limits**: Set CPU and memory limits
5. **Health Checks**: Monitor container health
6. **Logging**: Configure log rotation and external log aggregation

Example production run:

```bash
docker run -d \
  --name open-playlist \
  --restart unless-stopped \
  -p 127.0.0.1:5173:5173 \
  --env-file .env \
  -v spotify-data:/app/data \
  --memory="256m" \
  --cpus="0.5" \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  open-playlist:latest
```

## Backup and Restore

### Backup Data

```bash
# Backup volume to tar file
docker run --rm \
  -v spotify-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/spotify-backup-$(date +%Y%m%d).tar.gz -C /data .
```

### Restore Data

```bash
# Restore from backup
docker run --rm \
  -v spotify-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/spotify-backup-YYYYMMDD.tar.gz -C /data
```

## Support

For issues and questions:
- Check [README.md](README.md) for application documentation
- Review [APP_SUMMARY.md](APP_SUMMARY.md) for technical details
- Check container logs: `docker logs open-playlist`
