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
const MAX_PHOTOS = 5;

// ============================================
// GLOBAL VARIABLES
// ============================================
let allGoods = [];
let currentFilter = 'all';
let editingId = null;
let existingPhotoFilenames = [];

// ============================================
// DOM ELEMENTS
// ============================================
const dataBody = document.getElementById('dataBody');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const addBtn = document.getElementById('addBtn');
const formModal = document.getElementById('formModal');
const closeFormModal = document.getElementById('closeFormModal');
const cancelForm = document.getElementById('cancelForm');
const saveForm = document.getElementById('saveForm');
const formModalTitle = document.getElementById('formModalTitle');
const goodsForm = document.getElementById('goodsForm');
const goodsPhoto = document.getElementById('goodsPhoto');
const photoPreview = document.getElementById('photoPreview');
const photoList = document.getElementById('photoList');
const goodsName = document.getElementById('goodsName');
const goodsDescription = document.getElementById('goodsDescription');
const goodsQuantity = document.getElementById('goodsQuantity');
const goodsCondition = document.getElementById('goodsCondition');
const deleteModal = document.getElementById('deleteModal');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');
const successModal = document.getElementById('successModal');
const successMessage = document.getElementById('successMessage');
const successOk = document.getElementById('successOk');

// Sidebar elements
const profileAvatar = document.getElementById('profileAvatar');
const userName = document.getElementById('userName');

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const logoutBtn = document.getElementById('logoutBtn');
const logoutModal = document.getElementById('logoutModal');
const logoutYes = document.getElementById('logoutYes');
const logoutNo = document.getElementById('logoutNo');

let selectedFiles = [];

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
// SIDEBAR TOGGLE (Mobile)
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
// LOAD USER DATA
// ============================================
function loadUserData() {
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    
    if (adminData.name) {
        userName.textContent = adminData.name;
    }
    
    if (adminData.photo) {
        profileAvatar.src = adminData.photo;
        profileAvatar.onerror = function() {
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
// PHOTO PREVIEW
// ============================================
goodsPhoto.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    
    if (files.length > MAX_PHOTOS) {
        alert(`Maksimal upload ${MAX_PHOTOS} foto saja!`);
        this.value = '';
        return;
    }
    
    const existingCount = document.querySelectorAll('.photo-item:not(.new-photo)').length;
    const newCount = document.querySelectorAll('.photo-item.new-photo').length;
    const totalExisting = existingCount + newCount;
    
    if (totalExisting + files.length > MAX_PHOTOS) {
        alert(`Total foto maksimal ${MAX_PHOTOS}! Anda sudah memiliki ${totalExisting} foto.`);
        this.value = '';
        return;
    }
    
    selectedFiles = files;
    updatePhotoPreview();
});

function updatePhotoPreview() {
    document.querySelectorAll('.photo-item.new-photo').forEach(el => el.remove());
    
    if (selectedFiles.length === 0) {
        const totalExisting = document.querySelectorAll('.photo-item:not(.new-photo)').length;
        if (totalExisting === 0) {
            photoPreview.innerHTML = `
                <i class="ri-image-add-line"></i>
                <span>Klik untuk upload foto (maks ${MAX_PHOTOS})</span>
            `;
            photoPreview.classList.remove('has-images');
        } else {
            photoPreview.querySelector('.photo-count').textContent = `${totalExisting} dari ${MAX_PHOTOS} foto`;
        }
        return;
    }
    
    const totalPhotos = document.querySelectorAll('.photo-item').length + selectedFiles.length;
    photoPreview.innerHTML = `
        <i class="ri-image-add-line"></i>
        <span class="photo-count">${totalPhotos} dari ${MAX_PHOTOS} foto</span>
    `;
    photoPreview.classList.add('has-images');
    
    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item new-photo';
            photoItem.innerHTML = `
                <img src="${event.target.result}" alt="Photo baru ${index + 1}">
                <button class="remove-photo" data-index="${index}">
                    <i class="ri-close-line"></i>
                </button>
            `;
            
            photoItem.querySelector('.remove-photo').addEventListener('click', function(e) {
                e.stopPropagation();
                removeNewPhoto(index);
            });
            
            photoList.appendChild(photoItem);
        };
        reader.readAsDataURL(file);
    });
}

function removeNewPhoto(index) {
    selectedFiles = selectedFiles.filter((_, i) => i !== index);
    const dt = new DataTransfer();
    selectedFiles.forEach(file => dt.items.add(file));
    goodsPhoto.files = dt.files;
    updatePhotoPreview();
}

photoPreview.addEventListener('click', () => {
    goodsPhoto.click();
});

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
                        <p>Klik tombol "Tambah Barang" untuk menambahkan data pertama</p>
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
                <td>${item.jumlahBarang || 0}</td>
                <td>${formatDate(item.createdAt)}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${item.id}" title="Edit">
                        <i class="ri-pencil-line"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${item.id}" title="Hapus">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            openEditModal(id);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            openDeleteModal(id);
        });
    });
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
// OPEN ADD MODAL
// ============================================
addBtn.addEventListener('click', () => {
    editingId = null;
    existingPhotoFilenames = [];
    formModalTitle.textContent = 'Tambah Barang';
    goodsForm.reset();
    selectedFiles = [];
    goodsPhoto.value = '';
    photoList.innerHTML = '';
    photoPreview.innerHTML = `
        <i class="ri-image-add-line"></i>
        <span>Klik untuk upload foto (maks ${MAX_PHOTOS})</span>
    `;
    photoPreview.classList.remove('has-images');
    window.photosToDelete = [];
    formModal.classList.add('active');
    document.body.style.overflow = 'hidden';
});

// ============================================
// OPEN EDIT MODAL
// ============================================
async function openEditModal(id) {
    try {
        const response = await fetch(`${API_URL}/getDataBarang/${id}`);
        const data = await response.json();
        
        if (data) {
            editingId = id;
            formModalTitle.textContent = 'Edit Barang';
            
            goodsName.value = data.namaBarang || '';
            goodsDescription.value = data.deskripsiBarang || '';
            goodsQuantity.value = data.jumlahBarang || '';
            goodsCondition.value = data.kondisiBarang || '';
            
            const existingPhotos = data.fotoBarang || [];
            existingPhotoFilenames = [...existingPhotos];
            selectedFiles = [];
            photoList.innerHTML = '';
            window.photosToDelete = [];
            
            if (existingPhotos.length > 0) {
                photoPreview.innerHTML = `
                    <i class="ri-image-add-line"></i>
                    <span class="photo-count">${existingPhotos.length} dari ${MAX_PHOTOS} foto</span>
                `;
                photoPreview.classList.add('has-images');
                
                existingPhotos.forEach((photo, index) => {
                    const photoItem = document.createElement('div');
                    photoItem.className = 'photo-item existing-photo';
                    photoItem.dataset.filename = photo;
                    photoItem.innerHTML = `
                        <img src="${API_URL}/FotoBarang/${photo}" alt="Photo ${index + 1}">
                        <button class="remove-photo" data-filename="${photo}">
                            <i class="ri-close-line"></i>
                        </button>
                    `;
                    
                    photoItem.querySelector('.remove-photo').addEventListener('click', function(e) {
                        e.stopPropagation();
                        const filename = this.dataset.filename;
                        if (confirm('Hapus foto ini?')) {
                            if (!window.photosToDelete) window.photosToDelete = [];
                            window.photosToDelete.push(filename);
                            this.closest('.photo-item').remove();
                            const remaining = document.querySelectorAll('.photo-item:not(.new-photo)').length;
                            const newPhotos = document.querySelectorAll('.photo-item.new-photo').length;
                            const total = remaining + newPhotos;
                            if (total === 0) {
                                photoPreview.innerHTML = `
                                    <i class="ri-image-add-line"></i>
                                    <span>Klik untuk upload foto (maks ${MAX_PHOTOS})</span>
                                `;
                                photoPreview.classList.remove('has-images');
                            } else {
                                photoPreview.innerHTML = `
                                    <i class="ri-image-add-line"></i>
                                    <span class="photo-count">${total} dari ${MAX_PHOTOS} foto</span>
                                `;
                                photoPreview.classList.add('has-images');
                            }
                        }
                    });
                    
                    photoList.appendChild(photoItem);
                });
            }
            
            formModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    } catch (error) {
        console.error('Error loading goods data:', error);
        alert('Gagal memuat data barang');
    }
}

// ============================================
// SAVE FORM
// ============================================
saveForm.addEventListener('click', async () => {
    const nama = goodsName.value.trim();
    const deskripsi = goodsDescription.value.trim();
    const jumlah = parseInt(goodsQuantity.value);
    const kondisi = goodsCondition.value;
    
    if (!nama) {
        alert('Nama barang harus diisi!');
        goodsName.focus();
        return;
    }
    
    if (!jumlah || jumlah < 1) {
        alert('Jumlah barang harus diisi minimal 1!');
        goodsQuantity.focus();
        return;
    }
    
    if (!kondisi) {
        alert('Pilih kondisi barang!');
        goodsCondition.focus();
        return;
    }
    
    const existingPhotos = document.querySelectorAll('.photo-item.existing-photo');
    const existingFilenames = [];
    existingPhotos.forEach(el => {
        const filename = el.dataset.filename;
        if (filename) existingFilenames.push(filename);
    });
    
    const totalPhotos = existingFilenames.length + selectedFiles.length;
    if (totalPhotos > MAX_PHOTOS) {
        alert(`Total foto maksimal ${MAX_PHOTOS}! Saat ini: ${totalPhotos} foto.`);
        return;
    }
    
    const formData = new FormData();
    formData.append('namaBarang', nama);
    formData.append('deskripsiBarang', deskripsi || '');
    formData.append('jumlahBarang', jumlah);
    formData.append('kondisiBarang', kondisi);
    
    for (let i = 0; i < goodsPhoto.files.length; i++) {
        formData.append('fotoBarang', goodsPhoto.files[i]);
    }
    
    if (editingId) {
        formData.append('existingPhotos', JSON.stringify(existingFilenames));
        if (window.photosToDelete && window.photosToDelete.length > 0) {
            formData.append('photosToDelete', JSON.stringify(window.photosToDelete));
        }
    }
    
    try {
        let url = `${API_URL}/addDataBarang`;
        let method = 'POST';
        
        if (editingId) {
            url = `${API_URL}/updateDataBarang/${editingId}`;
            method = 'PUT';
        }
        
        const response = await fetch(url, {
            method: method,
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            window.photosToDelete = [];
            showSuccess(result.message);
            closeFormModalFn();
            await loadGoods();
        } else {
            alert(result.message || 'Gagal menyimpan data');
        }
    } catch (error) {
        console.error('Error saving goods:', error);
        alert('Gagal menyimpan data: ' + error.message);
    }
});

// ============================================
// CLOSE FORM MODAL
// ============================================
function closeFormModalFn() {
    formModal.classList.remove('active');
    editingId = null;
    existingPhotoFilenames = [];
    window.photosToDelete = [];
    selectedFiles = [];
    goodsPhoto.value = '';
    photoList.innerHTML = '';
    goodsForm.reset();
    photoPreview.innerHTML = `
        <i class="ri-image-add-line"></i>
        <span>Klik untuk upload foto (maks ${MAX_PHOTOS})</span>
    `;
    photoPreview.classList.remove('has-images');
    document.body.style.overflow = '';
}

closeFormModal.addEventListener('click', function(e) {
    e.stopPropagation();
    closeFormModalFn();
});

cancelForm.addEventListener('click', function(e) {
    e.stopPropagation();
    closeFormModalFn();
});

formModal.addEventListener('click', function(e) {
    if (e.target === formModal) {
        closeFormModalFn();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && formModal.classList.contains('active')) {
        closeFormModalFn();
    }
});

// ============================================
// DELETE MODAL
// ============================================
let deleteTargetId = null;

function openDeleteModal(id) {
    deleteTargetId = id;
    deleteModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
    deleteModal.classList.remove('active');
    deleteTargetId = null;
    document.body.style.overflow = '';
}

cancelDelete.addEventListener('click', closeDeleteModal);

deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && deleteModal.classList.contains('active')) {
        closeDeleteModal();
    }
});

confirmDelete.addEventListener('click', async () => {
    if (!deleteTargetId) return;
    
    try {
        const response = await fetch(`${API_URL}/deleteDataBarang/${deleteTargetId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess(result.message);
            closeDeleteModal();
            await loadGoods();
        } else {
            alert(result.message || 'Gagal menghapus data');
        }
    } catch (error) {
        console.error('Error deleting goods:', error);
        alert('Gagal menghapus data: ' + error.message);
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
        loadUserData();
        loadGoods();
        console.log('✅ SIMIVA Data Barang (Admin) loaded successfully!');
    } else {
        window.location.href = 'login.html';
    }
});

console.log('✅ SIMIVA Data Barang (Admin) initialized!');