// ============================================================
// CHEAL MARKET - APP.JS
// Supabase + Authentication + Marketplace + Chat
// ============================================================

// ------------------------------------------------------------
// 1. SUPABASE CONFIGURATION
// ------------------------------------------------------------

const SUPABASE_URL = "https://qwlklqjfbrhythpynghr.supabase.co";

// IMPORTANT:
// Replace the value below with the CURRENT "Publishable key"
// from Supabase > Settings > API Keys.
//
// It must start with:
// sb_publishable_

const SUPABASE_PUBLISHABLE_KEY =
  "PASTE_YOUR_CURRENT_PUBLISHABLE_KEY_HERE";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const BUCKET_NAME = "product-images";

// ------------------------------------------------------------
// 2. GLOBAL STATE
// ------------------------------------------------------------

let currentUser = null;
let currentProfile = null;
let currentProduct = null;
let currentConversation = null;
let selectedImages = [];
let allProducts = [];

const SAVED_KEY = "cheal_market_saved";

// ------------------------------------------------------------
// 3. BASIC HELPERS
// ------------------------------------------------------------

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

function formatPrice(price) {
  const number = Number(price || 0);

  return `UGX ${number.toLocaleString("en-UG")}`;
}

function getSavedProducts() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY)) || [];
  } catch {
    return [];
  }
}

function setSavedProducts(products) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(products));
}

function isSaved(productId) {
  return getSavedProducts().includes(Number(productId));
}

function showMessage(message) {
  alert(message);
}

// ------------------------------------------------------------
// 4. NAVIGATION
// ------------------------------------------------------------

function navigate(screen) {
  window.location.hash = screen;
  showScreen(screen);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function showScreen(screen) {
  const screens = document.querySelectorAll(".screen");

  screens.forEach((element) => {
    element.classList.remove("active");
  });

  const target = document.getElementById(`${screen}-screen`);

  if (target) {
    target.classList.add("active");
  }

  document.querySelectorAll(".bottom-nav button").forEach((button) => {
    button.classList.remove("active");
  });

  const activeButton = document.querySelector(
    `.bottom-nav button[data-screen="${screen}"]`
  );

  if (activeButton) {
    activeButton.classList.add("active");
  }

  closeMenu();
}

window.addEventListener("hashchange", () => {
  const screen = window.location.hash.replace("#", "") || "home";

  showScreen(screen);

  if (screen === "home") {
    loadProducts();
  }

  if (screen === "saved") {
    renderSavedProducts();
  }

  if (screen === "messages") {
    loadConversations();
  }

  if (screen === "account") {
    loadAccount();
  }

  if (screen === "listings") {
    loadMyListings();
  }
});

// ------------------------------------------------------------
// 5. LOAD PRODUCTS
// ------------------------------------------------------------

async function loadProducts() {
  const grid = $("products-grid");

  if (!grid) return;

  grid.innerHTML = `
    <div class="loading">
      Loading products...
    </div>
  `;

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Products error:", error);

    grid.innerHTML = `
      <div class="empty-state">
        <h3>Unable to load products</h3>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;

    return;
  }

  allProducts = data || [];

  renderProducts(allProducts);
}

// ------------------------------------------------------------
// 6. RENDER PRODUCTS
// ------------------------------------------------------------

function renderProducts(products) {
  const grid = $("products-grid");

  if (!grid) return;

  if (!products.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>No products found</h3>
        <p>Be the first student to list something.</p>
      </div>
    `;

    return;
  }

  grid.innerHTML = products
    .map((product) => {
      const images = Array.isArray(product.image_urls)
        ? product.image_urls
        : [];

      const image =
        images.length > 0
          ? images[0]
          : "https://placehold.co/600x450?text=Cheal+Market";

      return `
        <article class="product-card">

          <button
            class="save-button"
            onclick="toggleSaved(${product.id})"
            aria-label="Save product"
          >
            ${isSaved(product.id) ? "♥" : "♡"}
          </button>

          <div
            class="product-image"
            onclick="openProduct(${product.id})"
          >
            <img
              src="${escapeHTML(image)}"
              alt="${escapeHTML(product.name)}"
            />
          </div>

          <div
            class="product-info"
            onclick="openProduct(${product.id})"
          >
            <h3>${escapeHTML(product.name)}</h3>

            <strong>
              ${formatPrice(product.price)}
            </strong>

            <p>
              ${escapeHTML(product.campus || "Uganda")}
            </p>

            <span>
              ${escapeHTML(product.category || "Other")}
            </span>
          </div>

        </article>
      `;
    })
    .join("");
}

// ------------------------------------------------------------
// 7. SEARCH
// ------------------------------------------------------------

function searchProducts() {
  const input = $("search-input");

  if (!input) return;

  const search = input.value.toLowerCase().trim();

  if (!search) {
    renderProducts(allProducts);
    return;
  }

  const filtered = allProducts.filter((product) => {
    return (
      String(product.name || "")
        .toLowerCase()
        .includes(search) ||
      String(product.description || "")
        .toLowerCase()
        .includes(search) ||
      String(product.category || "")
        .toLowerCase()
        .includes(search) ||
      String(product.campus || "")
        .toLowerCase()
        .includes(search)
    );
  });

  renderProducts(filtered);
}

// ------------------------------------------------------------
// 8. CATEGORY FILTER
// ------------------------------------------------------------

function filterCategory(category) {
  if (!category || category === "All") {
    renderProducts(allProducts);
    navigate("home");
    return;
  }

  const filtered = allProducts.filter(
    (product) =>
      String(product.category || "").toLowerCase() ===
      String(category).toLowerCase()
  );

  navigate("home");

  renderProducts(filtered);
}

// ------------------------------------------------------------
// 9. SAVED PRODUCTS
// ------------------------------------------------------------

function toggleSaved(productId) {
  const id = Number(productId);

  let saved = getSavedProducts();

  if (saved.includes(id)) {
    saved = saved.filter((item) => item !== id);
  } else {
    saved.push(id);
  }

  setSavedProducts(saved);

  renderProducts(allProducts);

  if (window.location.hash === "#saved") {
    renderSavedProducts();
  }
}

function renderSavedProducts() {
  const container = $("saved-products");

  if (!container) return;

  const saved = getSavedProducts();

  const products = allProducts.filter((product) =>
    saved.includes(Number(product.id))
  );

  if (!products.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No saved products</h3>
        <p>Products you save will appear here.</p>
      </div>
    `;

    return;
  }

  container.innerHTML = products
    .map((product) => {
      const images = Array.isArray(product.image_urls)
        ? product.image_urls
        : [];

      const image =
        images.length > 0
          ? images[0]
          : "https://placehold.co/600x450?text=Cheal+Market";

      return `
        <article class="product-card">

          <button
            class="save-button"
            onclick="toggleSaved(${product.id})"
          >
            ♥
          </button>

          <div
            class="product-image"
            onclick="openProduct(${product.id})"
          >
            <img
              src="${escapeHTML(image)}"
              alt="${escapeHTML(product.name)}"
            />
          </div>

          <div class="product-info">
            <h3>${escapeHTML(product.name)}</h3>

            <strong>
              ${formatPrice(product.price)}
            </strong>

            <p>
              ${escapeHTML(product.campus || "Uganda")}
            </p>
          </div>

        </article>
      `;
    })
    .join("");
}

// ------------------------------------------------------------
// 10. PRODUCT DETAILS
// ------------------------------------------------------------

async function openProduct(productId) {
  const product = allProducts.find(
    (item) => Number(item.id) === Number(productId)
  );

  if (!product) return;

  currentProduct = product;

  const container = $("product-details");

  if (!container) return;

  const images = Array.isArray(product.image_urls)
    ? product.image_urls
    : [];

  const mainImage =
    images.length > 0
      ? images[0]
      : "https://placehold.co/800x600?text=Cheal+Market";

  container.innerHTML = `
    <div class="details-gallery">

      <img
        src="${escapeHTML(mainImage)}"
        alt="${escapeHTML(product.name)}"
      />

    </div>

    <div class="details-content">

      <div class="details-header">

        <div>
          <span>
            ${escapeHTML(product.category || "Other")}
          </span>

          <h1>
            ${escapeHTML(product.name)}
          </h1>

          <h2>
            ${formatPrice(product.price)}
          </h2>
        </div>

        <button
          class="save-button large"
          onclick="toggleSaved(${product.id}); openProduct(${product.id})"
        >
          ${isSaved(product.id) ? "♥" : "♡"}
        </button>

      </div>

      <div class="details-meta">
        <p>
          📍 ${escapeHTML(product.campus || "Uganda")}
        </p>

        <p>
          🕒 Recently listed
        </p>
      </div>

      <div class="details-description">
        <h3>Description</h3>

        <p>
          ${escapeHTML(
            product.description || "No description provided."
          )}
        </p>
      </div>

      <button
        class="primary-button"
        onclick="startChatWithSeller(${product.id})"
      >
        💬 Chat with seller
      </button>

    </div>
  `;

  navigate("product");
}

// ------------------------------------------------------------
// 11. IMAGE UPLOAD PREVIEW
// ------------------------------------------------------------

function handleImageSelection(event) {
  const files = Array.from(event.target.files || []);

  if (!files.length) return;

  if (files.length > 5) {
    showMessage("You can upload a maximum of 5 images.");
    event.target.value = "";
    return;
  }

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      showMessage("Only image files are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showMessage("Each image must be 10 MB or smaller.");
      event.target.value = "";
      return;
    }
  }

  selectedImages = files;

  renderImagePreviews();
}

function renderImagePreviews() {
  const container = $("image-preview");

  if (!container) return;

  if (!selectedImages.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = "";

  selectedImages.forEach((file) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const wrapper = document.createElement("div");

      wrapper.className = "image-preview-item";

      wrapper.innerHTML = `
        <img
          src="${event.target.result}"
          alt="Selected product image"
        />
      `;

      container.appendChild(wrapper);
    };

    reader.readAsDataURL(file);
  });
}

// ------------------------------------------------------------
// 12. UPLOAD PRODUCT IMAGES
// ------------------------------------------------------------

async function uploadProductImages(userId) {
  const urls = [];

  for (const file of selectedImages) {
    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const fileName =
      `${userId}/` +
      `${crypto.randomUUID()}.${extension}`;

    const { error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type
      });

    if (error) {
      console.error("Image upload error:", error);
      throw error;
    }

    const { data } = supabaseClient.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    urls.push(data.publicUrl);
  }

  return urls;
}

// ------------------------------------------------------------
// 13. SELL PRODUCT
// ------------------------------------------------------------

async function submitProduct(event) {
  event.preventDefault();

  if (!currentUser) {
    openAuth("login");
    return;
  }

  const name = $("product-name")?.value.trim();
  const price = $("product-price")?.value;
  const category = $("product-category")?.value;
  const campus = $("product-campus")?.value.trim();
  const description = $("product-description")?.value.trim();

  if (!name || !price || !category || !campus) {
    showMessage("Please complete all required fields.");
    return;
  }

  const button = event.submitter;

  if (button) {
    button.disabled = true;
    button.textContent = "Publishing...";
  }

  try {
    let imageUrls = [];

    if (selectedImages.length) {
      imageUrls = await uploadProductImages(currentUser.id);
    }

    const { error } = await supabaseClient
      .from("products")
      .insert({
        name,
        price: Number(price),
        category,
        campus,
        description,
        seller_id: currentUser.id,
        image_urls: imageUrls
      });

    if (error) {
      throw error;
    }

    showMessage("Your product has been listed successfully!");

    event.target.reset();

    selectedImages = [];

    renderImagePreviews();

    await loadProducts();

    navigate("home");

  } catch (error) {
    console.error("Product publishing error:", error);

    showMessage(
      `Unable to publish product: ${error.message}`
    );

  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Publish listing";
    }
  }
}

// ------------------------------------------------------------
// 14. AUTH MODAL
// ------------------------------------------------------------

function openAuth(mode = "login") {
  const modal = $("auth-modal");

  if (!modal) return;

  modal.classList.add("active");

  const loginForm = $("login-form");
  const signupForm = $("signup-form");

  if (mode === "signup") {
    if (loginForm) loginForm.style.display = "none";
    if (signupForm) signupForm.style.display = "block";
  } else {
    if (loginForm) loginForm.style.display = "block";
    if (signupForm) signupForm.style.display = "none";
  }
}

function closeAuth() {
  const modal = $("auth-modal");

  if (modal) {
    modal.classList.remove("active");
  }
}

function switchAuth(mode) {
  openAuth(mode);
}

// ------------------------------------------------------------
// 15. SIGN UP
// ------------------------------------------------------------

async function signUp(event) {
  event.preventDefault();

  const fullName = $("signup-name")?.value.trim();
  const campus = $("signup-campus")?.value.trim();
  const email = $("signup-email")?.value.trim();
  const password = $("signup-password")?.value;

  if (!fullName || !email || !password) {
    showMessage("Please complete all required fields.");
    return;
  }

  if (password.length < 6) {
    showMessage("Password must contain at least 6 characters.");
    return;
  }

  try {
    const { data, error } =
      await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            campus: campus || null
          }
        }
      });

    if (error) {
      throw error;
    }

    if (data.user) {
      if (data.session) {
        currentUser = data.user;

        await loadCurrentProfile();

        showMessage(
          "Account created successfully!"
        );

        closeAuth();

        navigate("account");

      } else {
        showMessage(
          "Account created. Please confirm your email before signing in."
        );
      }
    }

  } catch (error) {
    console.error("Signup error:", error);

    showMessage(
      `Sign up failed: ${error.message}`
    );
  }
}

// ------------------------------------------------------------
// 16. SIGN IN
// ------------------------------------------------------------

async function signIn(event) {
  event.preventDefault();

  const email = $("login-email")?.value.trim();
  const password = $("login-password")?.value;

  if (!email || !password) {
    showMessage("Enter your email and password.");
    return;
  }

  try {
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

    showMessage("Welcome back!");

    closeAuth();

    navigate("account");

  } catch (error) {
    console.error("Login error:", error);

    showMessage(
      `Login failed: ${error.message}`
    );
  }
}

// ------------------------------------------------------------
// 17. LOAD CURRENT USER
// ------------------------------------------------------------

async function loadCurrentUser() {
  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  currentUser = user || null;

  if (currentUser) {
    await loadCurrentProfile();
  }

  updateAuthUI();
}

// ------------------------------------------------------------
// 18. LOAD PROFILE
// ------------------------------------------------------------

async function loadCurrentProfile() {
  if (!currentUser) return;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error) {
    console.error("Profile error:", error);
    return;
  }

  currentProfile = data;
}

// ------------------------------------------------------------
// 19. UPDATE AUTH UI
// ------------------------------------------------------------

function updateAuthUI() {
  const accountName = $("account-name");
  const accountEmail = $("account-email");

  if (currentUser) {
    if (accountName) {
      accountName.textContent =
        currentProfile?.full_name ||
        currentUser.email ||
        "My Account";
    }

    if (accountEmail) {
      accountEmail.textContent =
        currentUser.email || "";
    }
  } else {
    if (accountName) {
      accountName.textContent = "Sign in";
    }

    if (accountEmail) {
      accountEmail.textContent = "";
    }
  }
}

// ------------------------------------------------------------
// 20. ACCOUNT
// ------------------------------------------------------------

async function loadAccount() {
  await loadCurrentUser();

  updateAuthUI();

  const signedOut = $("signed-out-account");
  const signedIn = $("signed-in-account");

  if (!currentUser) {
    if (signedOut) signedOut.style.display = "block";
    if (signedIn) signedIn.style.display = "none";
  } else {
    if (signedOut) signedOut.style.display = "none";
    if (signedIn) signedIn.style.display = "block";
  }
}

// ------------------------------------------------------------
// 21. LOGOUT
// ------------------------------------------------------------

async function logout() {
  const { error } =
    await supabaseClient.auth.signOut();

  if (error) {
    showMessage(`Logout failed: ${error.message}`);
    return;
  }

  currentUser = null;
  currentProfile = null;

  updateAuthUI();

  showMessage("You have been signed out.");

  navigate("home");
}

// ------------------------------------------------------------
// 22. MY LISTINGS
// ------------------------------------------------------------

async function loadMyListings() {
  const container = $("my-listings");

  if (!container) return;

  if (!currentUser) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Please sign in</h3>
        <p>You need an account to view your listings.</p>

        <button
          class="primary-button"
          onclick="openAuth('login')"
        >
          Sign in
        </button>
      </div>
    `;

    return;
  }

  container.innerHTML = `
    <div class="loading">
      Loading your listings...
    </div>
  `;

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("seller_id", currentUser.id)
    .order("created_at", {
      ascending: false
    });

  if (error) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Unable to load listings</h3>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;

    return;
  }

  if (!data.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No listings yet</h3>
        <p>Products you sell will appear here.</p>

        <button
          class="primary-button"
          onclick="navigate('sell')"
        >
          Sell something
        </button>
      </div>
    `;

    return;
  }

  container.innerHTML = data
    .map((product) => {
      const images = Array.isArray(product.image_urls)
        ? product.image_urls
        : [];

      const image =
        images[0] ||
        "https://placehold.co/600x450?text=Cheal+Market";

      return `
        <article class="product-card">

          <div class="product-image">
            <img
              src="${escapeHTML(image)}"
              alt="${escapeHTML(product.name)}"
            />
          </div>

          <div class="product-info">

            <h3>
              ${escapeHTML(product.name)}
            </h3>

            <strong>
              ${formatPrice(product.price)}
            </strong>

            <p>
              ${escapeHTML(product.category || "Other")}
            </p>

          </div>

        </article>
      `;
    })
    .join("");
}

// ------------------------------------------------------------
// 23. START CHAT
// ------------------------------------------------------------

async function startChatWithSeller(productId) {
  if (!currentUser) {
    openAuth("login");
    return;
  }

  const product = allProducts.find(
    (item) => Number(item.id) === Number(productId)
  );

  if (!product) return;

  if (product.seller_id === currentUser.id) {
    showMessage("You cannot chat with yourself.");
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("conversations")
      .upsert(
        {
          buyer_id: currentUser.id,
          seller_id: product.seller_id,
          product_id: product.id
        },
        {
          onConflict:
            "buyer_id,seller_id,product_id"
        }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    currentConversation = data;

    await openConversation(data.id);

  } catch (error) {
    console.error("Chat error:", error);

    showMessage(
      `Unable to start chat: ${error.message}`
    );
  }
}

// ------------------------------------------------------------
// 24. LOAD CONVERSATIONS
// ------------------------------------------------------------

async function loadConversations() {
  const container = $("conversations-list");

  if (!container) return;

  if (!currentUser) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Sign in to view messages</h3>

        <button
          class="primary-button"
          onclick="openAuth('login')"
        >
          Sign in
        </button>
      </div>
    `;

    return;
  }

  const { data, error } = await supabaseClient
    .from("conversations")
    .select("*")
    .or(
      `buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`
    )
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error("Conversation error:", error);

    container.innerHTML = `
      <div class="empty-state">
        <h3>Unable to load messages</h3>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;

    return;
  }

  if (!data.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No messages yet</h3>
        <p>Your private conversations will appear here.</p>
      </div>
    `;

    return;
  }

  const rows = [];

  for (const conversation of data) {
    const otherUserId =
      conversation.buyer_id === currentUser.id
        ? conversation.seller_id
        : conversation.buyer_id;

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name,campus")
      .eq("id", otherUserId)
      .maybeSingle();

    rows.push({
      conversation,
      profile
    });
  }

  container.innerHTML = rows
    .map(({ conversation, profile }) => {
      return `
        <button
          class="conversation-item"
          onclick="openConversation(${conversation.id})"
        >
          <div class="conversation-avatar">
            ${escapeHTML(
              (profile?.full_name || "U")
                .charAt(0)
                .toUpperCase()
            )}
          </div>

          <div>
            <strong>
              ${escapeHTML(
                profile?.full_name || "User"
              )}
            </strong>

            <span>
              ${escapeHTML(
                profile?.campus || ""
              )}
            </span>
          </div>
        </button>
      `;
    })
    .join("");
}

// ------------------------------------------------------------
// 25. OPEN CONVERSATION
// ------------------------------------------------------------

async function openConversation(conversationId) {
  const { data, error } = await supabaseClient
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .single();

  if (error) {
    showMessage(
      `Unable to open conversation: ${error.message}`
    );

    return;
  }

  currentConversation = data;

  const otherUserId =
    data.buyer_id === currentUser.id
      ? data.seller_id
      : data.buyer_id;

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("full_name,campus")
    .eq("id", otherUserId)
    .maybeSingle();

  const title = $("chat-user-name");

  if (title) {
    title.textContent =
      profile?.full_name || "User";
  }

  await loadMessages(conversationId);

  navigate("chat");

  subscribeToMessages(conversationId);
}

// ------------------------------------------------------------
// 26. LOAD MESSAGES
// ------------------------------------------------------------

async function loadMessages(conversationId) {
  const container = $("chat-messages");

  if (!container) return;

  const { data, error } = await supabaseClient
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", {
      ascending: true
    });

  if (error) {
    console.error("Messages error:", error);

    container.innerHTML = `
      <div class="empty-state">
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;

    return;
  }

  renderMessages(data || []);
}

// ------------------------------------------------------------
// 27. RENDER MESSAGES
// ------------------------------------------------------------

function renderMessages(messages) {
  const container = $("chat-messages");

  if (!container) return;

  if (!messages.length) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Start the conversation.</p>
      </div>
    `;

    return;
  }

  container.innerHTML = messages
    .map((message) => {
      const mine =
        message.sender_id === currentUser?.id;

      return `
        <div
          class="message-row ${
            mine ? "mine" : "theirs"
          }"
        >
          <div class="message-bubble">
            ${escapeHTML(message.message)}
          </div>
        </div>
      `;
    })
    .join("");

  container.scrollTop = container.scrollHeight;
}

// ------------------------------------------------------------
// 28. SEND MESSAGE
// ------------------------------------------------------------

async function sendMessage(event) {
  event.preventDefault();

  if (!currentUser || !currentConversation) {
    return;
  }

  const input = $("message-input");

  if (!input) return;

  const message = input.value.trim();

  if (!message) return;

  const { error } = await supabaseClient
    .from("messages")
    .insert({
      conversation_id:
        currentConversation.id,
      sender_id: currentUser.id,
      message
    });

  if (error) {
    showMessage(
      `Message failed: ${error.message}`
    );

    return;
  }

  input.value = "";

  await loadMessages(
    currentConversation.id
  );
}

// ------------------------------------------------------------
// 29. REALTIME CHAT
// ------------------------------------------------------------

let messageChannel = null;

function subscribeToMessages(conversationId) {
  if (messageChannel) {
    supabaseClient.removeChannel(
      messageChannel
    );
  }

  messageChannel = supabaseClient
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
        await loadMessages(conversationId);
      }
    )
    .subscribe();
}

// ------------------------------------------------------------
// 30. MENU
// ------------------------------------------------------------

function openMenu() {
  const menu = $("menu-drawer");

  if (menu) {
    menu.classList.add("active");
  }
}

function closeMenu() {
  const menu = $("menu-drawer");

  if (menu) {
    menu.classList.remove("active");
  }
}

// ------------------------------------------------------------
// 31. AUTH STATE LISTENER
// ------------------------------------------------------------

supabaseClient.auth.onAuthStateChange(
  async (event, session) => {
    currentUser = session?.user || null;

    if (currentUser) {
      await loadCurrentProfile();
    } else {
      currentProfile = null;
    }

    updateAuthUI();
  }
);

// ------------------------------------------------------------
// 32. FORM EVENT LISTENERS
// ------------------------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {
  const productForm = $("sell-form");

  if (productForm) {
    productForm.addEventListener(
      "submit",
      submitProduct
    );
  }

  const loginForm = $("login-form");

  if (loginForm) {
    loginForm.addEventListener(
      "submit",
      signIn
    );
  }

  const signupForm = $("signup-form");

  if (signupForm) {
    signupForm.addEventListener(
      "submit",
      signUp
    );
  }

  const imageInput = $("product-images");

  if (imageInput) {
    imageInput.addEventListener(
      "change",
      handleImageSelection
    );
  }

  const messageForm = $("message-form");

  if (messageForm) {
    messageForm.addEventListener(
      "submit",
      sendMessage
    );
  }

  const searchInput = $("search-input");

  if (searchInput) {
    searchInput.addEventListener(
      "input",
      searchProducts
    );
  }

  await loadCurrentUser();

  const initialScreen =
    window.location.hash.replace("#", "") ||
    "home";

  showScreen(initialScreen);

  await loadProducts();
});

// ------------------------------------------------------------
// 33. MAKE FUNCTIONS AVAILABLE TO HTML
// ------------------------------------------------------------

window.navigate = navigate;
window.openAuth = openAuth;
window.closeAuth = closeAuth;
window.switchAuth = switchAuth;
window.logout = logout;
window.toggleSaved = toggleSaved;
window.openProduct = openProduct;
window.filterCategory = filterCategory;
window.startChatWithSeller =
  startChatWithSeller;
window.openConversation = openConversation;
window.openMenu = openMenu;
window.closeMenu = closeMenu;
window.loadMyListings = loadMyListings;
window.loadConversations =
  loadConversations;
window.sendMessage = sendMessage;
window.handleImageSelection =
  handleImageSelection;
