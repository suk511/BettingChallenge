# GitHub Pages Deployment Instructions for BettingChallenge

Follow these steps to deploy your BettingChallenge app to GitHub Pages and fix the 404 error you're experiencing.

## Step 1: Update package.json

Add the following to your package.json file:

```json
"homepage": "https://suk511.github.io/BettingChallenge",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist/public",
  ...your existing scripts...
}
```

## Step 2: Create a .env.production file

Create a new file called `.env.production` in the root of your project with this content:

```
VITE_BASE_PATH=/BettingChallenge/
```

## Step 3: Update App.tsx for proper routing

In your App.tsx file, update your Router configuration to use the correct base path:

```tsx
import { Router } from 'wouter';

// Get the base path for GitHub Pages
const basePath = import.meta.env.VITE_BASE_PATH || '/BettingChallenge/';

function App() {
  return (
    <Router base={basePath}>
      {/* Your existing routes */}
    </Router>
  );
}
```

## Step 4: Deploy to GitHub Pages

Run the following commands to deploy your app:

```bash
# Build and deploy your app
npm run deploy
```

## Step 5: Configure GitHub Pages

1. Go to your GitHub repository at https://github.com/suk511/BettingChallenge
2. Click "Settings"
3. Go to "Pages" in the sidebar
4. Under "Build and deployment" > "Source", select "Deploy from a branch"
5. Select the "gh-pages" branch and "/ (root)" folder
6. Click "Save"

Your site will be deployed to https://suk511.github.io/BettingChallenge/

## Why This Fixes Your 404 Error

1. The 404.html file we created handles redirects for client-side routing
2. The script in index.html handles the URL rewrites needed for SPA navigation
3. Setting the correct base path in your Router ensures all routes work correctly

## Accessing Admin Panel

After deployment, your admin panel will be available at:
https://suk511.github.io/BettingChallenge/adminpanel

Use the credentials:
- Username: admin
- Password: password123