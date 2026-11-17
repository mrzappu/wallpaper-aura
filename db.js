/**
 * WALLPAPER AURA - DATABASE & STATE LAYER (db.js)
 * Manages database persistence via psycho.db.json & localStorage.
 * Supports dynamic categories, dynamic resolutions, Google OAuth, and download history.
 */

const DB = {
    KEY_STORAGE: 'aura_db_state',
    KEY_USER: 'aura_current_user',
    KEY_FAVORITES: 'aura_user_favorites',

    data: {
        siteName: "Wallpaper Aura",
        googleClientId: "",
        categories: [
            "Nature", "Minimalist", "Dark", "Anime", "Gaming", "Cars", "Abstract", "Architecture"
        ],
        resolutions: [
            { label: "4K Ultra HD", dimensions: "3840 x 2160", badge: "4K" },
            { label: "8K Ultra HD", dimensions: "7680 x 4320", badge: "8K" },
            { label: "2K QHD", dimensions: "2560 x 1440", badge: "2K" },
            { label: "Full HD 1080p", dimensions: "1920 x 1080", badge: "1080p" },
            { label: "Mobile AMOLED", dimensions: "1080 x 2400", badge: "Mobile" },
            { label: "Ultrawide (21:9)", dimensions: "3440 x 1440", badge: "UW" }
        ],
        adminEmails: [
            "adithyan@gmail.com", "admin@wallpaperaura.com"
        ],
        wallpapers: [],
        downloadHistory: []
    },

    async init() {
        // Try localStorage first
        const local = localStorage.getItem(this.KEY_STORAGE);
        if (local) {
            try {
                this.data = JSON.parse(local);
                if (!this.data.resolutions || this.data.resolutions.length === 0) {
                    this.data.resolutions = [
                        { label: "4K Ultra HD", dimensions: "3840 x 2160", badge: "4K" },
                        { label: "8K Ultra HD", dimensions: "7680 x 4320", badge: "8K" },
                        { label: "2K QHD", dimensions: "2560 x 1440", badge: "2K" },
                        { label: "Full HD 1080p", dimensions: "1920 x 1080", badge: "1080p" },
                        { label: "Mobile AMOLED", dimensions: "1080 x 2400", badge: "Mobile" },
                        { label: "Ultrawide (21:9)", dimensions: "3440 x 1440", badge: "UW" }
                    ];
                }
                return;
            } catch (e) {
                console.error('Error parsing localStorage DB', e);
            }
        }

        // Fetch psycho.db.json
        try {
            const res = await fetch('psycho.db.json');
            if (res.ok) {
                this.data = await res.json();
                this.save();
                return;
            }
        } catch (e) {
            console.warn('Fallback to embedded seed data');
        }

        this.save();
    },

    save() {
        localStorage.setItem(this.KEY_STORAGE, JSON.stringify(this.data));
    },

    // Site Config & Google Key
    getGoogleClientId() {
        return this.data.googleClientId || '';
    },

    setGoogleClientId(id) {
        this.data.googleClientId = id.trim();
        this.save();
    },

    // Wallpapers
    getWallpapers() {
        return this.data.wallpapers || [];
    },

    addWallpaper(wallpaper) {
        if (!this.data.wallpapers) this.data.wallpapers = [];
        this.data.wallpapers.unshift(wallpaper);
        this.save();
        return wallpaper;
    },

    deleteWallpaper(id) {
        this.data.wallpapers = (this.data.wallpapers || []).filter(w => w.id !== id);
        this.save();
    },

    incrementDownload(id) {
        const wall = (this.data.wallpapers || []).find(w => w.id === id);
        if (wall) {
            wall.downloads = (wall.downloads || 0) + 1;
            this.save();
        }
    },

    // Dynamic Categories
    getCategories() {
        return this.data.categories || [];
    },

    addCategory(cat) {
        const clean = cat.trim();
        if (!clean) return false;
        if (!this.data.categories.some(c => c.toLowerCase() === clean.toLowerCase())) {
            this.data.categories.push(clean);
            this.save();
            return true;
        }
        return false;
    },

    deleteCategory(cat) {
        this.data.categories = (this.data.categories || []).filter(c => c.toLowerCase() !== cat.toLowerCase());
        this.save();
    },

    // Dynamic Resolutions
    getResolutions() {
        return this.data.resolutions || [];
    },

    addResolution(label, dimensions, badge) {
        const cleanLabel = label.trim();
        if (!cleanLabel) return false;
        if (!this.data.resolutions) this.data.resolutions = [];
        
        const exists = this.data.resolutions.some(r => r.label.toLowerCase() === cleanLabel.toLowerCase());
        if (!exists) {
            this.data.resolutions.push({
                label: cleanLabel,
                dimensions: dimensions.trim() || "3840 x 2160",
                badge: badge ? badge.trim() : "Custom"
            });
            this.save();
            return true;
        }
        return false;
    },

    deleteResolution(label) {
        this.data.resolutions = (this.data.resolutions || []).filter(r => r.label.toLowerCase() !== label.toLowerCase());
        this.save();
    },

    // Admin Emails
    getAdminEmails() {
        return this.data.adminEmails || [];
    },

    addAdminEmail(email) {
        const clean = email.trim().toLowerCase();
        if (!clean || !clean.includes('@')) return false;
        if (!this.data.adminEmails) this.data.adminEmails = [];
        if (!this.data.adminEmails.includes(clean)) {
            this.data.adminEmails.push(clean);
            this.save();
            return true;
        }
        return false;
    },

    deleteAdminEmail(email) {
        this.data.adminEmails = (this.data.adminEmails || []).filter(e => e.toLowerCase() !== email.toLowerCase());
        this.save();
    },

    isAdmin(email) {
        if (!email) return false;
        return (this.data.adminEmails || []).some(e => e.toLowerCase() === email.trim().toLowerCase());
    },

    // User Authentication
    getCurrentUser() {
        const user = localStorage.getItem(this.KEY_USER);
        if (user) {
            try { 
                const u = JSON.parse(user);
                u.isAdmin = this.isAdmin(u.email);
                return u;
            } catch (e) { return null; }
        }
        return null;
    },

    setCurrentUser(user) {
        if (user) {
            user.isAdmin = this.isAdmin(user.email);
            localStorage.setItem(this.KEY_USER, JSON.stringify(user));
        } else {
            localStorage.removeItem(this.KEY_USER);
        }
    },

    logout() {
        localStorage.removeItem(this.KEY_USER);
    },

    // Download History Recording
    recordDownload(wallpaper, scaleLabel, userEmail) {
        const record = {
            id: 'dl-' + Date.now(),
            wallpaperId: wallpaper.id,
            title: wallpaper.title,
            imageUrl: wallpaper.imageUrl,
            resolution: scaleLabel || '4K',
            userEmail: userEmail || 'Guest',
            downloadedAt: new Date().toISOString()
        };

        if (!this.data.downloadHistory) {
            this.data.downloadHistory = [];
        }
        this.data.downloadHistory.unshift(record);
        this.incrementDownload(wallpaper.id);
        this.save();
    },

    getUserDownloads(userEmail) {
        if (!this.data.downloadHistory) return [];
        if (!userEmail) return this.data.downloadHistory.slice(0, 30);
        return this.data.downloadHistory.filter(h => h.userEmail.toLowerCase() === userEmail.toLowerCase());
    },

    // Favorites
    getFavorites() {
        const raw = localStorage.getItem(this.KEY_FAVORITES);
        if (raw) {
            try { return new Set(JSON.parse(raw)); } catch (e) { return new Set(); }
        }
        return new Set();
    },

    toggleLike(id) {
        const favs = this.getFavorites();
        const wall = (this.data.wallpapers || []).find(w => w.id === id);
        let favorited = false;

        if (favs.has(id)) {
            favs.delete(id);
            if (wall) wall.likes = Math.max(0, (wall.likes || 1) - 1);
            favorited = false;
        } else {
            favs.add(id);
            if (wall) wall.likes = (wall.likes || 0) + 1;
            favorited = true;
        }

        localStorage.setItem(this.KEY_FAVORITES, JSON.stringify([...favs]));
        this.save();
        return favorited;
    },

    isFavorited(id) {
        return this.getFavorites().has(id);
    }
};

window.DB = DB;
