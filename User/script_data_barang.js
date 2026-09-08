// ============================================
// FIREBASE IMPORTS & CONFIG
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCyH-v1B2gXtQAkUYCwrPSKh5oC6bWN5Lc",
    authDomain: "projek-inventaris.firebaseapp.com",
    databaseURL: "https://projek-inventaris-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "projek-inventaris",
    storageBucket: "projek-inventaris.firebasestorage.app",
    messagingSenderId: "439348267269",
    appId: "1:439348267269:web:4d2b4b34a1ad69fb260f6c",
    measurementId: "G-T2SYGZJQ3B"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ============================================
// API CONFIG
// ============================================
const API_URL = 'http://localhost:3000';

// ============================================
// GLOBAL VARIABLES
// ============================================
let allGoods = [];
let currentFilter = 'all';

// ============================================
// DOM ELEMENTS
// ============================================
const dataBody = document.getElementById('dataBody');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const logoutBtn = document.getElementById('logoutBtn');
const logoutModal = document.getElementById('logoutModal');
const logoutYes = document.getElementById('logoutYes');
const logoutNo = document.getElementById('logoutNo');

// ============================================
// THEME TOGGLE
// ============================================
const htmlElement = document.documentElement;
const savedTheme = localStorage.getItem('theme') || 'light';
htmlElement.setAttribute('data-theme', savedTheme);

function updateThemeText(theme) {
    const themeText = document.querySelector('.theme-text');
    if (themeText) {
        themeText.textContent = theme === 'light' ? 'Mode Terang' : 'Mode Gelap';
    }
}
updateThemeText(savedTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeText(newTheme);
});

// ============================================
// SIDEBAR TOGGLE
// ============================================
const overlay = document.createElement('div');
overlay.className = 'sidebar-overlay';
document.body.appendChild(overlay);

function toggleSidebar() {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
}

menuToggle.addEventListener('click', toggleSidebar);
overlay.addEventListener('click', toggleSidebar);

window.addEventListener('resize', () => {
    if (window.innerWidth > 992) {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        toggleSidebar();
    }
});

// ============================================
// LOGOUT MODAL
// ============================================
function openLogoutModal() {
    logoutModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLogoutModal() {
    logoutModal.classList.remove('active');
    document.body.style.overflow = '';
}

logoutBtn.addEventListener('click', openLogoutModal);

logoutNo.addEventListener('click', closeLogoutModal);

logoutYes.addEventListener('click', async () => {
    try {
        await signOut(auth);
        localStorage.removeItem('userData');
        closeLogoutModal();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Terjadi kesalahan saat logout');
    }
});

logoutModal.addEventListener('click', (e) => {
    if (e.target === logoutModal) closeLogoutModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && logoutModal.classList.contains('active')) {
        closeLogoutModal();
    }
});

// ============================================
// LOAD USER DATA
// ============================================
function loadUserData() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    const userNameEl = document.getElementById('userName');
    const profileAvatarEl = document.getElementById('profileAvatar');
    const userRoleEl = document.getElementById('userRole');
    
    if (userData.name) {
        if (userNameEl) userNameEl.textContent = userData.name;
    }
    
    if (userData.photo) {
        if (profileAvatarEl) {
            profileAvatarEl.src = userData.photo;
            profileAvatarEl.onerror = function() {
                this.src = 'Logo/SIMIVA.png';
            };
        }
    }
    
    if (userData.jabatan) {
        if (userRoleEl) userRoleEl.textContent = userData.jabatan;
    }
}

// ============================================
// FORMAT DATE
// ============================================
function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
        return 'Baru saja';
    }
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} menit yang lalu`;
    }
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} jam yang lalu`;
    }
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days} hari yang lalu`;
    }
    
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================
// CONDITION LABEL - USER
// ============================================
function getConditionLabel(condition) {
    const labels = {
        'layak': 'Layak Digunakan',
        'perbaikan': 'Perlu Perbaikan',
        'penggantian': 'Perlu Penggantian'
    };
    return labels[condition] || condition;
}

function getConditionBadgeClass(condition) {
    const classes = {
        'layak': 'condition-badge layak',
        'perbaikan': 'condition-badge perbaikan',
        'penggantian': 'condition-badge penggantian'
    };
    return classes[condition] || 'condition-badge';
}

// ============================================
// SLIDESHOW MODAL
// ============================================
const slideshowModal = document.getElementById('slideshowModal');
const slideshowImage = document.getElementById('slideshowImage');
const slideshowCounter = document.getElementById('slideshowCounter');
const slideshowClose = document.getElementById('slideshowClose');
const slideshowPrev = document.getElementById('slideshowPrev');
const slideshowNext = document.getElementById('slideshowNext');

let currentPhotos = [];
let currentPhotoIndex = 0;

window.openSlideshow = function(photos, index) {
    if (!photos || photos.length === 0) {
        console.warn('No photos to display');
        return;
    }
    
    if (typeof photos === 'string') {
        try {
            photos = JSON.parse(photos);
        } catch (e) {
            console.error('Invalid photos data:', e);
            return;
        }
    }
    
    currentPhotos = photos;
    currentPhotoIndex = index || 0;
    
    updateSlideshow();
    
    slideshowModal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

function closeSlideshow() {
    slideshowModal.classList.remove('active');
    document.body.style.overflow = '';
    currentPhotos = [];
    currentPhotoIndex = 0;
}

function updateSlideshow() {
    if (!currentPhotos || currentPhotos.length === 0) return;
    
    const photo = currentPhotos[currentPhotoIndex];
    if (!photo) return;
    
    slideshowImage.src = `${API_URL}/FotoBarang/${photo}`;
    slideshowImage.onerror = function() {
        this.src = 'Logo/SIMIVA.png';
    };
    
    slideshowCounter.textContent = `${currentPhotoIndex + 1} / ${currentPhotos.length}`;
    
    if (currentPhotos.length <= 1) {
        slideshowPrev.style.display = 'none';
        slideshowNext.style.display = 'none';
    } else {
        slideshowPrev.style.display = 'block';
        slideshowNext.style.display = 'block';
    }
}

function nextPhoto() {
    if (currentPhotos.length === 0) return;
    currentPhotoIndex = (currentPhotoIndex + 1) % currentPhotos.length;
    updateSlideshow();
}

function prevPhoto() {
    if (currentPhotos.length === 0) return;
    currentPhotoIndex = (currentPhotoIndex - 1 + currentPhotos.length) % currentPhotos.length;
    updateSlideshow();
}

slideshowClose.addEventListener('click', function(e) {
    e.stopPropagation();
    closeSlideshow();
});

slideshowNext.addEventListener('click', function(e) {
    e.stopPropagation();
    nextPhoto();
});

slideshowPrev.addEventListener('click', function(e) {
    e.stopPropagation();
    prevPhoto();
});

slideshowModal.addEventListener('click', function(e) {
    if (e.target === slideshowModal) {
        closeSlideshow();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && slideshowModal.classList.contains('active')) {
        closeSlideshow();
    }
    if (e.key === 'ArrowRight' && slideshowModal.classList.contains('active')) {
        nextPhoto();
    }
    if (e.key === 'ArrowLeft' && slideshowModal.classList.contains('active')) {
        prevPhoto();
    }
});

// ============================================
// RENDER TABLE
// ============================================
function renderTable(data) {
    if (!data || data.length === 0) {
        dataBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <i class="ri-box-3-line"></i>
                        <h3>Belum ada data barang</h3>
                        <p>Belum ada barang yang tersedia</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    dataBody.innerHTML = data.map(item => {
        let photosHtml = '';
        const photos = item.fotoBarang || [];
        
        if (photos.length > 0) {
            const displayPhotos = photos.slice(0, 4);
            const remaining = photos.length - 4;
            const photosJson = JSON.stringify(photos).replace(/"/g, '&quot;');
            
            photosHtml = `
                <div class="photo-thumbnails ${photos.length > 3 ? 'has-many' : ''}">
                    ${displayPhotos.map((photo, index) => `
                        <div class="photo-thumbnail" onclick="window.openSlideshow(${photosJson}, ${index})">
                            <img src="${API_URL}/FotoBarang/${photo}" alt="Foto ${index + 1}" onerror="this.style.display='none'">
                            ${photos.length > 1 ? `<span class="photo-number">${index + 1}</span>` : ''}
                        </div>
                    `).join('')}
                    ${remaining > 0 ? `<div class="photo-thumbnail more-photos" onclick="window.openSlideshow(${photosJson}, 0)">
                        <span>+${remaining}</span>
                    </div>` : ''}
                </div>
            `;
        } else {
            photosHtml = `
                <div class="table-image-placeholder">
                    <i class="ri-image-line"></i>
                </div>
            `;
        }
        
        return `
            <tr>
                <td>${photosHtml}</td>
                <td><strong>${item.namaBarang || '-'}</strong></td>
                <td>${item.deskripsiBarang || '-'}</td>
                <td><span class="${getConditionBadgeClass(item.kondisiBarang)}">${getConditionLabel(item.kondisiBarang)}</span></td>
                <td>
                    <span class="stock-badge ${item.jumlahBarang > 0 ? 'available' : 'empty'}">
                        ${item.jumlahBarang || 0}
                    </span>
                </td>
                <td>${formatDate(item.createdAt)}</td>
            </tr>
        `;
    }).join('');
}

// ============================================
// FILTER DATA
// ============================================
function filterData() {
    const searchQuery = searchInput.value.toLowerCase();
    let filtered = allGoods;

    if (searchQuery) {
        filtered = filtered.filter(item => 
            item.namaBarang && item.namaBarang.toLowerCase().includes(searchQuery)
        );
    }

    if (currentFilter !== 'all') {
        filtered = filtered.filter(item => 
            item.kondisiBarang === currentFilter
        );
    }

    filtered.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
    });

    renderTable(filtered);
    updateCounts();
}

// ============================================
// UPDATE COUNTS
// ============================================
function updateCounts() {
    document.getElementById('countAll').textContent = allGoods.length;
    
    const counts = { 'layak': 0, 'perbaikan': 0, 'penggantian': 0 };
    allGoods.forEach(item => {
        if (counts.hasOwnProperty(item.kondisiBarang)) {
            counts[item.kondisiBarang]++;
        }
    });
    
    document.getElementById('countLayak').textContent = counts['layak'];
    document.getElementById('countPerbaikan').textContent = counts['perbaikan'];
    document.getElementById('countPenggantian').textContent = counts['penggantian'];
}

// ============================================
// TAB FILTER
// ============================================
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.filter;
        filterData();
    });
});

// ============================================
// SEARCH
// ============================================
searchInput.addEventListener('input', function() {
    if (this.value.length > 0) {
        clearSearch.style.display = 'block';
    } else {
        clearSearch.style.display = 'none';
    }
    filterData();
});

clearSearch.addEventListener('click', function() {
    searchInput.value = '';
    clearSearch.style.display = 'none';
    filterData();
});

// ============================================
// LOAD GOODS FROM API
// ============================================
async function loadGoods() {
    try {
        const response = await fetch(`${API_URL}/getAllDataBarang`);
        const data = await response.json();
        
        allGoods = [];
        
        if (data && typeof data === 'object') {
            allGoods = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
        }
        
        filterData();
    } catch (error) {
        console.error('Error loading goods:', error);
        dataBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <i class="ri-error-warning-line"></i>
                        <h3>Gagal memuat data</h3>
                        <p>Pastikan server berjalan dan coba refresh halaman.</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

// ============================================
// AUTH STATE
// ============================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadUserData();
        loadGoods();
        console.log('✅ SIMIVA Data Barang (User) loaded successfully!');
    } else {
        window.location.href = 'login.html';
    }
});

console.log('✅ SIMIVA Data Barang (User) initialized!');