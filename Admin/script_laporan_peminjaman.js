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

// Filter elements
const filterDate = document.getElementById('filterDate');
const clearFilter = document.getElementById('clearFilter');

// Export buttons
const exportPDF = document.getElementById('exportPDF');
const exportExcel = document.getElementById('exportExcel');

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const logoutBtn = document.getElementById('logoutBtn');
const logoutModal = document.getElementById('logoutModal');
const logoutYes = document.getElementById('logoutYes');
const logoutNo = document.getElementById('logoutNo');
const returnInspectionModal = document.getElementById('returnInspectionModal');
const closeReturnInspection = document.getElementById('closeReturnInspection');
const cancelReturnInspection = document.getElementById('cancelReturnInspection');
const saveReturnInspection = document.getElementById('saveReturnInspection');
const inspectionItemsContainer = document.getElementById('inspectionItemsContainer');
const returnInspectionNote = document.getElementById('returnInspectionNote');

let inspectionTargetId = null;


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

function getReturnConditionHtml(request) {
    const inspection = request.returnInspection;
    const conditions = inspection && Array.isArray(inspection.conditions)
        ? inspection.conditions
        : (Array.isArray(request.returnConditions) ? request.returnConditions : []);

    if (request.returnStatus !== 'returned') {
        return `<div style="font-size:13px;color:var(--text-light);text-align:center;">Belum dikembalikan</div>`;
    }

    if (conditions.length === 0) {
        return `
            <div style="text-align:center;">
                <div style="font-size:12px;color:var(--text-light);margin-bottom:6px;">Belum diperiksa</div>
                <button class="btn-inspect-return" data-request-id="${request.id}"
                    style="border:0;border-radius:7px;padding:7px 10px;cursor:pointer;background:var(--primary-color);color:#fff;font-size:12px;">
                    Periksa Kondisi
                </button>
            </div>
        `;
    }

    const changed = conditions.some(item =>
        (item.kondisiAwal || '') !== (item.kondisiKembali || '')
    );

    const statusText = changed ? '⚠ Kondisi berubah' : '✓ Kondisi sesuai';
    const statusColor = changed ? 'var(--error-color)' : 'var(--success-color)';

    return `
        <div style="min-width:145px;">
            ${conditions.map(item => `
                <div style="font-size:12px;line-height:1.45;margin-bottom:6px;">
                    <strong>${item.namaBarang || '-'}</strong><br>
                    <span style="color:var(--text-light);">${getConditionLabel(item.kondisiAwal || 'layak')}</span>
                    <span style="margin:0 3px;">→</span>
                    <strong style="color:${(item.kondisiAwal || '') !== (item.kondisiKembali || '') ? 'var(--error-color)' : 'var(--success-color)'}">
                        ${getConditionLabel(item.kondisiKembali || 'layak')}
                    </strong>
                </div>
            `).join('')}
            <div style="font-size:11px;font-weight:600;color:${statusColor};margin-bottom:6px;">${statusText}</div>
            <button class="btn-inspect-return" data-request-id="${request.id}"
                style="border:0;border-radius:7px;padding:6px 9px;cursor:pointer;background:var(--primary-color);color:#fff;font-size:11px;">
                ${inspection ? 'Ubah Pemeriksaan' : 'Periksa Kondisi'}
            </button>
        </div>
    `;
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
            if (request.lateReturn === true) {
                const days = Number(request.lateReturnDays || 0);
                const hours = Number(request.lateReturnHours || 0);
                if (days > 0) return `Terlambat Dikembalikan (${days} hari${hours ? ` ${hours} jam` : ''})`;
                if (hours > 0) return `Terlambat Dikembalikan (${hours} jam)`;
                return 'Terlambat Dikembalikan';
            }
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
                <td colspan="12">
                    <div class="empty-state">
                        <i class="ri-file-chart-line"></i>
                        <h3>Belum ada laporan peminjaman</h3>
                        <p>Belum ada peminjaman yang diproses</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    dataBody.innerHTML = data.map(request => {
        const userPhoto = request.userPhoto || 'Logo/SIMIVA.png';
        const userJabatan = request.userJabatan || '-';
        const quantity = request.quantity || 1;
        const dueDate = request.dueDate || '-';
        const returnTime = request.returnTime || '-';
        
        // Buat quantity list per item
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
            quantityHtml = `<div style="font-size:13px;font-weight:600;color:var(--primary-color);text-align:center;">${quantity}</div>`;
        }
        
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
        const statusLabel = status === 'approved' ? 'Disetujui' : 
                           status === 'rejected' ? 'Ditolak' : 'Menunggu';
        const statusClass = status === 'approved' ? 'approved' : 
                           status === 'rejected' ? 'rejected' : 'pending';
        const returnStatusLabel = getReturnStatus(request);
        const returnStatusClass = getReturnStatusClass(request);
        
        // Format waktu pengembalian
        const returnTimeFormatted = returnTime !== '-' ? formatDate(returnTime) : '-';
        
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
                    <div>${formatDate(request.updatedAt || request.createdAt)}</div>
                </td>
                <td>
                    <div class="request-items">
                        ${itemsHtml}
                    </div>
                </td>
                <td>
                    ${getReturnConditionHtml(request)}
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
                    <div style="font-size:13px;color:var(--text-color);text-align:center;">
                        ${returnTimeFormatted}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================
// FILTER DATA
// ============================================
function filterData() {
    const searchQuery = searchInput.value.toLowerCase();
    let filtered = allRequests;

    // Filter berdasarkan status
    if (currentFilter !== 'all') {
        filtered = filtered.filter(item => item.status === currentFilter);
    }

    // Filter berdasarkan tanggal
    const dateValue = filterDate.value;

    if (dateValue) {
        const selectedDate = new Date(dateValue);
        filtered = filtered.filter(item => {
            const itemDate = new Date(item.createdAt);
            return itemDate.toDateString() === selectedDate.toDateString();
        });
    }

    if (searchQuery) {
        filtered = filtered.filter(item => {
            const userName = (item.userName || '').toLowerCase();
            const itemsMatch = (item.itemsDetail || []).some(detail => 
                (detail.namaBarang || '').toLowerCase().includes(searchQuery)
            );
            return userName.includes(searchQuery) || itemsMatch;
        });
    }

    // Sort by updatedAt descending (newest first)
    filtered.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(0);
        const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(0);
        return dateB - dateA;
    });

    renderTable(filtered);
    updateCounts();
}

// ============================================
// UPDATE COUNTS
// ============================================
function updateCounts() {
    document.getElementById('countAll').textContent = allRequests.length;
    
    const approved = allRequests.filter(item => item.status === 'approved').length;
    const rejected = allRequests.filter(item => item.status === 'rejected').length;
    const pending = allRequests.filter(item => item.status === 'pending').length;
    
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
// DATE FILTERS
// ============================================
filterDate.addEventListener('change', filterData);

clearFilter.addEventListener('click', function() {
    filterDate.value = '';
    filterData();
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
// EXPORT PDF
// ============================================
exportPDF.addEventListener('click', function() {
    const table = document.getElementById('reportTable');
    const rows = table.querySelectorAll('tr');
    let html = `
        <html>
        <head>
            <title>Laporan Peminjaman SIMIVA</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { text-align: center; color: #1E3A8A; margin-bottom: 5px; }
                .subtitle { text-align: center; color: #6B7280; margin-top: 0; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th { background: #3BA7FF; color: white; padding: 8px; text-align: left; border: 1px solid #E5E7EB; }
                td { padding: 8px; border: 1px solid #E5E7EB; }
                tr:nth-child(even) { background: #F9FAFB; }
                .footer { text-align: center; margin-top: 20px; color: #6B7280; font-size: 12px; }
            </style>
        </head>
        <body>
            <h1>SIMIVA - Laporan Peminjaman</h1>
            <p class="subtitle">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <table>
                <thead>
    `;
    
    // Header
    const headers = table.querySelectorAll('thead th');
    html += '<tr>';
    headers.forEach(th => {
        html += `<th>${th.textContent.trim()}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    // Body
    const bodyRows = table.querySelectorAll('tbody tr');
    bodyRows.forEach(row => {
        if (row.querySelector('.empty-state')) return;
        html += '<tr>';
        const cells = row.querySelectorAll('td');
        cells.forEach(td => {
            html += `<td>${td.textContent.trim()}</td>`;
        });
        html += '</tr>';
    });
    
    html += `
                </tbody>
            </table>
            <p class="footer">Dicetak dari SIMIVA - Sistem Manajemen Inventaris</p>
        </body>
        </html>
    `;
    
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.print();
});

// ============================================
// EXPORT EXCEL
// ============================================
exportExcel.addEventListener('click', function() {
    const table = document.getElementById('reportTable');
    const rows = table.querySelectorAll('tr');
    let csv = '';
    
    // Header
    const headers = table.querySelectorAll('thead th');
    const headerRow = [];
    headers.forEach(th => {
        headerRow.push(th.textContent.trim());
    });
    csv += headerRow.join(',') + '\n';
    
    // Body
    const bodyRows = table.querySelectorAll('tbody tr');
    bodyRows.forEach(row => {
        if (row.querySelector('.empty-state')) return;
        const cells = row.querySelectorAll('td');
        const rowData = [];
        cells.forEach(td => {
            let text = td.textContent.trim();
            if (text.includes(',')) {
                text = `"${text}"`;
            }
            rowData.push(text);
        });
        csv += rowData.join(',') + '\n';
    });
    
    // Download
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Peminjaman_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
});

// ============================================
// PEMERIKSAAN KONDISI PENGEMBALIAN OLEH ADMIN
// ============================================
function openReturnInspection(requestId) {
    const request = allRequests.find(item => item.id === requestId);
    if (!request) return;

    if (request.returnStatus !== 'returned') {
        alert('Barang belum dikembalikan oleh user.');
        return;
    }

    inspectionTargetId = requestId;

    const existing = request.returnInspection;
    const existingConditions = existing && Array.isArray(existing.conditions)
        ? existing.conditions
        : [];

    inspectionItemsContainer.innerHTML = (request.itemsDetail || []).map((item, index) => {
        const oldCondition = item.kondisiBarang || 'layak';
        const saved = existingConditions.find(c => c.itemId === item.id);
        const selected = saved ? saved.kondisiKembali : oldCondition;

        return `
            <div style="padding:14px;border:1px solid var(--border-color);border-radius:10px;background:var(--input-bg);">
                <div style="font-weight:600;margin-bottom:7px;">${index + 1}. ${item.namaBarang || '-'}</div>
                <div style="font-size:12px;color:var(--text-light);margin-bottom:8px;">
                    Kondisi saat dipinjam: <strong>${getConditionLabel(oldCondition)}</strong>
                </div>
                <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">
                    Hasil pemeriksaan admin
                </label>
                <select class="inspection-condition-select"
                    data-item-id="${item.id}"
                    data-item-name="${item.namaBarang || ''}"
                    data-original-condition="${oldCondition}"
                    style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-color);color:var(--text-color);">
                    <option value="layak" ${selected === 'layak' ? 'selected' : ''}>Layak Digunakan</option>
                    <option value="perbaikan" ${selected === 'perbaikan' ? 'selected' : ''}>Perlu Perbaikan</option>
                    <option value="penggantian" ${selected === 'penggantian' ? 'selected' : ''}>Perlu Penggantian</option>
                </select>
            </div>
        `;
    }).join('');

    returnInspectionNote.value = existing && existing.note ? existing.note : '';
    returnInspectionModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeReturnInspectionModal() {
    returnInspectionModal.classList.remove('active');
    document.body.style.overflow = '';
    inspectionTargetId = null;
}

document.addEventListener('click', (event) => {
    const button = event.target.closest('.btn-inspect-return');
    if (button) {
        openReturnInspection(button.dataset.requestId);
    }
});

closeReturnInspection.addEventListener('click', closeReturnInspectionModal);
cancelReturnInspection.addEventListener('click', closeReturnInspectionModal);

returnInspectionModal.addEventListener('click', (event) => {
    if (event.target === returnInspectionModal) {
        closeReturnInspectionModal();
    }
});

saveReturnInspection.addEventListener('click', async () => {
    if (!inspectionTargetId) return;

    const selects = [...document.querySelectorAll('.inspection-condition-select')];
    if (selects.length === 0) {
        alert('Tidak ada barang yang dapat diperiksa.');
        return;
    }

    const conditions = selects.map(select => ({
        itemId: select.dataset.itemId,
        namaBarang: select.dataset.itemName,
        kondisiAwal: select.dataset.originalCondition || 'layak',
        kondisiKembali: select.value
    }));

    const inspectionNote = returnInspectionNote.value.trim();
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');

    try {
        saveReturnInspection.disabled = true;
        saveReturnInspection.textContent = 'Menyimpan...';

        const response = await fetch(`${API_URL}/updateRequest/${inspectionTargetId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                returnInspection: {
                    conditions,
                    note: inspectionNote,
                    checkedBy: adminData.name || 'Admin'
                },
                updatedAt: new Date().toISOString()
            })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Gagal menyimpan pemeriksaan');
        }

        closeReturnInspectionModal();
        alert('Hasil pemeriksaan kondisi berhasil disimpan.');
        await loadRequests();
    } catch (error) {
        console.error('Error saving return inspection:', error);
        alert('Gagal menyimpan pemeriksaan: ' + error.message);
    } finally {
        saveReturnInspection.disabled = false;
        saveReturnInspection.textContent = 'Simpan Pemeriksaan';
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && returnInspectionModal.classList.contains('active')) {
        closeReturnInspectionModal();
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
                <td colspan="10">
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
// LOAD ADMIN DATA
// ============================================
function loadAdminData() {
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
// AUTO REFRESH
// ============================================
let refreshInterval = null;

function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    refreshInterval = setInterval(() => {
        loadRequests();
        console.log('🔄 Laporan Peminjaman auto-refreshed');
    }, 60000);
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
        loadRequests();
        startAutoRefresh();
        console.log('✅ SIMIVA Laporan Peminjaman loaded successfully!');
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

console.log('✅ SIMIVA Laporan Peminjaman initialized!');