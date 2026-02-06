# GitHub Actions Workflows

This directory contains automated workflows for the Open Playlist project.

## docker-publish.yml

Automatically builds and pushes Docker images to GitHub Container Registry (GHCR).

### Triggers

**Automatic triggers:**
- Push to `main` or `master` branch (excludes documentation changes)
- Pull requests to `main` or `master` (builds but doesn't push)

**Manual trigger:**
- Go to Actions tab → "Build and Push Docker Image" → Run workflow
- Optional: Specify custom tag (e.g., `v1.0.0`)

### What It Does

1. **Builds** Docker image for multiple platforms (amd64, arm64)
2. **Tags** with multiple formats:
   - `latest` (for main branch)
   - `main` (branch name)
   - `sha-<commit>` (commit hash)
   - Custom tag (if manually triggered)
3. **Pushes** to `ghcr.io/YOUR_USERNAME/open-playlist`
4. **Caches** layers for faster builds

### Image Tags

After push to main, you can pull:
```bash
# Latest version
docker pull ghcr.io/YOUR_USERNAME/open-playlist:latest

# Specific branch
docker pull ghcr.io/YOUR_USERNAME/open-playlist:main

# Specific commit
docker pull ghcr.io/YOUR_USERNAME/open-playlist:main-abc1234
```

### Multi-Platform Support

The workflow builds for:
- `linux/amd64` (x86_64 - Most PCs, servers)
- `linux/arm64` (ARM64 - Raspberry Pi 4/5, Apple Silicon, some NAS devices)

This means the image works on various hardware automatically!

### Permissions

The workflow uses GitHub's built-in `GITHUB_TOKEN` which has automatic permissions to:
- Read repository code
- Write to GitHub Packages (GHCR)

No manual token setup required! 🎉

### Usage on Unraid

After the workflow runs, update on Unraid:

```bash
ssh root@UNRAID-IP
cd /mnt/user/appdata/open-playlist/
docker-compose pull
docker-compose up -d
```

Or use the update script:
```bash
/mnt/user/appdata/open-playlist/update.sh
```

### Viewing Published Images

1. Go to your GitHub profile
2. Click "Packages" tab
3. Find `open-playlist`
4. View all tags and versions

### Manual Workflow Dispatch

To trigger a build with custom tag:

1. Go to **Actions** tab on GitHub
2. Click **"Build and Push Docker Image"**
3. Click **"Run workflow"**
4. Select branch (usually `main`)
5. Optional: Enter custom tag (e.g., `v1.0.0`)
6. Click **"Run workflow"**

The image will be tagged as:
- `ghcr.io/YOUR_USERNAME/open-playlist:v1.0.0`
- `ghcr.io/YOUR_USERNAME/open-playlist:latest`

### Monitoring Builds

- View build status: Repository → Actions tab
- Each commit shows build status ✅ or ❌
- Click on workflow run for detailed logs

### Troubleshooting

**Build fails:**
- Check Actions tab for error logs
- Common issues:
  - Dockerfile syntax errors
  - Missing files (check .dockerignore)
  - Package.json issues

**Can't pull image:**
- Ensure package visibility is set correctly
  - Public: Anyone can pull
  - Private: Requires authentication
- For private: Run `docker login ghcr.io` first

### Advanced: Semantic Versioning

To use semantic versioning (v1.0.0, v1.0.1, etc.):

1. **Create a git tag:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Workflow automatically creates:**
   - `ghcr.io/YOUR_USERNAME/open-playlist:1.0.0`
   - `ghcr.io/YOUR_USERNAME/open-playlist:1.0`
   - `ghcr.io/YOUR_USERNAME/open-playlist:1`
   - `ghcr.io/YOUR_USERNAME/open-playlist:latest`

3. **On Unraid, pin to specific version:**
   ```yaml
   image: ghcr.io/YOUR_USERNAME/open-playlist:1.0.0
   ```

### Cost

**FREE** ✅
- GitHub Actions: 2,000 minutes/month (free tier)
- This workflow uses ~2-3 minutes per build
- GitHub Container Registry: Free for public repos
- Private repos: 500MB free storage

### Security

- Uses minimal permissions
- Only runs on your repository
- Secrets are automatically managed by GitHub
- No manual token creation needed
