// Inisialisasi Ikon
lucide.createIcons();

// ==========================================
// 1. GLOBAL & AUDIO LOGIC
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // A. Audio Player Logic
    const audio = document.getElementById('adventure-audio');
    const toggleBtn = document.getElementById('music-toggle');
    const bars = document.getElementById('music-bars');
    
    if(audio && toggleBtn) {
        audio.volume = 0.3;
        toggleBtn.addEventListener('click', () => {
            if (audio.paused) {
                audio.play();
                bars.classList.remove('paused');
            } else {
                audio.pause();
                bars.classList.add('paused');
            }
        });
    }

    // B. Check Login Status
    checkServerAuth();

    // C. Render Gallery
    const galleryGrid = document.getElementById('gallery-grid');
    if(galleryGrid) {
        renderGallery();
    }
});

// ==========================================
// 2. MODAL WHATSAPP LOGIC
// ==========================================
function openWAModal() {
    const modal = document.getElementById('wa-modal');
    if(modal) {
        modal.style.display = 'flex';
        // Animasi fade in
        setTimeout(() => {
            if(modal.firstElementChild.nextElementSibling) {
                modal.firstElementChild.nextElementSibling.classList.remove('scale-95', 'opacity-0');
            }
        }, 10);
    }
}

function closeWAModal() {
    const modal = document.getElementById('wa-modal');
    if(modal) {
        if(modal.firstElementChild.nextElementSibling) {
            modal.firstElementChild.nextElementSibling.classList.add('scale-95', 'opacity-0');
        }
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// ==========================================
// 3. ADMIN & GALLERY SYSTEM (ROBUST VERSION)
// ==========================================

async function renderGallery() {
    const galleryGrid = document.getElementById('gallery-grid');
    if(!galleryGrid) return;

    galleryGrid.innerHTML = '<p class="text-gray-500 text-center col-span-3 animate-pulse">Memuat foto...</p>';

    try {
        const response = await fetch('api.php');
        const data = await response.json();

        galleryGrid.innerHTML = '';

        if (!Array.isArray(data) || data.length === 0) {
            galleryGrid.innerHTML = '<p class="text-gray-500 text-center col-span-3">Belum ada foto.</p>';
            return;
        }

        data.forEach(item => {
            const cardHTML = `
                <div class="gallery-item group relative overflow-hidden rounded-2xl aspect-[3/4] border border-gray-800 bg-gray-900">
                    <img src="${item.image_url}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" onerror="this.src='https://via.placeholder.com/400x600?text=Image+Missing'">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                        <span class="text-sunset-orange text-xs font-bold uppercase tracking-wider mb-1">Adventure Log</span>
                        <h3 class="text-2xl font-serif font-bold text-white">${item.title}</h3>
                        <p class="text-gray-300 text-sm mt-1 flex items-center gap-1">
                            <i data-lucide="map-pin" class="w-3 h-3"></i> ${item.description}
                        </p>
                    </div>
                </div>
            `;
            galleryGrid.innerHTML += cardHTML;
        });
        lucide.createIcons();
    } catch (error) {
        console.error('Error fetching data:', error);
        galleryGrid.innerHTML = '<p class="text-red-500 text-center col-span-3">Gagal mengambil data.</p>';
    }
}

async function checkServerAuth() {
    try {
        const response = await fetch('api.php?action=check_auth');
        const data = await response.json();
        
        if (data.is_logged_in) {
            showAdminPanel();
            localStorage.setItem('isAdmin', 'true');
        } else {
            localStorage.removeItem('isAdmin');
            hideAdminPanel();
        }
    } catch (error) {
        console.error("Auth check failed", error);
    }
}

function showAdminPanel() {
    const controls = document.getElementById('admin-controls');
    if(controls) controls.classList.remove('hidden');
}
function hideAdminPanel() {
    const controls = document.getElementById('admin-controls');
    if(controls) controls.classList.add('hidden');
}

function toggleAdminModal() {
    if(localStorage.getItem('isAdmin') === 'true') {
        if(confirm("Anda login sebagai Admin. Ingin Logout?")) {
            fetch('api.php?action=logout', { method: 'POST' })
                .then(() => {
                    localStorage.removeItem('isAdmin');
                    location.reload();
                });
        }
    } else {
        const modal = document.getElementById('login-modal');
        if(modal) modal.style.display = 'flex';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText = "Memproses...";
    btn.disabled = true;

    const usernameInput = document.getElementById('admin-user').value;
    const passwordInput = document.getElementById('admin-pass').value;

    try {
        const response = await fetch('api.php?action=login', {
            method: 'POST',
            body: JSON.stringify({
                username: usernameInput,
                password: passwordInput
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            localStorage.setItem('isAdmin', 'true');
            document.getElementById('login-modal').style.display = 'none';
            showAdminPanel();
            alert("Login Berhasil! Selamat datang, Admin.");
            e.target.reset();
        } else {
            throw new Error(result.error || "Login Gagal");
        }
    } catch (error) {
        alert(error.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

function openUploadModal() {
    document.getElementById('upload-modal').style.display = 'flex';
}

async function handleUpload(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    
    // START BLOCKING
    submitBtn.innerText = "Mengupload...";
    submitBtn.disabled = true;

    try {
        // AMBIL ELEMENT DENGAN AMAN
        const fileInput = document.getElementById('img-file');
        const titleInput = document.getElementById('img-title');
        const descInput = document.getElementById('img-desc');

        // Validasi elemen ada atau tidak (untuk mencegah "Stuck")
        if (!fileInput || !titleInput || !descInput) {
            throw new Error("Form tidak lengkap. Silahkan refresh halaman (Ctrl+F5).");
        }

        if(fileInput.files.length === 0) {
            throw new Error("Pilih file gambar terlebih dahulu!");
        }

        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        formData.append('title', titleInput.value);
        formData.append('desc', descInput.value);

        const response = await fetch('api.php?action=upload', {
            method: 'POST',
            body: formData
        });

        // Cek jika response bukan JSON (misal error PHP)
        const textResult = await response.text();
        let result;
        try {
            result = JSON.parse(textResult);
        } catch(err) {
            console.error("Server Error Raw:", textResult);
            throw new Error("Terjadi kesalahan server. Cek console untuk detail.");
        }

        if (response.ok && result.success) {
            document.getElementById('upload-modal').style.display = 'none';
            e.target.reset();
            renderGallery();
            alert("Foto berhasil diupload!");
        } else {
            if(response.status === 403 || response.status === 401) {
                alert("Sesi berakhir. Silahkan login ulang.");
                location.reload();
            } else {
                throw new Error(result.error || 'Gagal menyimpan');
            }
        }
    } catch (error) {
        alert("Gagal: " + error.message);
    } finally {
        // ALWAYS RUN: Kembalikan tombol agar tidak stuck
        if(submitBtn) {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    }
}

// SECURITY
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
    if (e.key === 'F12' || (e.ctrlKey && (e.key === 'u' || e.key === 'U'))) e.preventDefault();
});