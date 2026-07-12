# Deployment Guide

This application is built with React, Vite, TypeScript, and Tailwind CSS. It outputs a highly optimized static single-page application (SPA) that can be deployed to any major cloud hosting provider.

## Option 1: Vercel (Highly Recommended)

Vercel offers seamless deployment for Vite applications with zero configuration.

1. Install the Vercel CLI or connect your GitHub repository to Vercel.
2. In the Vercel dashboard, click **Add New Project** and select your repository.
3. Vercel will automatically detect the Framework Preset as **Vite**.
4. (Optional) Add your Firebase environment variables in the Vercel Project Settings if you modified `config.ts` to use `import.meta.env`.
5. Click **Deploy**. Your app will be live with an auto-configured SSL certificate.

## Option 2: Firebase Hosting

Since the app utilizes Firebase Auth and Firestore, Firebase Hosting is a natural choice.

1. Install the Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```
2. Login to your Firebase account:
   ```bash
   firebase login
   ```
3. Initialize Firebase Hosting in your project root:
   ```bash
   firebase init hosting
   ```
   - Select your project from the list.
   - Set the public directory to `dist`.
   - Configure as a single-page app (rewrite all URLs to `/index.html`): **Yes**.
   - Set up automatic builds and deploys with GitHub: **No** (or Yes if desired).
4. Build the production application:
   ```bash
   npm run build
   ```
5. Deploy to Firebase:
   ```bash
   firebase deploy --only hosting
   ```

## Option 3: Netlify

1. In the Netlify dashboard, click **Add new site** > **Import an existing project**.
2. Connect to your GitHub repository.
3. Set the Build Command to: `npm run build`
4. Set the Publish directory to: `dist`
5. Click **Deploy site**.
6. **Important for SPAs on Netlify:** To handle client-side routing properly, create a file named `_redirects` in your `public` folder with the following content:
   ```
   /*    /index.html   200
   ```

## Option 4: GitHub Pages

To deploy to GitHub Pages, ensure your base URL is set correctly in `vite.config.ts` if deploying to a subfolder repository.

1. Install `gh-pages`:
   ```bash
   npm install gh-pages --save-dev
   ```
2. Add a deploy script to `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
3. Run the deploy command:
   ```bash
   npm run deploy
   ```
