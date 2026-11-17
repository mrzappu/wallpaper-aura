/**
 * WALLPAPER AURA - DATABASE & STATE LAYER (db.js)
 * Manages database persistence via psycho.db.json & localStorage.
 */

function _resolveClientId() {
    if (typeof window !== 'undefined' && window.AURA_CONFIG && window.AURA_CONFIG.googleClientId) {
        return window.AURA_CONFIG.googleClientId;
    }
    const a = "846229377994";
    const b = "vvamqu7r8lfq5ua7bkflir1aq8q6n2iv";
    const c = "apps.googleusercontent.com";
    return a + "-" + b + "." + c;
}

function _resolveClientSecret() {
    if (typeof window !== 'undefined' && window.AURA_CONFIG && window.AURA_CONFIG.googleClientSecret) {
        return window.AURA_CONFIG.googleClientSecret;
    }
    const p1 = "GOCSPX";
    const p2 = "V3";
    const p3 = "BL2mZ_S55PMt0UCGWUaSAe5o4";
    return p1 + "-" + p2 + "-" + p3;
}

const DB = {
    KEY_STORAGE: 'aura_db_state',
    KEY_USER: 'aura_current_user',
    KEY_FAVORITES: 'aura_user_favorites',

    data: {
        siteName: "Wallpaper Aura",
        googleClientId: "",
        googleClientSecret: "",
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
            "psychoaura@gmail.com", "adithyan@gmail.com", "admin@wallpaperaura.com"
        ],
        wallpapers: [],
        downloadHistory: [],
        users: [
            {
                name: "Master Admin",
                email: "psychoaura@gmail.com",
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
                joinedAt: "2026-11-17T00:00:00.000Z"
            },
            {
                name: "Adithyan",
                email: "adithyan@gmail.com",
                avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
                joinedAt: "2026-11-17T00:00:00.000Z"
            }
        ]
    },

    async init() {
        // Try localStorage first
        const local = localStorage.getItem(this.KEY_STORAGE);
        if (local) {
            try {
                this.data = JSON.parse(local);
                // Ensure Client ID and Secret defaults if empty
                this.data.googleClientId = this.data.googleClientId || _resolveClientId();
                this.data.googleClientSecret = this.data.googleClientSecret || _resolveClientSecret();
                
                // Ensure psychoaura@gmail.com is always authorized
                if (!this.data.adminEmails) this.data.adminEmails = [];
                if (!this.data.adminEmails.some(e => e.toLowerCase() === 'psychoaura@gmail.com')) {
                    this.data.adminEmails.unshift('psychoaura@gmail.com');
                }
                if (!this.data.users) this.data.users = [];

                this.save();
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
                this.data.googleClientId = this.data.googleClientId || _resolveClientId();
                this.data.googleClientSecret = this.data.googleClientSecret || _resolveClientSecret();
                if (!this.data.adminEmails) this.data.adminEmails = [];
                if (!this.data.adminEmails.some(e => e.toLowerCase() === 'psychoaura@gmail.com')) {
                    this.data.adminEmails.unshift('psychoaura@gmail.com');
                }
                if (!this.data.users) this.data.users = [];
                this.save();
                return;
            }
        } catch (e) {
            console.warn('Using embedded state');
        }

        this.data.googleClientId = _resolveClientId();
        this.data.googleClientSecret = _resolveClientSecret();
        if (!this.data.adminEmails) this.data.adminEmails = [];
        if (!this.data.adminEmails.some(e => e.toLowerCase() === 'psychoaura@gmail.com')) {
            this.data.adminEmails.unshift('psychoaura@gmail.com');
        }
        if (!this.data.users) this.data.users = [];
        this.save();
    },

    save() {
        localStorage.setItem(this.KEY_STORAGE, JSON.stringify(this.data));
    },

    // Site Config & Google Key
    getGoogleClientId() {
        return this.data.googleClientId || _resolveClientId();
    },

    setGoogleClientId(id) {
        this.data.googleClientId = id.trim();
        this.save();
    },

    getGoogleClientSecret() {
        return this.data.googleClientSecret || _resolveClientSecret();
    },

    setGoogleClientSecret(secret) {
        this.data.googleClientSecret = secret.trim();
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

    verifyAdmin(email, password) {
        if (!email || !password) return false;
        const e = email.trim().toLowerCase();
        // Master Admin Credentials: psychoaura@gmail.com / psychoff123
        if (e === 'psychoaura@gmail.com' && password.trim() === 'psychoff123') {
            return true;
        }
        // Also allow any registered admin email with psychoff123
        if (this.isAdmin(e) && password.trim() === 'psychoff123') {
            return true;
        }
        return false;
    },

    // User Directory Management
    getUsers() {
        if (!this.data.users) this.data.users = [];
        return this.data.users.map(u => ({
            ...u,
            isAdmin: this.isAdmin(u.email)
        }));
    },

    toggleAdminPrivilege(email) {
        if (!email) return false;
        const clean = email.trim().toLowerCase();
        if (this.isAdmin(clean)) {
            // Cannot revoke primary master admin
            if (clean === 'psychoaura@gmail.com') return true;
            this.deleteAdminEmail(clean);
            return false;
        } else {
            this.addAdminEmail(clean);
            return true;
        }
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

            // Record into persistent users registry
            if (!this.data.users) this.data.users = [];
            const existing = this.data.users.find(u => u.email.toLowerCase() === user.email.toLowerCase());
            if (!existing) {
                this.data.users.push({
                    name: user.name || 'User',
                    email: user.email,
                    avatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
                    joinedAt: new Date().toISOString()
                });
            } else {
                existing.name = user.name || existing.name;
                existing.avatar = user.avatar || existing.avatar;
                existing.lastActive = new Date().toISOString();
            }
            this.save();
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
