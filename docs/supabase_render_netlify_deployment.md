# Deploying StadiumIQ-AI to Supabase, Render, and Netlify

This guide provides step-by-step instructions to deploy the entire StadiumIQ-AI application completely for free.

---

## 🗄️ Phase 1: Create PostgreSQL Database on Supabase

Supabase offers a free tier hosting Postgres databases.

1. **Sign Up / Log In**: Go to [Supabase](https://supabase.com) and create or log in to your account.
2. **Create New Project**:
   - Click **New Project** and select your organization.
   - **Name**: `StadiumIQ-AI`
   - **Database Password**: Choose a strong password and save it safely.
   - **Region**: Select a region close to your target Render web service (e.g., `East US (Virginia)` or `West US (Oregon)`).
   - **Pricing**: Select the **Free Tier**.
   - Click **Create new project**.
3. **Retrieve Connection String**:
   - Wait for the project database to finish provisioning (usually 1-2 minutes).
   - Go to **Project Settings** (gear icon on the sidebar) -> **Database**.
   - Scroll down to the **Connection string** section.
   - Select the **URI** tab.
   - Copy the connection URI. It will look like this:
     ```text
     postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres
     ```
   - **Replace `[YOUR-PASSWORD]`** with the database password you chose in step 2.

---

## 🚀 Phase 2: Deploy Backend on Render

Render hosts Node.js apps on their free tier.

1. **Commit and Push**: Ensure all latest code changes (including `.gitignore`) are committed and pushed to your GitHub repository.
2. **Sign Up / Log In**: Go to [Render](https://render.com) and sign in.
3. **Create Web Service**:
   - Click **New +** at the top right and select **Web Service**.
   - Connect your GitHub account and select the `StadiumIQ-AI` repository.
4. **Configure Settings**:
   - **Name**: `stadiumiq-backend`
   - **Region**: Choose a region close to your Supabase region (e.g., Oregon or Virginia).
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run seed && npm start`  
     *(Note: This seeds the Supabase database with default tables, matches, smart bins, and the default organizer account on first deployment. It is safe to use on subsequent runs.)*
   - **Instance Type**: Select **Free**.
5. **Set Environment Variables**:
   - Click **Advanced** and add the following keys:
     - `DATABASE_URL`: *Paste the connection URI from Supabase (Phase 1)*
     - `JWT_SECRET`: *Choose a high-entropy string (e.g. `supersecretjwtkey12345`)*
     - `GEMINI_API_KEY`: *Your Google Gemini API Key*
     - `NODE_ENV`: `production`
6. **Deploy**:
   - Click **Create Web Service**.
   - Wait for the build and deployment logs to print `listening on port 10000`.
   - Render will generate a public URL for your API, e.g., `https://stadiumiq-backend.onrender.com`. Copy this URL.

---

## 🌐 Phase 3: Deploy Frontend on Netlify

Netlify hosts static frontend assets for free.

1. **Sign Up / Log In**: Go to [Netlify](https://netlify.com) and sign in.
2. **Add New Site**:
   - Click **Add new site** -> **Import from Git**.
   - Select **GitHub** and authorize.
   - Choose the `StadiumIQ-AI` repository.
3. **Configure Settings**:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
4. **Set Environment Variables**:
   - Under **Environment variables**, click **Add variable** and enter:
     - `VITE_API_URL`: *Paste your Render backend API URL (e.g., `https://stadiumiq-backend.onrender.com` without a trailing slash)*
5. **Deploy**:
   - Click **Deploy site**.
   - Netlify will compile your TypeScript files, build Vite bundles, and deploy it.
   - Netlify redirects are pre-configured in `frontend/public/_redirects` to handle React SPA router fallbacks correctly.
