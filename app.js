// ==========================================
// 1. SUPABASE CLIENT INITIALIZATION
// ==========================================
// Replace these placeholders with your actual Supabase credentials from Project Settings -> API
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY'

// Initialize Supabase with implicit flow to avoid Safari WebKit PKCE fetch blocks
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit'
  }
})

// ==========================================
// 2. AUTHENTICATION LOGIC
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form') // Update with your form ID if different
  const errorMessage = document.getElementById('error-message') // Update with your error element ID

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      
      const email = document.getElementById('email').value
      const password = document.getElementById('password').value

      if (errorMessage) errorMessage.textContent = ''

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      if (error) {
        console.error('Sign-in error:', error.message)
        if (errorMessage) errorMessage.textContent = error.message
      } else {
        console.log('User signed in successfully:', data)
        window.location.reload()
      }
    })
  }
})
