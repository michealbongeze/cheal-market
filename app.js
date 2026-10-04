/* =========================================================
   CHEAL MARKET — FULL APP ENGINE
   ========================================================== */

// --- CONFIGURATION & STATE ---
const SUPABASE_URL = 'https://YOUR_SUPABASE_PROJECT_ID.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';                 // Replace with your Supabase Anon Key

let supabaseClient = null;
if (window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

let currentUser = null;
let currentProfile = null;
let selectedAvatarFile = null;
let activeCategory = 'All';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  initRouting();
  initAuthListeners();
  initMarketplace();
  initProfileManagement();
  checkSession();
});

// =========================================================
// 1. ROUTING & SCREEN NAVIGATION
// =========================================================
function initRouting() {
  const navItems = document.querySelectorAll('[data-nav], [data-route]');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const route = item.getAttribute('data-route') || item.getAttribute('data-nav');
      if (route) {
        e.preventDefault();
        navigateToScreen(route);
      }
    });
  });

  const menuButton = document.getElementById('menuButton');
  const closeMenu = document.getElementById('closeMenu');
  const menuOverlay = document.getElementById('menuOverlay');

  if (menuButton && menuOverlay) {
    menuButton.addEventListener('click', () => menuOverlay.classList.remove('hidden'));
  }
  if (closeMenu && menuOverlay) {
    closeMenu.addEventListener('click', () => menuOverlay.classList.add('hidden'));
  }

  const topAccountBtn = document.getElementById('topAccountButton');
  if (topAccountBtn) {
    topAccountBtn.addEventListener('click', () => navigateToScreen('account'));
  }
}

function navigateToScreen(screenName) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(s => s.classList.add('hidden'));

  const targetScreen = document.getElementById(`${screenName}Screen`);
  if (targetScreen) {
    targetScreen.classList.remove('hidden');
  }

  // Close drawer overlay if open
  const menuOverlay = document.getElementById('menuOverlay');
  if (menuOverlay) menuOverlay.classList.add('hidden');

  // Update bottom navigation bar active state
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  navItems.forEach(nav => {
    if (nav.getAttribute('data-nav') === screenName) {
      nav.classList.add('active');
    } else {
      nav.classList.remove('active');
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =========================================================
// 2. AUTHENTICATION & SESSION
// =========================================================
function initAuthListeners() {
  const authModal = document.getElementById('authOverlay');
  const closeAuth = document.getElementById('closeAuth');
  const authLoginBtn = document.getElementById('accountLoginButton');
  const authSwitchBtn = document.getElementById('authSwitch');
  const authForm = document.getElementById('authForm');
  const logoutBtn = document.getElementById('logoutButton');
  const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');

  if (closeAuth) closeAuth.addEventListener('click', () => authModal.classList.add('hidden'));
  if (authLoginBtn) authLoginBtn.addEventListener('click', () => authModal.classList.remove('hidden'));

  let isSignUpMode = false;

  if (authSwitchBtn) {
    authSwitchBtn.addEventListener('click', () => {
      isSignUpMode = !isSignUpMode;
      const signupFields = document.getElementById('signupFields');
      const authTitle = document.getElementById('authTitle');
      const authSubmitText = document.getElementById('authSubmitText');

      if (isSignUpMode) {
        signupFields.classList.remove('hidden');
        authTitle.textContent = 'Create CHEAL Account';
        authSubmitText.textContent = 'Sign up';
        authSwitchBtn.innerHTML = 'Already have an account? <strong>Sign in</strong>';
      } else {
        signupFields.classList.add('hidden');
        authTitle.textContent = 'Welcome to CHEAL Market';
        authSubmitText.textContent = 'Sign in';
        authSwitchBtn.innerHTML = 'Don\'t have an account? <strong>Sign up</strong>';
      }
    });
  }

  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value;
      const authMsg = document.getElementById('authMessage');

      authMsg.textContent = 'Processing...';
      authMsg.style.color = '#10b981';

      try {
        if (isSignUpMode) {
          const name = document.getElementById('authName').value.trim();
          const campus = document.getElementById('authCampus').value.trim();

          const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: { data: { full_name: name, campus: campus } }
          });
          if (error) throw error;

          authMsg.textContent = 'Account created successfully!';
          setTimeout(() => authModal.classList.add('hidden'), 1000);
        } else {
          const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
          if (error) throw error;

          authMsg.textContent = 'Signed in successfully!';
          setTimeout(() => authModal.classList.add('hidden'), 1000);
        }
        checkSession();
      } catch (err) {
        authMsg.textContent = err.message || 'Authentication failed.';
        authMsg.style.color = '#ef4444';
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (supabaseClient) await supabaseClient.auth.signOut();
      currentUser = null;
      currentProfile = null;
      updateUserUI();
    });
  }

  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', async () => {
      const email = document.getElementById('authEmail').value.trim();
      const authMsg = document.getElementById('authMessage');

      if (!email) {
        authMsg.textContent = 'Please enter your email address first.';
        authMsg.style.color = '#ef4444';
        return;
      }

      try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
        if (error) throw error;
        authMsg.textContent = 'Password reset email sent!';
        authMsg.style.color = '#10b981';
      } catch (err) {
        authMsg.textContent = err.message || 'Could not send reset email.';
        authMsg.style.color = '#ef4444';
      }
    });
  }
}

async function checkSession() {
  if (!supabaseClient) return;

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session && session.user) {
    currentUser = session.user;
    await fetchProfile(currentUser.id);
  } else {
    currentUser = null;
    currentProfile = null;
  }
  updateUserUI();
}

async function fetchProfile(userId) {
  try {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      currentProfile = data;
    }
  } catch (err) {
    console.warn('Profile fetch note:', err);
  }
}

function updateUserUI() {
  const loggedOutCard = document.getElementById('accountLoggedOut');
  const loggedInCard = document.getElementById('accountLoggedIn');
  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');
  const profilePhoneInput = document.getElementById('profilePhone');

  if (currentUser) {
    if (loggedOutCard) loggedOutCard.classList.add('hidden');
    if (loggedInCard) loggedInCard.classList.remove('hidden');

    const displayName = currentProfile?.full_name || currentUser.user_metadata?.full_name || 'CHEAL User';
    if (profileName) profileName.textContent = displayName;
    if (profileEmail) profileEmail.textContent = currentUser.email;

    if (profilePhoneInput && currentProfile?.phone) {
      profilePhoneInput.value = currentProfile.phone;
    }

    // Render avatar picture or fallback initial
    renderProfileAvatar(currentProfile?.avatar_url || currentUser.user_metadata?.avatar_url, displayName);
  } else {
    if (loggedOutCard) loggedOutCard.classList.remove('hidden');
    if (loggedInCard) loggedInCard.classList.add('hidden');
    if (profileName) profileName.textContent = 'Welcome';
    if (profileEmail) profileEmail.textContent = 'Sign in to manage your account.';
    renderProfileAvatar(null, 'M');
  }
}

// =========================================================
// 3. PROFILE PICTURE & ACCOUNT INFO SAVING
// =========================================================
function initProfileManagement() {
  const avatarInput = document.getElementById('avatarInput');
  const avatarFileName = document.getElementById('avatarFileName');
  const saveProfileBtn = document.getElementById('saveProfileInfoBtn');
  const profileSaveMsg = document.getElementById('profileSaveMessage');

  if (avatarInput) {
    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        selectedAvatarFile = file;
        if (avatarFileName) avatarFileName.textContent = file.name;
      }
    });
  }

  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', async () => {
      if (!profileSaveMsg) return;

      profileSaveMsg.textContent = 'Saving profile...';
      profileSaveMsg.style.color = '#10b981';

      if (!currentUser) {
        profileSaveMsg.textContent = 'Please sign in to update profile.';
        profileSaveMsg.style.color = '#ef4444';
        return;
      }

      try {
        let avatarUrl = currentProfile?.avatar_url || null;

        // 1. Upload photo to Supabase storage if file was selected
        if (selectedAvatarFile) {
          const fileExt = selectedAvatarFile.name.split('.').pop();
          const filePath = `avatars/${currentUser.id}-${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabaseClient.storage
            .from('avatars')
            .upload(filePath, selectedAvatarFile, { upsert: true });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabaseClient.storage
            .from('avatars')
            .getPublicUrl(filePath);

          avatarUrl = urlData.publicUrl;
        }

        // 2. Update user profile database table
        const phoneInput = document.getElementById('profilePhone')?.value || '';

        const updates = {
          id: currentUser.id,
          phone: phoneInput,
          avatar_url: avatarUrl,
          updated_at: new Date()
        };

        const { error: updateError } = await supabaseClient
          .from('profiles')
          .upsert(updates);

        if (updateError) throw updateError;

        currentProfile = { ...currentProfile, ...updates };

        // 3. Update UI Avatar immediately
        const displayName = currentProfile?.full_name || currentUser.user_metadata?.full_name || 'CHEAL User';
        renderProfileAvatar(avatarUrl, displayName);

        profileSaveMsg.textContent = 'Profile updated successfully!';
      } catch (err) {
        console.error('Save error:', err);
        profileSaveMsg.textContent = err.message || 'Failed to update profile.';
        profileSaveMsg.style.color = '#ef4444';
      }
    });
  }
}

function renderProfileAvatar(url, name = 'M') {
  const avatarImg = document.getElementById('profileAvatarImg');
  const avatarInitial = document.getElementById('profileAvatarInitial');

  const initialChar = name.charAt(0).toUpperCase();

  if (url && avatarImg) {
    avatarImg.src = url;
    avatarImg.classList.remove('hidden');
    if (avatarInitial) avatarInitial.classList.add('hidden');
  } else {
    if (avatarImg) avatarImg.classList.add('hidden');
    if (avatarInitial) {
      avatarInitial.textContent = initialChar;
      avatarInitial.classList.remove('hidden');
    }
  }
}

// =========================================================
// 4. MARKETPLACE, SEARCH & LISTINGS
// =========================================================
function initMarketplace() {
  const categoryBtns = document.querySelectorAll('.category-card');
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.getAttribute('data-category');
      const title = document.getElementById('productSectionTitle');
      if (title) title.textContent = `${activeCategory} Listings`;
    });
  });

  const sellForm = document.getElementById('sellForm');
  if (sellForm) {
    sellForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const sellMsg = document.getElementById('sellMessage');

      if (!currentUser) {
        if (sellMsg) {
          sellMsg.textContent = 'Please sign in to post an item.';
          sellMsg.style.color = '#ef4444';
        }
        document.getElementById('authOverlay')?.classList.remove('hidden');
        return;
      }

      if (sellMsg) {
        sellMsg.textContent = 'Publishing listing...';
        sellMsg.style.color = '#10b981';
      }

      const title = document.getElementById('productName').value;
      const price = document.getElementById('productPrice').value;
      const category = document.getElementById('productCategory').value;
      const campus = document.getElementById('productCampus').value;
      const description = document.getElementById('productDescription').value;

      try {
        const { data, error } = await supabaseClient
          .from('products')
          .insert([
            {
              user_id: currentUser.id,
              title,
              price: parseFloat(price),
              category,
              campus,
              description,
              created_at: new Date()
            }
          ]);

        if (error) throw error;

        if (sellMsg) sellMsg.textContent = 'Listing published successfully!';
        sellForm.reset();
        setTimeout(() => navigateToScreen('home'), 1200);
      } catch (err) {
        if (sellMsg) {
          sellMsg.textContent = err.message || 'Failed to publish listing.';
          sellMsg.style.color = '#ef4444';
        }
      }
    });
  }
}
