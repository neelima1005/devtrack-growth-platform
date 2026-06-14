@echo off
echo Running Vercel deployment fixes...
cd /d "%~dp0"

echo 1. Removing node_modules from Git index...
git rm -r --cached node_modules

echo 2. Deleting node_modules locally...
if exist node_modules (
    rmdir /s /q node_modules
)

echo 3. Installing packages...
call npm install

echo 4. Running local build...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo Local build failed! Please check the errors above.
    pause
    exit /b %ERRORLEVEL%
)

echo 5. Committing fixes...
git add .gitignore package.json
git commit -m "chore: fix Vercel deployment issues"

echo 6. Pushing to origin main...
git push origin main

echo Success! All tasks completed.
pause
