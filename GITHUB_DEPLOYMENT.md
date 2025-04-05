# GitHub Pages Deployment Guide

This guide will walk you through deploying your betting game application to GitHub Pages.

## Prerequisites

- A GitHub account
- Git installed on your local machine
- Your project pushed to a GitHub repository

## Step 1: Configure your package.json

Add the following to your package.json file:

```json
{
  "homepage": "https://yourusername.github.io/repository-name",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

Replace `yourusername` with your GitHub username and `repository-name` with the name of your repository.

## Step 2: Install Required Packages

Install the gh-pages package as a development dependency.

## Step 3: Update your vite.config.ts

Make sure your vite.config.ts has the correct base path for GitHub Pages:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
// ...other imports

export default defineConfig({
  // Add this line for GitHub Pages
  base: '/repository-name/',  // Replace with your repository name
  // ...other configuration
})
```

## Step 4: Configure Routes for GitHub Pages

Since GitHub Pages serves static content, client-side routing needs special handling. In your router setup (wouter), add a basename:

For example:

```typescript
import { Router, Route } from 'wouter';

// Get the base from your environment or hardcode it
const base = import.meta.env.BASE_URL || '/repository-name/';

function App() {
  return (
    <Router base={base}>
      {/* Your routes */}
    </Router>
  );
}
```

## Step 5: Create a 404.html Redirect for SPA Routing

Create a file named `404.html` in your `public` folder with the following content:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
  <script>
    // Single Page Apps for GitHub Pages
    // MIT License
    // https://github.com/rafgraph/spa-github-pages
    var pathSegmentsToKeep = 1;

    var l = window.location;
    l.replace(
      l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
      l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + '/?/' +
      l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
      (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
      l.hash
    );
  </script>
</head>
<body>
  Redirecting...
</body>
</html>
```

## Step 6: Add Redirect Script to index.html

Add the following script to your `index.html` file, just before the closing `</head>` tag:

```html
<script type="text/javascript">
  // Single Page Apps for GitHub Pages
  // MIT License
  // https://github.com/rafgraph/spa-github-pages
  (function(l) {
    if (l.search[1] === '/' ) {
      var decoded = l.search.slice(1).split('&').map(function(s) { 
        return s.replace(/~and~/g, '&')
      }).join('?');
      window.history.replaceState(null, null,
          l.pathname.slice(0, -1) + decoded + l.hash
      );
    }
  }(window.location))
</script>
```

## Step 7: Configure Backend API URL

For your application to communicate with your backend API, update your API URL configuration:

```typescript
// Example in src/lib/queryClient.ts or similar
const API_URL = import.meta.env.PROD 
  ? 'https://your-api-server.com' // Use your actual backend API URL
  : '';

export const apiRequest = async (method, endpoint, data) => {
  // Use API_URL in your fetch requests
  return fetch(`${API_URL}${endpoint}`, {
    // ...other fetch options
  });
};
```

## Step 8: Deploy to GitHub Pages

Run the deploy command to build and deploy your application to GitHub Pages.

This will build your application and push the built files to a `gh-pages` branch in your repository.

## Step 9: Configure GitHub Repository

1. Go to your GitHub repository
2. Click on "Settings"
3. Scroll down to the "GitHub Pages" section
4. Under "Source", select the `gh-pages` branch
5. Click "Save"

Your application should now be available at `https://yourusername.github.io/repository-name/`.

## Admin Access and Routing

For admin access at `/adminpanel`, ensure that your client-side routing handles this path correctly. The GitHub Pages deployment will redirect this to your SPA router, which will then show the admin interface for authorized users.

## Troubleshooting

### My CSS/JS is not loading

Make sure all your asset paths are relative or using the `import.meta.env.BASE_URL` prefix.

### My routes don't work after deployment

Ensure you've configured the basename correctly for your router and added the necessary redirect scripts.

### API calls are failing

Check that your API endpoint URLs are correctly configured for production.

### 404 errors when refreshing the page

Verify your 404.html redirect is properly set up and your index.html contains the necessary redirect script.

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Vite Static Deploy Guide](https://vitejs.dev/guide/static-deploy.html)
- [SPA GitHub Pages](https://github.com/rafgraph/spa-github-pages)
