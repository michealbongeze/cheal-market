/* =========================================================
   CHEAL MARKET — APP.JS
   Backend: Supabase (Project: michealbongeze)
========================================================== */

// 1. SUPABASE INITIALIZATION WITH YOUR ANON KEY
const SUPABASE_URL = 'https://michealbongeze.supabase.co';
const SUPABASE_ANON_KEY = 'EyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3bGtscWpmYnJoeXRocHluZ2hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMjg3MzEsImV4cCI6MjEwNjYwNDczMX0.BUscEhVhQd0bNS8VHHHlJUxudmsF0tXpx5PC9_oQ2-I';

let supabase = null;
try {
  if (window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'implicit' // Resolves iOS WebKit issues
      }
    });
  }
} catch (err) {
  console.warn('Supabase initialization warning:', err);
}

// 2. STATE MANAGEMENT
let currentUser = null;
let currentScreen = 'home';
let savedProductIds = new Set(JSON.parse(localStorage.getItem('cheal_saved_ids') || '[]'));
let selectedCategory = null;
let searchQuery = '';
let isSignUpMode = false;

// 3. DOM ELEMENTS & EVENT LISTENERS
document.addEventListener('DOMContentLoaded', () => {
  // Navigation & Screens
  const screens = document.querySelectorAll('.screen');
  const navItems = document.querySelectorAll('.nav-item');
  const categoryCards = document.querySelectorAll('.category-card');

  // Top Bar & Menus
  const menuButton = document.getElementById('menuButton');
  const menuOverlay = document.getElementById('menuOverlay');
  const closeMenu = document.getElementById('closeMenu');
  const topAccountButton = document.getElementById('topAccountButton');
  const brandHomeButton = document.getElementById('brandHomeButton');

  // Search
  const searchInput = document.getElementById('searchInput');
  const clearSearch = document.getElementById('clearSearch');

  // Auth Modal & Forms
  const authOverlay = document.getElementById('authOverlay');
  const closeAuth = document.getElementById('closeAuth');
  const authForm = document.getElementById('authForm');
  const authSwitch = document.getElementById('authSwitch');
  const signupFields = document.getElementById('signupFields');
  const authTitle = document.getElementById('authTitle');
  const authSubtitle = document.getElementById('authSubtitle');
  const authSubmitText = document.getElementById('authSubmitText');
  const authMessage = document.getElementById('authMessage');
  const accountLoginButton = document.getElementById('accountLoginButton');
  const logoutButton = document.getElementById('logoutButton');

  // Grids & Products
  const productGrid = document.getElementById('productGrid');
  const savedGrid = document.getElementById('savedGrid');
  const myListingsGrid = document.getElementById('myListingsGrid');
  const sellForm = document.getElementById('sellForm');
  const sellMessage = document.getElementById('sellMessage');

  // Account Header Elements
  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');
  const profileAvatar = document.getElementById('profileAvatar');
  const accountLoggedOut = document.getElementById('accountLoggedOut');
  const accountLoggedIn = document.getElementById('accountLoggedIn');

  // =========================================================
  // ROUTING & SCREEN NAVIGATION
  // =========================================================
  function navigateTo(screenName) {
    currentScreen = screenName;

    // Toggle screen visibility
    screens.forEach(screen => {
      if (screen.dataset.screen === screenName) {
        screen.classList.remove('hidden');
      } else {
        screen.classList.add('hidden');
      }
    });

    // Update bottom nav highlighting
    navItems.forEach(nav => {
      if (nav.dataset.nav === screenName) {
        nav.classList.add('active');
      } else {
        nav.classList.remove('active');
      }
    });

    // Close mobile side drawer if open
    if (menuOverlay) menuOverlay.classList.add('hidden');

    // Trigger grid updates depending on screen
    if (screenName === 'home') fetchProducts();
    if (screenName === 'saved') renderSavedGrid();
    if (screenName === 'my-listings') fetchMyListings();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // GLOBAL DELEGATED CLICK LISTENER (Ensures all buttons respond everywhere)
  document.addEventListener('click', (e) => {
    const routeTarget = e.target.closest('[data-route]');
    if (routeTarget) {
      e.preventDefault();
      const route = routeTarget.dataset.route;
      if (route) navigateTo(route);
    }

    const navTarget = e.target.closest('.nav-item');
    if (navTarget) {
      e.preventDefault();
      const target = navTarget.dataset.nav;
      if (target) navigateTo(target);
    }
  });

  if (brandHomeButton) {
    brandHomeButton.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('home');
    });
  }

  // =========================================================
  // SIDE MENU DRAWER & TOP BUTTONS
  // =========================================================
  if (menuButton && menuOverlay) {
    menuButton.addEventListener('click', () => menuOverlay.classList.remove('hidden'));
  }
  if (closeMenu && menuOverlay) {
    closeMenu.addEventListener('click', () => menuOverlay.classList.add('hidden'));
  }
  if (menuOverlay) {
    menuOverlay.addEventListener('click', (e) => {
      if (e.target === menuOverlay) menuOverlay.classList.add('hidden');
    });
  }

  if (topAccountButton) {
    topAccountButton.addEventListener('click', () => navigateTo('account'));
  }

  // Category filter triggers
  categoryCards.forEach(card => {
    card.addEventListener('click', () => {
      const cat = card.dataset.category;
      selectedCategory = selectedCategory === cat ? null : cat;
      categoryCards.forEach(c => c.classList.toggle('active', c.dataset.category === selectedCategory));
      fetchProducts();
    });
  });

  // =========================================================
  // SEARCH FUNCTIONALITY
  // =========================================================
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      if (clearSearch) {
        clearSearch.classList.toggle('hidden', searchQuery.length === 0);
      }
      fetchProducts();
    });
  }

  if (clearSearch) {
    clearSearch.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      searchQuery = '';
      clearSearch.classList.add('hidden');
      fetchProducts();
    });
  }

  // =========================================================
  // AUTHENTICATION LISTENERS
  // =========================================================
  if (supabase) {
    supabase.auth.onAuthStateChange((event, session) => {
      currentUser = session ? session.user : null;
      updateAccountUI();
      fetchProducts();
    });
  }

  function updateAccountUI() {
    if (currentUser) {
      if (accountLoggedOut) accountLoggedOut.classList.add('hidden');
      if (accountLoggedIn) accountLoggedIn.classList.remove('hidden');

      const userEmail = currentUser.email || 'Student User';
      if (profileName) profileName.textContent = userEmail.split('@')[0];
      if (profileEmail) profileEmail.textContent = userEmail;
      if (profileAvatar) profileAvatar.textContent = userEmail.charAt(0).toUpperCase();
    } else {
      if (accountLoggedOut) accountLoggedOut.classList.remove('hidden');
      if (accountLoggedIn) accountLoggedIn.classList.add('hidden');

      if (profileName) profileName.textContent = 'Welcome';
      if (profileEmail) profileEmail.textContent = 'Sign in to manage your account.';
      if (profileAvatar) profileAvatar.textContent = '👤';
    }
  }

  function openAuthModal() {
    if (authOverlay) authOverlay.classList.remove('hidden');
  }

  function closeAuthModal() {
    if (authOverlay) authOverlay.classList.add('hidden');
    if (authMessage) authMessage.textContent = '';
  }

  if (accountLoginButton) accountLoginButton.addEventListener('click', openAuthModal);
  if (closeAuth) closeAuth.addEventListener('click', closeAuthModal);

  if (authSwitch) {
    authSwitch.addEventListener('click', () => {
      isSignUpMode = !isSignUpMode;
      if (signupFields) signupFields.classList.toggle('hidden', !isSignUpMode);

      if (isSignUpMode) {
        authTitle.textContent = 'Create an Account';
        authSubtitle.textContent = 'Join Cheal Market to sell and chat with students.';
        authSubmitText.textContent = 'Sign up';
        authSwitch.innerHTML = 'Already have an account? <strong>Sign in</strong>';
      } else {
        authTitle.textContent = 'Welcome to Cheal Market';
        authSubtitle.textContent = 'Sign in to buy, sell and chat.';
        authSubmitText.textContent = 'Sign in';
        authSwitch.innerHTML = "Don't have an account? <strong>Sign up</strong>";
      }
    });
  }

  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!supabase) {
        if (authMessage) authMessage.textContent = 'Database client unavailable.';
        return;
      }

      if (authMessage) authMessage.textContent = 'Processing...';

      const email = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value;

      if (isSignUpMode) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          if (authMessage) authMessage.textContent = error.message;
        } else {
          if (authMessage) authMessage.textContent = 'Account created! Check your email to verify.';
          setTimeout(closeAuthModal, 2000);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (authMessage) authMessage.textContent = error.message;
        } else {
          closeAuthModal();
          authForm.reset();
        }
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      if (supabase) await supabase.auth.signOut();
      currentUser = null;
      updateAccountUI();
      navigateTo('home');
    });
  }

  // =========================================================
  // PRODUCTS FETCHING & RENDERING
  // =========================================================
  async function fetchProducts() {
    if (!productGrid) return;

    if (!supabase) {
      productGrid.innerHTML = `<div class="empty-state"><p>No products available right now.</p></div>`;
      return;
    }

    productGrid.innerHTML = `
      <div class="loading-card">
        <div class="spinner"></div>
        <p>Loading products...</p>
      </div>
    `;

    let query = supabase.from('products').select('*').order('created_at', { ascending: false });

    if (selectedCategory) {
      query = query.eq('category', selectedCategory);
    }

    const { data: products, error } = await query;

    if (error) {
      productGrid.innerHTML = `<div class="empty-state"><p>No products found.</p></div>`;
      return;
    }

    let filtered = products || [];
    if (searchQuery) {
      filtered = filtered.filter(p => 
        (p.name && p.name.toLowerCase().includes(searchQuery)) ||
        (p.title && p.title.toLowerCase().includes(searchQuery)) ||
        (p.description && p.description.toLowerCase().includes(searchQuery))
      );
    }

    renderProductCards(filtered, productGrid);
  }

  function renderProductCards(items, targetContainer) {
    if (!targetContainer) return;
    targetContainer.innerHTML = '';

    if (!items || items.length === 0) {
      targetContainer.innerHTML = `
        <div class="empty-state">
          <p>No products found.</p>
        </div>
      `;
      return;
    }

    items.forEach(product => {
      const isSaved = savedProductIds.has(product.id);
      const title = product.name || product.title || 'Untitled Product';
      const price = product.price ? `UGX ${Number(product.price).toLocaleString()}` : 'Contact for Price';
      const campus = product.campus || product.location || 'Kampala Campus';
      const image = product.image_url || 'https://via.placeholder.com/300x200?text=Cheal+Market';

      const card = document.createElement('div');
      card.className = 'product-card-item';
      card.innerHTML = `
        <div class="product-image-wrap">
          <img src="${image}" alt="${title}" loading="lazy" />
          <button type="button" class="save-btn ${isSaved ? 'saved' : ''}" data-id="${product.id}">
            ${isSaved ? '♥' : '♡'}
          </button>
        </div>
        <div class="product-details">
          <strong class="product-title">${title}</strong>
          <p class="product-price">${price}</p>
          <small class="product-campus">📍 ${campus}</small>
        </div>
      `;

      const saveBtn = card.querySelector('.save-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleSaveProduct(product.id, saveBtn);
        });
      }

      targetContainer.appendChild(card);
    });
  }

  function toggleSaveProduct(productId, btnElement) {
    if (savedProductIds.has(productId)) {
      savedProductIds.delete(productId);
      if (btnElement) {
        btnElement.classList.remove('saved');
        btnElement.textContent = '♡';
      }
    } else {
      savedProductIds.add(productId);
      if (btnElement) {
        btnElement.classList.add('saved');
        btnElement.textContent = '♥';
      }
    }
    localStorage.setItem('cheal_saved_ids', JSON.stringify(Array.from(savedProductIds)));
  }

  async function renderSavedGrid() {
    if (!savedGrid) return;
    if (savedProductIds.size === 0 || !supabase) {
      savedGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">♡</div>
          <h2>No saved items</h2>
          <p>Tap the heart on a product to save it here.</p>
        </div>
      `;
      return;
    }

    const { data: products } = await supabase.from('products').select('*').in('id', Array.from(savedProductIds));
    renderProductCards(products || [], savedGrid);
  }

  async function fetchMyListings() {
    if (!myListingsGrid) return;
    if (!currentUser || !supabase) {
      myListingsGrid.innerHTML = `
        <div class="empty-state">
          <p>Please sign in to view your listings.</p>
        </div>
      `;
      return;
    }

    const { data: products } = await supabase.from('products').select('*').eq('user_id', currentUser.id);
    renderProductCards(products || [], myListingsGrid);
  }

  // =========================================================
  // SELL FORM SUBMISSION
  // =========================================================
  if (sellForm) {
    sellForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentUser || !supabase) {
        alert('Please sign in first to post an item.');
        openAuthModal();
        return;
      }

      if (sellMessage) sellMessage.textContent = 'Publishing item...';

      const name = document.getElementById('productName').value.trim();
      const price = parseFloat(document.getElementById('productPrice').value);
      const category = document.getElementById('productCategory').value;
      const campus = document.getElementById('productCampus').value.trim();
      const description = document.getElementById('productDescription').value.trim();

      const { error } = await supabase.from('products').insert([
        {
          name,
          title: name,
          price,
          category,
          campus,
          location: campus,
          description,
          user_id: currentUser.id
        }
      ]);

      if (error) {
        if (sellMessage) sellMessage.textContent = 'Failed to post item: ' + error.message;
      } else {
        if (sellMessage) sellMessage.textContent = 'Item published successfully!';
        sellForm.reset();
        setTimeout(() => {
          if (sellMessage) sellMessage.textContent = '';
          navigateTo('home');
        }, 1500);
      }
    });
  }

  // Initial load
  fetchProducts();
});
