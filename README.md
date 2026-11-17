# Wallpaper Aura 🌌
> Free 4K & Ultra HD Desktop Wallpaper Archive Platform

A high-performance, clean, modular wallpaper web application with multi-resolution 4K downloads, dynamic category and resolution tier management, Google Authentication, user profiles with complete download history, and an administrative control panel.

Repository: [https://github.com/mrzappu/wallpaper-aura.git](https://github.com/mrzappu/wallpaper-aura.git)

---

## 🚀 Key Features

1. **Brand New Aesthetic**: Clean, modern dark theme without flashy neon/pink.
2. **Admin-Only 4K Upload**: The "Upload 4K" button is exclusively accessible to authorized administrators.
3. **Free 4K Downloads for Everyone**:
   - Visitors can browse all wallpapers freely.
   - When clicking "Download", visitors are prompted to sign in with Google (100% free).
   - Once signed in, any resolution (4K Ultra HD, 2K QHD, 1080p Full HD, Mobile) downloads immediately.
4. **Complete Download History**: All downloads are saved to the user's profile with re-download options.
5. **Dynamic Categories & Dynamic Resolutions**:
   - Admins can add or delete categories from the Admin Panel.
   - Admins can add custom resolution tiers (e.g., 8K, Dual Monitor, Mobile AMOLED).
6. **Google OAuth 2.0 Integration**:
   - Supports Google Identity Services (GIS) Sign-In with your Google Client ID.
   - Configure directly from the Admin Panel.

---

## 📁 File Structure

- `index.html` — Main Explore & Wallpaper Gallery
- `upload.html` — Admin Wallpaper Publisher
- `profile.html` — User Profile, Download History & Saved Favorites
- `admin.html` — Administrative Control Center (Categories, Resolutions, Admin Emails, Google OAuth)
- `style.css` — Modern, responsive dark theme styles
- `db.js` — Client database and state management
- `app.js` — Main gallery and modal interaction controller
- `psycho.db.json` — Initial database schema and wallpaper seeds
- `vercel.json` — Routing configuration for Vercel deployment

---

## 🔑 How to Set Up Your Google OAuth Client ID

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project named **Wallpaper Aura**.
3. Under **APIs & Services > OAuth consent screen**, select **External**, fill in the App name and your support email.
4. Under **APIs & Services > Credentials**, click **Create Credentials > OAuth client ID**.
5. Select **Web application**.
6. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000` (for local testing)
   - `https://wallpaper-aura.vercel.app` (your Vercel domain)
7. Copy your generated **Client ID** (e.g., `123456789-xxxx.apps.googleusercontent.com`).
8. Paste it into the Google Client ID section in `admin.html`.

---

## 📤 Push to GitHub & Deploy on Vercel

Run the following commands in your terminal:

```bash
git init
git add .
git commit -m "Initial commit for Wallpaper Aura"
git branch -M main
git remote add origin https://github.com/mrzappu/wallpaper-aura.git
git push -u origin main
```
