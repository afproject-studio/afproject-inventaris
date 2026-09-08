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
// DOM ELEMENTS
// ============================================
const welcomeName = document.getElementById('welcomeName');
const currentDate = document.getElementById('currentDate');
const headerUserName = document.getElementById('headerUserName');
const headerProfileImage = document.getElementById('headerProfileImage');

// Stats elements
const totalBarangEl = document.getElementById('totalBarang');
const peminjamanBulanIniEl = document.getElementById('peminjamanBulanIni');
const totalPeminjamanBarangEl = document.getElementById('totalPeminjamanBarang');

// Cards untuk kondisi
const statsGrid = document.querySelector('.stats-grid');

// Activity list
const activityList = document.querySelector('.activity-list');

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');

// Logout
const logoutBtnHeader = document.getElementById('logoutBtnHeader');
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

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeText(newTheme);
    });
}

// ============================================
// SIDEBAR TOGGLE (Mobile)
// ============================================
const overlay = document.createElement('div');
overlay.className = 'sidebar-overlay';
document.body.appendChild(overlay);

function toggleSidebar() {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
}

if (menuToggle) {
    menuToggle.addEventListener('click', toggleSidebar);
}

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
// LOGOUT FUNCTION
// ============================================
function openLogoutModal() {
    logoutModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLogoutModal() {
    logoutModal.classList.remove('active');
    document.body.style.overflow = '';
}

if (logoutBtnHeader) {
    logoutBtnHeader.addEventListener('click', openLogoutModal);
}

if (logoutNo) {
    logoutNo.addEventListener('click', closeLogoutModal);
}

if (logoutYes) {
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
}

if (logoutModal) {
    logoutModal.addEventListener('click', (e) => {
        if (e.target === logoutModal) closeLogoutModal();
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && logoutModal && logoutModal.classList.contains('active')) {
        closeLogoutModal();
    }
});

// ============================================
// LOAD USER DATA
// ============================================
function loadUserData() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (userData.name) {
        welcomeName.textContent = userData.name;
        headerUserName.textContent = userData.name;
    }
    
    if (userData.photo) {
        headerProfileImage.src = userData.photo;
        headerProfileImage.onerror = function() {
            this.src = 'Logo/SIMIVA.png';
        };
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
// GET CONDITION LABEL - USER
// ============================================
function getConditionLabel(condition) {
    const labels = {
        'layak': 'Layak Digunakan',
        'perbaikan': 'Perlu Perbaikan',
        'penggantian': 'Perlu Penggantian'
    };
    return labels[condition] || condition;
}

function getConditionColor(condition) {
    const colors = {
        'layak': 'green',
        'perbaikan': 'orange',
        'penggantian': 'red'
    };
    return colors[condition] || 'blue';
}

// ============================================
// GET USER REQUESTS (Hanya untuk user yang login)
// ============================================
async function getUserRequests(userId) {
    try {
        const response = await fetch(`${API_URL}/getRequestsByUser/${userId}`);
        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error('Error loading user requests:', error);
        return [];
    }
}

// ============================================
// UPDATE DASHBOARD STATS - USER
// ============================================
async function updateDashboard(data, userId) {
    const allGoods = data || [];
    
    // 1. Total Barang
    const totalBarang = allGoods.length;
    if (totalBarangEl) {
        totalBarangEl.textContent = totalBarang.toLocaleString('id-ID');
    }
    
    // 2. Peminjaman Bulan Ini (hanya milik user yang login)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const userRequests = await getUserRequests(userId);
    
    const bulanIni = userRequests.filter(item => {
        if (!item.createdAt) return false;
        const date = new Date(item.createdAt);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    if (peminjamanBulanIniEl) {
        peminjamanBulanIniEl.textContent = bulanIni.length.toLocaleString('id-ID');
    }
    
    // 3. Total Peminjaman Barang (milik user yang login)
    if (totalPeminjamanBarangEl) {
        totalPeminjamanBarangEl.textContent = userRequests.length.toLocaleString('id-ID');
    }
    
    // 4. Total Riwayat Peminjaman (disetujui + ditolak) - hanya user yang login
    const historyCount = userRequests.filter(item => 
        item.status === 'approved' || item.status === 'rejected'
    ).length;
    
    // Tambahkan card Total Riwayat Peminjaman
    updateHistoryCard(historyCount);
    
    // 5. Update Card Kondisi
    updateConditionCards(allGoods);
    
    // 6. Update Activity (hanya untuk user yang login)
    updateActivity(userRequests);
}

// ============================================
// UPDATE HISTORY CARD
// ============================================
function updateHistoryCard(count) {
    document.querySelectorAll('.stat-card.history-card').forEach(el => el.remove());
    
    const card = document.createElement('div');
    card.className = 'stat-card history-card';
    card.innerHTML = `
        <div class="stat-icon purple">
            <i class="ri-history-line"></i>
        </div>
        <div class="stat-info">
            <h3>${count}</h3>
            <p>Total Riwayat Peminjaman</p>
        </div>
    `;
    
    const totalPeminjamanCard = document.querySelector('.stat-card:nth-child(3)');
    if (totalPeminjamanCard) {
        totalPeminjamanCard.parentNode.insertBefore(card, totalPeminjamanCard.nextSibling);
    } else {
        statsGrid.appendChild(card);
    }
}

// ============================================
// UPDATE CONDITION CARDS - USER
// ============================================
function updateConditionCards(allGoods) {
    document.querySelectorAll('.stat-card.condition-card').forEach(el => el.remove());
    
    const conditions = {
        'layak': { label: 'Layak Digunakan', icon: 'ri-checkbox-circle-line', color: 'green' },
        'perbaikan': { label: 'Perlu Perbaikan', icon: 'ri-tools-line', color: 'orange' },
        'penggantian': { label: 'Perlu Penggantian', icon: 'ri-close-circle-line', color: 'red' }
    };
    
    const counts = {
        'layak': 0,
        'perbaikan': 0,
        'penggantian': 0
    };
    
    allGoods.forEach(item => {
        if (item.kondisiBarang && counts.hasOwnProperty(item.kondisiBarang)) {
            counts[item.kondisiBarang]++;
        }
    });
    
    Object.keys(conditions).forEach(key => {
        const cond = conditions[key];
        const count = counts[key] || 0;
        
        const card = document.createElement('div');
        card.className = 'stat-card condition-card';
        card.innerHTML = `
            <div class="stat-icon ${cond.color}">
                <i class="${cond.icon}"></i>
            </div>
            <div class="stat-info">
                <h3>${count}</h3>
                <p>${cond.label}</p>
            </div>
        `;
        
        statsGrid.appendChild(card);
    });
}

// ============================================
// UPDATE ACTIVITY - USER (hanya untuk user yang login)
// ============================================
function updateActivity(userRequests) {
    if (!activityList) return;
    
    const sorted = [...userRequests].sort((a, b) => {
        const dateA = a.updatedAt || a.createdAt ? new Date(a.updatedAt || a.createdAt) : new Date(0);
        const dateB = b.updatedAt || b.createdAt ? new Date(b.updatedAt || b.createdAt) : new Date(0);
        return dateB - dateA;
    });
    
    const recent = sorted.slice(0, 5);
    
    if (recent.length === 0) {
        activityList.innerHTML = `
            <div class="activity-item">
                <div class="activity-content">
                    <p class="activity-text">Belum ada aktivitas peminjaman</p>
                    <span class="activity-time">Mulai ajukan barang sekarang</span>
                </div>
            </div>
        `;
        return;
    }
    
    activityList.innerHTML = recent.map((item) => {
        const status = item.status || 'pending';
        const returnStatus = item.returnStatus || 'waiting';
        
        // Aktivitas pengembalian
        if (returnStatus === 'returned' && status === 'approved') {
            const itemNames = (item.itemsDetail || []).map(d => d.namaBarang).join(', ');
            return `
                <div class="activity-item">
                    <div class="activity-icon purple">
                        <i class="ri-return-box-line"></i>
                    </div>
                    <div class="activity-content">
                        <p class="activity-text">
                            <strong>Anda telah mengajukan pengembalian barang</strong>
                            <br>
                            <span style="font-size:13px;">${itemNames || 'Tanpa nama'}</span>
                        </p>
                        <span class="activity-time">${formatDate(item.updatedAt || item.createdAt)}</span>
                    </div>
                </div>
            `;
        }
        
        // Aktivitas peminjaman biasa
        const statusLabel = status === 'pending' ? 'Menunggu' : 
                           status === 'approved' ? 'Disetujui' : 'Ditolak';
        const color = status === 'approved' ? 'green' : 
                      status === 'rejected' ? 'red' : 'orange';
        const icon = status === 'approved' ? 'ri-checkbox-circle-line' : 
                     status === 'rejected' ? 'ri-close-circle-line' : 'ri-time-line';
        
        const itemsCount = (item.itemsDetail || []).length;
        const itemNames = (item.itemsDetail || []).map(d => d.namaBarang).join(', ');
        
        return `
            <div class="activity-item">
                <div class="activity-icon ${color}">
                    <i class="${icon}"></i>
                </div>
                <div class="activity-content">
                    <p class="activity-text">
                        <strong>Peminjaman barang baru ditambahkan:</strong>
                        <br>
                        <span style="font-size:13px;">${itemNames || 'Tanpa nama'}</span>
                        <span style="font-size:12px;color:var(--text-light);margin-left:8px;">
                            (${itemsCount} barang, Status: ${statusLabel})
                        </span>
                    </p>
                    <span class="activity-time">${formatDate(item.createdAt)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// LOAD GOODS FROM API
// ============================================
async function loadGoods() {
    try {
        const response = await fetch(`${API_URL}/getAllDataBarang`);
        const data = await response.json();
        
        let allGoods = [];
        
        if (data && typeof data === 'object') {
            allGoods = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
        }
        
        const user = auth.currentUser;
        if (user) {
            await updateDashboard(allGoods, user.uid);
        }
        
    } catch (error) {
        console.error('Error loading goods:', error);
        if (totalBarangEl) totalBarangEl.textContent = '0';
        if (peminjamanBulanIniEl) peminjamanBulanIniEl.textContent = '0';
        if (totalPeminjamanBarangEl) totalPeminjamanBarangEl.textContent = '0';
        
        if (activityList) {
            activityList.innerHTML = `
                <div class="activity-item">
                    <div class="activity-content">
                        <p class="activity-text" style="color:var(--error-color);">
                            <i class="ri-error-warning-line"></i> Gagal memuat data
                        </p>
                        <span class="activity-time">Pastikan server berjalan</span>
                    </div>
                </div>
            `;
        }
    }
}

// ============================================
// SET CURRENT DATE
// ============================================
function setCurrentDate() {
    if (!currentDate) return;
    
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    currentDate.textContent = now.toLocaleDateString('id-ID', options);
}

// ============================================
// AUTO REFRESH
// ============================================
let refreshInterval = null;

function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    refreshInterval = setInterval(() => {
        loadGoods();
        console.log('🔄 Dashboard auto-refreshed');
    }, 30000);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// ============================================
// AUTH STATE
// ============================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadUserData();
        setCurrentDate();
        loadGoods();
        startAutoRefresh();
        console.log('✅ SIMIVA Dashboard (User) loaded successfully!');
    } else {
        window.location.href = 'login.html';
    }
});

// ============================================
// CLEANUP
// ============================================
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
});

console.log('✅ SIMIVA Dashboard (User) initialized!');