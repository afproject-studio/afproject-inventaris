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
let adminData = {};

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

// Reject modal
const rejectModal = document.getElementById('rejectModal');
const closeRejectModal = document.getElementById('closeRejectModal');
const cancelReject = document.getElementById('cancelReject');
const confirmReject = document.getElementById('confirmReject');
const rejectReason = document.getElementById('rejectReason');

// Success modal
const successModal = document.getElementById('successModal');
const successMessage = document.getElementById('successMessage');
const successOk = document.getElementById('successOk');

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
// FORMAT DATE
// ============================================
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

function formatTimeAgo(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Baru saja';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} menit yang lalu`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam yang lalu`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} hari yang lalu`;
    return formatDate(timestamp);
}

// ============================================
// CONDITION LABEL - ADMIN
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
// RENDER TABLE
// ============================================
function renderTable(data) {
    if (!data || data.length === 0) {
        dataBody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <i class="ri-box-3-line"></i>
                        <h3>Belum ada pengajuan</h3>
                        <p>Belum ada user yang mengajukan peminjaman barang</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    dataBody.innerHTML = data.map(request => {
        const userPhoto = request.userPhoto || 'Logo/SIMIVA.png';
        const userJabatan = request.userJabatan || '-';
        
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
        
        const status = request.status || 'pending';
        const isPending = status === 'pending';
        const dueDate = request.dueDate || '-';
        
        // Buat list quantity per item
        let quantityHtml = '';
        if (request.itemsDetail && request.itemsDetail.length > 0) {
            quantityHtml = request.itemsDetail.map(item => {
                const qty = item.requestedQuantity || 1;
                return `<div style="font-size:12px;color:var(--text-color);">${item.namaBarang} : ${qty}</div>`;
            }).join('');
        } else {
            quantityHtml = `<div style="font-size:13px;font-weight:600;color:var(--primary-color);">${request.quantity || 1}</div>`;
        }
        
        let actionHtml = '';
        if (isPending) {
            actionHtml = `
                <div class="action-buttons">
                    <button class="action-btn approve-btn" data-id="${request.id}">
                        <i class="ri-check-line"></i> Setuju
                    </button>
                    <button class="action-btn reject-btn" data-id="${request.id}">
                        <i class="ri-close-line"></i> Tolak
                    </button>
                </div>
            `;
        } else if (status === 'approved') {
            actionHtml = `
                <div class="action-buttons">
                    <span class="action-btn approved-btn">
                        <i class="ri-checkbox-circle-line"></i> Menyetujui
                    </span>
                </div>
            `;
        } else if (status === 'rejected') {
            actionHtml = `
                <div class="action-buttons">
                    <span class="action-btn rejected-btn">
                        <i class="ri-close-circle-line"></i> Menolak
                    </span>
                </div>
            `;
        }
        
        return `
            <tr>
                <td>
                    <div class="user-info">
                        <img src="${userPhoto}" alt="${request.userName}" class="user-avatar" onerror="this.src='Logo/SIMIVA.png'">
                        <span class="user-name">${request.userName || 'User'}</span>
                    </div>
                </td>
                <td>
                    <div style="font-size:12px;color:var(--text-color);text-align:center;">
                        ${userJabatan}
                    </div>
                </td>
                <td>
                    <div>
                        <div>${formatDate(request.createdAt)}</div>
                        <small style="color:var(--text-light);font-size:11px;">${formatTimeAgo(request.createdAt)}</small>
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
                    <div style="font-size:13px;color:var(--text-color);">
                        ${quantityHtml}
                    </div>
                </td>
                <td>
                    ${actionHtml}
                </td>
            </tr>
        `;
    }).join('');

    document.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            handleApprove(id);
        });
    });

    document.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            openRejectModal(id);
        });
    });
}

// ============================================
// HANDLE APPROVE
// ============================================
async function handleApprove(id) {
    if (!confirm('Apakah Anda yakin ingin menyetujui pengajuan ini?')) return;
    
    try {
        const requestSnapshot = await fetch(`${API_URL}/getRequest/${id}`);
        const requestData = await requestSnapshot.json();
        
        if (!requestData || !requestData.id) {
            alert('Data request tidak ditemukan');
            return;
        }
        
        const response = await fetch(`${API_URL}/updateRequest/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'approved',
                adminName: adminData.name || 'Admin',
                quantity: requestData.quantity || 1
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('Pengajuan berhasil disetujui!');
            await loadRequests();
        } else {
            alert(result.message || 'Gagal menyetujui pengajuan');
        }
    } catch (error) {
        console.error('Error approving request:', error);
        alert('Gagal menyetujui pengajuan: ' + error.message);
    }
}

// ============================================
// REJECT MODAL
// ============================================
let rejectTargetId = null;

function openRejectModal(id) {
    rejectTargetId = id;
    rejectReason.value = '';
    rejectModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeRejectModalFn() {
    rejectModal.classList.remove('active');
    document.body.style.overflow = '';
    rejectTargetId = null;
    rejectReason.value = '';
}

closeRejectModal.addEventListener('click', closeRejectModalFn);
cancelReject.addEventListener('click', closeRejectModalFn);

rejectModal.addEventListener('click', (e) => {
    if (e.target === rejectModal) closeRejectModalFn();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && rejectModal.classList.contains('active')) {
        closeRejectModalFn();
    }
});

// ============================================
// CONFIRM REJECT
// ============================================
confirmReject.addEventListener('click', async () => {
    const reason = rejectReason.value.trim();
    if (!reason) {
        alert('Harap masukkan alasan penolakan!');
        rejectReason.focus();
        return;
    }
    
    if (!rejectTargetId) return;
    
    try {
        const response = await fetch(`${API_URL}/updateRequest/${rejectTargetId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'rejected',
                adminName: adminData.name || 'Admin',
                adminNote: reason
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeRejectModalFn();
            showSuccess('Pengajuan berhasil ditolak!');
            await loadRequests();
        } else {
            alert(result.message || 'Gagal menolak pengajuan');
        }
    } catch (error) {
        console.error('Error rejecting request:', error);
        alert('Gagal menolak pengajuan: ' + error.message);
    }
});

// ============================================
// FILTER DATA
// ============================================
function filterData() {
    const searchQuery = searchInput.value.toLowerCase();
    let filtered = allRequests;

    filtered = filtered.filter(item => item.status === 'pending');

    if (searchQuery) {
        filtered = filtered.filter(item => {
            const userName = (item.userName || '').toLowerCase();
            const itemsMatch = (item.itemsDetail || []).some(detail => 
                (detail.namaBarang || '').toLowerCase().includes(searchQuery)
            );
            return userName.includes(searchQuery) || itemsMatch;
        });
    }

    if (currentFilter !== 'all') {
        filtered = filtered.filter(item => {
            return (item.itemsDetail || []).some(detail => 
                detail.kondisiBarang === currentFilter
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
    const pendingRequests = allRequests.filter(item => item.status === 'pending');
    
    document.getElementById('countAll').textContent = pendingRequests.length;
    
    const counts = { 'layak': 0 };
    pendingRequests.forEach(item => {
        (item.itemsDetail || []).forEach(detail => {
            if (detail.kondisiBarang === 'layak') counts.layak++;
        });
    });
    
    document.getElementById('countLayak').textContent = counts.layak;
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
// SUCCESS MODAL
// ============================================
function showSuccess(message) {
    successMessage.textContent = message;
    successModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

successOk.addEventListener('click', () => {
    successModal.classList.remove('active');
    document.body.style.overflow = '';
});

successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
        successModal.classList.remove('active');
        document.body.style.overflow = '';
    }
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
              request.userPhoto = userData.foto_User || 'Logo/SIMIVA.png';
              request.userJabatan = userData.jabatan_User || '-';
              request.userName = userData.name_User || request.userName || 'User';
            } else {
              request.userPhoto = 'Logo/SIMIVA.png';
              request.userJabatan = '-';
            }
          } catch (userError) {
            console.error('Error fetching user data for userId:', request.userId, userError);
            request.userPhoto = 'Logo/SIMIVA.png';
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
        <td colspan="8">
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
// AUTO REFRESH
// ============================================
let refreshInterval = null;

function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    refreshInterval = setInterval(() => {
        loadRequests();
        console.log('🔄 Data Peminjaman Barang auto-refreshed');
    }, 30000);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// ============================================
// LOAD ADMIN DATA
// ============================================
function loadAdminData() {
    const adminDataFromStorage = JSON.parse(localStorage.getItem('adminData') || '{}');
    adminData = adminDataFromStorage;
}

// ============================================
// LOAD USER DATA
// ============================================
function loadUserData() {
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    
    const userNameEl = document.getElementById('userName');
    const profileAvatarEl = document.getElementById('profileAvatar');
    const userRoleEl = document.querySelector('.user-role');
    
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
    
    if (userRoleEl) {
        userRoleEl.textContent = 'Administrator';
    }
}

// ============================================
// AUTH STATE
// ============================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadUserData();
        loadAdminData();
        loadRequests();
        startAutoRefresh();
        console.log('✅ SIMIVA Data Peminjaman Barang loaded successfully!');
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

console.log('✅ SIMIVA Data Peminjaman Barang initialized!');