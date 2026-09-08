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
let allRequests = [];
let currentFilter = 'all';
let currentUser = null;

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

// Return modal
const returnModal = document.getElementById('returnModal');
const closeReturnModal = document.getElementById('closeReturnModal');
const cancelReturn = document.getElementById('cancelReturn');
const confirmReturn = document.getElementById('confirmReturn');

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
// NAVIGATION ACTIVE STATE
// ============================================
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        document.querySelectorAll('.nav-item').forEach(nav => {
            nav.classList.remove('active');
        });
        this.classList.add('active');
    });
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
// FORMAT DATE
// ============================================
function getDueDateWIB(dueDate) {
    if (!dueDate || typeof dueDate !== 'string') return null;
    const match = dueDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return new Date(dueDate);
    return new Date(`${match[1]}-${match[2]}-${match[3]}T23:59:59.999+07:00`);
}

function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateOnly(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
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

// ============================================
// GET STATUS PEMINJAMAN
// ============================================
function getReturnStatus(request) {
    const status = request.status || 'pending';
    const returnStatus = request.returnStatus || 'waiting';
    const dueDate = request.dueDate;
    
    if (status === 'pending') {
        return 'Menunggu Proses';
    }
    
    if (status === 'rejected') {
        return 'Tidak Dipinjamkan';
    }
    
    if (status === 'approved') {
        if (returnStatus === 'returned') {
            if (request.lateReturn === true) return 'Terlambat Dikembalikan';
            const returnedAt = request.returnTime ? new Date(request.returnTime) : null;
            const due = dueDate ? getDueDateWIB(dueDate) : null;
            if (returnedAt && due && returnedAt > due) return 'Terlambat Dikembalikan';
            return 'Berhasil Dikembalikan';
        }
        return 'Berhasil Dipinjam';
    }
    
    return 'Menunggu Proses';
}

function getReturnStatusClass(request) {
    const status = request.status || 'pending';
    const returnStatus = request.returnStatus || 'waiting';
    const dueDate = request.dueDate;
    
    if (status === 'pending') {
        return 'pending';
    }
    
    if (status === 'rejected') {
        return 'rejected';
    }
    
    if (status === 'approved') {
        if (returnStatus === 'returned') {
            if (request.lateReturn === true) return 'late';
            const returnedAt = request.returnTime ? new Date(request.returnTime) : null;
            const due = dueDate ? getDueDateWIB(dueDate) : null;
            if (returnedAt && due && returnedAt > due) return 'late';
            return 'returned';
        }
        return 'approved';
    }
    
    return 'pending';
}

// ============================================
// RENDER TABLE
// ============================================
function renderTable(data) {
    if (!data || data.length === 0) {
        dataBody.innerHTML = `
            <tr>
                <td colspan="11">
                    <div class="empty-state">
                        <i class="ri-history-line"></i>
                        <h3>Belum ada riwayat peminjaman</h3>
                        <p>Anda belum memiliki riwayat peminjaman barang</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    dataBody.innerHTML = data.map(request => {
        const itemsHtml = (request.itemsDetail || []).map(item => {
            const photos = item.fotoBarang || [];
            const firstPhoto = photos.length > 0 ? photos[0] : null;
            
            return `
                <div class="request-item-mini">
                    ${firstPhoto ? `
                        <img src="${API_URL}/FotoBarang/${firstPhoto}" alt="${item.namaBarang}" style="width:30px;height:30px;object-fit:cover;border-radius:4px;">
                    ` : `
                        <div class="table-image-placeholder" style="width:30px;height:30px;border-radius:4px;background:var(--input-bg);display:flex;align-items:center;justify-content:center;color:var(--text-light);font-size:14px;border:1px dashed var(--border-color);flex-shrink:0;">
                            <i class="ri-image-line"></i>
                        </div>
                    `}
                    <div class="item-detail">
                        <span class="item-name">${item.namaBarang || '-'}</span>
                        <span class="item-meta">${getConditionLabel(item.kondisiBarang)} | Stok: ${item.jumlahBarang}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        let quantityHtml = '';
        if (request.itemsDetail && request.itemsDetail.length > 0) {
            const quantityItems = request.itemsDetail.map(item => {
                const qty = item.requestedQuantity || 1;
                return `
                    <div class="qty-item">
                        <span class="qty-name">${item.namaBarang}</span>:<span class="qty-value">${qty}</span>
                    </div>
                `;
            }).join('');
            quantityHtml = `<div class="quantity-list">${quantityItems}</div>`;
        } else {
            quantityHtml = `<div style="font-size:13px;font-weight:600;color:var(--primary-color);text-align:center;">${request.quantity || 1}</div>`;
        }
        
        const status = request.status || 'pending';
        const statusLabel = status === 'approved' ? 'Disetujui' : 
                           status === 'rejected' ? 'Ditolak' : 'Belum Diketahui';
        const statusClass = status === 'approved' ? 'approved' : 
                           status === 'rejected' ? 'rejected' : 'pending';
        const userJabatan = request.userJabatan || '-';
        const dueDate = request.dueDate || '-';
        const returnStatusLabel = getReturnStatus(request);
        const returnStatusClass = getReturnStatusClass(request);
        
        // Cek apakah tombol pengembalian bisa ditampilkan
        const canReturn = status === 'approved' &&
                         (request.returnStatus || 'waiting') === 'waiting';
        
        let actionHtml = '';
        if (canReturn) {
            const isOverdue = request.dueDate && getDueDateWIB(request.dueDate) < new Date();
            actionHtml = `
                <button class="action-btn return-btn" data-id="${request.id}">
                    <i class="ri-return-box-line"></i> ${isOverdue ? 'Kembalikan (Terlambat)' : 'Ajukan Pengembalian'}
                </button>
            `;
        } else if (status === 'approved' && (request.returnStatus || 'waiting') === 'returned') {
            actionHtml = `
                <span class="action-btn returned-btn">
                    <i class="ri-checkbox-circle-line"></i> Dikembalikan
                </span>
            `;
        } else {
            actionHtml = `
                <span class="action-btn disabled-btn">
                    <i class="ri-subtract-line"></i> -
                </span>
            `;
        }
        
        return `
            <tr>
                <td>
                    <div class="admin-info">
                        <span class="admin-name">${request.adminName || 'Admin'}</span>
                    </div>
                </td>
                <td>
                    <div>${formatDate(request.updatedAt || request.createdAt)}</div>
                </td>
                <td>
                    <div style="font-size:13px;color:var(--text-color);text-align:center;">
                        ${userJabatan}
                    </div>
                </td>
                <td>
                    <div class="request-items">
                        ${itemsHtml}
                    </div>
                </td>
                <td>
                    <div style="font-size:13px;color:var(--text-color);text-align:center;font-weight:500;">
                        ${formatDateOnly(dueDate)}
                    </div>
                </td>
                <td>
                    <div style="max-width:150px;font-size:13px;color:var(--text-color);word-wrap:break-word;">
                        ${request.reason || '-'}
                    </div>
                </td>
                <td>
                    ${quantityHtml}
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${statusLabel}</span>
                </td>
                <td>
                    <div class="admin-note ${request.adminNote ? '' : 'empty'}">
                        ${request.adminNote || '-'}
                    </div>
                </td>
                <td>
                    <span class="return-status-badge ${returnStatusClass}">${returnStatusLabel}</span>
                </td>
                <td>
                    ${actionHtml}
                </td>
            </tr>
        `;
    }).join('');
    
    document.querySelectorAll('.return-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            openReturnModal(id);
        });
    });
}

// ============================================
// RETURN MODAL
// ============================================
let returnTargetId = null;

function openReturnModal(id) {
    returnTargetId = id;
    returnModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeReturnModalFn() {
    returnModal.classList.remove('active');
    document.body.style.overflow = '';
    returnTargetId = null;
}

closeReturnModal.addEventListener('click', closeReturnModalFn);
cancelReturn.addEventListener('click', closeReturnModalFn);

returnModal.addEventListener('click', (e) => {
    if (e.target === returnModal) closeReturnModalFn();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && returnModal.classList.contains('active')) {
        closeReturnModalFn();
    }
});

// ============================================
// CONFIRM RETURN
// ============================================
confirmReturn.addEventListener('click', async () => {
    if (!returnTargetId) return;

    try {
        confirmReturn.disabled = true;
        confirmReturn.textContent = 'Memproses...';

        const response = await fetch(`${API_URL}/updateRequest/${returnTargetId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                returnStatus: 'returned',
                updatedAt: new Date().toISOString()
            })
        });

        const result = await response.json();

        if (result.success) {
            closeReturnModalFn();
            alert('Pengembalian berhasil diajukan. Barang akan diperiksa oleh admin.');
            await loadRequests();
        } else {
            alert(result.message || 'Gagal mengajukan pengembalian');
        }
    } catch (error) {
        console.error('Error submitting return:', error);
        alert('Gagal mengajukan pengembalian: ' + error.message);
    } finally {
        confirmReturn.disabled = false;
        confirmReturn.textContent = 'Ajukan Pengembalian';
    }
});

// ============================================
// FILTER DATA - HANYA UNTUK USER YANG LOGIN
// ============================================
function filterData() {
    if (!currentUser) return;
    
    const searchQuery = searchInput.value.toLowerCase();
    // USER: Hanya menampilkan data milik user yang login
    let filtered = allRequests.filter(item => item.userId === currentUser.uid);

    if (currentFilter !== 'all') {
        filtered = filtered.filter(item => item.status === currentFilter);
    }

    if (searchQuery) {
        filtered = filtered.filter(item => {
            return (item.itemsDetail || []).some(detail => 
                (detail.namaBarang || '').toLowerCase().includes(searchQuery)
            );
        });
    }

    filtered.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
    });

    renderTable(filtered);
    updateCounts(filtered);
}

// ============================================
// UPDATE COUNTS
// ============================================
function updateCounts(filteredData) {
    // USER: Hanya untuk user yang login
    const userRequests = allRequests.filter(item => item.userId === currentUser.uid);
    
    document.getElementById('countAll').textContent = userRequests.length;
    
    const approved = userRequests.filter(item => item.status === 'approved').length;
    const rejected = userRequests.filter(item => item.status === 'rejected').length;
    const pending = userRequests.filter(item => item.status === 'pending').length;
    
    document.getElementById('countApproved').textContent = approved;
    document.getElementById('countRejected').textContent = rejected;
    document.getElementById('countPending').textContent = pending;
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
// LOAD REQUESTS
// ============================================
async function loadRequests() {
  try {
    const response = await fetch(`${API_URL}/getAllRequests`);
    const data = await response.json();
    
    allRequests = [];
    
    if (data && typeof data === 'object') {
      const requestPromises = Object.keys(data).map(async (key) => {
        const request = {
          id: key,
          ...data[key]
        };
        
        if (request.userId) {
          try {
            const userResponse = await fetch(`${API_URL}/getUserData/${request.userId}`);
            const userResult = await userResponse.json();
            if (userResult && userResult.success) {
              const userData = userResult.data;
              request.userJabatan = userData.jabatan_User || '-';
              request.userName = userData.name_User || request.userName || 'User';
            } else {
              request.userJabatan = '-';
            }
          } catch (userError) {
            console.error('Error fetching user data for userId:', request.userId, userError);
            request.userJabatan = '-';
          }
        }
        return request;
      });
      
      allRequests = await Promise.all(requestPromises);
    }
    
    filterData();
  } catch (error) {
    console.error('Error loading requests:', error);
    dataBody.innerHTML = `
      <tr>
        <td colspan="11">
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
// AUTO REFRESH
// ============================================
let refreshInterval = null;

function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    refreshInterval = setInterval(() => {
        loadRequests();
        console.log('🔄 Riwayat Peminjaman auto-refreshed');
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
        currentUser = user;
        loadUserData();
        loadRequests();
        startAutoRefresh();
        console.log('✅ SIMIVA Riwayat Peminjaman loaded successfully!');
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

console.log('✅ SIMIVA Riwayat Peminjaman initialized!');