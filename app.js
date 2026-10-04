const SUPABASE_URL = "https://qwlklqjfbrhythpynghr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_HVAjJNZAQIiyf1aFosvH0A_fnYoFpHx";
const BUCKET_NAME = "product-images";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

/* =========================================================
   CHEAL MARKET - Application State
   ========================================================= */

let currentUser = null;
let currentProfile = null;
let currentConversation = null;
let realtimeChannel = null;

const $ = (id) => document.getElementById(id);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

/* =========================================================
   HELPERS
   ========================================================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatPrice(value) {
  const number = Number(value || 0);
  return `UGX ${number.toLocaleString("en-UG")}`;
}

function getUserName() {
  if (!currentUser) return "Guest";
  return (
    currentProfile?.full_name ||
    currentProfile?.name ||
    currentUser.user_metadata?.full_name ||
    currentUser.user_metadata?.name ||
    currentUser.email?.split("@")[0] ||
    "User"
  );
}

function showNotice(message, type = "info") {
  const existing = $("globalNotice");
  if (existing) existing.remove();

  const notice = document.createElement("div");
  notice.id = "globalNotice";
  notice.className = `global-notice ${type}`;
  notice.textContent = message;

  document.body.appendChild(notice);

  setTimeout(() => {
    notice.remove();
  }, 4000);
}

function closeAllOverlays() {
  $("authOverlay")?.classList.add("hidden");
  $("menuOverlay")?.classList.add("hidden");
}

/* =========================================================
   NAVIGATION
   ========================================================= */

const validRoutes = [
  "home",
  "saved",
  "sell",
  "messages",
  "chat",
  "account",
  "my-listings",
  "product"
];

function navigate(route, data = null) {
  if (!validRoutes.includes(route)) {
    route = "home";
  }

  document
    .querySelectorAll(".screen")
    .forEach((screen) => screen.classList.add("hidden"));

  const screen = $(`${route.replace("-", "")}Screen`);
  if (screen) {
    screen.classList.remove("hidden");
  } else if (route === "home") {
    $("homeScreen")?.classList.remove("hidden");
  }

  document.querySelectorAll("[data-nav]").forEach((item) => {
    item.classList.toggle("active", item.dataset.nav === route);
  });

  if (route === "saved") loadSavedProducts();
  if (route === "messages") loadConversations();
  if (route === "account") updateAccountUI();
  if (route === "my-listings") loadMyListings();
  if (route === "product" && data) showProductDetails(data);
  if (route === "chat" && data) openChat(data);

  window.scrollTo({ top: 0, behavior: "smooth" });
  closeAllOverlays();
}

function handleHashNavigation() {
  let route = window.location.hash.replace("#", "");
  if (!route) route = "home";
  navigate(route);
}

window.addEventListener("hashchange", handleHashNavigation);

/* =========================================================
   MENU OVERLAY
   ========================================================= */

function openMenu() {
  $("menuOverlay")?.classList.remove("hidden");
}

function closeMenu() {
  $("menuOverlay")?.classList.add("hidden");
}

/* =========================================================
   AUTH MODAL & CONTROLS
   ========================================================= */

let authMode = "signin";

function openAuth(mode = "signin") {
  authMode = mode;
  const overlay = $("authOverlay");
  if (!overlay) return;

  overlay.classList.remove("hidden");
  updateAuthModal();
}

function closeAuth() {
  $("authOverlay")?.classList.add("hidden");
}

function updateAuthModal() {
  const title = $("authTitle");
  const subtitle = $("authSubtitle");
  const submitText = $("authSubmitText");
  const switchButton = $("authSwitch");
  const signupFields = $("signupFields");

  if (authMode === "signup") {
    if (title) title.textContent = "Create your account";
    if (subtitle) subtitle.textContent = "Join Cheal Market and start buying or selling.";
    if (submitText) submitText.textContent = "Create account";
    if (switchButton) switchButton.textContent = "Already have an account? Sign in";
    signupFields?.classList.remove("hidden");
  } else {
    if (title) title.textContent = "Welcome back";
    if (subtitle) subtitle.textContent = "Sign in to continue to Cheal Market.";
    if (submitText) submitText.textContent = "Sign in";
    if (switchButton) switchButton.textContent = "Don't have an account? Create one";
    signupFields?.classList.add("hidden");
  }

  const message = $("authMessage");
  if (message) message.textContent = "";
}

/* =========================================================
   AUTHENTICATION LOGIC
   ========================================================= */

async function handleAuthSubmit(event) {
  event.preventDefault();

  const email = $("authEmail")?.value.trim();
  const password = $("authPassword")?.value;
  const name = $("authName")?.value.trim();
  const campus = $("authCampus")?.value.trim();

  const message = $("authMessage");
  const submit = $("authSubmitText");

  if (!email || !password) {
    if (message) message.textContent = "Please enter your email and password.";
    return;
  }

  if (authMode === "signup" && !name) {
    if (message) message.textContent = "Please enter your name.";
    return;
  }

  try {
    if (submit) {
      submit.textContent = authMode === "signup" ? "Creating account..." : "Signing in...";
    }

    if (authMode === "signup") {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, name, campus }
        }
      });

      if (error) throw error;

      currentUser = data.user || null;
      if (currentUser) {
        await createProfile(currentUser, name, campus);
      }

      if (message) message.textContent = "Account created successfully.";

      setTimeout(() => {
        closeAuth();
        updateAccountUI();
      }, 800);
    } else {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      currentUser = data.user || null;
      await loadCurrentProfile();

      if (message) message.textContent = "Signed in successfully.";

      setTimeout(() => {
        closeAuth();
        updateAccountUI();
        navigate("home");
      }, 500);
    }
  } catch (error) {
    console.error(error);
    if (message) {
      message.textContent = error?.message || "Something went wrong. Please try again.";
    }
  } finally {
    if (submit) {
      submit.textContent = authMode === "signup" ? "Create account" : "Sign in";
    }
  }
}

async function createProfile(user, name, campus) {
  try {
    const { error } = await supabaseClient.from("profiles").upsert({
      id: user.id,
      full_name: name,
      name,
      campus,
      email: user.email
    });

    if (error) console.warn("Profile creation warning:", error.message);
  } catch (error) {
    console.warn("Could not create profile:", error);
  }
}

async function loadCurrentUser() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    currentUser = session?.user || null;

    if (currentUser) {
      await loadCurrentProfile();
    } else {
      currentProfile = null;
    }

    updateAccountUI();
  } catch (error) {
    console.error("Could not load current user:", error);
    currentUser = null;
    currentProfile = null;
    updateAccountUI();
  }
}

async function loadCurrentProfile() {
  if (!currentUser) {
    currentProfile = null;
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (error) {
      console.warn("Could not load profile:", error.message);
      currentProfile = null;
      return;
    }

    currentProfile = data || null;
  } catch (error) {
    console.warn("Profile error:", error);
    currentProfile = null;
  }
}

/* =========================================================
   ACCOUNT UI UPDATE & LOGOUT FIX
   ========================================================= */

function updateAccountUI() {
  const loggedOut = $("accountLoggedOut");
  const loggedIn = $("accountLoggedIn");

  const nameElement = $("profileName");
  const emailElement = $("profileEmail");
  const avatar = $("profileAvatar");

  // State: LOGGED OUT
  if (!currentUser) {
    loggedOut?.classList.remove("hidden");
    loggedIn?.classList.add("hidden");

    if (nameElement) nameElement.textContent = "";
    if (emailElement) emailElement.textContent = "";
    if (avatar) avatar.textContent = "👤";

    return;
  }

  // State: LOGGED IN
  loggedOut?.classList.add("hidden");
  loggedIn?.classList.remove("hidden");

  const name = getUserName();

  if (nameElement) nameElement.textContent = name;
  if (emailElement) emailElement.textContent = currentUser.email || "";
  if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
}

async function logout() {
  try {
    // 1. Immediately wipe local state
    currentUser = null;
    currentProfile = null;
    currentConversation = null;

    if (realtimeChannel) {
      try {
        await supabaseClient.removeChannel(realtimeChannel);
      } catch (err) {
        console.warn("Realtime cleanup warning:", err);
      }
      realtimeChannel = null;
    }

    // 2. Immediately purge state from DOM
    updateAccountUI();

    // 3. Clear session on Supabase
    const { error } = await supabaseClient.auth.signOut();
    if (error) console.error("Supabase logout error:", error);

    // 4. Final state check, re-render and navigate home
    currentUser = null;
    currentProfile = null;
    updateAccountUI();

    navigate("home");
    showNotice("You have been signed out.", "success");
  } catch (error) {
    console.error(error);
    currentUser = null;
    currentProfile = null;
    currentConversation = null;

    updateAccountUI();
    navigate("home");
    showNotice("You have been signed out.", "success");
  }
}

function setupAuthListener() {
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    currentUser = session?.user || null;

    if (!currentUser) {
      currentProfile = null;
      currentConversation = null;

      if (realtimeChannel) {
        try {
          await supabaseClient.removeChannel(realtimeChannel);
        } catch (error) {
          console.warn(error);
        }
        realtimeChannel = null;
      }

      updateAccountUI();
      return;
    }

    await loadCurrentProfile();
    updateAccountUI();
  });
}

/* =========================================================
   PRODUCTS
   ========================================================= */

let allProducts = [];

async function loadProducts() {
  try {
    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    allProducts = data || [];
    renderProducts(allProducts);
  } catch (error) {
    console.error("Could not load products:", error);
    allProducts = [];
    renderProducts([]);
    showNotice("Could not load products.", "error");
  }
}

function renderProducts(products) {
  const grid = $("productGrid");
  if (!grid) return;

  if (!products.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>No products found</h3>
        <p>Try another search or category.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map((product) => productCardHTML(product)).join("");
}

function productCardHTML(product) {
  const image = product.image_url || product.image || "";
  const name = product.name || product.title || "Unnamed product";
  const category = product.category || "Other";
  const campus = product.campus || "Campus";

  return `
    <article class="product-card" data-product-id="${escapeHTML(product.id)}">
      <div class="product-image-wrap">
        ${
          image
            ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(name)}" class="product-image">`
            : `<div class="product-image-placeholder">📦</div>`
        }
      </div>
      <div class="product-card-body">
        <h3>${escapeHTML(name)}</h3>
        <strong>${formatPrice(product.price)}</strong>
        <p>${escapeHTML(campus)}</p>
        <span class="product-category">${escapeHTML(category)}</span>
      </div>
    </article>
  `;
}

/* =========================================================
   SEARCH
   ========================================================= */

function setupSearch() {
  const searchInput = $("searchInput");
  const clearSearch = $("clearSearch");

  searchInput?.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();

    if (clearSearch) {
      clearSearch.classList.toggle("hidden", !query);
    }

    if (!query) {
      renderProducts(allProducts);
      return;
    }

    const filtered = allProducts.filter((product) => {
      const text = [
        product.name,
        product.title,
        product.description,
        product.category,
        product.campus
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(query);
    });

    renderProducts(filtered);
  });

  clearSearch?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    clearSearch.classList.add("hidden");
    renderProducts(allProducts);
  });
}

/* =========================================================
   SAVED PRODUCTS
   ========================================================= */

async function getSavedIds() {
  if (!currentUser) return [];

  try {
    const { data, error } = await supabaseClient
      .from("saved_products")
      .select("product_id")
      .eq("user_id", currentUser.id);

    if (error) return [];
    return (data || []).map((row) => row.product_id);
  } catch {
    return [];
  }
}

async function loadSavedProducts() {
  const grid = $("savedGrid");
  if (!grid) return;

  if (!currentUser) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>Sign in to see saved items</h3>
        <p>Save products you want to find later.</p>
        <button class="primary-button" data-action="signin">Sign in</button>
      </div>
    `;
    return;
  }

  try {
    const ids = await getSavedIds();

    if (!ids.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>No saved items yet</h3>
          <p>Products you save will appear here.</p>
        </div>
      `;
      return;
    }

    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .in("id", ids);

    if (error) throw error;

    grid.innerHTML = (data || []).map((product) => productCardHTML(product)).join("");
  } catch (error) {
    console.error(error);
    grid.innerHTML = `<div class="empty-state"><h3>Could not load saved items</h3></div>`;
  }
}

async function toggleSaved(productId) {
  if (!currentUser) {
    openAuth("signin");
    return;
  }

  try {
    const { data } = await supabaseClient
      .from("saved_products")
      .select("id")
      .eq("user_id", currentUser.id)
      .eq("product_id", productId)
      .maybeSingle();

    if (data) {
      await supabaseClient.from("saved_products").delete().eq("id", data.id);
      showNotice("Removed from saved items.", "success");
    } else {
      const { error } = await supabaseClient.from("saved_products").insert({
        user_id: currentUser.id,
        product_id: productId
      });

      if (error) throw error;
      showNotice("Product saved.", "success");
    }

    await loadSavedProducts();
  } catch (error) {
    console.error(error);
    showNotice("Could not update saved item.", "error");
  }
}

/* =========================================================
   PRODUCT DETAILS
   ========================================================= */

async function showProductDetails(product) {
  const container = $("productDetails");
  if (!container) return;

  const image = product.image_url || product.image || "";

  container.innerHTML = `
    <div class="product-detail">
      <button class="back-button" data-action="back-home">← Back</button>
      <div class="product-detail-image">
        ${
          image
            ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(product.name || "Product")}">`
            : "📦"
        }
      </div>
      <div class="product-detail-content">
        <span class="product-category">${escapeHTML(product.category || "Other")}</span>
        <h1>${escapeHTML(product.name || product.title || "Product")}</h1>
        <h2>${formatPrice(product.price)}</h2>
        <p>${escapeHTML(product.description || "No description provided.")}</p>
        <p>📍 ${escapeHTML(product.campus || "Campus")}</p>
        <div class="product-actions">
          <button class="primary-button" data-action="contact-seller" data-product-id="${escapeHTML(product.id)}">💬 Contact seller</button>
          <button class="secondary-button" data-action="save-product" data-product-id="${escapeHTML(product.id)}">❤️ Save</button>
        </div>
      </div>
    </div>
  `;

  navigate("product");
}

/* =========================================================
   SELL PRODUCT & IMAGE UPLOAD
   ========================================================= */

async function uploadProductImages(files) {
  const urls = [];

  for (const file of files) {
    const extension = file.name.split(".").pop();
    const fileName = `${currentUser.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${extension}`;

    const { error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, { upsert: false });

    if (error) throw error;

    const { data } = supabaseClient.storage.from(BUCKET_NAME).getPublicUrl(fileName);
    if (data?.publicUrl) urls.push(data.publicUrl);
  }

  return urls;
}

function setupImagePreview() {
  const input = $("productImages");
  const preview = $("imagePreview");

  input?.addEventListener("change", () => {
    if (!preview) return;
    preview.innerHTML = "";

    const files = Array.from(input.files || []).slice(0, 5);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = document.createElement("img");
        img.src = reader.result;
        img.alt = "Product preview";
        preview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });
}

async function handleSellSubmit(event) {
  event.preventDefault();

  if (!currentUser) {
    openAuth("signin");
    return;
  }

  const name = $("productName")?.value.trim();
  const price = Number($("productPrice")?.value || 0);
  const category = $("productCategory")?.value;
  const campus = $("productCampus")?.value.trim();
  const description = $("productDescription")?.value.trim();
  const files = Array.from($("productImages")?.files || []).slice(0, 5);
  const message = $("sellMessage");

  try {
    if (!name || !price || !category) {
      if (message) message.textContent = "Please fill in all required fields.";
      return;
    }

    if (message) message.textContent = "Uploading product...";

    let imageUrls = [];
    if (files.length) {
      imageUrls = await uploadProductImages(files);
    }

    const payload = {
      name,
      price,
      category,
      campus,
      description,
      seller_id: currentUser.id,
      seller_name: getUserName(),
      image_url: imageUrls[0] || null,
      images: imageUrls
    };

    const { error } = await supabaseClient.from("products").insert(payload);
    if (error) throw error;

    if (message) message.textContent = "Product listed successfully!";

    $("sellForm")?.reset();
    if ($("imagePreview")) $("imagePreview").innerHTML = "";

    await loadProducts();

    setTimeout(() => {
      navigate("home");
    }, 1000);
  } catch (error) {
    console.error(error);
    if (message) {
      message.textContent = error?.message || "Could not list product.";
    }
  }
}

/* =========================================================
   MY LISTINGS
   ========================================================= */

async function loadMyListings() {
  const grid = $("myListingsGrid");
  if (!grid) return;

  if (!currentUser) {
    grid.innerHTML = `<div class="empty-state"><h3>Sign in to view your listings</h3></div>`;
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .eq("seller_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data?.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>You have no listings yet</h3>
          <p>Sell something to students on campus.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = data.map((product) => productCardHTML(product)).join("");
  } catch (error) {
    console.error(error);
    grid.innerHTML = `<div class="empty-state"><h3>Could not load your listings</h3></div>`;
  }
}

/* =========================================================
   MESSAGES & CONVERSATIONS
   ========================================================= */

async function loadConversations() {
  const list = $("conversationList");
  if (!list) return;

  if (!currentUser) {
    list.innerHTML = `
      <div class="empty-state">
        <h3>Sign in to view messages</h3>
        <button class="primary-button" data-action="signin">Sign in</button>
      </div>
    `;
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("conversations")
      .select("*")
      .or(`buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    if (!data?.length) {
      list.innerHTML = `
        <div class="empty-state">
          <h3>No messages yet</h3>
          <p>Your conversations will appear here.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = data
      .map((conversation) => {
        const otherName =
          conversation.buyer_id === currentUser.id
            ? conversation.seller_name
            : conversation.buyer_name;

        return `
          <button class="conversation-item" data-action="open-conversation" data-conversation-id="${escapeHTML(conversation.id)}">
            <div class="conversation-avatar">${escapeHTML((otherName || "U").charAt(0).toUpperCase())}</div>
            <div>
              <strong>${escapeHTML(otherName || "User")}</strong>
              <p>${escapeHTML(conversation.product_name || "Conversation")}</p>
            </div>
          </button>
        `;
      })
      .join("");
  } catch (error) {
    console.error(error);
    list.innerHTML = `<div class="empty-state"><h3>Messages are not available yet</h3></div>`;
  }
}

/* =========================================================
   CHAT
   ========================================================= */

async function openChat(conversation) {
  currentConversation = conversation;

  const name = $("chatName");
  const product = $("chatProduct");

  if (name) {
    name.textContent =
      conversation.other_name ||
      conversation.seller_name ||
      conversation.buyer_name ||
      "Chat";
  }

  if (product) product.textContent = conversation.product_name || "";

  await loadChatMessages(conversation.id);
  setupRealtimeChat(conversation.id);
  navigate("chat");
}

async function loadChatMessages(conversationId) {
  const container = $("chatMessages");
  if (!container) return;

  try {
    const { data, error } = await supabaseClient
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    container.innerHTML = (data || [])
      .map((message) => {
        const mine = message.sender_id === currentUser?.id;
        return `
          <div class="chat-message ${mine ? "mine" : "theirs"}">
            <div class="message-bubble">${escapeHTML(message.content)}</div>
          </div>
        `;
      })
      .join("");

    container.scrollTop = container.scrollHeight;
  } catch (error) {
    console.error(error);
  }
}

function setupRealtimeChat(conversationId) {
  if (realtimeChannel) {
    supabaseClient.removeChannel(realtimeChannel);
  }

  realtimeChannel = supabaseClient
    .channel(`conversation-${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`
      },
      () => {
        loadChatMessages(conversationId);
      }
    )
    .subscribe();
}

async function sendMessage(event) {
  event.preventDefault();

  if (!currentUser || !currentConversation) return;

  const input = $("chatInput");
  const content = input?.value.trim();

  if (!content) return;

  try {
    const { error } = await supabaseClient.from("messages").insert({
      conversation_id: currentConversation.id,
      sender_id: currentUser.id,
      content
    });

    if (error) throw error;

    input.value = "";
    await loadChatMessages(currentConversation.id);
  } catch (error) {
    console.error(error);
    showNotice("Could not send message.", "error");
  }
}

/* =========================================================
   CONTACT SELLER
   ========================================================= */

async function contactSeller(product) {
  if (!currentUser) {
    openAuth("signin");
    return;
  }

  if (product.seller_id === currentUser.id) {
    showNotice("This is your own listing.", "info");
    return;
  }

  try {
    const { data: existing } = await supabaseClient
      .from("conversations")
      .select("*")
      .eq("product_id", product.id)
      .or(`buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`)
      .maybeSingle();

    if (existing) {
      openChat({ ...existing, other_name: product.seller_name });
      return;
    }

    const { data, error } = await supabaseClient
      .from("conversations")
      .insert({
        product_id: product.id,
        product_name: product.name || product.title,
        buyer_id: currentUser.id,
        buyer_name: getUserName(),
        seller_id: product.seller_id,
        seller_name: product.seller_name
      })
      .select()
      .single();

    if (error) throw error;

    openChat({ ...data, other_name: product.seller_name });
  } catch (error) {
    console.error(error);
    showNotice("Could not start conversation.", "error");
  }
}

/* =========================================================
   GLOBAL CLICK HANDLER
   ========================================================= */

document.addEventListener("click", async (event) => {
  const routeElement = event.target.closest("[data-route]");
  if (routeElement) {
    event.preventDefault();
    navigate(routeElement.dataset.route);
    return;
  }

  const navElement = event.target.closest("[data-nav]");
  if (navElement) {
    event.preventDefault();
    navigate(navElement.dataset.nav);
    return;
  }

  const actionElement = event.target.closest("[data-action]");
  if (!actionElement) return;

  const action = actionElement.dataset.action;

  if (action === "signin") {
    openAuth("signin");
    return;
  }
  if (action === "signup") {
    openAuth("signup");
    return;
  }
  if (action === "logout") {
    await logout();
    return;
  }
  if (action === "open-menu") {
    openMenu();
    return;
  }
  if (action === "close-menu") {
    closeMenu();
    return;
  }
  if (action === "close-auth") {
    closeAuth();
    return;
  }
  if (action === "back-home") {
    navigate("home");
    return;
  }

  if (action === "save-product") {
    const id = actionElement.dataset.productId;
    const product = allProducts.find((item) => String(item.id) === String(id));
    if (product) await toggleSaved(product.id);
    return;
  }

  if (action === "contact-seller") {
    const id = actionElement.dataset.productId;
    const product = allProducts.find((item) => String(item.id) === String(id));
    if (product) await contactSeller(product);
    return;
  }

  if (action === "open-conversation") {
    const id = actionElement.dataset.conversationId;
    try {
      const { data, error } = await supabaseClient
        .from("conversations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      openChat(data);
    } catch (error) {
      console.error(error);
    }
    return;
  }
});

/* =========================================================
   PRODUCT CARD CLICK
   ========================================================= */

document.addEventListener("click", (event) => {
  const card = event.target.closest(".product-card");
  if (!card) return;

  if (event.target.closest("button, a, input")) return;

  const id = card.dataset.productId;
  const product = allProducts.find((item) => String(item.id) === String(id));
  if (product) showProductDetails(product);
});

/* =========================================================
   EVENT LISTENERS
   ========================================================= */

$("authForm")?.addEventListener("submit", handleAuthSubmit);
$("sellForm")?.addEventListener("submit", handleSellSubmit);
$("chatForm")?.addEventListener("submit", sendMessage);

$("authSwitch")?.addEventListener("click", () => {
  authMode = authMode === "signin" ? "signup" : "signin";
  updateAuthModal();
});

$("closeAuth")?.addEventListener("click", closeAuth);
$("closeMenu")?.addEventListener("click", closeMenu);
$("menuButton")?.addEventListener("click", openMenu);
$("topAccountButton")?.addEventListener("click", () => navigate("account"));
$("accountLoginButton")?.addEventListener("click", () => openAuth("signin"));
$("logoutButton")?.addEventListener("click", logout);

setupImagePreview();
setupSearch();

$("locationButton")?.addEventListener("click", () => {
  showNotice("Location filtering will be available soon.", "info");
});

/* =========================================================
   INITIALIZATION
   ========================================================= */

async function initializeApp() {
  updateAccountUI();
  await loadCurrentUser();
  setupAuthListener();
  await loadProducts();
  handleHashNavigation();
}

initializeApp();
