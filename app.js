// ==========================================
// 1. SUPABASE CLIENT INITIALIZATION
// ==========================================
// Project ID: michealbongeze | Anon Key: Sb_publishable_HVAjJNZAQIiyf1aFosvH0A_fnYoFpHx
const SUPABASE_URL = 'https://michealbongeze.supabase.co'
const SUPABASE_ANON_KEY = 'Sb_publishable_HVAjJNZAQIiyf1aFosvH0A_fnYoFpHx'

// Note: flowType 'implicit' prevents iOS Safari WebKit PKCE fetch blocks ("Load failed")
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit'
  }
})

// ==========================================
// 2. STATE MANAGEMENT & DOM INITIALIZATION
// ==========================================
let currentUser = null

document.addEventListener('DOMContentLoaded', () => {
  // Elements matching your original CHEAL Market setup
  const authModal = document.getElementById('auth-modal')
  const postModal = document.getElementById('post-modal')
  const openAuthBtn = document.getElementById('open-auth-btn') || document.getElementById('auth-btn')
  const openPostBtn = document.getElementById('open-post-btn') || document.getElementById('post-btn')
  const closeBtns = document.querySelectorAll('.close-btn, #close-auth, #close-post')
  
  const loginForm = document.getElementById('login-form') || document.getElementById('auth-form')
  const postProductForm = document.getElementById('post-product-form')
  const authError = document.getElementById('auth-error')
  const productsContainer = document.getElementById('products-container') || document.getElementById('products-grid')

  // Listen to Auth State Changes
  supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session ? session.user : null
    updateAuthUI()
    fetchProducts()
  })

  // ==========================================
  // 3. INTERACTIVE BUTTON & MODAL CONTROLS
  // ==========================================
  if (openAuthBtn) {
    openAuthBtn.addEventListener('click', async () => {
      if (currentUser) {
        await supabase.auth.signOut()
      } else if (authModal) {
        authModal.style.display = 'flex'
      }
    })
  }

  if (openPostBtn) {
    openPostBtn.addEventListener('click', () => {
      if (!currentUser) {
        alert('Please sign in to post an item on CHEAL Market.')
        if (authModal) authModal.style.display = 'flex'
      } else if (postModal) {
        postModal.style.display = 'flex'
      }
    })
  }

  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (authModal) authModal.style.display = 'none'
      if (postModal) postModal.style.display = 'none'
    })
  })

  window.addEventListener('click', (e) => {
    if (e.target === authModal) authModal.style.display = 'none'
    if (e.target === postModal) postModal.style.display = 'none'
  })

  function updateAuthUI() {
    const userStatus = document.getElementById('user-account-status') || document.getElementById('user-status')
    if (userStatus) {
      userStatus.textContent = currentUser ? `Logged in as: ${currentUser.email}` : 'Browsing as Guest'
    }
    if (openAuthBtn) {
      openAuthBtn.textContent = currentUser ? 'Sign Out' : 'Sign In'
    }
  }

  // ==========================================
  // 4. AUTHENTICATION (SIGN IN & SIGN UP)
  // ==========================================
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      if (authError) authError.textContent = ''

      const emailInput = document.getElementById('email') || document.getElementById('auth-email')
      const passwordInput = document.getElementById('password') || document.getElementById('auth-password')

      if (!emailInput || !passwordInput) return

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput.value.trim(),
        password: passwordInput.value
      })

      if (error) {
        if (authError) authError.textContent = error.message
      } else {
        if (authModal) authModal.style.display = 'none'
        loginForm.reset()
      }
    })
  }

  // ==========================================
  // 5. PRODUCT FEED & SUBMISSIONS
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
      card.className = 'product-card card'
      card.innerHTML = `
        <h3>${product.title || 'Untitled Item'}</h3>
        <p class="price">UGX ${product.price || 0}</p>
        <p class="location">📍 ${product.location || 'Kampala'}</p>
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
        if (postModal) postModal.style.display = 'none'
        fetchProducts()
      }
    })
  }
})
