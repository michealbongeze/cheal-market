/* =========================================================
   CHEAL MARKET
   Main Application JavaScript
   ========================================================= */

/* =========================
   SUPABASE CONFIGURATION
   ========================= */

const SUPABASE_URL =
  "https://qwlklqjfbrhythpynghr.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_HVAjJNZAQIiyf1aFosvH0A_fnYoFpHx";

const BUCKET_NAME = "product-images";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


/* =========================
   APP STATE
   ========================= */

let currentUser = null;
let currentProfile = null;
let currentProduct = null;
let currentConversation = null;
let realtimeChannel = null;

let products = [];
let savedProducts = JSON.parse(
  localStorage.getItem("cheal_saved_products") || "[]"
);

let selectedImages = [];

let searchTerm = "";
let activeCategory = "all";

let sortMode = "latest";


/* =========================
   ROUTES
   ========================= */

const ROUTES = {
  home: "homeScreen",
  saved: "savedScreen",
  sell: "sellScreen",
  messages: "messagesScreen",
  chat: "chatScreen",
  account: "accountScreen",
  "my-listings": "myListingsScreen",
  product: "productScreen"
};


/* =========================
   HELPERS
   ========================= */

function $(id) {
  return document.getElementById(id);
}


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

  return "UGX " + number.toLocaleString("en-UG");
}


function makeId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2)
  );
}


function getProductImage(product) {
  if (!product) return "";

  if (Array.isArray(product.image_urls) && product.image_urls.length) {
    return product.image_urls[0];
  }

  if (product.image_url) {
    return product.image_url;
  }

  return "";
}


function showNotice(message) {
  alert(message);
}


/* =========================
   NAVIGATION
   ========================= */

function navigate(route) {
  if (!ROUTES[route]) {
    route = "home";
  }

  if (window.location.hash !== "#" + route) {
    window.location.hash = route;
  } else {
    showScreen(route);
  }
}


function showScreen(route) {
  if (!ROUTES[route]) {
    route = "home";
  }

  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.add("hidden");
  });

  const target = $(ROUTES[route]);

  if (target) {
    target.classList.remove("hidden");
  }

  document
    .querySelectorAll(".bottom-nav [data-nav]")
    .forEach((item) => {
      item.classList.remove("active");

      if (item.dataset.nav === route) {
        item.classList.add("active");
      }
    });

  const sellButton = document.querySelector(".sell-nav");

  if (sellButton) {
    sellButton.classList.toggle("active", route === "sell");
  }

  closeMenu();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  if (route === "saved") {
    renderSavedProducts();
  }

  if (route === "messages") {
    loadConversations();
  }

  if (route === "account") {
    updateAccountUI();
  }

  if (route === "my-listings") {
    loadMyListings();
  }
}


function handleHashChange() {
  let route = window.location.hash.replace("#", "");

  if (!route) {
    route = "home";
  }

  if (!ROUTES[route]) {
    route = "home";
  }

  showScreen(route);
}


/* =========================
   MENU
   ========================= */

function openMenu() {
  const menu = $("menuOverlay");

  if (!menu) return;

  menu.classList.remove("hidden");
  menu.classList.add("active");
}


function closeMenu() {
  const menu = $("menuOverlay");

  if (!menu) return;

  menu.classList.remove("active");
  menu.classList.add("hidden");
}


/* =========================
   AUTH MODAL
   ========================= */

let authMode = "login";


function openAuth(mode = "login") {
  authMode = mode;

  const overlay = $("authOverlay");

  if (!overlay) return;

  const signupFields = $("signupFields");
  const title = $("authTitle");
  const subtitle = $("authSubtitle");
  const submitText = $("authSubmitText");
  const switchButton = $("authSwitch");
  const message = $("authMessage");

  if (message) {
    message.textContent = "";
  }

  if (mode === "signup") {
    if (signupFields) {
      signupFields.classList.remove("hidden");
    }

    if (title) {
      title.textContent = "Create your account";
    }

    if (subtitle) {
      subtitle.textContent =
        "Join Cheal Market and start buying or selling.";
    }

    if (submitText) {
      submitText.textContent = "Create Account";
    }

    if (switchButton) {
      switchButton.textContent =
        "Already have an account? Login";
    }
  } else {
    if (signupFields) {
      signupFields.classList.add("hidden");
    }

    if (title) {
      title.textContent = "Welcome back";
    }

    if (subtitle) {
      subtitle.textContent =
        "Login to continue to Cheal Market.";
    }

    if (submitText) {
      submitText.textContent = "Login";
    }

    if (switchButton) {
      switchButton.textContent =
        "Don't have an account? Sign up";
    }
  }

  overlay.classList.remove("hidden");
  overlay.classList.add("active");

  const email = $("authEmail");

  if (email) {
    setTimeout(() => email.focus(), 100);
  }
}


function closeAuth() {
  const overlay = $("authOverlay");

  if (!overlay) return;

  overlay.classList.remove("active");
  overlay.classList.add("hidden");
}


function setAuthMessage(message, isError = true) {
  const element = $("authMessage");

  if (!element) return;

  element.textContent = message;

  element.style.color = isError
    ? "#d93025"
    : "#16803c";
}


/* =========================
   LOGIN / SIGNUP
   ========================= */

async function handleAuthSubmit(event) {
  event.preventDefault();

  const email = $("authEmail")?.value.trim();
  const password = $("authPassword")?.value;
  const name = $("authName")?.value.trim();
  const campus = $("authCampus")?.value.trim();

  if (!email || !password) {
    setAuthMessage("Please enter your email and password.");
    return;
  }

  const submitButton = $("authForm")?.querySelector(
    'button[type="submit"]'
  );

  if (submitButton) {
    submitButton.disabled = true;
  }

  setAuthMessage("Please wait...", false);

  try {
    if (authMode === "login") {
      const { data, error } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

      if (error) {
        throw error;
      }

      currentUser = data.user;

      await loadCurrentProfile();

      setAuthMessage("Login successful.", false);

      setTimeout(() => {
        closeAuth();
        updateAccountUI();
        navigate("home");
      }, 500);

    } else {
      if (!name) {
        setAuthMessage("Please enter your name.");
        return;
      }

      const { data, error } =
        await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              campus: campus
            }
          }
        });

      if (error) {
        throw error;
      }

      currentUser = data.user;

      if (data.session) {
        await loadCurrentProfile();

        setAuthMessage(
          "Account created successfully.",
          false
        );

        setTimeout(() => {
          closeAuth();
          updateAccountUI();
          navigate("home");
        }, 700);
      } else {
        setAuthMessage(
          "Account created. Check your email to confirm your account.",
          false
        );
      }
    }

  } catch (error) {
    console.error("Authentication error:", error);

    setAuthMessage(
      error?.message || "Authentication failed."
    );

  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}


/* =========================
   CURRENT USER
   ========================= */

async function loadCurrentUser() {
  try {
    const { data, error } =
      await supabaseClient.auth.getSession();

    if (error) {
      console.error(error);
      return;
    }

    currentUser = data?.session?.user || null;

    if (currentUser) {
      await loadCurrentProfile();
    }

    updateAccountUI();

  } catch (error) {
    console.error(
      "Could not load current user:",
      error
    );
  }
}


/* =========================
   PROFILE
   ========================= */

async function loadCurrentProfile() {
  if (!currentUser) {
    currentProfile = null;
    return;
  }

  try {
    const { data, error } =
      await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

    if (error) {
      console.warn(
        "Profile loading error:",
        error.message
      );

      currentProfile = null;
      return;
    }

    currentProfile = data;

  } catch (error) {
    console.warn(error);
    currentProfile = null;
  }
}


function getUserName() {
  return (
    currentProfile?.full_name ||
    currentProfile?.name ||
    currentUser?.user_metadata?.full_name ||
    currentUser?.user_metadata?.name ||
    currentUser?.email?.split("@")[0] ||
    "Cheal Market User"
  );
}


function getUserCampus() {
  return (
    currentProfile?.campus ||
    currentUser?.user_metadata?.campus ||
    ""
  );
}


function updateAccountUI() {
  const loggedOut = $("accountLoggedOut");
  const loggedIn = $("accountLoggedIn");

  const nameElement = $("profileName");
  const emailElement = $("profileEmail");
  const avatar = $("profileAvatar");

  if (!currentUser) {
    if (loggedOut) {
      loggedOut.classList.remove("hidden");
    }

    if (loggedIn) {
      loggedIn.classList.add("hidden");
    }

    return;
  }

  if (loggedOut) {
    loggedOut.classList.add("hidden");
  }

  if (loggedIn) {
    loggedIn.classList.remove("hidden");
  }

  const name = getUserName();

  if (nameElement) {
    nameElement.textContent = name;
  }

  if (emailElement) {
    emailElement.textContent =
      currentUser.email || "";
  }

  if (avatar) {
    avatar.textContent =
      name.charAt(0).toUpperCase();
  }
}


/* =========================
   LOGOUT
   ========================= */

async function logout() {
  try {
    await supabaseClient.auth.signOut();

    currentUser = null;
    currentProfile = null;
    currentConversation = null;

    if (realtimeChannel) {
      await supabaseClient.removeChannel(
        realtimeChannel
      );

      realtimeChannel = null;
    }

    updateAccountUI();
    navigate("home");

  } catch (error) {
    console.error(error);

    showNotice(
      error?.message || "Could not logout."
    );
  }
}


/* =========================
   PRODUCTS
   ========================= */

async function loadProducts() {
  try {
    const { data, error } =
      await supabaseClient
        .from("products")
        .select("*")
        .order("created_at", {
          ascending: false
        });

    if (error) {
      throw error;
    }

    products = data || [];

    renderProducts();

  } catch (error) {
    console.error(
      "Could not load products:",
      error
    );

    products = [];

    renderProducts();

    const grid = $("productGrid");

    if (grid) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>Unable to load products</h3>
          <p>${escapeHTML(
            error?.message ||
            "Please try again later."
          )}</p>
        </div>
      `;
    }
  }
}


function getFilteredProducts() {
  let result = [...products];

  if (activeCategory !== "all") {
    result = result.filter((product) => {
      return (
        String(product.category || "")
          .toLowerCase() ===
        activeCategory.toLowerCase()
      );
    });
  }

  if (searchTerm) {
    const search = searchTerm.toLowerCase();

    result = result.filter((product) => {
      return [
        product.name,
        product.category,
        product.campus,
        product.description
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }

  if (sortMode === "price-low") {
    result.sort(
      (a, b) =>
        Number(a.price || 0) -
        Number(b.price || 0)
    );
  }

  if (sortMode === "price-high") {
    result.sort(
      (a, b) =>
        Number(b.price || 0) -
        Number(a.price || 0)
    );
  }

  return result;
}


function renderProducts(list = null) {
  const grid = $("productGrid");

  if (!grid) return;

  const items =
    list || getFilteredProducts();

  if (!items.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>No products found</h3>
        <p>Try another search or category.</p>
      </div>
    `;

    return;
  }

  grid.innerHTML = items
    .map(renderProductCard)
    .join("");
}


function renderProductCard(product) {
  const id = product.id;

  const image =
    getProductImage(product);

  const saved =
    savedProducts.includes(id);

  return `
    <article class="product-card">

      <div
        class="product-open"
        data-product-id="${escapeHTML(id)}"
      >
        <div class="product-image">

          ${
            image
              ? `
                <img
                  src="${escapeHTML(image)}"
                  alt="${escapeHTML(product.name)}"
                >
              `
              : `
                <div class="no-image">
                  📦
                </div>
              `
          }

        </div>

        <div class="product-info">

          <h3>
            ${escapeHTML(product.name)}
          </h3>

          <strong>
            ${formatPrice(product.price)}
          </strong>

          <p>
            ${escapeHTML(product.campus || "Campus")}
          </p>

        </div>
      </div>

      <button
        type="button"
        class="save-button"
        data-action="save"
        data-product-id="${escapeHTML(id)}"
        aria-label="Save product"
      >
        ${saved ? "♥" : "♡"}
      </button>

    </article>
  `;
}


/* =========================
   PRODUCT DETAILS
   ========================= */

function openProduct(productId) {
  const product =
    products.find(
      (item) =>
        String(item.id) === String(productId)
    );

  if (!product) {
    showNotice("Product not found.");
    return;
  }

  currentProduct = product;

  const container = $("productDetails");

  if (!container) return;

  const image =
    getProductImage(product);

  const saved =
    savedProducts.includes(product.id);

  container.innerHTML = `
    <div class="product-detail">

      <button
        type="button"
        class="back-button"
        data-route="home"
      >
        ← Back
      </button>

      <div class="product-detail-image">

        ${
          image
            ? `
              <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(product.name)}"
              >
            `
            : `
              <div class="no-image">
                📦
              </div>
            `
        }

      </div>

      <div class="product-detail-info">

        <h1>
          ${escapeHTML(product.name)}
        </h1>

        <h2>
          ${formatPrice(product.price)}
        </h2>

        <p>
          <strong>Category:</strong>
          ${escapeHTML(product.category || "Other")}
        </p>

        <p>
          <strong>Campus:</strong>
          ${escapeHTML(product.campus || "Not specified")}
        </p>

        <p>
          ${escapeHTML(
            product.description ||
            "No description provided."
          )}
        </p>

        <div class="product-actions">

          <button
            type="button"
            data-action="save"
            data-product-id="${escapeHTML(product.id)}"
          >
            ${saved ? "♥ Saved" : "♡ Save"}
          </button>

          <button
            type="button"
            data-action="chat-seller"
            data-product-id="${escapeHTML(product.id)}"
          >
            💬 Chat with seller
          </button>

        </div>

      </div>

    </div>
  `;

  navigate("product");
}


/* =========================
   SAVED PRODUCTS
   ========================= */

function saveProductsToStorage() {
  localStorage.setItem(
    "cheal_saved_products",
    JSON.stringify(savedProducts)
  );
}


function toggleSaved(productId) {
  const id = String(productId);

  const index = savedProducts.findIndex(
    (item) => String(item) === id
  );

  if (index >= 0) {
    savedProducts.splice(index, 1);
  } else {
    savedProducts.push(productId);
  }

  saveProductsToStorage();

  renderProducts();
  renderSavedProducts();

  if (
    currentProduct &&
    String(currentProduct.id) === id
  ) {
    openProduct(id);
  }
}


function renderSavedProducts() {
  const grid = $("savedGrid");

  if (!grid) return;

  const saved = products.filter((product) =>
    savedProducts.some(
      (id) =>
        String(id) === String(product.id)
    )
  );

  if (!saved.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>No saved products</h3>
        <p>Products you save will appear here.</p>
      </div>
    `;

    return;
  }

  grid.innerHTML = saved
    .map(renderProductCard)
    .join("");
}


/* =========================
   SEARCH
   ========================= */

function handleSearch(value) {
  searchTerm = value.trim();

  const clearButton = $("clearSearch");

  if (clearButton) {
    clearButton.classList.toggle(
      "hidden",
      !searchTerm
    );
  }

  renderProducts();
}


function clearSearch() {
  searchTerm = "";
  activeCategory = "all";

  const input = $("searchInput");

  if (input) {
    input.value = "";
  }

  const clearButton = $("clearSearch");

  if (clearButton) {
    clearButton.classList.add("hidden");
  }

  renderProducts();
}


/* =========================
   CATEGORY
   ========================= */

function filterCategory(category) {
  activeCategory =
    category || "all";

  navigate("home");

  renderProducts();
}


/* =========================
   SORT
   ========================= */

function changeSort() {
  if (sortMode === "latest") {
    sortMode = "price-low";
  } else if (sortMode === "price-low") {
    sortMode = "price-high";
  } else {
    sortMode = "latest";
  }

  const button = $("sortButton");

  if (button) {
    if (sortMode === "latest") {
      button.textContent = "Sort";
    }

    if (sortMode === "price-low") {
      button.textContent =
        "Price: Low → High";
    }

    if (sortMode === "price-high") {
      button.textContent =
        "Price: High → Low";
    }
  }

  renderProducts();
}


/* =========================
   IMAGE PREVIEW
   ========================= */

function handleImageSelection(event) {
  const files =
    Array.from(event.target.files || []);

  if (!files.length) return;

  const available =
    5 - selectedImages.length;

  if (available <= 0) {
    showNotice(
      "You can upload a maximum of 5 images."
    );

    return;
  }

  selectedImages.push(
    ...files.slice(0, available)
  );

  renderImagePreview();
}


function renderImagePreview() {
  const preview = $("imagePreview");

  if (!preview) return;

  if (!selectedImages.length) {
    preview.innerHTML = "";
    return;
  }

  preview.innerHTML = selectedImages
    .map((file, index) => {

      const url =
        URL.createObjectURL(file);

      return `
        <div class="preview-item">

          <img
            src="${url}"
            alt="Preview ${index + 1}"
          >

          <button
            type="button"
            data-action="remove-image"
            data-image-index="${index}"
          >
            ×
          </button>

        </div>
      `;
    })
    .join("");
}


function removeSelectedImage(index) {
  selectedImages.splice(index, 1);

  renderImagePreview();
}


/* =========================
   UPLOAD IMAGES
   ========================= */

async function uploadProductImages(productId) {
  if (!selectedImages.length) {
    return [];
  }

  const urls = [];

  for (const file of selectedImages) {
    const extension =
      file.name.split(".").pop() ||
      "jpg";

    const fileName =
      `${productId}/${makeId()}.${extension}`;

    const { error } =
      await supabaseClient.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false
        });

    if (error) {
      throw error;
    }

    const { data } =
      supabaseClient.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

    if (data?.publicUrl) {
      urls.push(data.publicUrl);
    }
  }

  return urls;
}


/* =========================
   SELL PRODUCT
   ========================= */

async function handleSellSubmit(event) {
  event.preventDefault();

  if (!currentUser) {
    openAuth("login");
    return;
  }

  const name =
    $("productName")?.value.trim();

  const price =
    Number($("productPrice")?.value);

  const category =
    $("productCategory")?.value;

  const campus =
    $("productCampus")?.value.trim();

  const description =
    $("productDescription")?.value.trim();

  const message =
    $("sellMessage");

  if (!name || !price || !category) {
    if (message) {
      message.textContent =
        "Please fill in the product name, price and category.";
    }

    return;
  }

  try {
    if (message) {
      message.textContent =
        "Publishing your product...";
    }

    const productId = makeId();

    const imageUrls =
      await uploadProductImages(productId);

    const productData = {
      id: productId,
      seller_id: currentUser.id,
      name,
      price,
      category,
      campus,
      description,
      image_urls: imageUrls,
      image_url: imageUrls[0] || null
    };

    const { error } =
      await supabaseClient
        .from("products")
        .insert(productData);

    if (error) {
      throw error;
    }

    if (message) {
      message.textContent =
        "Product published successfully!";
    }

    const form = $("sellForm");

    if (form) {
      form.reset();
    }

    selectedImages = [];

    renderImagePreview();

    await loadProducts();

    setTimeout(() => {
      navigate("home");
    }, 700);

  } catch (error) {
    console.error(
      "Publishing product failed:",
      error
    );

    if (message) {
      message.textContent =
        error?.message ||
        "Could not publish product.";
    }
  }
}


/* =========================
   MY LISTINGS
   ========================= */

async function loadMyListings() {
  const grid = $("myListingsGrid");

  if (!grid) return;

  if (!currentUser) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>Login required</h3>
        <p>Please login to view your listings.</p>

        <button
          type="button"
          data-action="login"
        >
          Login
        </button>
      </div>
    `;

    return;
  }

  grid.innerHTML = `
    <div class="empty-state">
      <p>Loading your listings...</p>
    </div>
  `;

  try {
    const { data, error } =
      await supabaseClient
        .from("products")
        .select("*")
        .eq("seller_id", currentUser.id)
        .order("created_at", {
          ascending: false
        });

    if (error) {
      throw error;
    }

    if (!data?.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>No listings yet</h3>
          <p>Products you sell will appear here.</p>
        </div>
      `;

      return;
    }

    grid.innerHTML = data
      .map(renderProductCard)
      .join("");

  } catch (error) {
    console.error(error);

    grid.innerHTML = `
      <div class="empty-state">
        <h3>Could not load listings</h3>
        <p>${escapeHTML(
          error?.message || ""
        )}</p>
      </div>
    `;
  }
}


/* =========================
   CONVERSATIONS
   ========================= */

async function loadConversations() {
  const list = $("conversationList");

  if (!list) return;

  if (!currentUser) {
    list.innerHTML = `
      <div class="empty-state">
        <h3>Login required</h3>
        <p>Login to view your messages.</p>

        <button
          type="button"
          data-action="login"
        >
          Login
        </button>
      </div>
    `;

    return;
  }

  list.innerHTML = `
    <div class="empty-state">
      <p>Loading messages...</p>
    </div>
  `;

  try {
    const { data, error } =
      await supabaseClient
        .from("conversations")
        .select("*")
        .or(
          `buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`
        )
        .order("updated_at", {
          ascending: false
        });

    if (error) {
      throw error;
    }

    if (!data?.length) {
      list.innerHTML = `
        <div class="empty-state">
          <h3>No messages yet</h3>
          <p>Your conversations will appear here.</p>
        </div>
      `;

      return;
    }

    const rows = [];

    for (const conversation of data) {
      const otherId =
        String(conversation.buyer_id) ===
        String(currentUser.id)
          ? conversation.seller_id
          : conversation.buyer_id;

      let otherName = "User";

      try {
        const { data: profile } =
          await supabaseClient
            .from("profiles")
            .select("full_name,name")
            .eq("id", otherId)
            .maybeSingle();

        otherName =
          profile?.full_name ||
          profile?.name ||
          "User";

      } catch (_) {}

      let productName = "";

      const product =
        products.find(
          (item) =>
            String(item.id) ===
            String(conversation.product_id)
        );

      if (product) {
        productName = product.name;
      }

      rows.push(`
        <button
          type="button"
          class="conversation-item"
          data-action="open-conversation"
          data-conversation-id="${escapeHTML(
            conversation.id
          )}"
        >

          <strong>
            ${escapeHTML(otherName)}
          </strong>

          ${
            productName
              ? `
                <span>
                  ${escapeHTML(productName)}
                </span>
              `
              : ""
          }

        </button>
      `);
    }

    list.innerHTML = rows.join("");

  } catch (error) {
    console.error(error);

    list.innerHTML = `
      <div class="empty-state">
        <h3>Messages unavailable</h3>
        <p>${escapeHTML(
          error?.message || ""
        )}</p>
      </div>
    `;
  }
}


/* =========================
   START CHAT
   ========================= */

async function startChat(productId) {
  if (!currentUser) {
    openAuth("login");
    return;
  }

  const product =
    products.find(
      (item) =>
        String(item.id) ===
        String(productId)
    );

  if (!product) {
    showNotice("Product not found.");
    return;
  }

  if (
    String(product.seller_id) ===
    String(currentUser.id)
  ) {
    showNotice(
      "You cannot message yourself about your own listing."
    );

    return;
  }

  try {
    let conversation = null;

    const { data: existing } =
      await supabaseClient
        .from("conversations")
        .select("*")
        .eq("buyer_id", currentUser.id)
        .eq("seller_id", product.seller_id)
        .eq("product_id", product.id)
        .maybeSingle();

    if (existing) {
      conversation = existing;
    } else {
      const { data, error } =
        await supabaseClient
          .from("conversations")
          .insert({
            id: makeId(),
            buyer_id: currentUser.id,
            seller_id: product.seller_id,
            product_id: product.id
          })
          .select()
          .single();

      if (error) {
        throw error;
      }

      conversation = data;
    }

    await openConversation(
      conversation.id
    );

  } catch (error) {
    console.error(error);

    showNotice(
      error?.message ||
      "Could not start conversation."
    );
  }
}


/* =========================
   OPEN CONVERSATION
   ========================= */

async function openConversation(
  conversationId
) {
  if (!currentUser) {
    openAuth("login");
    return;
  }

  try {
    const { data: conversation, error } =
      await supabaseClient
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

    if (error) {
      throw error;
    }

    currentConversation =
      conversation;

    const otherId =
      String(conversation.buyer_id) ===
      String(currentUser.id)
        ? conversation.seller_id
        : conversation.buyer_id;

    let otherName = "User";

    const { data: profile } =
      await supabaseClient
        .from("profiles")
        .select("full_name,name")
        .eq("id", otherId)
        .maybeSingle();

    if (profile) {
      otherName =
        profile.full_name ||
        profile.name ||
        "User";
    }

    const product =
      products.find(
        (item) =>
          String(item.id) ===
          String(conversation.product_id)
      );

    if ($("chatName")) {
      $("chatName").textContent =
        otherName;
    }

    if ($("chatProduct")) {
      $("chatProduct").textContent =
        product?.name || "";
    }

    navigate("chat");

    await loadMessages(
      conversationId
    );

    subscribeToMessages(
      conversationId
    );

  } catch (error) {
    console.error(error);

    showNotice(
      error?.message ||
      "Could not open conversation."
    );
  }
}


/* =========================
   MESSAGES
   ========================= */

async function loadMessages(
  conversationId
) {
  const container =
    $("chatMessages");

  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      <p>Loading messages...</p>
    </div>
  `;

  try {
    const { data, error } =
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
      throw error;
    }

    renderMessages(data || []);

  } catch (error) {
    console.error(error);

    container.innerHTML = `
      <div class="empty-state">
        <p>${escapeHTML(
          error?.message ||
          "Could not load messages."
        )}</p>
      </div>
    `;
  }
}


function renderMessages(messages) {
  const container =
    $("chatMessages");

  if (!container) return;

  if (!messages.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Start the conversation</h3>
        <p>Send the first message.</p>
      </div>
    `;

    return;
  }

  container.innerHTML = messages
    .map((message) => {

      const mine =
        String(message.sender_id) ===
        String(currentUser?.id);

      return `
        <div
          class="chat-message ${
            mine ? "mine" : "theirs"
          }"
        >
          ${escapeHTML(message.content)}
        </div>
      `;
    })
    .join("");

  container.scrollTop =
    container.scrollHeight;
}


async function sendMessage(event) {
  event.preventDefault();

  if (!currentUser) {
    openAuth("login");
    return;
  }

  if (!currentConversation) {
    return;
  }

  const input = $("chatInput");

  if (!input) return;

  const content =
    input.value.trim();

  if (!content) return;

  input.disabled = true;

  try {
    const { error } =
      await supabaseClient
        .from("messages")
        .insert({
          id: makeId(),
          conversation_id:
            currentConversation.id,
          sender_id:
            currentUser.id,
          content
        });

    if (error) {
      throw error;
    }

    input.value = "";

    await loadMessages(
      currentConversation.id
    );

  } catch (error) {
    console.error(error);

    showNotice(
      error?.message ||
      "Message could not be sent."
    );

  } finally {
    input.disabled = false;
    input.focus();
  }
}


/* =========================
   REALTIME CHAT
   ========================= */

function subscribeToMessages(
  conversationId
) {
  if (realtimeChannel) {
    supabaseClient.removeChannel(
      realtimeChannel
    );
  }

  realtimeChannel =
    supabaseClient
      .channel(
        "chat-" + conversationId
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
        }
      )
      .subscribe();
}


/* =========================
   LOCATION
   ========================= */

function handleLocation() {
  showNotice(
    "Location selection will be added soon. You can currently search products by campus."
  );
}


/* =========================
   EVENT HANDLERS
   ========================= */

function setupEvents() {

  /* Hash navigation */

  window.addEventListener(
    "hashchange",
    handleHashChange
  );


  /* Menu */

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


  /* Top account */

  $("topAccountButton")?.addEventListener(
    "click",
    () => navigate("account")
  );


  /* Account login */

  $("accountLoginButton")?.addEventListener(
    "click",
    () => openAuth("login")
  );


  /* Logout */

  $("logoutButton")?.addEventListener(
    "click",
    logout
  );


  /* Auth */

  $("closeAuth")?.addEventListener(
    "click",
    closeAuth
  );

  $("authSwitch")?.addEventListener(
    "click",
    () => {
      openAuth(
        authMode === "login"
          ? "signup"
          : "login"
      );
    }
  );

  $("authForm")?.addEventListener(
    "submit",
    handleAuthSubmit
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


  /* Search */

  $("searchInput")?.addEventListener(
    "input",
    (event) => {
      handleSearch(event.target.value);
    }
  );


  $("clearSearch")?.addEventListener(
    "click",
    clearSearch
  );


  /* Location */

  $("locationButton")?.addEventListener(
    "click",
    handleLocation
  );


  /* Sort */

  $("sortButton")?.addEventListener(
    "click",
    changeSort
  );


  /* Sell form */

  $("sellForm")?.addEventListener(
    "submit",
    handleSellSubmit
  );


  /* Image input */

  $("productImages")?.addEventListener(
    "change",
    handleImageSelection
  );


  /* Chat */

  $("chatForm")?.addEventListener(
    "submit",
    sendMessage
  );


  /* Bottom navigation */

  document
    .querySelectorAll(
      ".bottom-nav [data-nav]"
    )
    .forEach((item) => {

      item.addEventListener(
        "click",
        (event) => {
          event.preventDefault();

          navigate(
            item.dataset.nav
          );
        }
      );

    });


  /* Category buttons */

  document
    .querySelectorAll(
      "[data-category]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {
          filterCategory(
            button.dataset.category
          );
        }
      );

    });


  /* Settings */

  const settingsButton =
    Array.from(
      document.querySelectorAll(
        "#accountLoggedIn .account-menu-item"
      )
    ).find((button) => {
      return (
        button
          .textContent
          .trim()
          .toLowerCase()
          .includes("settings")
      );
    });

  settingsButton?.addEventListener(
    "click",
    () => {
      showNotice(
        "Account settings will be added soon."
      );
    }
  );


  /* Global click delegation */

  document.addEventListener(
    "click",
    (event) => {

      const routeElement =
        event.target.closest(
          "[data-route]"
        );

      if (routeElement) {
        event.preventDefault();

        navigate(
          routeElement.dataset.route
        );

        return;
      }


      const actionElement =
        event.target.closest(
          "[data-action]"
        );

      if (!actionElement) {
        return;
      }

      const action =
        actionElement.dataset.action;


      if (action === "save") {
        toggleSaved(
          actionElement.dataset.productId
        );

        return;
      }


      if (action === "login") {
        openAuth("login");

        return;
      }


      if (action === "chat-seller") {
        startChat(
          actionElement.dataset.productId
        );

        return;
      }


      if (action === "open-conversation") {
        openConversation(
          actionElement.dataset.conversationId
        );

        return;
      }


      if (action === "remove-image") {
        removeSelectedImage(
          Number(
            actionElement.dataset.imageIndex
          )
        );

        return;
      }

    }
  );


  /* Product cards */

  document.addEventListener(
    "click",
    (event) => {

      const productElement =
        event.target.closest(
          ".product-open"
        );

      if (!productElement) {
        return;
      }

      openProduct(
        productElement.dataset.productId
      );

    }
  );

}


/* =========================
   AUTH STATE LISTENER
   ========================= */

function setupAuthListener() {

  supabaseClient.auth.onAuthStateChange(
    (event, session) => {

      currentUser =
        session?.user || null;

      if (currentUser) {

        setTimeout(() => {
          loadCurrentProfile();
        }, 0);

      } else {

        currentProfile = null;

      }

      updateAccountUI();

    }
  );

}


/* =========================
   INITIALIZATION
   ========================= */

async function initializeApp() {

  console.log(
    "Cheal Market starting..."
  );

  console.log(
    "Supabase URL:",
    SUPABASE_URL
  );

  console.log(
    "Supabase client:",
    !!supabaseClient
  );

  setupEvents();

  setupAuthListener();

  await loadCurrentUser();

  await loadProducts();

  handleHashChange();

  console.log(
    "Cheal Market ready."
  );
}


/* =========================
   START APP
   ========================= */

document.addEventListener(
  "DOMContentLoaded",
  initializeApp
);
