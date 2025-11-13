// Utama: login/register + render canteen setelah login (localStorage-based demo)
(function() {
  const usersKey = 'canteen_users';
  const currentUserKey = 'canteen_current_user';
  const CART_PREFIX = 'canteen_cart_'; // setiap user punya keranjang sendiri

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(usersKey) || '[]'); } catch { return []; }
  }
  function saveUsers(users) {
    localStorage.setItem(usersKey, JSON.stringify(users));
  }
  function setCurrentUser(u) {
    localStorage.setItem(currentUserKey, JSON.stringify(u));
  }
  function getCurrentUser() {
    const s = localStorage.getItem(currentUserKey);
    return s ? JSON.parse(s) : null;
  }

  function cartKey() {
    const user = getCurrentUser();
    return CART_PREFIX + (user ? user.nim : 'guest');
  }

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(cartKey()) || '[]');
    } catch {
      return [];
    }
  }
  function saveCart(cart) {
    localStorage.setItem(cartKey(), JSON.stringify(cart));
  }

  function addToCart(item, qty) {
    const cart = getCart();
    const idx = cart.findIndex(ci => ci.id === item.id);
    if (idx >= 0) {
      cart[idx].qty += qty;
    } else {
      cart.push({ id: item.id, name: item.name, price: item.price, qty: qty });
    }
    saveCart(cart);
    renderCartPanel();
    updateCartSummary();
  }

  function updateCartPanel() {
    const cart = getCart();
    const itemsEl = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    if (!itemsEl || !totalEl) return;

    itemsEl.innerHTML = '';
    if (cart.length === 0) {
      itemsEl.innerHTML = '<p style="color:#666;">Keranjang kosong.</p>';
      totalEl.textContent = formatRupiah(0);
      return;
    }

    cart.forEach(ci => {
      const line = document.createElement('div');
      line.className = 'cart-item';
      line.innerHTML = `
        <span class="name">${ci.name}</span>
        <input type="number" class="qty" min="1" value="${ci.qty}" data-id="${ci.id}" style="width:60px;" />
        <span>${formatRupiah(ci.qty * ci.price)}</span>
        <button class="remove-item btn" data-id="${ci.id}">Hapus</button>
      `;
      itemsEl.appendChild(line);
    });

    // Handler untuk ubah kuantitas dan hapus
    itemsEl.querySelectorAll('.qty').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = parseInt(e.target.dataset.id);
        const newQty = parseInt(e.target.value) || 1;
        const cart = getCart();
        const ci = cart.find(x => x.id === id);
        if (ci) {
          ci.qty = newQty;
          saveCart(cart);
          renderCartPanel();
          updateCartSummary();
        }
      });
    });

    itemsEl.querySelectorAll('.remove-item').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        const id = parseInt(ev.target.dataset.id);
        removeFromCart(id);
      });
    });

    // Total
    const total = cart.reduce((sum, it) => sum + it.qty * it.price, 0);
    totalEl.textContent = formatRupiah(total);
  }

  function renderCartPanel() {
    updateCartPanel();
  }

  function removeFromCart(id) {
    let cart = getCart();
    cart = cart.filter(ci => ci.id !== id);
    saveCart(cart);
    renderCartPanel();
    updateCartSummary();
  }

  function updateCartSummary() {
    const cart = getCart();
    const btn = document.getElementById('openCartBtn');
    if (btn) btn.textContent = 'Keranjang (' + cart.length + ')';
  }

  function formatRupiah(n) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
  }

  // Registrasi
  if (location.pathname.endsWith('register.html')) {
    const form = document.getElementById('registerForm');
    const msg = document.getElementById('message');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const nim = document.getElementById('nim').value.trim();
      if (!name || !nim) {
        msg.textContent = 'Harap isi semua field.';
        return;
      }
      const users = getUsers();
      if (users.find(u => u.nim === nim)) {
        msg.textContent = 'NIM telah terdaftar sebelumnya. Gunakan akun lain.';
        return;
      }
      users.push({ name, nim });
      saveUsers(users);
      alert('Pendaftaran berhasil. Silakan login.');
      window.location.href = 'login.html';
    });
  }

  // Login
  if (location.pathname.endsWith('login.html')) {
    const form = document.getElementById('loginForm');
    const msg = document.getElementById('message');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const nim = document.getElementById('nim').value.trim();
      if (!name || !nim) {
        msg.textContent = 'Harap isi semua field.';
        return;
      }
      const users = getUsers();
      const found = users.find(u => u.name === name && u.nim === nim);
      if (!found) {
        msg.textContent = 'Akun tidak ditemukan. Pastikan nama dan NIM benar, atau daftar terlebih dahulu.';
        return;
      }
      setCurrentUser({ name, nim });
      window.location.href = 'canteen.html';
    });
  }

  // After login: render kantin
  if (location.pathname.endsWith('canteen.html')) {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    // Tampilkan nama pengguna
    const welcomeEl = document.getElementById('welcomeName');
    if (welcomeEl) welcomeEl.textContent = user.name;

    // Update keranjang summary di tombol Keranjang
    updateCartSummary();

    // Load daftar warung
    fetch('data/stalls.json')
      .then(res => res.json())
      .then(data => {
        const stalls = data.stalls || [];
        const container = document.getElementById('stalls');
        const filterEl = document.getElementById('filter');
        function renderList(list) {
          container.innerHTML = '';
          list.forEach(s => {
            const card = document.createElement('div');
            card.className = 'stall-card';
            card.innerHTML = `
              <img src="${s.image}" alt="${s.name}">
              <h3>${s.name}</h3>
              <p class="cat">${s.category}</p>
              <p class="desc">${s.description}</p>
              <p class="price">${formatRupiah(s.price)}</p>
              <div class="cart-controls">
                <input type="number" class="qty" min="1" max="99" value="1" data-id="${s.id}" />
                <button class="add-to-cart btn" data-id="${s.id}">Tambahkan ke Keranjang</button>
              </div>
            `;
            container.appendChild(card);
          });

          // Delegated add-to-cart
          container.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('add-to-cart')) {
              const id = parseInt(e.target.dataset.id);
              const card = e.target.closest('.stall-card');
              const qtyInput = card.querySelector('.qty');
              const qty = parseInt(qtyInput.value) || 1;
              const item = stalls.find(s => s.id === id);
              if (item) {
                addToCart(item, qty);
              }
            }
          });
        }

        renderList(stalls);

        if (filterEl) {
          filterEl.value = 'Semua';
          filterEl.addEventListener('change', (e) => {
            const cat = e.target.value;
            if (cat === 'Semua') renderList(stalls);
            else renderList(stalls.filter(s => s.category === cat));
          });
        }

        // Cart panel open/close
        const openBtn = document.getElementById('openCartBtn');
        const closeBtn = document.getElementById('closeCartBtn');
        const panel = document.getElementById('cartPanel');
        if (openBtn && panel) {
          openBtn.addEventListener('click', () => panel.classList.add('open'));
        }
        if (closeBtn && panel) {
          closeBtn.addEventListener('click', () => panel.classList.remove('open'));
        }

        // Checkout ( simulasi)
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
          checkoutBtn.addEventListener('click', () => {
            const cart = getCart();
            if (cart.length === 0) {
              alert('Keranjang kosong. Tambahkan item terlebih dahulu.');
              return;
            }
            alert('Checkout simulasi: terima kasih. Pesanan Anda telah diterima.');
            // Kosongkan keranjang setelah checkout
            saveCart([]);
            renderCartPanel();
            updateCartSummary();
          });
        }

      })
      .catch(err => {
        console.error('Gagal memuat data warung:', err);
        const container = document.getElementById('stalls');
        container.innerHTML = '<p>Gagal memuat data warung. Coba lagi nanti.</p>';
      });
  }
})();
