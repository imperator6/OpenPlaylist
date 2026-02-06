# GitHub Actions Setup Guide

Complete guide for setting up automated Docker builds with GitHub Actions and GitHub Container Registry.

## Prerequisites

- ✅ GitHub account
- ✅ Git installed on your machine
- ✅ Project code ready to push

## Part 1: Initial GitHub Setup

### Step 1: Create GitHub Repository

1. **Go to GitHub:**
   - Visit: https://github.com/new

2. **Create repository:**
   ```
   Repository name: open-playlist
   Description: Spotify waiting-list playlist manager
   Private: ✅ (Recommended)

   DON'T initialize with README (we already have one)
   ```

3. **Click "Create repository"**

### Step 2: Push Your Code to GitHub

**First time setup:**

```bash
# Navigate to your project
cd c:\Users\Tino\dev\checkouts\open-playlist

# Initialize git (if not already)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit with reorganized structure"

# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/open-playlist.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Subsequent updates:**

```bash
# Use the deploy script
deploy.bat

# Or manually:
git add .
git commit -m "Your commit message"
git push
```

## Part 2: GitHub Actions Automatic Setup

### The Workflow File

The workflow file is already created at:
```
.github/workflows/docker-publish.yml
```

**It automatically:**
- ✅ Triggers on every push to `main`
- ✅ Builds Docker image
- ✅ Pushes to GitHub Container Registry
- ✅ Tags with multiple formats
- ✅ Supports multi-platform (amd64, arm64)

### How It Works

```
You push code → GitHub detects push → Workflow runs → Image built → Pushed to GHCR
    ↓                                                                       ↓
2 minutes                                                           Ready to pull!
```

## Part 3: First Build

### Trigger First Build

1. **Push the workflow file:**
   ```bash
   git add .github/
   git commit -m "Add GitHub Actions workflow"
   git push
   ```

2. **Watch the build:**
   - Go to: `https://github.com/YOUR_USERNAME/open-playlist/actions`
   - Click on the running workflow
   - Watch real-time logs

3. **Wait for completion (~2-3 minutes)**
   - ✅ Green checkmark = Success
   - ❌ Red X = Failed (click for logs)

### Verify Image Published

1. **Check your packages:**
   - Go to: `https://github.com/YOUR_USERNAME?tab=packages`
   - You should see `open-playlist`

2. **Click on the package:**
   - View all tags
   - See pull command
   - Check size and platforms

3. **Make it private (recommended):**
   - Click "Package settings"
   - Scroll to "Danger Zone"
   - "Change visibility" → Private

## Part 4: Configure Unraid

### Step 1: Update docker-compose.yml

On Unraid, edit the compose file:

```bash
ssh root@UNRAID-IP
cd /mnt/user/appdata/open-playlist
nano docker-compose.yml
```

**Change from:**
```yaml
services:
  open-playlist:
    build: .
```

**To:**
```yaml
services:
  open-playlist:
    image: ghcr.io/YOUR_USERNAME/open-playlist:latest
```

**Full file:**
```yaml
version: '3.8'

services:
  open-playlist:
    image: ghcr.io/YOUR_USERNAME/open-playlist:latest
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
    driver: local
```

Save: `Ctrl+X` → `Y` → `Enter`

### Step 2: Login to GHCR (Private Images Only)

If your image is private:

```bash
# On Unraid
docker login ghcr.io -u YOUR_GITHUB_USERNAME

# Enter your GitHub Personal Access Token when prompted
# (Create token at: https://github.com/settings/tokens)
# Required scopes: read:packages
```

### Step 3: Create Update Script

```bash
nano /mnt/user/appdata/open-playlist/update.sh
```

Paste:
```bash
#!/bin/bash
cd /mnt/user/appdata/open-playlist/

echo "==================================="
echo "Updating Open Playlist"
echo "==================================="
echo ""

echo "Pulling latest image from GHCR..."
docker-compose pull

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to pull image!"
    echo "Make sure you're logged in: docker login ghcr.io"
    exit 1
fi

echo ""
echo "Restarting container..."
docker-compose up -d

echo ""
echo "Recent logs:"
docker-compose logs --tail 20

echo ""
echo "==================================="
echo "Update complete!"
echo "==================================="
echo "Access at: http://$(hostname -I | awk '{print $1}'):5173"
```

Make executable:
```bash
chmod +x /mnt/user/appdata/open-playlist/update.sh
```

### Step 4: Pull and Run

```bash
# Pull the image
docker-compose pull

# Start container
docker-compose up -d

# Check logs
docker-compose logs -f
```

## Part 5: Development Workflow

### Daily Workflow

```
1. Make changes to code on Windows
2. Run: deploy.bat (or git push manually)
3. GitHub Actions builds image (2-3 min)
4. SSH to Unraid: ./update.sh
5. Done! ✅
```

### Update Process

**On Windows:**
```bash
# Edit your code
# ...

# Deploy
deploy.bat
```

**On Unraid (after build completes):**
```bash
ssh root@UNRAID-IP
/mnt/user/appdata/open-playlist/update.sh
```

## Part 6: Advanced Features

### Manual Workflow Trigger

Run a build without pushing code:

1. Go to: `https://github.com/YOUR_USERNAME/open-playlist/actions`
2. Click: "Build and Push Docker Image"
3. Click: "Run workflow"
4. Optional: Enter custom tag (e.g., `v1.0.0`)
5. Click: "Run workflow"

### Version Tags

Create a release version:

```bash
# On Windows
git tag v1.0.0
git push origin v1.0.0
```

This creates:
- `ghcr.io/YOUR_USERNAME/open-playlist:v1.0.0`
- `ghcr.io/YOUR_USERNAME/open-playlist:1.0.0`
- `ghcr.io/YOUR_USERNAME/open-playlist:1.0`
- `ghcr.io/YOUR_USERNAME/open-playlist:1`
- `ghcr.io/YOUR_USERNAME/open-playlist:latest`

### Pin to Specific Version

In `docker-compose.yml`:
```yaml
image: ghcr.io/YOUR_USERNAME/open-playlist:v1.0.0  # Pin to specific version
# OR
image: ghcr.io/YOUR_USERNAME/open-playlist:latest  # Always use latest
```

## Part 7: Monitoring & Maintenance

### Check Build Status

**On GitHub:**
- Green ✅ badge on commits = Build successful
- Red ❌ badge = Build failed
- Yellow 🟡 circle = Build in progress

**View Details:**
1. Go to Actions tab
2. Click on workflow run
3. View logs for each step

### View Published Images

1. Your packages: `https://github.com/YOUR_USERNAME?tab=packages`
2. Click on `open-playlist`
3. View:
   - All tags
   - Image size
   - Pull command
   - Published date

### Delete Old Images

1. Go to package page
2. Click on specific tag/version
3. Click "Delete version"
4. Confirm

Or use GitHub API:
```bash
# Delete specific version
gh api --method DELETE /user/packages/container/open-playlist/versions/VERSION_ID
```

## Part 8: Troubleshooting

### Build Fails

**Check logs:**
1. Go to Actions tab
2. Click failed workflow
3. Click on failed step
4. Read error message

**Common issues:**
- ❌ Dockerfile syntax error
- ❌ Missing files (.dockerignore excluding needed files)
- ❌ npm install fails (package.json issue)
- ❌ Insufficient permissions

### Can't Pull Image on Unraid

**For private images:**
```bash
# Login to GHCR
docker login ghcr.io

# Try pull again
docker-compose pull
```

**For "not found" errors:**
- Check package visibility (Public vs Private)
- Verify image name is correct (case-sensitive)
- Ensure workflow completed successfully

### Workflow Not Triggering

**Check:**
- ✅ Workflow file in `.github/workflows/`
- ✅ Pushed to `main` branch (not other branch)
- ✅ File named `docker-publish.yml` (not .yaml)
- ✅ Valid YAML syntax

**Force trigger:**
- Use manual workflow dispatch
- Or make a small change and push again

## Summary Checklist

Setup (one time):
- ✅ Create GitHub repository
- ✅ Push code including `.github/workflows/docker-publish.yml`
- ✅ Wait for first build to complete
- ✅ Verify image in GitHub Packages
- ✅ Update Unraid docker-compose.yml
- ✅ Login to GHCR on Unraid (if private)
- ✅ Create update script on Unraid
- ✅ Pull and run

Daily workflow:
- ✅ Make changes on Windows
- ✅ Run `deploy.bat` or `git push`
- ✅ Wait ~2-3 minutes for build
- ✅ Run `./update.sh` on Unraid
- ✅ Enjoy! 🎵

## Resources

- GitHub Actions docs: https://docs.github.com/en/actions
- GHCR docs: https://docs.github.com/en/packages
- Docker docs: https://docs.docker.com/
- Your Actions: `https://github.com/YOUR_USERNAME/open-playlist/actions`
- Your Packages: `https://github.com/YOUR_USERNAME?tab=packages`
