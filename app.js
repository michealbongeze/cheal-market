/* =========================================================
   CHEAL MARKET — APP.JS (PRODUCTION READY)
========================================================== */

const SUPABASE_URL = 'https://qwklkqjfbrhythpynghr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3bGtscWpmYnJoeXRocHluZ2hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMjg3MzEsImV4cCI6MjEwNjYwNDczMX0.BUscEhVhQd0bNS8VHHHlJUxudmsF0tXpx5PC9_oQ2-I';

let supabase = null;

try {
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (err) {
  console.error('Supabase Client Init Error:', err);
}

// APP STATE
let currentUser = null;
let savedProductIds = new Set(JSON.parse(localStorage.getItem('cheal_saved_ids') || '[]'));
let selectedCategory = null;
let searchQuery = '';

// NAVIGATION SYSTEM
function navigateTo(screenName, btnEl = null) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(screen => {
    if (screen.id === `screen-${screenName}`) {
      screen.classList.remove('hidden');
    } else {
      screen.classList.add('hidden');
    }
  });

  if (btnEl) {
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    btnEl.classList.add('active');
  }

  if (screenName === 'home') fetchProducts();
  if (screenName === 'saved') renderSavedGrid();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// CATEGORY SELECTION
function selectCategory(cat, el) {
  if (selectedCategory === cat) {
    selectedCategory = null;
    el.classList.remove('active');
  } else {
    selectedCategory = cat;
    document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
  }
  fetchProducts();
}

// SEARCH FILTER
function handleSearch(val) {
  searchQuery = val.trim().toLowerCase();
  fetchProducts();
}

// FETCH & DISPLAY PRODUCTS WITH DETAILED ERROR REPORTING
async function fetchProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  if (!supabase) {
    grid.innerHTML = '<div class="empty-state"><p>Database connection unavailable.</p></div>';
    return;
  }

  grid.innerHTML = '<div class="empty-state"><p>Loading latest items...</p></div>';

  try {
    let query = supabase.from('products').select('*').order('created_at', { ascending: false });

    if (selectedCategory) {
      query = query.eq('category', selectedCategory);
    }

    const { data: products, error } = await query;

    if (error) {
      grid.innerHTML = `
        <div class="empty-state" style="color:#e63946;">
          <p><strong>Unable to load listings</strong></p>
          <small>${error.message}</small>
        </div>`;
      return;
    }

    let filtered = products || [];
    if (searchQuery) {
      filtered = filtered.filter(p => {
        const title = (p.name || p.title || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        return title.includes(searchQuery) || desc.includes(searchQuery);
      });
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>No products available yet.</p>
          <small>Tap the "+" Sell button to post the first item!</small>
        </div>`;
      return;
    }

    renderProductCards(filtered, grid);

  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="color:#e63946;"><p>Connection Error</p></div>`;
  }
}

// RENDER PRODUCTS
function renderProductCards(items, container) {
  container.innerHTML = '';
  items.forEach(product => {
    const isSaved = savedProductIds.has(String(product.id));
    const title = product.name || product.title || 'Untitled Item';
    const price = product.price ? `UGX ${Number(product.price).toLocaleString()}` : 'Contact for Price';
    const image = product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';

    const card = document.createElement('div');
    card.className = 'product-card-item';
    card.innerHTML = `
      <div class="product-image-wrap">
        <img src="${image}" alt="${title}" />
        <button type="button" class="save-btn ${isSaved ? 'saved' : ''}" onclick="toggleSave('${product.id}', this)">
          ${isSaved ? '♥' : '♡'}
        </button>
      </div>
      <div class="product-details">
        <strong class="product-title">${title}</strong>
        <p class="product-price">${price}</p>
        <small class="product-campus">📍 ${product.campus || 'Kampala'}</small>
      </div>
    `;
    container.appendChild(card);
  });
}

// TOGGLE SAVED ITEMS
function toggleSave(id, btn) {
  const strId = String(id);
  if (savedProductIds.has(strId)) {
    savedProductIds.delete(strId);
    btn.classList.remove('saved');
    btn.textContent = '♡';
  } else {
    savedProductIds.add(strId);
    btn.classList.add('saved');
    btn.textContent = '♥';
  }
  localStorage.setItem('cheal_saved_ids', JSON.stringify(Array.from(savedProductIds)));
}

async function renderSavedGrid() {
  const grid = document.getElementById('savedGrid');
  if (!grid) return;

  if (savedProductIds.size === 0 || !supabase) {
    grid.innerHTML = '<div class="empty-state"><p>No saved items yet.</p></div>';
    return;
  }

  const { data: products } = await supabase.from('products').select('*').in('id', Array.from(savedProductIds));
  renderProductCards(products || [], grid);
}

// AUTH MODAL MANAGEMENT
function openAuthModal() {
  document.getElementById('authOverlay').classList.remove('hidden');
}

function closeAuthModal() {
  document.getElementById('authOverlay').classList.add('hidden');
  document.getElementById('authMessage').textContent = '';
}

async function handleSignUp() {
  if (!supabase) return;
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;

  const { error } = await supabase.auth.signUp({ email, password });
  const msg = document.getElementById('authMessage');
  if (error) {
    msg.style.color = 'red';
    msg.textContent = error.message;
  } else {
    msg.style.color = 'green';
    msg.textContent = 'Registration successful! Check your email to confirm.';
  }
}

async function handleLogout() {
  if (supabase) await supabase.auth.signOut();
  currentUser = null;
  document.getElementById('accountLoggedOut').classList.remove('hidden');
  document.getElementById('accountLoggedIn').classList.add('hidden');
  navigateTo('home');
}

// EVENT LISTENERS & INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  if (supabase) {
    supabase.auth.getSession().then(({ data: { session } }) => {
      currentUser = session ? session.user : null;
      updateAuthUI();
    });

    supabase.auth.onAuthStateChange((_, session) => {
      currentUser = session ? session.user : null;
      updateAuthUI();
    });
  }

  const authForm = document.getElementById('authForm');
  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!supabase) return;

      const email = document.getElementById('authEmail').value;
      const password = document.getElementById('authPassword').value;

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      const msg = document.getElementById('authMessage');
      if (error) {
        msg.style.color = 'red';
        msg.textContent = error.message;
      } else {
        closeAuthModal();
      }
    });
  }

  const sellForm = document.getElementById('sellForm');
  if (sellForm) {
    sellForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentUser || !supabase) {
        alert('Please sign in to post an item.');
        openAuthModal();
        return;
      }

      const name = document.getElementById('productName').value;
      const price = parseFloat(document.getElementById('productPrice').value);
      const category = document.getElementById('productCategory').value;
      const campus = document.getElementById('productCampus').value;
      const description = document.getElementById('productDescription').value;

      const { error } = await supabase.from('products').insert([
        { name, price, category, campus, description, user_id: currentUser.id }
      ]);

      const msg = document.getElementById('sellMessage');
      if (error) {
        msg.style.color = 'red';
        msg.textContent = error.message;
      } else {
        msg.style.color = 'green';
        msg.textContent = 'Item published successfully!';
        sellForm.reset();
        setTimeout(() => navigateTo('home'), 1200);
      }
    });
  }

  fetchProducts();
});

function updateAuthUI() {
  if (currentUser) {
    document.getElementById('accountLoggedOut').classList.add('hidden');
    document.getElementById('accountLoggedIn').classList.remove('hidden');
    document.getElementById('profileEmail').textContent = currentUser.email;
  } else {
    document.getElementById('accountLoggedOut').classList.remove('hidden');
    document.getElementById('accountLoggedIn').classList.add('hidden');
  }
}
