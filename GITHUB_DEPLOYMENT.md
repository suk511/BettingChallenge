# GitHub Pages Deployment Guide for BettingChallenge

This guide will help you deploy your BettingChallenge application to GitHub Pages.

## Prerequisites

1. Make sure you have a GitHub repository for your project (e.g., https://github.com/suk511/BettingChallenge)
2. Ensure you have the gh-pages package installed (it's already included in your package.json)

## What We've Set Up

We've already made several important configurations to ensure your app works properly on GitHub Pages:

1. **Base Path Configuration**:
   - Added `.env.production` file with `VITE_BASE_PATH=/BettingChallenge/`
   - Updated `App.tsx` to use the Router with the base path

2. **SPA Routing for GitHub Pages**:
   - Added a `404.html` file in the public folder with a redirect script
   - Your `index.html` already has the necessary redirect script for GitHub Pages

3. **Package.json Configuration**:
   - Set `"homepage": "https://suk511.github.io/BettingChallenge"`
   - Added deployment scripts: `"predeploy"` and `"deploy"`

## Deployment Steps

1. **Commit your changes** to your repository:
   ```bash
   git add .
   git commit -m "Prepare for GitHub Pages deployment"
   git push origin main
   ```

2. **Run the deployment command**:
   ```bash
   npm run deploy
   ```
   This command will:
   - Build your application for production
   - Create or update the gh-pages branch in your repository
   - Push the built files to the gh-pages branch

3. **Configure GitHub Pages**:
   - Go to your repository on GitHub
   - Navigate to Settings > Pages
   - Under "Source", select "Deploy from a branch"
   - Select the "gh-pages" branch and the root (/) folder
   - Click "Save"

4. **Wait for deployment**:
   - GitHub will now deploy your site
   - Once deployed, it will be available at: https://suk511.github.io/BettingChallenge/

## Handling Backend Services

Since GitHub Pages only hosts static files, your backend won't be available when users access your site from GitHub Pages. You have two options:

1. **Demo Mode**: For demonstration purposes, you could modify your frontend to run without a backend
2. **Separate Backend Deployment**: Deploy your backend to a service like Heroku, Render, or Railway, and update your frontend API requests to point to that server

## Testing Your Deployment

After deploying, test these key features:

1. **Navigation**: Ensure all links and routes work correctly
2. **Login**: Test user authentication
3. **Admin Panel**: Verify access at `/adminpanel`
4. **Deep Linking**: Test accessing direct URLs like:
   - https://suk511.github.io/BettingChallenge/login
   - https://suk511.github.io/BettingChallenge/adminpanel

## Troubleshooting

If you encounter issues:

1. **404 Errors**: Make sure your GitHub Pages is properly set up to use the gh-pages branch
2. **Blank Pages**: Check browser console for script or asset loading errors
3. **Routing Issues**: Verify that the base path is correctly configured
4. **API Errors**: Remember that GitHub Pages can't host your backend, so API calls will fail unless you've deployed your backend separately

## Development vs Production

When developing locally, your app will continue to work as before. The production changes for GitHub Pages deployment only affect the built version of your application.