// ==========================================
// 1. SUPABASE CLIENT INITIALIZATION WITH SAFARI FIX
// ==========================================
const SUPABASE_URL = 'https://michealbongeze.supabase.co'
const SUPABASE_ANON_KEY = 'Sb_publishable_HVAjJNZAQIiyf1aFosvH0A_fnYoFpHx'

// Note: flowType 'implicit' prevents mobile Safari PKCE preflight errors ("Load failed")
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit'
  }
})

// ==========================================
// 2. GLOBAL STATE & DOM ELEMENTS
// ==========================================
let currentUser = null

document.addEventListener('DOMContentLoaded', () => {
  // Navigation & Modals
  const authModal = document.getElementById('auth-modal')
  const postModal = document.getElementById('post-modal')
  const authBtn = document.getElementById('auth-btn')
  const postBtn = document.getElementById('post-btn')
  const closeAuth = document.getElementById('close-auth')
  const closePost = document.getElementById('close-post')
  const userStatus = document.getElementById('user-status')

  // Forms
  const authForm = document.getElementById('auth-form')
  const signupSubmitBtn = document.getElementById('signup-submit-btn')
  const postProductForm = document.getElementById('post-product-form')
  const authError = document.getElementById('auth-error')
  const productsGrid = document.getElementById('products-grid')

  // Tab Switching
  const tabBtns = document.querySelectorAll('.tab-btn')
  const tabContents = document.querySelectorAll('.tab-content')

  // ==========================================
  // 3. AUTHENTICATION STATE & UI UPDATES
  // ==========================================
  supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session ? session.user : null
    updateUI()
    fetchProducts()
  })

  function updateUI() {
    if (currentUser) {
      if (userStatus) userStatus.textContent = `Logged in as: ${currentUser.email}`
      if (authBtn) authBtn.textContent = 'Sign Out'
    } else {
      if (userStatus) userStatus.textContent = 'Browsing as Guest'
      if (authBtn) authBtn.textContent = 'Sign In'
    }
  }

  // ==========================================
  // 4. TAB NAVIGATION
  // ==========================================
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab')

      tabBtns.forEach(b => b.classList.remove('active'))
      btn.classList.add('active')

      tabContents.forEach(content => {
        if (content.id === `${targetTab}-section`) {
          content.style.display = 'block'
        } else {
          content.style.display = 'none'
        }
      })
    })
  })

  // ==========================================
  // 5. MODAL CONTROLS
  // ==========================================
  if (authBtn) {
    authBtn.addEventListener('click', async () => {
      if (currentUser) {
        await supabase.auth.signOut()
      } else {
        if (authModal) authModal.style.display = 'flex'
      }
    })
  }

  if (postBtn) {
    postBtn.addEventListener('click', () => {
      if (!currentUser) {
        alert('Please sign in to post an item.')
        if (authModal) authModal.style.display = 'flex'
      } else {
        if (postModal) postModal.style.display = 'flex'
      }
    })
  }

  if (closeAuth) closeAuth.addEventListener('click', () => authModal.style.display = 'none')
  if (closePost) closePost.addEventListener('click', () => postModal.style.display = 'none')

  window.addEventListener('click', (e) => {
    if (e.target === authModal) authModal.style.display = 'none'
    if (e.target === postModal) postModal.style.display = 'none'
  })

  // ==========================================
  // 6. LOGIN & SIGNUP HANDLERS
  // ==========================================
  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      if (authError) authError.textContent = ''

      const email = document.getElementById('auth-email').value.trim()
      const password = document.getElementById('auth-password').value

      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        if (authError) authError.textContent = error.message
      } else {
        if (authModal) authModal.style.display = 'none'
        authForm.reset()
      }
    })
  }

  if (signupSubmitBtn) {
    signupSubmitBtn.addEventListener('click', async () => {
      if (authError) authError.textContent = ''

      const email = document.getElementById('auth-email').value.trim()
      const password = document.getElementById('auth-password').value

      if (!email || !password) {
        if (authError) authError.textContent = 'Please enter an email and password.'
        return
      }

      const { data, error } = await supabase.auth.signUp({ email, password })

      if (error) {
        if (authError) authError.textContent = error.message
      } else {
        alert('Account created! Please check your email for confirmation.')
        if (authModal) authModal.style.display = 'none'
        authForm.reset()
      }
    })
  }

  // ==========================================
  // 7. PRODUCT FETCHING & POSTING
  // ==========================================
  async function fetchProducts() {
    if (!productsGrid) return

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      productsGrid.innerHTML = `<p class="error-msg">Error loading products: ${error.message}</p>`
      return
    }

    renderProducts(products)
  }

  function renderProducts(products) {
    if (!productsGrid) return
    productsGrid.innerHTML = ''

    if (!products || products.length === 0) {
      productsGrid.innerHTML = '<p>No items posted yet.</p>'
      return
    }

    products.forEach(item => {
      const card = document.createElement('div')
      card.className = 'card'
      card.innerHTML = `
        <h3>${item.title || 'Untitled Item'}</h3>
        <p class="price">UGX ${item.price || '0'}</p>
        <p class="location">📍 ${item.location || 'Uganda'}</p>
      `
      productsGrid.appendChild(card)
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
        alert('Failed to post item: ' + error.message)
      } else {
        postProductForm.reset()
        if (postModal) postModal.style.display = 'none'
        fetchProducts()
      }
    })
  }
})
