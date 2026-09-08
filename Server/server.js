const express = require('express');
const app = express();
const db = require('./firebase'); 
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer'); 
const fs = require('fs');
require('dotenv').config();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// MULTER CONFIG
// ============================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'FotoBarang/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diizinkan'), false);
    }
  }
});

// Static folder untuk akses foto
app.use('/FotoBarang', express.static(path.join(__dirname, 'FotoBarang')));

// ============================================
// HELPERS
// ============================================
function getTimestamp() {
  return new Date().toISOString();
}

// Due date from the form is YYYY-MM-DD (date only).
// The deadline is 23:59:59 WIB on that selected date.
// This avoids JavaScript parsing YYYY-MM-DD as UTC midnight, which
// previously made a return appear ~7-8 hours late too early.
function getDueDateWIB(dueDate) {
  if (!dueDate || typeof dueDate !== 'string') return null;
  const match = dueDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return new Date(dueDate);

  const [, year, month, day] = match;
  return new Date(`${year}-${month}-${day}T23:59:59.999+07:00`);
}

function getConditionLabel(condition) {
  const labels = {
    'layak': 'Layak Digunakan',
    'perbaikan': 'Perlu Perbaikan',
    'penggantian': 'Perlu Penggantian'
  };
  return labels[condition] || condition;
}

// ============================================
// 1. POST
// ============================================

app.post('/addDataBarang', upload.array('fotoBarang', 10), async (req, res) => {
  try {
    const { 
      namaBarang, 
      deskripsiBarang, 
      jumlahBarang, 
      kondisiBarang 
    } = req.body;
    
    if (!namaBarang) {
      return res.status(400).json({
        success: false,
        message: 'Nama barang wajib diisi'
      });
    }
    
    if (!jumlahBarang || parseInt(jumlahBarang) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Jumlah barang minimal 1'
      });
    }
    
    if (!kondisiBarang) {
      return res.status(400).json({
        success: false,
        message: 'Kondisi barang wajib dipilih'
      });
    }
    
    // Validasi kondisi barang hanya menerima: layak, perbaikan, penggantian
    const validConditions = ['layak', 'perbaikan', 'penggantian'];
    if (!validConditions.includes(kondisiBarang)) {
      return res.status(400).json({
        success: false,
        message: 'Kondisi barang tidak valid. Pilih: Layak Digunakan, Perlu Perbaikan, atau Perlu Penggantian'
      });
    }
    
    const fotoBarang = req.files ? req.files.map(file => file.filename) : [];
    const newData = {
      namaBarang,
      deskripsiBarang: deskripsiBarang || '',
      jumlahBarang: parseInt(jumlahBarang),
      kondisiBarang,
      fotoBarang: fotoBarang,
      createdAt: getTimestamp(),
      updatedAt: getTimestamp()
    };
    
    const newRef = db.ref('barang').push();
    await newRef.set(newData);
    
    res.status(201).json({
      success: true,
      message: 'Barang berhasil ditambahkan!',
      id: newRef.key
    });
  } catch (error) {
    console.error('Error adding barang:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding barang: ' + error.message
    });
  }
});

app.post('/addRequest', async (req, res) => {
  try {
    const { 
      userId, 
      userName, 
      userEmail, 
      items, 
      itemsDetail, 
      reason, 
      quantity, 
      dueDate,
      status,
      returnStatus
    } = req.body;
    
    if (!userId || !items || items.length === 0 || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Data tidak lengkap'
      });
    }
    
    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Batas waktu peminjaman harus diisi'
      });
    }
    
    // Validasi: User hanya boleh meminjam barang dengan kondisi 'layak' (Layak Digunakan)
    if (itemsDetail && itemsDetail.length > 0) {
      const invalidItems = itemsDetail.filter(item => item.kondisiBarang !== 'layak');
      if (invalidItems.length > 0) {
        const invalidNames = invalidItems.map(item => item.namaBarang).join(', ');
        return res.status(400).json({
          success: false,
          message: `Barang dengan kondisi selain "Layak Digunakan" tidak dapat dipinjam: ${invalidNames}`
        });
      }
    }
    
    // Pastikan itemsDetail memiliki requestedQuantity
    const processedItemsDetail = (itemsDetail || []).map(item => ({
      ...item,
      requestedQuantity: item.requestedQuantity || 1
    }));
    
    const requestData = {
      userId,
      userName: userName || 'User',
      userEmail: userEmail || '',
      items: items,
      itemsDetail: processedItemsDetail,
      reason: reason,
      quantity: quantity || 1,
      dueDate: dueDate,
      status: status || 'pending',
      returnStatus: returnStatus || 'waiting',
      createdAt: getTimestamp(),
      updatedAt: getTimestamp()
    };
    
    const newRef = db.ref('requests').push();
    await newRef.set(requestData);
    
    res.status(201).json({
      success: true,
      message: 'Peminjaman berhasil dikirim!',
      id: newRef.key
    });
  } catch (error) {
    console.error('Error adding request:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding request: ' + error.message
    });
  }
});

// ============================================
// 2. GET
// ============================================

app.get('/getAllDataBarang', async (req, res) => {
  try {
    const snapshot = await db.ref('barang').once('value');
    const data = snapshot.val();
    
    if (data) {
      res.json(data);
    } else {
      res.json({});
    }
  } catch (error) {
    console.error('Error reading barang data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error reading barang data: ' + error.message 
    });
  }
});

app.get('/getDataBarang/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const snapshot = await db.ref(`barang/${id}`).once('value');
    const data = snapshot.val();
    
    if (data) {
      res.json(data);
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Data barang tidak ditemukan' 
      });
    }
  } catch (error) {
    console.error('Error reading barang data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error reading barang data: ' + error.message 
    });
  }
});

app.get('/getAllRequests', async (req, res) => {
  try {
    const snapshot = await db.ref('requests').once('value');
    const data = snapshot.val();
    
    if (data) {
      res.json(data);
    } else {
      res.json({});
    }
  } catch (error) {
    console.error('Error reading requests:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error reading requests: ' + error.message 
    });
  }
});

app.get('/getRequestsByUser/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const snapshot = await db.ref('requests').once('value');
    const data = snapshot.val();
    
    if (!data) {
      return res.json([]);
    }
    
    const userRequests = [];
    for (const key in data) {
      if (data[key].userId === userId) {
        userRequests.push({
          id: key,
          ...data[key]
        });
      }
    }
    
    res.json(userRequests);
  } catch (error) {
    console.error('Error reading user requests:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error reading user requests: ' + error.message 
    });
  }
});

app.get('/getRequest/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const snapshot = await db.ref(`requests/${id}`).once('value');
    const data = snapshot.val();
    
    if (data) {
      res.json({ id, ...data });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Request tidak ditemukan' 
      });
    }
  } catch (error) {
    console.error('Error reading request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error reading request: ' + error.message 
    });
  }
});

app.get('/getUserData/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID diperlukan'
      });
    }
    
    const snapshot = await db.ref('user').once('value');
    const users = snapshot.val();
    
    if (!users) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }
    
    let userData = null;
    for (const username in users) {
      if (users[username].uid === userId) {
        userData = {
          username: username,
          ...users[username]
        };
        break;
      }
    }
    
    if (userData) {
      res.json({
        success: true,
        data: userData
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }
  } catch (error) {
    console.error('Error reading user data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error reading user data: ' + error.message 
    });
  }
});

// ============================================
// 3. PUT
// ============================================

app.put('/updateDataBarang/:id', upload.array('fotoBarang', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      namaBarang, 
      deskripsiBarang, 
      jumlahBarang, 
      kondisiBarang,
      existingPhotos,
      photosToDelete
    } = req.body;
    
    const snapshot = await db.ref(`barang/${id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Data barang tidak ditemukan'
      });
    }
    
    if (!namaBarang) {
      return res.status(400).json({
        success: false,
        message: 'Nama barang wajib diisi'
      });
    }
    
    if (!jumlahBarang || parseInt(jumlahBarang) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Jumlah barang minimal 1'
      });
    }
    
    if (!kondisiBarang) {
      return res.status(400).json({
        success: false,
        message: 'Kondisi barang wajib dipilih'
      });
    }
    
    // Validasi kondisi barang hanya menerima: layak, perbaikan, penggantian
    const validConditions = ['layak', 'perbaikan', 'penggantian'];
    if (!validConditions.includes(kondisiBarang)) {
      return res.status(400).json({
        success: false,
        message: 'Kondisi barang tidak valid. Pilih: Layak Digunakan, Perlu Perbaikan, atau Perlu Penggantian'
      });
    }
    
    const existingData = snapshot.val();
    let currentPhotos = existingData.fotoBarang || [];
    
    if (photosToDelete) {
      const toDelete = JSON.parse(photosToDelete);
      toDelete.forEach(filename => {
        const oldPath = path.join(__dirname, 'FotoBarang', filename);
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
            console.log(`Deleted photo: ${filename}`);
          } catch (err) {
            console.error(`Error deleting photo ${filename}:`, err);
          }
        }
      });
      currentPhotos = currentPhotos.filter(f => !toDelete.includes(f));
    }
    
    const newPhotos = req.files ? req.files.map(file => file.filename) : [];
    
    let finalPhotos = [];
    if (existingPhotos) {
      const existing = JSON.parse(existingPhotos);
      finalPhotos = [...existing, ...newPhotos];
    } else {
      finalPhotos = [...currentPhotos, ...newPhotos];
    }
    
    const updateData = {
      namaBarang,
      deskripsiBarang: deskripsiBarang || '',
      jumlahBarang: parseInt(jumlahBarang),
      kondisiBarang,
      fotoBarang: finalPhotos,
      updatedAt: getTimestamp()
    };
    
    await db.ref(`barang/${id}`).update(updateData);
    
    res.json({
      success: true,
      message: 'Barang berhasil diperbarui!'
    });
  } catch (error) {
    console.error('Error updating barang:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating barang: ' + error.message
    });
  }
});

app.put('/updateRequest/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      status, 
      adminName, 
      adminNote, 
      quantity,
      returnStatus,
      returnNote,
      returnConditions,
      returnInspection,
      updatedAt
    } = req.body;
    
    const snapshot = await db.ref(`requests/${id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Request tidak ditemukan'
      });
    }
    
    const requestData = snapshot.val();
    
    const updateData = {
      updatedAt: updatedAt || getTimestamp()
    };
    
    if (status) updateData.status = status;
    if (adminName) updateData.adminName = adminName;
    if (adminNote) updateData.adminNote = adminNote;
    if (returnStatus) {
      updateData.returnStatus = returnStatus;
      // Simpan waktu pengembalian yang sebenarnya dan hitung keterlambatan saat user benar-benar mengembalikan.
      if (returnStatus === 'returned' && requestData.returnStatus !== 'returned') {
        const actualReturnTime = new Date();
        const due = requestData.dueDate ? getDueDateWIB(requestData.dueDate) : null;
        const isLate = !!(due && actualReturnTime > due);
        const lateMs = isLate ? actualReturnTime.getTime() - due.getTime() : 0;

        updateData.returnTime = actualReturnTime.toISOString();
        updateData.lateReturn = isLate;
        updateData.lateReturnDays = isLate ? Math.floor(lateMs / 86400000) : 0;
        updateData.lateReturnHours = isLate ? Math.floor((lateMs % 86400000) / 3600000) : 0;
      }
    }
    if (returnNote) updateData.returnNote = returnNote;
    if (Array.isArray(returnConditions)) updateData.returnConditions = returnConditions;
    await db.ref(`requests/${id}`).update(updateData);
    
    // Handle stock changes
    const itemsDetail = requestData.itemsDetail || [];
    const quantityToChange = quantity || requestData.quantity || 1;
    
    if (status === 'approved') {
      // KURANGI stok saat disetujui
      console.log(`✅ Mengurangi stok untuk ${itemsDetail.length} barang...`);
      for (const item of itemsDetail) {
        const itemId = item.id;
        const itemSnapshot = await db.ref(`barang/${itemId}`).once('value');
        if (itemSnapshot.exists()) {
          const currentItem = itemSnapshot.val();
          const currentStock = currentItem.jumlahBarang || 0;
          const qtyToReduce = item.requestedQuantity || 1;
          const newStock = Math.max(0, currentStock - qtyToReduce);
          await db.ref(`barang/${itemId}`).update({
            jumlahBarang: newStock,
            updatedAt: getTimestamp()
          });
          console.log(`  ${item.namaBarang}: ${currentStock} → ${newStock} (dikurangi ${qtyToReduce})`);
        }
      }
    } else if (status === 'rejected') {
      // TIDAK mengubah stok saat ditolak
      console.log(`❌ Request ${id} ditolak, stok tidak berubah`);
    }
    
    // Handle return: user hanya mengajukan pengembalian.
    // Stok dikembalikan setelah user mengklik kembalikan.
    // Kondisi fisik TIDAK ditentukan user; admin memeriksanya setelah barang diterima.
    if (returnStatus === 'returned' && requestData.returnStatus !== 'returned') {
      console.log(`🔄 Mengembalikan stok untuk ${itemsDetail.length} barang...`);

      for (const item of itemsDetail) {
        const itemId = item.id;
        const itemSnapshot = await db.ref(`barang/${itemId}`).once('value');

        if (itemSnapshot.exists()) {
          const currentItem = itemSnapshot.val();
          const currentStock = currentItem.jumlahBarang || 0;
          const qtyToAdd = item.requestedQuantity || 1;
          const newStock = currentStock + qtyToAdd;

          await db.ref(`barang/${itemId}`).update({
            jumlahBarang: newStock,
            updatedAt: getTimestamp()
          });
        }
      }
    }

    // Pemeriksaan kondisi hanya boleh berasal dari admin.
    if (returnInspection && Array.isArray(returnInspection.conditions)) {
      const inspection = {
        ...returnInspection,
        checkedAt: getTimestamp()
      };

      await db.ref(`requests/${id}/returnInspection`).set(inspection);

      const conditionMap = {};
      returnInspection.conditions.forEach(condition => {
        if (condition && condition.itemId) {
          conditionMap[condition.itemId] = condition.kondisiKembali || 'layak';
        }
      });

      for (const item of itemsDetail) {
        const itemId = item.id;
        if (!conditionMap[itemId]) continue;

        const itemSnapshot = await db.ref(`barang/${itemId}`).once('value');
        if (itemSnapshot.exists()) {
          await db.ref(`barang/${itemId}`).update({
            kondisiBarang: conditionMap[itemId],
            updatedAt: getTimestamp()
          });
        }
      }
    }
    
    res.json({
      success: true,
      message: 'Request berhasil diperbarui!'
    });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating request: ' + error.message
    });
  }
});

// ============================================
// 4. DELETE
// ============================================

app.delete('/deleteDataBarang/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const snapshot = await db.ref(`barang/${id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Data barang tidak ditemukan'
      });
    }
    
    const data = snapshot.val();
    if (data.fotoBarang && Array.isArray(data.fotoBarang)) {
      data.fotoBarang.forEach(filename => {
        const fotoPath = path.join(__dirname, 'FotoBarang', filename);
        if (fs.existsSync(fotoPath)) {
          try {
            fs.unlinkSync(fotoPath);
            console.log(`Deleted photo: ${filename}`);
          } catch (err) {
            console.error(`Error deleting photo ${filename}:`, err);
          }
        }
      });
    } else if (data.fotoBarang && typeof data.fotoBarang === 'string') {
      const fotoPath = path.join(__dirname, 'FotoBarang', data.fotoBarang);
      if (fs.existsSync(fotoPath)) {
        try {
          fs.unlinkSync(fotoPath);
        } catch (err) {
          console.error('Error deleting photo:', err);
        }
      }
    }
    
    await db.ref(`barang/${id}`).remove();
    
    res.json({
      success: true,
      message: 'Barang berhasil dihapus!'
    });
  } catch (error) {
    console.error('Error deleting barang:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting barang: ' + error.message
    });
  }
});

app.delete('/deleteRequest/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const snapshot = await db.ref(`requests/${id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Request tidak ditemukan'
      });
    }
    
    await db.ref(`requests/${id}`).remove();
    
    res.json({
      success: true,
      message: 'Request berhasil dihapus!'
    });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting request: ' + error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});