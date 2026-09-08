// ============================================
// FIREBASE IMPORTS & CONFIG
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import {
    getDatabase,
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

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
const db = getDatabase(app);

// ============================================
// API CONFIG
// ============================================
const API_URL = 'http://localhost:3000';

// ============================================
// DOM ELEMENTS
// ============================================
const welcomeName = document.getElementById('welcomeName');
const currentDate = document.getElementById('currentDate');
const headerAdminName = document.getElementById('headerAdminName');
const headerProfileImage = document.getElementById('headerProfileImage');

// Stats elements
const totalBarangEl = document.getElementById('totalBarang');
const pemasukanBulanIniEl = document.getElementById('pemasukanBulanIni');
const pengajuanMasukEl = document.getElementById('pengajuanMasuk');
const laporanPengajuanEl = document.getElementById('laporanPengajuan');

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
            localStorage.removeItem('adminData');
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
// LOAD ADMIN DATA
// ============================================
function loadAdminData() {
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    
    if (adminData.name) {
        welcomeName.textContent = adminData.name;
        headerAdminName.textContent = adminData.name;
    }
    
    if (adminData.photo) {
        headerProfileImage.src = adminData.photo;
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
// GET CONDITION LABEL - ADMIN
// ============================================
function getConditionLabel(condition) {
    const labels = {
        'layak': 'Layak Digunakan',
        'perbaikan': 'Perlu Perbaikan',
        'penggantian': 'Perlu Penggantian'
    };
    return labels[condition] || condition;
}

// ============================================
// GET ALL REQUESTS
// ============================================
async function getAllRequests() {
    try {
        const response = await fetch(`${API_URL}/getAllRequests`);
        const data = await response.json();
        const requests = [];
        if (data && typeof data === 'object') {
            for (const key in data) {
                requests.push({
                    id: key,
                    ...data[key]
                });
            }
        }
        return requests;
    } catch (error) {
        console.error('Error loading requests:', error);
        return [];
    }
}

// ============================================
// UPDATE DASHBOARD STATS - ADMIN
// ============================================
async function updateDashboard(data) {
    const allGoods = data || [];
    
    // 1. Total Barang
    const totalBarang = allGoods.length;
    if (totalBarangEl) {
        totalBarangEl.textContent = totalBarang.toLocaleString('id-ID');
    }
    
    // 2. Pemasukan Bulan Ini
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const bulanIni = allGoods.filter(item => {
        if (!item.createdAt) return false;
        const date = new Date(item.createdAt);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    if (pemasukanBulanIniEl) {
        pemasukanBulanIniEl.textContent = bulanIni.length.toLocaleString('id-ID');
    }
    
    // 3. Data Peminjaman Barang (total semua data peminjaman barang)
    const allRequests = await getAllRequests();
    const laporanCount = allRequests.length;
    if (pengajuanMasukEl) {
        pengajuanMasukEl.textContent = laporanCount.toLocaleString('id-ID');
    }

    // 4. Laporan Peminjaman (total semua pengajuan yang sudah diproses approved + rejected)
    const processedRequests = allRequests.filter(item => 
        item.status === 'approved' || item.status === 'rejected'
    );
    if (laporanPengajuanEl) {
        laporanPengajuanEl.textContent = processedRequests.length.toLocaleString('id-ID');
    }
    
    // 5. Update Card Kondisi
    updateConditionCards(allGoods);
    
    // 6. Update Activity - Admin
    await updateActivity(allGoods, allRequests);
}

// ============================================
// UPDATE CONDITION CARDS - ADMIN
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
// UPDATE ACTIVITY - ADMIN
// ============================================
async function updateActivity(allGoods, allRequests) {
    if (!activityList) return;
    
    const goodsActivities = allGoods.map(item => ({
        type: 'pemasukan',
        adminName: 'Admin',
        itemName: item.namaBarang || 'Tanpa nama',
        condition: item.kondisiBarang || 'layak',
        timestamp: item.createdAt || new Date().toISOString(),
        icon: 'ri-add-line',
        color: 'blue',
        text: `Barang baru ditambahkan: <strong>${item.namaBarang || 'Tanpa nama'}</strong> (${getConditionLabel(item.kondisiBarang)})`
    }));
    
    const processedRequests = (allRequests || []).filter(item => 
        item.status === 'approved' || item.status === 'rejected'
    );
    
    const requestActivities = processedRequests.map(item => {
        const adminName = item.adminName || 'Admin';
        const userName = item.userName || 'User';
        const status = item.status;
        const statusText = status === 'approved' ? 'menyetujui' : 'menolak';
        const icon = status === 'approved' ? 'ri-checkbox-circle-line' : 'ri-close-circle-line';
        const color = status === 'approved' ? 'green' : 'red';
        
        const itemsCount = (item.itemsDetail || []).length;
        const itemNames = (item.itemsDetail || []).map(d => d.namaBarang).join(', ');
        
        return {
            type: 'request',
            adminName: adminName,
            userName: userName,
            status: status,
            statusText: statusText,
            itemNames: itemNames || 'Tanpa nama',
            itemsCount: itemsCount,
            timestamp: item.updatedAt || item.createdAt || new Date().toISOString(),
            icon: icon,
            color: color,
            text: `<strong>${adminName} ${statusText} pengajuan barang dari ${userName}</strong><br>
                   <span style="font-size:13px;">${itemNames || 'Tanpa nama'}</span>
                   <span style="font-size:12px;color:var(--text-light);margin-left:8px;">
                       (${itemsCount} barang)
                   </span>`
        };
    });
    
    const allActivities = [...goodsActivities, ...requestActivities];
    
    allActivities.sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
        const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
        return dateB - dateA;
    });
    
    const recent = allActivities.slice(0, 5);
    
    if (recent.length === 0) {
        activityList.innerHTML = `
            <div class="activity-item">
                <div class="activity-content">
                    <p class="activity-text">Belum ada aktivitas</p>
                    <span class="activity-time">Mulai tambahkan barang atau proses pengajuan</span>
                </div>
            </div>
        `;
        return;
    }
    
    activityList.innerHTML = recent.map((activity) => {
        return `
            <div class="activity-item">
                <div class="activity-icon ${activity.color}">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <p class="activity-text">
                        ${activity.text}
                    </p>
                    <span class="activity-time">${formatDate(activity.timestamp)}</span>
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
        
        await updateDashboard(allGoods);
        
    } catch (error) {
        console.error('Error loading goods:', error);
        if (totalBarangEl) totalBarangEl.textContent = '0';
        if (pemasukanBulanIniEl) pemasukanBulanIniEl.textContent = '0';
        if (pengajuanMasukEl) pengajuanMasukEl.textContent = '0';
        
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
        console.log('🔄 Dashboard Admin auto-refreshed');
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
        loadAdminData();
        setCurrentDate();
        loadGoods();
        startAutoRefresh();
        console.log('✅ SIMIVA Dashboard (Admin) loaded successfully!');
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

console.log('✅ SIMIVA Dashboard (Admin) initialized!');