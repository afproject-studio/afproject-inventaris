// ============================================
// FIREBASE IMPORTS & CONFIG
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    fetchSignInMethodsForEmail,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import {
    getDatabase,
    ref,
    get,
    child,
    set,
    update
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

// Firebase Configuration
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const dbRef = ref(db);

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Fungsi untuk kompresi gambar
function compressImage(file, maxW = 800, maxH = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const img = new Image();
            img.src = reader.result;
            img.onload = () => {
                let { width, height } = img;
                if (width > maxW || height > maxH) {
                    const ratio = Math.min(maxW / width, maxH / height);
                    width *= ratio;
                    height *= ratio;
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

// Kompresi iteratif sampai di bawah maxSizeKB
async function compressToMaxSize(file, maxSizeKB = 1000) {
    let quality = 0.8;
    let result = await compressImage(file, 800, 800, quality);
    let sizeKB = (result.length * 3 / 4) / 1024;
    while (sizeKB > maxSizeKB && quality > 0.1) {
        quality -= 0.1;
        result = await compressImage(file, 800, 800, quality);
        sizeKB = (result.length * 3 / 4) / 1024;
    }
    return result;
}

// Fungsi untuk memeriksa apakah email sudah terdaftar di database user
async function isEmailRegistered(email) {
    try {
        const snapshot = await get(ref(db, 'user'));
        if (!snapshot.exists()) {
            return false;
        }
        const users = snapshot.val();
        for (const username in users) {
            if (users[username].email_User === email) {
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error("Error checking email:", error);
        return false;
    }
}

// Fungsi untuk memeriksa apakah username sudah terdaftar
async function isUsernameRegistered(username) {
    try {
        const snapshot = await get(child(dbRef, `user/${username}`));
        return snapshot.exists();
    } catch (error) {
        console.error("Error checking username:", error);
        return false;
    }
}

// Fungsi untuk menampilkan modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ============================================
// THEME TOGGLE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const htmlElement = document.documentElement;

    if (themeToggle) {
        const savedTheme = localStorage.getItem('theme') || 'light';
        htmlElement.setAttribute('data-theme', savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // ============================================
    // PASSWORD TOGGLE VISIBILITY
    // ============================================
    document.querySelectorAll('.floating-input input[type="password"]').forEach(field => {
        const parent = field.closest('.floating-input');
        if (!parent) return;
        
        const showPw = parent.querySelector('.show-pw');
        const hidePw = parent.querySelector('.hide-pw');

        if (showPw && hidePw) {
            showPw.style.display = 'none';
            hidePw.style.display = 'none';

            field.addEventListener('focus', () => {
                if (field.value.length > 0) {
                    if (field.type === 'password') {
                        showPw.style.display = 'block';
                        hidePw.style.display = 'none';
                    } else {
                        showPw.style.display = 'none';
                        hidePw.style.display = 'block';
                    }
                }
            });

            field.addEventListener('input', () => {
                if (field.value.length > 0) {
                    if (field.type === 'password') {
                        showPw.style.display = 'block';
                        hidePw.style.display = 'none';
                    } else {
                        showPw.style.display = 'none';
                        hidePw.style.display = 'block';
                    }
                } else {
                    showPw.style.display = 'none';
                    hidePw.style.display = 'none';
                }
            });

            showPw.addEventListener('click', () => {
                field.type = 'text';
                showPw.style.display = 'none';
                hidePw.style.display = 'block';
            });

            hidePw.addEventListener('click', () => {
                field.type = 'password';
                hidePw.style.display = 'none';
                showPw.style.display = 'block';
            });
        }
    });

    // ============================================
    // FILE INPUT HANDLER (untuk register)
    // ============================================
    const fotoInput = document.getElementById('iFoto');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileLabelText = document.querySelector('.file-label-text');
    const fileInputContainer = document.querySelector('.floating-input.file-input');

    if (fotoInput && fileInfo && fileName && fileLabelText && fileInputContainer) {
        fotoInput.addEventListener('change', function(e) {
            const file = this.files[0];
            const photoField = document.querySelector('.photo-field');
            
            photoField.classList.remove('invalid');
            fileInfo.className = 'file-info';
            fileInfo.textContent = '';
            
            if (file) {
                if (!file.type.startsWith('image/')) {
                    photoField.classList.add('invalid');
                    fileInfo.textContent = '❌ Harap upload file gambar (JPG, PNG, GIF, dll)';
                    fileInfo.className = 'file-info error';
                    this.value = '';
                    fileName.textContent = '';
                    fileName.classList.remove('show');
                    fileLabelText.classList.remove('hide');
                    fileInputContainer.classList.remove('has-file');
                    return;
                }
                
                if (file.size > 1000 * 1024) {
                    photoField.classList.add('invalid');
                    fileInfo.textContent = `❌ File terlalu besar: ${(file.size / 1024).toFixed(1)}KB (max 1000KB)`;
                    fileInfo.className = 'file-info error';
                    this.value = '';
                    fileName.textContent = '';
                    fileName.classList.remove('show');
                    fileLabelText.classList.remove('hide');
                    fileInputContainer.classList.remove('has-file');
                    return;
                }
                
                photoField.classList.remove('invalid');
                fileInfo.textContent = `✅ ${file.name} (${(file.size / 1024).toFixed(1)}KB)`;
                fileInfo.className = 'file-info success';
                fileName.textContent = file.name;
                fileName.classList.add('show');
                fileLabelText.classList.add('hide');
                fileInputContainer.classList.add('has-file');
                
            } else {
                fileName.textContent = '';
                fileName.classList.remove('show');
                fileLabelText.classList.remove('hide');
                fileInputContainer.classList.remove('has-file');
                fileInfo.textContent = '';
                fileInfo.className = 'file-info';
            }
        });
    }

    // ============================================
    // MODAL CONTROLS
    // ============================================
    const modalConfigs = [
        { modalId: 'usernameModal', closeId: 'closeUsername', okId: 'usernameModalOk' },
        { modalId: 'emailModal', closeId: 'closeEmail', okId: 'emailModalOk' },
        { modalId: 'successModal', closeId: 'closeSuccess', okId: null },
        { modalId: 'statusModal', closeId: 'close-status', okId: 'modalOkBtn' },
        { modalId: 'errorModal', closeId: 'closeError', okId: 'errorModalOk' }
    ];

    modalConfigs.forEach(({ modalId, closeId, okId }) => {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        const closeBtn = document.getElementById(closeId);
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeModal(modalId));
        }

        if (okId) {
            const okBtn = document.getElementById(okId);
            if (okBtn) {
                okBtn.addEventListener('click', () => closeModal(modalId));
            }
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modalId);
            }
        });
    });

    const successLoginBtn = document.getElementById('successModalLogin');
    if (successLoginBtn) {
        successLoginBtn.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }

    // ============================================
    // LOGIN FUNCTIONALITY
    // ============================================
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('iEmail').value.trim();
            const password = document.getElementById('iPassword').value.trim();
            const emailField = document.querySelector('.email-field');
            const passwordField = document.querySelector('.login-password');

            let isValid = true;
            if (!email) {
                emailField.classList.add('invalid');
                isValid = false;
            } else {
                emailField.classList.remove('invalid');
            }

            if (!password) {
                passwordField.classList.add('invalid');
                isValid = false;
            } else {
                passwordField.classList.remove('invalid');
            }

            if (!isValid) return;

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                console.log("✅ Login successful, user UID:", user.uid);

                const userSnapshot = await get(ref(db, 'user'));
                let userFound = false;
                let userData = null;

                if (userSnapshot.exists()) {
                    const users = userSnapshot.val();
                    
                    for (const username in users) {
                        if (users[username].email_User === email) {
                            userFound = true;
                            userData = users[username];
                            console.log("✅ User found in database:", username);
                            break;
                        }
                    }
                    
                    if (!userFound) {
                        for (const username in users) {
                            if (users[username].uid === user.uid) {
                                userFound = true;
                                userData = users[username];
                                console.log("✅ User found by UID:", username);
                                
                                if (userData.email_User !== email) {
                                    console.log("🔄 Updating email in database...");
                                    await update(ref(db, `user/${username}`), {
                                        email_User: email,
                                        updated_at: new Date().toISOString()
                                    });
                                    console.log("✅ Email updated in database");
                                }
                                break;
                            }
                        }
                    }
                }

                if (userFound) {
                    console.log("✅ User login successful, redirecting...");
                    
                    localStorage.setItem('userData', JSON.stringify({
                        name: userData.name_User,
                        jabatan: userData.jabatan_User || '',
                        email: email,
                        phone: userData.nohp_User || '',
                        photo: userData.foto_User || 'Logo/SIMIVA.png'
                    }));
                    
                    window.location.href = 'dashboard.html';
                } else {
                    await auth.signOut();
                    alert("Akun tidak ditemukan dalam sistem. Hubungi administrator.");
                }

            } catch (err) {
                console.error("❌ Login error:", err.code, err.message);

                if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
                    openModal('statusModal');
                } else if (err.code === 'auth/user-not-found') {
                    alert("Email tidak terdaftar sebagai user");
                } else if (err.code === 'auth/too-many-requests') {
                    alert("Terlalu banyak percobaan login. Coba lagi nanti");
                } else if (err.code === 'auth/network-request-failed') {
                    alert("Koneksi internet bermasalah. Coba lagi");
                } else {
                    alert("Terjadi kesalahan: " + err.message);
                }
            }
        });
    }

    // ============================================
    // REGISTER FUNCTIONALITY
    // ============================================
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('iNama').value.trim();
            const jabatan = document.getElementById('iJabatan').value.trim();
            const username = document.getElementById('iUsername').value.trim();
            const email = document.getElementById('iEmail').value.trim();
            const password = document.getElementById('iPassword').value.trim();
            const fotoFile = document.getElementById('iFoto').files[0];
            const nohp = document.getElementById('iNoTelp').value.trim();

            // Validasi semua field
            const nameField = document.querySelector('.name-field');
            const jabatanField = document.querySelector('.jabatan-field');
            const usernameField = document.querySelector('.username-field');
            const emailField = document.querySelector('.email-field');
            const passwordField = document.querySelector('.password-field');
            const photoField = document.querySelector('.photo-field');

            let isValid = true;

            if (!name) { nameField.classList.add('invalid'); isValid = false; } 
            else { nameField.classList.remove('invalid'); }

            if (!jabatan) { jabatanField.classList.add('invalid'); isValid = false; } 
            else { jabatanField.classList.remove('invalid'); }

            if (!username || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) { 
                usernameField.classList.add('invalid'); 
                isValid = false; 
            } else { usernameField.classList.remove('invalid'); }

            if (!email || !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)) { 
                emailField.classList.add('invalid'); 
                isValid = false; 
            } else { emailField.classList.remove('invalid'); }

            if (!password || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(password)) { 
                passwordField.classList.add('invalid'); 
                isValid = false; 
            } else { passwordField.classList.remove('invalid'); }

            if (!fotoFile) { 
                photoField.classList.add('invalid'); 
                isValid = false; 
            } else if (fotoFile.size > 1000 * 1024) {
                photoField.classList.add('invalid');
                document.getElementById('fileInfo').textContent = `❌ File terlalu besar: ${(fotoFile.size / 1024).toFixed(1)}KB (max 1000KB)`;
                document.getElementById('fileInfo').className = 'file-info error';
                isValid = false;
            } else { photoField.classList.remove('invalid'); }

            if (!isValid) return;

            try {
                // Cek email di Auth
                try {
                    const methods = await fetchSignInMethodsForEmail(auth, email);
                    if (methods && methods.length > 0) {
                        openModal('emailModal');
                        return;
                    }
                } catch (authError) {
                    console.log("Email check in auth:", authError);
                }

                // Cek email di database
                const emailRegistered = await isEmailRegistered(email);
                if (emailRegistered) {
                    openModal('emailModal');
                    return;
                }

                // Cek username
                const usernameRegistered = await isUsernameRegistered(username);
                if (usernameRegistered) {
                    openModal('usernameModal');
                    return;
                }

                // Kompresi gambar
                const fotoBase64 = await compressToMaxSize(fotoFile, 1000);

                // Data untuk database
                const data = {
                    name_User: name,
                    jabatan_User: jabatan,
                    email_User: email,
                    foto_User: fotoBase64,
                    nohp_User: nohp || '',
                    username: username,
                    tanggal_daftar: new Date().toISOString(),
                };

                // Buat akun di Firebase Authentication
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const userId = userCredential.user.uid;
                data.uid = userId;

                // Simpan ke database user
                await set(ref(db, `user/${username}`), data);

                // Tampilkan sukses
                openModal('successModal');

                // Redirect setelah 3 detik
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);

            } catch (error) {
                console.error("Terjadi kesalahan:", error);

                if (error.code === 'auth/email-already-in-use') {
                    openModal('emailModal');
                } else if (error.code === 'auth/invalid-email') {
                    alert("Format email tidak valid");
                } else if (error.code === 'auth/weak-password') {
                    alert("Password terlalu lemah. Gunakan minimal 8 karakter dengan kombinasi huruf besar, kecil, angka, dan simbol");
                } else if (error.code === 'auth/network-request-failed') {
                    alert("Koneksi internet bermasalah. Coba lagi");
                } else {
                    alert("Terjadi kesalahan: " + error.message);
                }
            }
        });
    }

    // ============================================
    // RESET PASSWORD FUNCTIONALITY
    // ============================================
    const resetEmail = document.getElementById('resetEmail');
    const continueBtn = document.getElementById('continueBtn');
    const emailField = document.querySelector('.email-field');

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }

    const errorModalOk = document.getElementById('errorModalOk');
    if (errorModalOk) {
        errorModalOk.addEventListener('click', () => {
            closeModal('errorModal');
        });
    }

    if (resetEmail && continueBtn) {
        resetEmail.addEventListener('blur', () => {
            const email = resetEmail.value.trim();
            if (email === '' || !email.includes('@') || !email.includes('.')) {
                emailField.classList.add('invalid');
            } else {
                emailField.classList.remove('invalid');
            }
        });

        resetEmail.addEventListener('input', () => {
            const email = resetEmail.value.trim();
            if (email !== '' && email.includes('@') && email.includes('.')) {
                emailField.classList.remove('invalid');
            }
        });

        continueBtn.addEventListener('click', async () => {
            const email = resetEmail.value.trim();

            if (!email || !email.includes('@') || !email.includes('.')) {
                emailField.classList.add('invalid');
                return;
            }

            emailField.classList.remove('invalid');

            try {
                const emailRegistered = await isEmailRegistered(email);

                if (emailRegistered) {
                    await sendPasswordResetEmail(auth, email);
                    
                    const successModal = document.getElementById('successModal');
                    if (successModal) {
                        successModal.classList.add('active');
                    }
                } else {
                    const errorModal = document.getElementById('errorModal');
                    if (errorModal) {
                        errorModal.classList.add('active');
                    }
                }
            } catch (error) {
                console.error("Reset password error:", error);
                if (error.code === 'auth/user-not-found') {
                    openModal('errorModal');
                } else if (error.code === 'auth/invalid-email') {
                    alert("Format email tidak valid");
                } else if (error.code === 'auth/network-request-failed') {
                    alert("Koneksi internet bermasalah. Coba lagi");
                } else {
                    alert("Terjadi kesalahan: " + error.message);
                }
            }
        });

        resetEmail.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                continueBtn.click();
            }
        });
    }

    // ============================================
    // VALIDASI INPUT REAL-TIME (untuk register)
    // ============================================
    const inputFields = document.querySelectorAll('.floating-input input');
    inputFields.forEach(input => {
        if (input.id === 'iEmail' || input.id === 'iUsername' || input.id === 'iNama' || input.id === 'iJabatan' || input.id === 'iPassword') {
            input.addEventListener('blur', () => {
                const field = input.closest('.field');
                if (!field) return;
                
                if (input.value.trim() === '') {
                    field.classList.add('invalid');
                } else {
                    field.classList.remove('invalid');
                }
            });

            input.addEventListener('input', () => {
                const field = input.closest('.field');
                if (!field) return;
                
                if (input.value.trim() !== '') {
                    field.classList.remove('invalid');
                }
            });
        }
    });
});