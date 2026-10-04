// ==========================================
// 1. SUPABASE CLIENT INITIALIZATION
// ==========================================
const SUPABASE_URL = 'https://michealbongeze.supabase.co'
const SUPABASE_ANON_KEY = 'Sb_publishable_HVAjJNZAQIiyf1aFosvH0A_fnYoFpHx'

// Initialize Supabase with implicit flow to fix iOS Safari network errors
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit'
  }
})

// ==========================================
// 2. STATE MANAGEMENT & DOM ELEMENTS
// ==========================================
let currentUser = null

document.addEventListener('DOMContentLoaded', () => {
  // UI Elements
  const authModal = document.getElementById('auth-modal')
  const postModal = document.getElementById('post-modal')
  const openAuthBtn = document.getElementById('open-auth-btn')
  const openPostBtn = document.getElementById('open-post-btn')
  const closeBtns = document.querySelectorAll('.close-btn')
  
  const loginForm = document.getElementById('login-form')
  const signupForm = document.getElementById('signup-form')
  const postProductForm = document.getElementById('post-product-form')
  const authError = document.getElementById('auth-error')
  const productsContainer = document.getElementById('products-container')

  // Listen to Auth State Changes
  supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session ? session.user : null
    updateAuthUI()
    fetchProducts()
  })

  // ==========================================
  // 3. MODAL & NAVIGATION CONTROLS
  // ==========================================
  if (openAuthBtn) {
    openAuthBtn.addEventListener('click', () => showModal(authModal))
  }

  if (openPostBtn) {
    openPostBtn.addEventListener('click', () => {
      if (!currentUser) {
        alert('Please sign in to post an item.')
        showModal(authModal)
      } else {
        showModal(postModal)
      }
    })
  }

  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      hideModal(authModal)
      hideModal(postModal)
    })
  })

  window.addEventListener('click', (e) => {
    if (e.target === authModal) hideModal(authModal)
    if (e.target === postModal) hideModal(postModal)
  })

  function showModal(modal) {
    if (modal) modal.style.display = 'flex'
  }

  function hideModal(modal) {
    if (modal) modal.style.display = 'none'
  }

  function updateAuthUI() {
    const userAccountText = document.getElementById('user-account-status')
    if (userAccountText) {
      userAccountText.textContent = currentUser ? `Logged in as ${currentUser.email}` : 'Sign in to manage your account.'
    }
  }

  // ==========================================
  // 4. AUTHENTICATION HANDLERS
  // ==========================================
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      if (authError) authError.textContent = ''

      const email = document.getElementById('email').value.trim()
      const password = document.getElementById('password').value

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        if (authError) authError.textContent = error.message
      } else {
        hideModal(authModal)
        loginForm.reset()
      }
    })
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      if (authError) authError.textContent = ''

      const email = document.getElementById('signup-email').value.trim()
      const password = document.getElementById('signup-password').value

      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })

      if (error) {
        if (authError) authError.textContent = error.message
      } else {
        alert('Check your email for account confirmation!')
        hideModal(authModal)
        signupForm.reset()
      }
    })
  }

  // ==========================================
  // 5. PRODUCT FEED & DATA FETCHING
  // ==========================================
  async function fetchProducts() {
    if (!productsContainer) return

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products:', error.message)
      return
    }

    renderProducts(products)
  }

  function renderProducts(products) {
    if (!productsContainer) return
    productsContainer.innerHTML = ''

    if (!products || products.length === 0) {
      productsContainer.innerHTML = '<p class="no-items">No items posted yet.</p>'
      return
    }

    products.forEach(product => {
      const card = document.createElement('div')
      card.className = 'product-card'
      card.innerHTML = `
        <img src="${product.image_url || 'https://via.placeholder.com/150'}" alt="${product.title}" />
        <div class="product-info">
          <h3>${product.title}</h3>
          <p class="price">UGX ${product.price}</p>
          <p class="location">📍 ${product.location || 'Kampala'}</p>
        </div>
      `
      productsContainer.appendChild(card)
    })
  }

  if (postProductForm) {
    postProductForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      if (!currentUser) return

      const title = document.getElementById('product-title').value
      const price = document.getElementById('product-price').value
      const location = document.getElementById('product-location').value

      const { error } = await supabase.from('products').insert([
        {
          title,
          price: parseFloat(price),
          location,
          user_id: currentUser.id
        }
      ])

      if (error) {
        alert('Failed to post product: ' + error.message)
      } else {
        postProductForm.reset()
        hideModal(postModal)
        fetchProducts()
      }
    })
  }
})
