/* =========================================================
   CHEAL MARKET 2.0
   Supabase-powered marketplace
   ========================================================= */

const SUPABASE_URL = "https://qwlklqjfbrhythpynghr.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_HVAjJNZAQIiyf1AosvH0A_fnYoFpHx";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const BUCKET_NAME = "product-images";

let currentUser = null;
let currentProfile = null;
let currentScreen = "home";
let currentConversation = null;
let realtimeChannel = null;
let selectedImages = [];
let allProducts = [];
let savedProducts = JSON.parse(
  localStorage.getItem("cheal_saved_products") || "[]"
);


/* =========================================================
   HELPERS
   ========================================================= */

const $ = (id) => document.getElementById(id);

function escapeHTML(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatPrice(value) {
  const number = Number(value || 0);

  return `UGX ${number.toLocaleString("en-UG")}`;
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short"
  });
}

function formatTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-UG", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getProductName(product) {
  return product.name || product.title || "Untitled product";
}

function getProductDescription(product) {
  return product.description || product.desc || "";
}

function getProductCategory(product) {
  return product.category || product.cat || "Other";
}

function getProductCampus(product) {
  return product.campus || "Kampala";
}

function getImageUrls(product) {
  if (!product || !product.image_urls) return [];

  if (Array.isArray(product.image_urls)) {
    return product.image_urls;
  }

  try {
    const parsed = JSON.parse(product.image_urls);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function productInitial(product) {
  return getProductName(product).charAt(0).toUpperCase();
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function navigate(route) {
  const validRoutes = [
    "home",
    "saved",
    "sell",
    "messages",
    "account",
    "my-listings",
    "chat",
    "product"
  ];

  if (!validRoutes.includes(route)) {
    route = "home";
  }

  currentScreen = route;

  if (route !== "product" && route !== "chat") {
    history.pushState(
      { route },
      "",
      `#${route}`
    );
  }

  showScreen(route);

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });
}

function showScreen(route) {
  const screens = document.querySelectorAll(".screen");

  screens.forEach((screen) => {
    screen.classList.add("hidden");
  });

  let targetId = `${route}Screen`;

  if (route === "my-listings") {
    targetId = "myListingsScreen";
  }

  if (route === "product") {
    targetId = "productScreen";
  }

  if (route === "chat") {
    targetId = "chatScreen";
  }

  const target = $(targetId);

  if (target) {
    target.classList.remove("hidden");
  }

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");

    const nav = item.dataset.nav;

    if (
      nav === route ||
      (route === "my-listings" && nav === "account") ||
      (route === "chat" && nav === "messages")
    ) {
      item.classList.add("active");
    }
  });

  if (route === "home") {
    loadProducts();
  }

  if (route === "saved") {
    renderSavedProducts();
  }

  if (route === "messages") {
    loadConversations();
  }

  if (route === "account") {
    updateAccountScreen();
  }

  if (route === "my-listings") {
    loadMyListings();
  }
}

window.addEventListener("popstate", () => {
  const route = location.hash.replace("#", "") || "home";

  showScreen(route);
});

window.addEventListener("hashchange", () => {
  const route = location.hash.replace("#", "") || "home";

  if (route !== currentScreen) {
    currentScreen = route;
    showScreen(route);
  }
});


/* =========================================================
   PRODUCTS
   ========================================================= */

async function loadProducts() {
  const grid = $("productGrid");

  if (!grid) return;

  grid.innerHTML = `
    <div class="loading-card">
      <div class="spinner"></div>
      <p>Loading products...</p>
    </div>
  `;

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error("Products error:", error);

    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h2>Could not load products</h2>
        <p>${escapeHTML(error.message)}</p>
        <button class="primary-button" onclick="loadProducts()">
          Try again
        </button>
      </div>
    `;

    return;
  }

  allProducts = data || [];

  renderProductGrid(
    allProducts,
    grid
  );
}

function renderProductGrid(products, container) {
  if (!container) return;

  if (!products.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <h2>No products found</h2>
        <p>There are no listings matching your search yet.</p>
        <button class="primary-button" data-route="sell">
          Sell an item
        </button>
      </div>
    `;

    return;
  }

  container.innerHTML = products
    .map(productCard)
    .join("");
}

function productCard(product) {
  const id = product.id;

  const images = getImageUrls(product);

  const imageHTML = images.length
    ? `
      <img
        src="${escapeHTML(images[0])}"
        alt="${escapeHTML(getProductName(product))}"
        loading="lazy"
      >
    `
    : `
      <div class="product-image-placeholder">
        🛍️
      </div>
    `;

  const saved = savedProducts.includes(String(id));

  return `
    <article class="product-card">

      <div
        class="product-image"
        onclick="openProduct(${Number(id)})"
      >
        ${imageHTML}

        <button
          class="save-product ${saved ? "saved" : ""}"
          onclick="event.stopPropagation(); toggleSaved('${String(id)}')"
          aria-label="Save product"
        >
          ${saved ? "♥" : "♡"}
        </button>
      </div>

      <button
        class="product-card-button"
        onclick="openProduct(${Number(id)})"
      >
        <div class="product-info">

          <div class="product-name">
            ${escapeHTML(getProductName(product))}
          </div>

          <div class="product-price">
            ${formatPrice(product.price)}
          </div>

          <div class="product-meta">
            ${escapeHTML(getProductCategory(product))}
          </div>

          <div class="product-campus">
            📍 ${escapeHTML(getProductCampus(product))}
          </div>

        </div>
      </button>

    </article>
  `;
}


/* =========================================================
   SEARCH
   ========================================================= */

function searchProducts() {
  const input = $("searchInput");

  if (!input) return;

  const query = input.value.trim().toLowerCase();

  const clearButton = $("clearSearch");

  if (clearButton) {
    clearButton.classList.toggle(
      "hidden",
      !query
    );
  }

  if (!query) {
    $("productSectionTitle").textContent =
      "Latest listings";

    renderProductGrid(
      allProducts,
      $("productGrid")
    );

    return;
  }

  const results = allProducts.filter((product) => {

    const text = [
      getProductName(product),
      getProductDescription(product),
      getProductCategory(product),
      getProductCampus(product)
    ]
      .join(" ")
      .toLowerCase();

    return text.includes(query);
  });

  $("productSectionTitle").textContent =
    `Results for "${input.value.trim()}"`;

  renderProductGrid(
    results,
    $("productGrid")
  );
}


/* =========================================================
   CATEGORY FILTER
   ========================================================= */

function filterCategory(category) {
  const results = allProducts.filter(
    (product) =>
      getProductCategory(product).toLowerCase() ===
      category.toLowerCase()
  );

  $("productSectionTitle").textContent =
    category;

  renderProductGrid(
    results,
    $("productGrid")
  );

  navigate("home");
}


/* =========================================================
   SAVED PRODUCTS
   ========================================================= */

function saveProducts() {
  localStorage.setItem(
    "cheal_saved_products",
    JSON.stringify(savedProducts)
  );
}

function toggleSaved(id) {
  const stringId = String(id);

  if (savedProducts.includes(stringId)) {
    savedProducts = savedProducts.filter(
      (item) => item !== stringId
    );
  } else {
    savedProducts.push(stringId);
  }

  saveProducts();

  renderProductGrid(
    allProducts,
    $("productGrid")
  );

  if (currentScreen === "saved") {
    renderSavedProducts();
  }
}

function renderSavedProducts() {
  const grid = $("savedGrid");

  if (!grid) return;

  const saved = allProducts.filter((product) =>
    savedProducts.includes(String(product.id))
  );

  renderProductGrid(saved, grid);
}


/* =========================================================
   PRODUCT DETAILS
   ========================================================= */

function openProduct(id) {
  const product = allProducts.find(
    (item) => Number(item.id) === Number(id)
  );

  if (!product) return;

  renderProductDetails(product);

  currentScreen = "product";

  document.querySelectorAll(".screen").forEach(
    (screen) => screen.classList.add("hidden")
  );

  $("productScreen").classList.remove("hidden");

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });
}

function renderProductDetails(product) {
  const container = $("productDetails");

  if (!container) return;

  const images = getImageUrls(product);

  const imageHTML = images.length
    ? `
      <img
        src="${escapeHTML(images[0])}"
        alt="${escapeHTML(getProductName(product))}"
      >
    `
    : `
      <div class="product-image-placeholder">
        🛍️
      </div>
    `;

  const sellerName =
    product.seller_name ||
    product.seller ||
    "Cheal Market seller";

  const saved = savedProducts.includes(
    String(product.id)
  );

  container.innerHTML = `
    <div class="product-details">

      <div class="product-detail-image">
        ${imageHTML}
      </div>

      <div class="product-detail-content">

        <p class="section-label">
          ${escapeHTML(getProductCategory(product))}
        </p>

        <h1>
          ${escapeHTML(getProductName(product))}
        </h1>

        <div class="detail-price">
          ${formatPrice(product.price)}
        </div>

        <div class="detail-meta">
          <span class="detail-pill">
            📍 ${escapeHTML(getProductCampus(product))}
          </span>

          <span class="detail-pill">
            ${formatDate(product.created_at)}
          </span>

          ${
            images.length
              ? `<span class="detail-pill">${images.length} photo${images.length === 1 ? "" : "s"}</span>`
              : ""
          }
        </div>

        <div class="detail-description">
          ${
            escapeHTML(
              getProductDescription(product)
            ) ||
            "No description provided."
          }
        </div>

        <div class="seller-card">

          <div class="seller-avatar">
            ${escapeHTML(
              sellerName.charAt(0).toUpperCase()
            )}
          </div>

          <div class="seller-info">
            <strong>${escapeHTML(sellerName)}</strong>
            <small>Seller on Cheal Market</small>
          </div>

        </div>

        <div class="detail-actions">

          <button
            class="secondary-button"
            onclick="toggleSaved('${String(product.id)}'); renderProductDetails(allProducts.find(p => Number(p.id) === Number('${Number(product.id)}')))"
          >
            ${saved ? "♥ Saved" : "♡ Save"}
          </button>

          <button
            class="primary-button"
            onclick="startConversation(${Number(product.id)})"
          >
            💬 Chat with seller
          </button>

        </div>

      </div>

    </div>
  `;
}


/* =========================================================
   IMAGE SELECTION
   ========================================================= */

function setupImagePicker() {
  const input = $("productImages");

  if (!input) return;

  input.addEventListener("change", () => {

    const files = Array.from(input.files || []);

    if (files.length > 5) {
      showSellMessage(
        "You can upload a maximum of 5 photos.",
        true
      );

      input.value = "";

      return;
    }

    selectedImages = files;

    renderImagePreviews();
  });
}

function renderImagePreviews() {
  const preview = $("imagePreview");

  if (!preview) return;

  preview.innerHTML = "";

  selectedImages.forEach((file, index) => {

    const url = URL.createObjectURL(file);

    const item = document.createElement("div");

    item.className = "image-preview";

    item.innerHTML = `
      <img
        src="${url}"
        alt="Product photo ${index + 1}"
      >

      <button
        type="button"
        class="remove-image"
        onclick="removeSelectedImage(${index})"
      >
        ×
      </button>
    `;

    preview.appendChild(item);
  });
}

function removeSelectedImage(index) {
  selectedImages.splice(index, 1);

  const input = $("productImages");

  if (input) {
    input.value = "";
  }

  renderImagePreviews();
}


/* =========================================================
   IMAGE UPLOAD
   ========================================================= */

async function uploadProductImages(files, userId) {

  const urls = [];

  for (let i = 0; i < files.length; i++) {

    const file = files[i];

    const extension =
      file.name.split(".").pop().toLowerCase();

    const safeExtension =
      extension || "jpg";

    const fileName =
      `${crypto.randomUUID()}.${safeExtension}`;

    const path =
      `${userId}/${fileName}`;

    const { error } =
      await supabaseClient.storage
        .from(BUCKET_NAME)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type
        });

    if (error) {
      console.error("Image upload error:", error);

      throw new Error(
        `Image upload failed: ${error.message}`
      );
    }

    const {
      data: publicData
    } =
      supabaseClient.storage
        .from(BUCKET_NAME)
        .getPublicUrl(path);

    if (publicData?.publicUrl) {
      urls.push(publicData.publicUrl);
    }
  }

  return urls;
}


/* =========================================================
   SELL PRODUCT
   ========================================================= */

async function publishProduct(event) {

  event.preventDefault();

  const message = $("sellMessage");

  if (!currentUser) {
    openAuth("login");

    return;
  }

  const name =
    $("productName").value.trim();

  const price =
    Number($("productPrice").value);

  const category =
    $("productCategory").value;

  const campus =
    $("productCampus").value.trim();

  const description =
    $("productDescription").value.trim();

  if (!name || !price || !category || !campus) {

    showSellMessage(
      "Please complete all required fields.",
      true
    );

    return;
  }

  if (selectedImages.length > 5) {

    showSellMessage(
      "You can upload a maximum of 5 photos.",
      true
    );

    return;
  }

  showSellMessage(
    "Publishing your listing..."
  );

  try {

    let imageUrls = [];

    if (selectedImages.length) {

      imageUrls =
        await uploadProductImages(
          selectedImages,
          currentUser.id
        );
    }

    const { error } =
      await supabaseClient
        .from("products")
        .insert({
          name,
          price,
          category,
          campus,
          description,
          seller_id: currentUser.id,
          image_urls: imageUrls
        });

    if (error) {
      throw error;
    }

    showSellMessage(
      "Your product has been listed successfully!"
    );

    $("sellForm").reset();

    selectedImages = [];

    renderImagePreviews();

    await loadProducts();

    setTimeout(() => {
      navigate("home");
    }, 800);

  } catch (error) {

    console.error("Publish error:", error);

    showSellMessage(
      error.message ||
      "Could not publish your listing.",
      true
    );
  }
}

function showSellMessage(text, error = false) {

  const element = $("sellMessage");

  if (!element) return;

  element.textContent = text;

  element.classList.toggle(
    "error",
    error
  );
}


/* =========================================================
   MY LISTINGS
   ========================================================= */

async function loadMyListings() {

  const grid = $("myListingsGrid");

  if (!grid) return;

  if (!currentUser) {

    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔐</div>
        <h2>Sign in required</h2>
        <p>Sign in to see your listings.</p>
        <button class="primary-button" onclick="openAuth('login')">
          Sign in
        </button>
      </div>
    `;

    return;
  }

  grid.innerHTML = `
    <div class="loading-card">
      <div class="spinner"></div>
      <p>Loading your listings...</p>
    </div>
  `;

  const { data, error } =
    await supabaseClient
      .from("products")
      .select("*")
      .eq("seller_id", currentUser.id)
      .order("created_at", {
        ascending: false
      });

  if (error) {

    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h2>Could not load listings</h2>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;

    return;
  }

  renderProductGrid(
    data || [],
    grid
  );
}


/* =========================================================
   AUTH
   ========================================================= */

let authMode = "login";

function openAuth(mode = "login") {

  authMode = mode;

  const overlay = $("authOverlay");

  if (!overlay) return;

  overlay.classList.remove("hidden");

  updateAuthModal();
}

function closeAuth() {

  const overlay = $("authOverlay");

  if (overlay) {
    overlay.classList.add("hidden");
  }
}

function updateAuthModal() {

  const title = $("authTitle");
  const subtitle = $("authSubtitle");
  const signupFields = $("signupFields");
  const submitText = $("authSubmitText");
  const switchButton = $("authSwitch");

  if (authMode === "signup") {

    title.textContent =
      "Create your account";

    subtitle.textContent =
      "Join students buying and selling on campus.";

    signupFields.classList.remove("hidden");

    submitText.textContent =
      "Create account";

    switchButton.innerHTML =
      "Already have an account? <strong>Sign in</strong>";

  } else {

    title.textContent =
      "Welcome back";

    subtitle.textContent =
      "Sign in to buy, sell and chat.";

    signupFields.classList.add("hidden");

    submitText.textContent =
      "Sign in";

    switchButton.innerHTML =
      "Don't have an account? <strong>Sign up</strong>";
  }

  $("authMessage").textContent = "";
}

async function handleAuth(event) {

  event.preventDefault();

  const message = $("authMessage");

  message.classList.remove("error");

  message.textContent =
    authMode === "signup"
      ? "Creating your account..."
      : "Signing you in...";

  try {

    const email =
      $("authEmail").value.trim();

    const password =
      $("authPassword").value;

    if (authMode === "signup") {

      const fullName =
        $("authName").value.trim();

      const campus =
        $("authCampus").value.trim();

      const { error } =
        await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              campus
            }
          }
        });

      if (error) throw error;

      message.textContent =
        "Account created. Check your email if confirmation is required.";

      setTimeout(closeAuth, 1500);

    } else {

      const { error } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

      if (error) throw error;

      closeAuth();

      await loadCurrentUser();
    }

  } catch (error) {

    console.error("Auth error:", error);

    message.classList.add("error");

    message.textContent =
      error.message ||
      "Authentication failed.";
  }
}


/* =========================================================
   CURRENT USER
   ========================================================= */

async function loadCurrentUser() {

  const {
    data: {
      user
    }
  } =
    await supabaseClient.auth.getUser();

  currentUser = user || null;

  currentProfile = null;

  if (currentUser) {

    const {
      data: profile
    } =
      await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

    currentProfile = profile || null;
  }

  updateAccountScreen();
}


/* =========================================================
   ACCOUNT
   ========================================================= */

function updateAccountScreen() {

  const loggedOut =
    $("accountLoggedOut");

  const loggedIn =
    $("accountLoggedIn");

  const name =
    $("profileName");

  const email =
    $("profileEmail");

  const avatar =
    $("profileAvatar");

  if (!currentUser) {

    loggedOut?.classList.remove("hidden");
    loggedIn?.classList.add("hidden");

    if (name) {
      name.textContent = "Welcome";
    }

    if (email) {
      email.textContent =
        "Sign in to manage your account.";
    }

    if (avatar) {
      avatar.textContent = "M";
    }

    return;
  }

  loggedOut?.classList.add("hidden");
  loggedIn?.classList.remove("hidden");

  const profileName =
    currentProfile?.full_name ||
    currentUser.user_metadata?.full_name ||
    currentUser.email?.split("@")[0] ||
    "User";

  if (name) {
    name.textContent = profileName;
  }

  if (email) {
    email.textContent =
      currentUser.email || "";
  }

  if (avatar) {
    avatar.textContent =
      profileName.charAt(0).toUpperCase();
  }
}

async function logout() {

  await supabaseClient.auth.signOut();

  currentUser = null;
  currentProfile = null;

  closeAuth();

  updateAccountScreen();

  navigate("home");
}


/* =========================================================
   CONVERSATIONS
   ========================================================= */

async function loadConversations() {

  const list = $("conversationList");

  if (!list) return;

  if (!currentUser) {

    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔐</div>
        <h2>Sign in to view messages</h2>
        <p>Your private conversations will appear here.</p>
        <button class="primary-button" onclick="openAuth('login')">
          Sign in
        </button>
      </div>
    `;

    return;
  }

  list.innerHTML = `
    <div class="loading-card">
      <div class="spinner"></div>
      <p>Loading conversations...</p>
    </div>
  `;

  const { data, error } =
    await supabaseClient
      .from("conversations")
      .select(`
        id,
        buyer_id,
        seller_id,
        product_id,
        created_at
      `)
      .or(
        `buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`
      )
      .order("created_at", {
        ascending: false
      });

  if (error) {

    console.error(
      "Conversation error:",
      error
    );

    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h2>Could not load messages</h2>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;

    return;
  }

  if (!data?.length) {

    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💬</div>
        <h2>No conversations yet</h2>
        <p>When you message a seller, your conversation will appear here.</p>
        <button class="primary-button" data-route="home">
          Find products
        </button>
      </div>
    `;

    return;
  }

  const html = [];

  for (const conversation of data) {

    const otherUserId =
      conversation.buyer_id === currentUser.id
        ? conversation.seller_id
        : conversation.buyer_id;

    const {
      data: profile
    } =
      await supabaseClient
        .from("profiles")
        .select("full_name,campus")
        .eq("id", otherUserId)
        .maybeSingle();

    const {
      data: product
    } =
      conversation.product_id
        ? await supabaseClient
            .from("products")
            .select("name,title")
            .eq("id", conversation.product_id)
            .maybeSingle()
        : { data: null };

    const {
      data: latestMessage
    } =
      await supabaseClient
        .from("messages")
        .select("message,created_at")
        .eq(
          "conversation_id",
          conversation.id
        )
        .order("created_at", {
          ascending: false
        })
        .limit(1)
        .maybeSingle();

    const otherName =
      profile?.full_name ||
      "Cheal Market user";

    const productName =
      product
        ? getProductName(product)
        : "Marketplace chat";

    html.push(`
      <button
        class="conversation-item"
        onclick="openConversation(${Number(conversation.id)})"
      >

        <div class="conversation-avatar">
          ${escapeHTML(
            otherName.charAt(0).toUpperCase()
          )}
        </div>

        <div class="conversation-content">

          <div class="conversation-top">
            <span class="conversation-name">
              ${escapeHTML(otherName)}
            </span>

            <span class="conversation-time">
              ${
                latestMessage
                  ? formatDate(latestMessage.created_at)
                  : formatDate(conversation.created_at)
              }
            </span>
          </div>

          <div class="conversation-preview">
            ${
              latestMessage
                ? escapeHTML(latestMessage.message)
                : escapeHTML(productName)
            }
          </div>

        </div>

      </button>
    `);
  }

  list.innerHTML = html.join("");
}


/* =========================================================
   START CONVERSATION
   ========================================================= */

async function startConversation(productId) {

  if (!currentUser) {
    openAuth("login");
    return;
  }

  const product =
    allProducts.find(
      (item) =>
        Number(item.id) === Number(productId)
    );

  if (!product) return;

  const sellerId =
    product.seller_id;

  if (!sellerId) {
    alert("This product does not have a seller assigned.");
    return;
  }

  if (sellerId === currentUser.id) {
    alert("You cannot start a chat with yourself.");
    return;
  }

  let conversation;

  const {
    data: existing,
    error: findError
  } =
    await supabaseClient
      .from("conversations")
      .select("*")
      .eq("buyer_id", currentUser.id)
      .eq("seller_id", sellerId)
      .eq("product_id", product.id)
      .maybeSingle();

  if (findError) {
    console.error(findError);
  }

  if (existing) {

    conversation = existing;

  } else {

    const {
      data: created,
      error
    } =
      await supabaseClient
        .from("conversations")
        .insert({
          buyer_id: currentUser.id,
          seller_id: sellerId,
          product_id: product.id
        })
        .select()
        .single();

    if (error) {

      console.error(
        "Conversation creation error:",
        error
      );

      alert(error.message);

      return;
    }

    conversation = created;
  }

  await openConversation(
    conversation.id
  );
}


/* =========================================================
   OPEN CONVERSATION
   ========================================================= */

async function openConversation(conversationId) {

  if (!currentUser) {
    openAuth("login");
    return;
  }

  const {
    data: conversation,
    error
  } =
    await supabaseClient
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

  if (error) {

    console.error(error);

    return;
  }

  currentConversation =
    conversation;

  let otherUserId =
    conversation.buyer_id === currentUser.id
      ? conversation.seller_id
      : conversation.buyer_id;

  const {
    data: profile
  } =
    await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("id", otherUserId)
      .maybeSingle();

  const {
    data: product
  } =
    conversation.product_id
      ? await supabaseClient
          .from("products")
          .select("*")
          .eq("id", conversation.product_id)
          .maybeSingle()
      : { data: null };

  $("chatName").textContent =
    profile?.full_name ||
    "Cheal Market user";

  $("chatProduct").textContent =
    product
      ? getProductName(product)
      : "";

  currentScreen = "chat";

  document.querySelectorAll(".screen").forEach(
    (screen) =>
      screen.classList.add("hidden")
  );

  $("chatScreen").classList.remove("hidden");

  await loadMessages(
    conversationId
  );

  subscribeToMessages(
    conversationId
  );

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });
}


/* =========================================================
   MESSAGES
   ========================================================= */

async function loadMessages(conversationId) {

  const container =
    $("chatMessages");

  if (!container) return;

  container.innerHTML = `
    <div class="loading-card">
      <div class="spinner"></div>
      <p>Loading messages...</p>
    </div>
  `;

  const {
    data,
    error
  } =
    await supabaseClient
      .from("messages")
      .select("*")
      .eq(
        "conversation_id",
        conversationId
      )
      .order("created_at", {
        ascending: true
      });

  if (error) {

    console.error(
      "Messages error:",
      error
    );

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h2>Could not load messages</h2>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;

    return;
  }

  renderMessages(data || []);

  scrollChatToBottom();
}

function renderMessages(messages) {

  const container =
    $("chatMessages");

  if (!container) return;

  if (!messages.length) {

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">👋</div>
        <h2>Start the conversation</h2>
        <p>Send a message to the seller.</p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    messages
      .map((message) => {

        const mine =
          message.sender_id ===
          currentUser?.id;

        return `
          <div class="message ${mine ? "mine" : "theirs"}">

            ${escapeHTML(message.message)}

            <span class="message-time">
              ${formatTime(message.created_at)}
            </span>

          </div>
        `;
      })
      .join("");
}

async function sendMessage(event) {

  event.preventDefault();

  if (!currentUser ||
      !currentConversation) {
    return;
  }

  const input =
    $("chatInput");

  const text =
    input.value.trim();

  if (!text) return;

  input.disabled = true;

  const {
    error
  } =
    await supabaseClient
      .from("messages")
      .insert({
        conversation_id:
          currentConversation.id,
        sender_id:
          currentUser.id,
        message: text
      });

  input.disabled = false;

  if (error) {

    console.error(
      "Send message error:",
      error
    );

    alert(error.message);

    return;
  }

  input.value = "";

  await loadMessages(
    currentConversation.id
  );

  scrollChatToBottom();
}

function scrollChatToBottom() {

  const container =
    $("chatMessages");

  if (!container) return;

  setTimeout(() => {

    container.scrollTop =
      container.scrollHeight;

  }, 50);
}


/* =========================================================
   REALTIME CHAT
   ========================================================= */

function subscribeToMessages(
  conversationId
) {

  if (realtimeChannel) {

    supabaseClient.removeChannel(
      realtimeChannel
    );

    realtimeChannel = null;
  }

  realtimeChannel =
    supabaseClient
      .channel(
        `conversation-${conversationId}`
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter:
            `conversation_id=eq.${conversationId}`
        },
        async () => {

          await loadMessages(
            conversationId
          );

          scrollChatToBottom();
        }
      )
      .subscribe();
}


/* =========================================================
   MENU
   ========================================================= */

function openMenu() {
  $("menuOverlay")?.classList.remove(
    "hidden"
  );
}

function closeMenu() {
  $("menuOverlay")?.classList.add(
    "hidden"
  );
}


/* =========================================================
   SORT
   ========================================================= */

function sortProducts() {

  if (!allProducts.length) return;

  const sorted =
    [...allProducts].sort(
      (a, b) =>
        Number(b.price || 0) -
        Number(a.price || 0)
    );

  $("productSectionTitle").textContent =
    "Highest priced";

  renderProductGrid(
    sorted,
    $("productGrid")
  );
}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function setupEvents() {

  document.addEventListener(
    "click",
    (event) => {

      const routeButton =
        event.target.closest(
          "[data-route]"
        );

      if (routeButton) {

        const route =
          routeButton.dataset.route;

        if (route) {
          navigate(route);
        }

        closeMenu();
      }

      const category =
        event.target.closest(
          "[data-category]"
        );

      if (category) {

        filterCategory(
          category.dataset.category
        );
      }
    }
  );


  $("searchInput")?.addEventListener(
    "input",
    searchProducts
  );


  $("clearSearch")?.addEventListener(
    "click",
    () => {

      $("searchInput").value = "";

      searchProducts();

      $("searchInput").focus();
    }
  );


  $("sortButton")?.addEventListener(
    "click",
    sortProducts
  );


  $("sellForm")?.addEventListener(
    "submit",
    publishProduct
  );


  $("authForm")?.addEventListener(
    "submit",
    handleAuth
  );


  $("authSwitch")?.addEventListener(
    "click",
    () => {

      authMode =
        authMode === "login"
          ? "signup"
          : "login";

      updateAuthModal();
    }
  );


  $("closeAuth")?.addEventListener(
    "click",
    closeAuth
  );


  $("authOverlay")?.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        $("authOverlay")
      ) {
        closeAuth();
      }
    }
  );


  $("menuButton")?.addEventListener(
    "click",
    openMenu
  );


  $("closeMenu")?.addEventListener(
    "click",
    closeMenu
  );


  $("menuOverlay")?.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        $("menuOverlay")
      ) {
        closeMenu();
      }
    }
  );


  $("topAccountButton")?.addEventListener(
    "click",
    () => navigate("account")
  );


  $("accountLoginButton")?.addEventListener(
    "click",
    () => openAuth("login")
  );


  $("logoutButton")?.addEventListener(
    "click",
    logout
  );


  $("chatForm")?.addEventListener(
    "submit",
    sendMessage
  );


  $("locationButton")?.addEventListener(
    "click",
    () => {
      alert(
        "Location filtering will be added to the marketplace."
      );
    }
  );
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

async function initializeApp() {

  setupEvents();

  setupImagePicker();

  await loadCurrentUser();

  const route =
    location.hash.replace("#", "") ||
    "home";

  currentScreen = route;

  showScreen(route);

  supabaseClient.auth.onAuthStateChange(
    async (event, session) => {

      currentUser =
        session?.user || null;

      if (currentUser) {

        const {
          data: profile
        } =
          await supabaseClient
            .from("profiles")
            .select("*")
            .eq(
              "id",
              currentUser.id
            )
            .maybeSingle();

        currentProfile =
          profile || null;

      } else {

        currentProfile = null;
      }

      updateAccountScreen();

      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT"
      ) {
        if (currentScreen === "messages") {
          loadConversations();
        }
      }
    }
  );
}


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  initializeApp
);


/* =========================================================
   EXPOSE FUNCTIONS USED BY HTML
   ========================================================= */

window.navigate = navigate;
window.loadProducts = loadProducts;
window.toggleSaved = toggleSaved;
window.openProduct = openProduct;
window.openAuth = openAuth;
window.closeAuth = closeAuth;
window.removeSelectedImage =
  removeSelectedImage;
window.startConversation =
  startConversation;
window.openConversation =
  openConversation;
window.renderProductDetails =
  renderProductDetails;
