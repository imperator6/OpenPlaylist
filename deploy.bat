@echo off
REM Quick deploy script for Open Playlist
REM Commits and pushes changes to trigger GitHub Actions build

echo ============================================
echo Open Playlist - Deploy to GitHub
echo ============================================
echo.

REM Check if git is initialized
git rev-parse --git-dir > nul 2>&1
if errorlevel 1 (
    echo ERROR: This is not a git repository!
    echo Please run 'git init' first.
    pause
    exit /b 1
)

REM Show current status
echo Current git status:
echo.
git status --short
echo.

REM Ask for confirmation
set /p CONFIRM="Do you want to commit and push these changes? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo Cancelled.
    pause
    exit /b 0
)

REM Ask for commit message
echo.
set /p COMMIT_MSG="Enter commit message (or press Enter for default): "
if "%COMMIT_MSG%"=="" (
    set COMMIT_MSG=Update Open Playlist
)

echo.
echo Staging all changes...
git add .

echo.
echo Committing with message: "%COMMIT_MSG%"
git commit -m "%COMMIT_MSG%"

if errorlevel 1 (
    echo.
    echo No changes to commit or commit failed.
    pause
    exit /b 1
)

echo.
echo Pushing to GitHub...
git push

if errorlevel 1 (
    echo.
    echo ERROR: Push failed!
    echo.
    echo Common fixes:
    echo 1. Make sure you have set up a remote: git remote add origin <URL>
    echo 2. Make sure you have pushed at least once: git push -u origin main
    echo 3. Check your network connection
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo SUCCESS! Changes pushed to GitHub
echo ============================================
echo.
echo GitHub Actions will now automatically:
echo 1. Build the Docker image
echo 2. Push to GitHub Container Registry
echo.
echo View build progress:
echo https://github.com/YOUR_USERNAME/open-playlist/actions
echo.
echo After build completes (2-3 minutes), update Unraid:
echo   ssh root@UNRAID-IP
echo   cd /mnt/user/appdata/open-playlist
echo   ./update.sh
echo.
pause
