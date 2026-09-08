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
// GLOBAL VARIABLES
// ============================================
let allUsers = [];

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
        localStorage.removeItem('adminData');
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
// LOAD ADMIN DATA
// ============================================
function loadAdminData() {
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    
    const userNameEl = document.getElementById('userName');
    const profileAvatarEl = document.getElementById('profileAvatar');
    
    if (adminData.name) {
        if (userNameEl) userNameEl.textContent = adminData.name;
    }
    
    if (adminData.photo) {
        if (profileAvatarEl) {
            profileAvatarEl.src = adminData.photo;
            profileAvatarEl.onerror = function() {
                this.src = 'Logo/SIMIVA.png';
            };
        }
    }
}

// ============================================
// FORMAT DATE
// ============================================
function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// ============================================
// RENDER TABLE
// ============================================
function renderTable(data) {
    if (!data || data.length === 0) {
        dataBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <i class="ri-user-3-line"></i>
                        <h3>Belum ada user terdaftar</h3>
                        <p>Belum ada user yang mendaftar di sistem</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    dataBody.innerHTML = data.map(user => {
        const photo = user.foto_User || 'Logo/SIMIVA.png';
        
        return `
            <tr>
                <td>
                    <img src="${photo}" alt="${user.name_User}" class="user-avatar-table" onerror="this.src='Logo/SIMIVA.png'">
                </td>
                <td><strong>${user.name_User || '-'}</strong></td>
                <td>${user.jabatan_User || '-'}</td>
                <td>${user.nohp_User || '-'}</td>
                <td>${user.username || '-'}</td>
                <td>${formatDate(user.tanggal_daftar)}</td>
            </tr>
        `;
    }).join('');
}

// ============================================
// FILTER DATA
// ============================================
function filterData() {
    const searchQuery = searchInput.value.toLowerCase();
    let filtered = allUsers;

    if (searchQuery) {
        filtered = filtered.filter(user => 
            (user.name_User && user.name_User.toLowerCase().includes(searchQuery)) ||
            (user.jabatan_User && user.jabatan_User.toLowerCase().includes(searchQuery)) ||
            (user.username && user.username.toLowerCase().includes(searchQuery))
        );
    }

    renderTable(filtered);
}

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
// LOAD USERS FROM FIREBASE
// ============================================
async function loadUsers() {
    try {
        const snapshot = await get(ref(db, 'user'));
        
        allUsers = [];
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            allUsers = Object.keys(users).map(key => ({
                username: key,
                ...users[key]
            }));
        }
        
        filterData();
    } catch (error) {
        console.error('Error loading users:', error);
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
        loadAdminData();
        loadUsers();
        console.log('✅ SIMIVA Data User loaded successfully!');
    } else {
        window.location.href = 'login.html';
    }
});

console.log('✅ SIMIVA Data User initialized!');