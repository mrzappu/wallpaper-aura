/**
 * WALLPAPER AURA - CLIENT ENGINE (app.js)
 * Clean, standard high-resolution wallpaper platform.
 */

// Application State
let activeFilter = 'All';
let activeResolution = 'all';
let activeSort = 'trending';
let searchQuery = '';
let activeWallpaperForModal = null;
let selectedResolutionObj = null;
let pendingDownloadAfterLogin = false;

// DOM Elements
const categoryTabs = document.getElementById('categoryTabs');
const galleryGrid = document.getElementById('galleryGrid');
const noResults = document.getElementById('noResults');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const resolutionFilter = document.getElementById('resolutionFilter');
const sortSelect = document.getElementById('sortSelect');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');

const totalWallpapersCount = document.getElementById('totalWallpapersCount');
const totalDownloadsCount = document.getElementById('totalDownloadsCount');

// Auth DOM
const adminUploadBtn = document.getElementById('adminUploadBtn');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const userProfilePill = document.getElementById('userProfilePill');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userRoleBadge = document.getElementById('userRoleBadge');

// Preview Modal DOM
const previewModal = document.getElementById('previewModal');
const closePreviewBtn = document.getElementById('closePreviewBtn');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalAuthor = document.getElementById('modalAuthor');
const modalAuthorAvatar = document.getElementById('modalAuthorAvatar');
const modalResolutionBadge = document.getElementById('modalResolutionBadge');
const modalResValue = document.getElementById('modalResValue');
const modalCategory = document.getElementById('modalCategory');
const modalDownloads = document.getElementById('modalDownloads');
const modalLikes = document.getElementById('modalLikes');
const modalTagsContainer = document.getElementById('modalTagsContainer');
const modalLikeBtn = document.getElementById('modalLikeBtn');
const modalDownloadBtn = document.getElementById('modalDownloadBtn');
const modalDownloadLabel = document.getElementById('modalDownloadLabel');
const viewFullscreenBtn = document.getElementById('viewFullscreenBtn');
const modalResOptionsGrid = document.getElementById('modalResOptionsGrid');

// Toast Container
const toastContainer = document.getElementById('toastContainer');

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */
async function initApp() {
    await DB.init();
    setupAuthUI();
    renderCategoryTabs();
    renderResolutionFilterOptions();
    renderGallery();
    setupEventListeners();
    setupGoogleIdentity();
}

/* ==========================================================================
   AUTHENTICATION UI
   - "Upload 4K" button is ONLY visible if user is an Admin!
   ========================================================================== */
function setupAuthUI() {
    const user = DB.getCurrentUser();
    const saveSuggestionPopup = document.getElementById('saveSuggestionPopup');
    const userSavedStatus = document.getElementById('userSavedStatus');
    const modalAccountName = document.getElementById('modalAccountName');

    const navAdminBtn = document.getElementById('navAdminBtn');

    if (user) {
        if (googleLoginBtn) googleLoginBtn.classList.add('hidden');
        if (userProfilePill) userProfilePill.classList.remove('hidden');
        if (userAvatar) userAvatar.src = user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100';
        if (userName) userName.textContent = user.name || 'User';
        
        const isAdmin = DB.isAdmin(user.email);
        if (userRoleBadge) userRoleBadge.textContent = isAdmin ? 'Admin' : 'Member';

        // Show Admin Panel & Upload button ONLY if user is Admin!
        if (adminUploadBtn) {
            if (isAdmin) adminUploadBtn.classList.remove('hidden');
            else adminUploadBtn.classList.add('hidden');
        }
        if (navAdminBtn) {
            if (isAdmin) navAdminBtn.classList.remove('hidden');
            else navAdminBtn.classList.add('hidden');
        }

        if (saveSuggestionPopup) saveSuggestionPopup.classList.add('hidden');
        if (userSavedStatus) userSavedStatus.classList.remove('hidden');
        if (modalAccountName) modalAccountName.textContent = user.name || 'User';
    } else {
        if (googleLoginBtn) googleLoginBtn.classList.remove('hidden');
        if (userProfilePill) userProfilePill.classList.add('hidden');
        if (adminUploadBtn) adminUploadBtn.classList.add('hidden');
        if (navAdminBtn) navAdminBtn.classList.add('hidden');
        if (saveSuggestionPopup) saveSuggestionPopup.classList.remove('hidden');
        if (userSavedStatus) userSavedStatus.classList.add('hidden');
    }
}

/* Google Identity Services (GIS) integration */
function setupGoogleIdentity() {
    const clientId = DB.getGoogleClientId();
    if (clientId && window.google && window.google.accounts && window.google.accounts.id) {
        try {
            google.accounts.id.initialize({
                client_id: clientId,
                callback: handleGoogleCredentialResponse,
                auto_select: false
            });
            // Prompt Google One-Tap
            google.accounts.id.prompt();
        } catch (e) {
            console.log('Google Identity init error:', e);
        }
    }
}

function handleGoogleCredentialResponse(response) {
    try {
        // Decode JWT payload
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        const data = JSON.parse(jsonPayload);

        const user = {
            name: data.name,
            email: data.email,
            avatar: data.picture
        };
        DB.setCurrentUser(user);
        setupAuthUI();
        showToast(`Signed in with Google as ${user.name}`, 'success');

        if (pendingDownloadAfterLogin) {
            pendingDownloadAfterLogin = false;
            executeDownload();
        }
    } catch (e) {
        console.error('Credential parse error', e);
    }
}

/* ==========================================================================
   DYNAMIC CATEGORY TABS & RESOLUTION SELECTOR
   ========================================================================== */
function renderCategoryTabs() {
    const categories = ['All', ...DB.getCategories()];
    categoryTabs.innerHTML = categories.map(cat => `
        <button class="tab-btn ${cat.toLowerCase() === activeFilter.toLowerCase() ? 'active' : ''}" data-cat="${cat}">
            ${cat}
        </button>
    `).join('');

    categoryTabs.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            categoryTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.cat;
            renderGallery();
        });
    });
}

function renderResolutionFilterOptions() {
    const resolutions = DB.getResolutions();
    let html = `<option value="all">All Resolutions</option>`;
    resolutions.forEach(r => {
        html += `<option value="${r.badge}">${r.label} (${r.badge})</option>`;
    });
    resolutionFilter.innerHTML = html;
}

/* ==========================================================================
   GALLERY RENDERING & FILTERING
   ========================================================================== */
function getFilteredList() {
    const all = DB.getWallpapers();
    const filtered = all.filter(w => {
        // Category filter
        const matchCat = (activeFilter === 'All') || (w.category.toLowerCase() === activeFilter.toLowerCase());

        // Resolution filter
        let matchRes = true;
        if (activeResolution !== 'all') {
            matchRes = (w.resolution || '').toLowerCase().includes(activeResolution.toLowerCase());
        }

        // Search query
        let matchSearch = true;
        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            const titleMatch = (w.title || '').toLowerCase().includes(q);
            const tagMatch = w.tags && w.tags.some(t => t.toLowerCase().includes(q));
            const catMatch = (w.category || '').toLowerCase().includes(q);
            matchSearch = titleMatch || tagMatch || catMatch;
        }

        return matchCat && matchRes && matchSearch;
    });

    // Sorting
    return filtered.sort((a, b) => {
        if (activeSort === 'latest') return new Date(b.createdAt) - new Date(a.createdAt);
        if (activeSort === 'likes') return (b.likes || 0) - (a.likes || 0);
        if (activeSort === 'downloads') return (b.downloads || 0) - (a.downloads || 0);
        // Default: trending
        return ((b.likes || 0) * 2 + (b.downloads || 0)) - ((a.likes || 0) * 2 + (a.downloads || 0));
    });
}

function renderGallery() {
    const list = getFilteredList();
    galleryGrid.innerHTML = '';

    if (list.length === 0) {
        noResults.classList.remove('hidden');
    } else {
        noResults.classList.add('hidden');
        list.forEach(w => {
            const isLiked = DB.isFavorited(w.id);
            const card = document.createElement('div');
            card.className = 'wallpaper-card';
            card.innerHTML = `
                <div class="card-image-wrap">
                    <img src="${w.imageUrl}" alt="${escapeHtml(w.title)}" class="card-img" loading="lazy">
                    <div class="card-badges">
                        <span class="res-tag">${escapeHtml(w.resolution || '4K')}</span>
                        <span class="category-tag">${escapeHtml(w.category)}</span>
                    </div>
                    <div class="card-hover-actions">
                        <button class="quick-btn ${isLiked ? 'liked' : ''}" data-like-id="${w.id}" title="${isLiked ? 'Unlike' : 'Favorite'}">
                            <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                        </button>
                        <button class="quick-btn" data-preview-id="${w.id}" title="Preview & Download">
                            <i class="fa-solid fa-expand"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-title">${escapeHtml(w.title)}</div>
                    <div class="card-footer">
                        <div class="author-chip">
                            <span>${escapeHtml(w.author || 'Creator')}</span>
                        </div>
                        <div class="card-stats">
                            <span class="stat-group"><i class="fa-solid fa-heart" style="color:var(--accent-red)"></i> ${formatNumber(w.likes || 0)}</span>
                            <span class="stat-group"><i class="fa-solid fa-download" style="color:var(--accent-blue)"></i> ${formatNumber(w.downloads || 0)}</span>
                        </div>
                    </div>
                </div>
            `;

            // Card click
            card.addEventListener('click', (e) => {
                if (e.target.closest('.quick-btn')) return;
                openPreview(w);
            });

            // Quick Like button
            card.querySelector('[data-like-id]').addEventListener('click', (e) => {
                e.stopPropagation();
                toggleLikeAction(w.id);
            });

            // Quick Preview button
            card.querySelector('[data-preview-id]').addEventListener('click', (e) => {
                e.stopPropagation();
                openPreview(w);
            });

            galleryGrid.appendChild(card);
        });
    }

    updateHeaderStats();
}

function toggleLikeAction(id) {
    const favorited = DB.toggleLike(id);
    showToast(favorited ? 'Saved to your favorites!' : 'Removed from favorites', favorited ? 'success' : 'info');
    renderGallery();
    if (activeWallpaperForModal && activeWallpaperForModal.id === id) {
        updateModalLikeState();
    }
}

function updateHeaderStats() {
    const all = DB.getWallpapers();
    let totalDls = 0;
    all.forEach(w => totalDls += (w.downloads || 0));

    totalWallpapersCount.textContent = all.length;
    totalDownloadsCount.textContent = totalDls > 1000 ? (totalDls / 1000).toFixed(1) + 'k' : totalDls;
}

/* ==========================================================================
   PREVIEW MODAL & 4K DOWNLOAD LOGIC
   - Prompts Google Sign In if user is not logged in!
   ========================================================================== */
function openPreview(w) {
    activeWallpaperForModal = w;
    modalImage.src = w.imageUrl;
    modalTitle.textContent = w.title;
    modalAuthor.textContent = w.author || 'Community Creator';
    modalAuthorAvatar.src = w.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100';
    modalResolutionBadge.textContent = `${w.resolution || '4K'}`;
    modalResValue.textContent = w.dimensions || '3840 x 2160';
    modalCategory.textContent = w.category;
    modalDownloads.textContent = formatNumber(w.downloads || 0);
    modalLikes.textContent = formatNumber(w.likes || 0);

    // Tags
    modalTagsContainer.innerHTML = '';
    if (w.tags && w.tags.length > 0) {
        w.tags.forEach(t => {
            const span = document.createElement('span');
            span.className = 'tag-chip';
            span.textContent = `#${t}`;
            modalTagsContainer.appendChild(span);
        });
    }

    // Dynamic Resolution Buttons
    renderModalResolutionOptions();
    updateModalLikeState();

    const saveSuggestionPopup = document.getElementById('saveSuggestionPopup');
    const userSavedStatus = document.getElementById('userSavedStatus');
    const modalAccountName = document.getElementById('modalAccountName');
    const user = DB.getCurrentUser();

    if (user) {
        if (saveSuggestionPopup) saveSuggestionPopup.classList.add('hidden');
        if (userSavedStatus) {
            userSavedStatus.classList.remove('hidden');
            if (modalAccountName) modalAccountName.textContent = user.name || 'User';
        }
    } else {
        if (saveSuggestionPopup) {
            saveSuggestionPopup.classList.remove('hidden');
            saveSuggestionPopup.classList.remove('highlight-pulse');
        }
        if (userSavedStatus) userSavedStatus.classList.add('hidden');
    }

    previewModal.classList.remove('hidden');
}

function renderModalResolutionOptions() {
    const resolutions = DB.getResolutions();
    modalResOptionsGrid.innerHTML = '';

    resolutions.forEach((res, index) => {
        const btn = document.createElement('button');
        btn.className = `res-download-btn ${index === 0 ? 'active-res' : ''}`;
        btn.innerHTML = `
            <span class="res-title">${res.label}</span>
            <span class="res-sub">${res.dimensions}</span>
        `;
        btn.addEventListener('click', () => {
            modalResOptionsGrid.querySelectorAll('.res-download-btn').forEach(b => b.classList.remove('active-res'));
            btn.classList.add('active-res');
            selectedResolutionObj = res;
            modalDownloadLabel.textContent = `Download Free (${res.badge || res.label})`;
        });
        modalResOptionsGrid.appendChild(btn);
    });

    selectedResolutionObj = resolutions[0] || { label: '4K Ultra HD', badge: '4K', dimensions: '3840 x 2160' };
    modalDownloadLabel.textContent = `Download Free (${selectedResolutionObj.badge || '4K'})`;
}

function updateModalLikeState() {
    if (!activeWallpaperForModal) return;
    const isLiked = DB.isFavorited(activeWallpaperForModal.id);
    if (isLiked) {
        modalLikeBtn.classList.add('active');
        modalLikeBtn.innerHTML = `<i class="fa-solid fa-heart"></i> <span>Favorited</span>`;
    } else {
        modalLikeBtn.classList.remove('active');
        modalLikeBtn.innerHTML = `<i class="fa-regular fa-heart"></i> <span>Favorite</span>`;
    }
    modalLikes.textContent = formatNumber(activeWallpaperForModal.likes || 0);
}

// Download Button Trigger: 100% Free Instant Download
modalDownloadBtn.addEventListener('click', () => {
    if (!activeWallpaperForModal) return;
    executeDownload();
});

function executeDownload() {
    if (!activeWallpaperForModal) return;
    const user = DB.getCurrentUser();
    const resLabel = selectedResolutionObj ? selectedResolutionObj.label : '4K Ultra HD';

    // Increment download counter
    DB.incrementDownload(activeWallpaperForModal.id);

    if (user) {
        // Record into user's personal download history
        DB.recordDownload(activeWallpaperForModal, resLabel, user.email);
        showToast(`📥 Downloading ${resLabel}! Saved to your profile history.`, 'success');
    } else {
        showToast(`📥 Downloading ${resLabel}! Tip: Sign in with Google to keep your history.`, 'info');
        const savePopup = document.getElementById('saveSuggestionPopup');
        if (savePopup) {
            savePopup.classList.add('highlight-pulse');
            setTimeout(() => savePopup.classList.remove('highlight-pulse'), 3000);
        }
    }

    modalDownloads.textContent = formatNumber(activeWallpaperForModal.downloads || 0);
    updateHeaderStats();

    // Determine download URL
    let downloadUrl = activeWallpaperForModal.imageUrl;
    if (downloadUrl.includes('unsplash.com')) {
        let targetW = 3840;
        if (selectedResolutionObj) {
            const dims = selectedResolutionObj.dimensions.split('x');
            if (dims[0]) targetW = parseInt(dims[0].trim()) || 3840;
        }
        downloadUrl = downloadUrl.split('?')[0] + `?w=${targetW}&auto=format&fit=crop&q=90`;
    }

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.target = '_blank';
    a.download = `wallpaperaura_${sanitizeFileName(activeWallpaperForModal.title)}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

modalLikeBtn.addEventListener('click', () => {
    if (activeWallpaperForModal) {
        toggleLikeAction(activeWallpaperForModal.id);
    }
});

viewFullscreenBtn.addEventListener('click', () => {
    if (activeWallpaperForModal) {
        window.open(activeWallpaperForModal.imageUrl, '_blank');
    }
});

/* ==========================================================================
   EVENT LISTENERS & CONTROLS
   ========================================================================== */
function setupEventListeners() {
    // Search
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        clearSearchBtn.classList.toggle('visible', searchQuery.trim().length > 0);
        renderGallery();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.classList.remove('visible');
        renderGallery();
    });

    // Resolution Filter
    resolutionFilter.addEventListener('change', (e) => {
        activeResolution = e.target.value;
        renderGallery();
    });

    // Sort Select
    sortSelect.addEventListener('change', (e) => {
        activeSort = e.target.value;
        renderGallery();
    });

    // Reset Filters
    resetFiltersBtn.addEventListener('click', () => {
        activeFilter = 'All';
        activeResolution = 'all';
        activeSort = 'trending';
        searchQuery = '';
        searchInput.value = '';
        resolutionFilter.value = 'all';
        sortSelect.value = 'trending';
        renderCategoryTabs();
        renderGallery();
    });

    // Close Preview Modal Handlers
    closePreviewBtn.addEventListener('click', () => {
        previewModal.classList.add('hidden');
    });

    previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal) {
            previewModal.classList.add('hidden');
        }
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            previewModal.classList.add('hidden');
        }
    });
}

/* ==========================================================================
   HELPERS & TOASTS
   ========================================================================== */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-circle-xmark';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 250);
    }, 3000);
}

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
}

function sanitizeFileName(str) {
    return str.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Start
document.addEventListener('DOMContentLoaded', initApp);
