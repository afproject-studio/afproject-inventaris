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
let selectedItems = [];
let currentUser = null;
let itemQuantities = {};

// ============================================
// DOM ELEMENTS
// ============================================
const dataBody = document.getElementById('dataBody');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const selectAll = document.getElementById('selectAll');
const submitRequestBtn = document.getElementById('submitRequestBtn');
const selectedCount = document.getElementById('selectedCount');
const requestDueDate = document.getElementById('requestDueDate');
const quantityPerItemContainer = document.getElementById('quantityPerItemContainer');

// Modal elements
const submitModal = document.getElementById('submitModal');
const closeSubmitModal = document.getElementById('closeSubmitModal');
const cancelSubmit = document.getElementById('cancelSubmit');
const confirmSubmit = document.getElementById('confirmSubmit');
const requestList = document.getElementById('requestList');
const requestReason = document.getElementById('requestReason');

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const logoutBtn = document.getElementById('logoutBtn');
const logoutModal = document.getElementById('logoutModal');
const logoutYes = document.getElementById('logoutYes');
const logoutNo = document.getElementById('logoutNo');

// Success modal
const successModal = document.getElementById('successModal');
const successMessage = document.getElementById('successMessage');
const successOk = document.getElementById('successOk');

// WhatsApp float
const whatsappFloat = document.getElementById('whatsappFloat');
const whatsappBtn = document.getElementById('whatsappBtn');

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
// WHATSAPP FLOAT - DRAG AND CLICK
// ============================================
let isDragging = false;
let dragStartX, dragStartY;
let startX, startY;

whatsappFloat.addEventListener('mousedown', (e) => {
    isDragging = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    startX = whatsappFloat.offsetLeft || 0;
    startY = whatsappFloat.offsetTop || 0;
    
    const onMouseMove = (e2) => {
        const dx = e2.clientX - dragStartX;
        const dy = e2.clientY - dragStartY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            isDragging = true;
        }
        if (isDragging) {
            const newX = Math.max(0, Math.min(window.innerWidth - 60, startX + dx));
            const newY = Math.max(0, Math.min(window.innerHeight - 60, startY + dy));
            whatsappFloat.style.left = newX + 'px';
            whatsappFloat.style.top = newY + 'px';
            whatsappFloat.style.right = 'auto';
            whatsappFloat.style.bottom = 'auto';
        }
    };
    
    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        if (!isDragging) {
            window.open('https://wa.me/6287855819772', '_blank');
        }
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
});

// Touch support for mobile
whatsappFloat.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    isDragging = false;
    dragStartX = touch.clientX;
    dragStartY = touch.clientY;
    startX = whatsappFloat.offsetLeft || 0;
    startY = whatsappFloat.offsetTop || 0;
    
    const onTouchMove = (e2) => {
        const touch2 = e2.touches[0];
        const dx = touch2.clientX - dragStartX;
        const dy = touch2.clientY - dragStartY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            isDragging = true;
        }
        if (isDragging) {
            const newX = Math.max(0, Math.min(window.innerWidth - 60, startX + dx));
            const newY = Math.max(0, Math.min(window.innerHeight - 60, startY + dy));
            whatsappFloat.style.left = newX + 'px';
            whatsappFloat.style.top = newY + 'px';
            whatsappFloat.style.right = 'auto';
            whatsappFloat.style.bottom = 'auto';
        }
    };
    
    const onTouchEnd = () => {
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
        if (!isDragging) {
            window.open('https://wa.me/6287855819772', '_blank');
        }
    };
    
    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
});

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
// RENDER TABLE
// ============================================
function renderTable(data) {
    if (!data || data.length === 0) {
        dataBody.innerHTML = `
            <tr>
                <td colspan="7">
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

    // USER: Hanya kondisi 'layak' (Layak Digunakan) yang bisa dipinjam
    const canCheck = (condition) => {
        return condition === 'layak';
    };

    dataBody.innerHTML = data.map(item => {
        const isCheckable = canCheck(item.kondisiBarang) && item.jumlahBarang > 0;
        const isChecked = selectedItems.some(id => id === item.id);
        
        const photos = item.fotoBarang || [];
        const photosJson = JSON.stringify(photos).replace(/"/g, '&quot;');
        const displayPhotos = photos.slice(0, 3);
        const remaining = photos.length - 3;
        
        let photosHtml = '';
        if (photos.length > 0) {
            photosHtml = `
                <div class="photo-thumbnails ${photos.length > 3 ? 'has-many' : ''}">
                    ${displayPhotos.map((photo, index) => `
                        <div class="photo-thumbnail" onclick="window.openSlideshow(${photosJson}, ${index})">
                            <img src="${API_URL}/FotoBarang/${photo}" alt="Foto ${index + 1}" onerror="this.style.display='none'">
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
        
        // Tampilkan pesan jika tidak bisa dipinjam
        let statusMessage = '';
        if (!isCheckable && item.jumlahBarang > 0) {
            statusMessage = `<span style="font-size:11px;color:var(--text-light);">(Tidak dapat dipinjam)</span>`;
        } else if (item.jumlahBarang === 0) {
            statusMessage = `<span style="font-size:11px;color:var(--error-color);">(Stok habis)</span>`;
        }
        
        return `
            <tr>
                <td>
                    <input type="checkbox" 
                           data-id="${item.id}"
                           ${isCheckable ? '' : 'disabled'}
                           ${isChecked ? 'checked' : ''}>
                </td>
                <td>${photosHtml}</td>
                <td><strong>${item.namaBarang || '-'}</strong></td>
                <td>${item.deskripsiBarang || '-'}</td>
                <td>
                    <span class="${getConditionBadgeClass(item.kondisiBarang)}">${getConditionLabel(item.kondisiBarang)}</span>
                    ${statusMessage}
                </td>
                <td>
                    <span class="stock-badge ${item.jumlahBarang > 0 ? 'available' : 'empty'}">
                        ${item.jumlahBarang || 0}
                    </span>
                </td>
                <td>${formatDate(item.createdAt)}</td>
            </tr>
        `;
    }).join('');

    document.querySelectorAll('#dataBody input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const id = this.dataset.id;
            if (this.checked) {
                if (!selectedItems.includes(id)) {
                    selectedItems.push(id);
                }
            } else {
                selectedItems = selectedItems.filter(itemId => itemId !== id);
                delete itemQuantities[id];
            }
            updateSubmitButton();
        });
    });
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
// UPDATE SUBMIT BUTTON
// ============================================
function updateSubmitButton() {
    // USER: Hanya kondisi 'layak' yang bisa dipilih
    const canCheck = (condition) => {
        return condition === 'layak';
    };
    
    const validSelected = allGoods.filter(item => 
        selectedItems.includes(item.id) && 
        canCheck(item.kondisiBarang) && 
        item.jumlahBarang > 0
    );
    
    selectedItems = validSelected.map(item => item.id);
    
    if (selectedItems.length > 0) {
        submitRequestBtn.style.display = 'flex';
        selectedCount.textContent = selectedItems.length;
    } else {
        submitRequestBtn.style.display = 'none';
    }
}

// ============================================
// SELECT ALL (Hanya untuk kondisi 'layak')
// ============================================
selectAll.addEventListener('change', function() {
    // USER: Hanya kondisi 'layak' yang bisa dipilih
    const canCheck = (condition) => {
        return condition === 'layak';
    };
    
    const visibleItems = allGoods.filter(item => {
        if (currentFilter !== 'all' && item.kondisiBarang !== currentFilter) return false;
        const searchQuery = searchInput.value.toLowerCase();
        if (searchQuery && !item.namaBarang.toLowerCase().includes(searchQuery)) return false;
        return true;
    });
    
    const checkableItems = visibleItems.filter(item => 
        canCheck(item.kondisiBarang) && item.jumlahBarang > 0
    );
    
    if (this.checked) {
        checkableItems.forEach(item => {
            if (!selectedItems.includes(item.id)) {
                selectedItems.push(item.id);
            }
        });
    } else {
        const checkableIds = checkableItems.map(item => item.id);
        selectedItems = selectedItems.filter(id => !checkableIds.includes(id));
        checkableIds.forEach(id => {
            delete itemQuantities[id];
        });
    }
    
    document.querySelectorAll('#dataBody input[type="checkbox"]').forEach(checkbox => {
        const id = checkbox.dataset.id;
        checkbox.checked = selectedItems.includes(id);
    });
    
    updateSubmitButton();
});

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
    updateSubmitButton();
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
        selectedItems = [];
        itemQuantities = {};
        document.querySelectorAll('#dataBody input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        selectAll.checked = false;
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
    selectedItems = [];
    itemQuantities = {};
    document.querySelectorAll('#dataBody input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    selectAll.checked = false;
    filterData();
});

clearSearch.addEventListener('click', function() {
    searchInput.value = '';
    clearSearch.style.display = 'none';
    selectedItems = [];
    itemQuantities = {};
    document.querySelectorAll('#dataBody input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    selectAll.checked = false;
    filterData();
});

// ============================================
// SET DUE DATE MIN/MAX
// ============================================
function setDueDateLimits() {
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 14);
    
    const todayStr = today.toISOString().split('T')[0];
    const maxDateStr = maxDate.toISOString().split('T')[0];
    
    requestDueDate.min = todayStr;
    requestDueDate.max = maxDateStr;
}

// ============================================
// RENDER QUANTITY PER ITEM
// ============================================
function renderQuantityPerItem() {
    if (!quantityPerItemContainer) return;
    
    const selectedData = allGoods.filter(item => selectedItems.includes(item.id));
    
    if (selectedData.length === 0) {
        quantityPerItemContainer.innerHTML = `
            <div class="quantity-item-row" style="justify-content:center;color:var(--text-light);">
                <span>Tidak ada barang yang dipilih</span>
            </div>
        `;
        return;
    }
    
    quantityPerItemContainer.innerHTML = selectedData.map(item => {
        const currentQty = itemQuantities[item.id] || 1;
        return `
            <div class="quantity-item-row">
                <span class="item-name-label">${item.namaBarang}</span>
                <span class="item-stock-label">Stok: ${item.jumlahBarang}</span>
                <input type="number" 
                       class="qty-input" 
                       data-id="${item.id}" 
                       value="${currentQty}" 
                       min="1" 
                       max="${item.jumlahBarang}">
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.qty-input').forEach(input => {
        input.addEventListener('change', function() {
            const id = this.dataset.id;
            const value = parseInt(this.value);
            const maxStock = allGoods.find(item => item.id === id)?.jumlahBarang || 0;
            
            if (isNaN(value) || value < 1) {
                this.value = 1;
                itemQuantities[id] = 1;
            } else if (value > maxStock) {
                this.value = maxStock;
                itemQuantities[id] = maxStock;
                alert(`Stok ${allGoods.find(item => item.id === id)?.namaBarang} hanya ${maxStock} barang`);
            } else {
                itemQuantities[id] = value;
            }
        });
        
        input.addEventListener('input', function() {
            const id = this.dataset.id;
            const value = parseInt(this.value);
            const maxStock = allGoods.find(item => item.id === id)?.jumlahBarang || 0;
            
            if (!isNaN(value) && value >= 1 && value <= maxStock) {
                itemQuantities[id] = value;
            }
        });
    });
}

// ============================================
// SUBMIT REQUEST
// ============================================
submitRequestBtn.addEventListener('click', function() {
    if (selectedItems.length === 0) return;
    
    const selectedData = allGoods.filter(item => selectedItems.includes(item.id));
    
    selectedData.forEach(item => {
        if (!itemQuantities[item.id]) {
            itemQuantities[item.id] = 1;
        }
    });
    
    requestList.innerHTML = selectedData.map(item => {
        const photos = item.fotoBarang || [];
        const firstPhoto = photos.length > 0 ? photos[0] : null;
        const qty = itemQuantities[item.id] || 1;
        
        return `
            <div class="request-item">
                ${firstPhoto ? `
                    <img src="${API_URL}/FotoBarang/${firstPhoto}" alt="${item.namaBarang}">
                ` : `
                    <div class="table-image-placeholder" style="width:50px;height:50px;border-radius:var(--radius-sm);background:var(--input-bg);display:flex;align-items:center;justify-content:center;color:var(--text-light);font-size:24px;border:2px dashed var(--border-color);flex-shrink:0;">
                        <i class="ri-image-line"></i>
                    </div>
                `}
                <div class="item-info">
                    <div class="item-name">${item.namaBarang}</div>
                    <div class="item-detail">${item.deskripsiBarang || '-'} | ${getConditionLabel(item.kondisiBarang)} | Stok: ${item.jumlahBarang} | Jumlah: ${qty}</div>
                </div>
            </div>
        `;
    }).join('');
    
    renderQuantityPerItem();
    
    requestReason.value = '';
    setDueDateLimits();
    
    submitModal.classList.add('active');
    document.body.style.overflow = 'hidden';
});

// Close submit modal
function closeSubmitModalFn() {
    submitModal.classList.remove('active');
    document.body.style.overflow = '';
    requestReason.value = '';
    requestDueDate.value = '';
}

closeSubmitModal.addEventListener('click', closeSubmitModalFn);
cancelSubmit.addEventListener('click', closeSubmitModalFn);

submitModal.addEventListener('click', (e) => {
    if (e.target === submitModal) closeSubmitModalFn();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && submitModal.classList.contains('active')) {
        closeSubmitModalFn();
    }
});

// ============================================
// CONFIRM SUBMIT
// ============================================
confirmSubmit.addEventListener('click', async function() {
    const reason = requestReason.value.trim();
    const dueDate = requestDueDate.value;
    
    if (!reason) {
        alert('Harap masukkan alasan peminjaman!');
        requestReason.focus();
        return;
    }
    
    if (!dueDate) {
        alert('Harap pilih batas waktu peminjaman!');
        requestDueDate.focus();
        return;
    }
    
    if (selectedItems.length === 0) {
        alert('Tidak ada barang yang dipilih');
        return;
    }
    
    let allValid = true;
    let errorMessage = '';
    
    selectedItems.forEach(id => {
        const qty = itemQuantities[id] || 0;
        const item = allGoods.find(g => g.id === id);
        if (qty < 1) {
            allValid = false;
            errorMessage = `Jumlah untuk ${item?.namaBarang || 'barang'} minimal 1`;
        } else if (qty > (item?.jumlahBarang || 0)) {
            allValid = false;
            errorMessage = `Jumlah untuk ${item?.namaBarang || 'barang'} melebihi stok yang tersedia (${item?.jumlahBarang || 0})`;
        }
    });
    
    if (!allValid) {
        alert(errorMessage);
        return;
    }
    
    try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        let totalQuantity = 0;
        selectedItems.forEach(id => {
            totalQuantity += (itemQuantities[id] || 1);
        });
        
        const requestData = {
            userId: currentUser.uid,
            userName: userData.name || 'User',
            userEmail: userData.email || '',
            items: selectedItems,
            itemsDetail: allGoods.filter(item => selectedItems.includes(item.id)).map(item => ({
                ...item,
                requestedQuantity: itemQuantities[item.id] || 1
            })),
            reason: reason,
            quantity: totalQuantity,
            dueDate: dueDate,
            status: 'pending',
            returnStatus: 'waiting',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const response = await fetch(`${API_URL}/addRequest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeSubmitModalFn();
            selectedItems = [];
            itemQuantities = {};
            document.querySelectorAll('#dataBody input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });
            selectAll.checked = false;
            updateSubmitButton();
            showSuccess('Peminjaman berhasil dikirim!');
        } else {
            alert(result.message || 'Gagal mengirim peminjaman');
        }
    } catch (error) {
        console.error('Error submitting request:', error);
        alert('Gagal mengirim peminjaman: ' + error.message);
    }
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
                <td colspan="7">
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
        currentUser = user;
        loadUserData();
        loadGoods();
        console.log('✅ SIMIVA Peminjaman Barang loaded successfully!');
    } else {
        window.location.href = 'login.html';
    }
});

console.log('✅ SIMIVA Peminjaman Barang initialized!');