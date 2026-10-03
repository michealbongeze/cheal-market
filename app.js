// ============================================================
// CHEAL MARKET
// Main Application
// ============================================================

// ============================================================
// SUPABASE CONFIGURATION
// ============================================================

const SUPABASE_URL =
  "https://qwlklqjfbrhythpynghr.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_HVAjJNZAQIiyf1AosvH0A_fnYoFpHx";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

const BUCKET_NAME = "product-images";


// ============================================================
// APP STATE
// ============================================================

let currentUser = null;
let currentProfile = null;

let currentProduct = null;
let currentConversation = null;

let messageChannel = null;

let selectedImages = [];
let allProducts = [];

let currentCategory = "All";
let currentSort = "latest";

const SAVED_KEY =
  "cheal_market_saved";


// ============================================================
// DOM HELPER
// ============================================================

function $(id) {
  return document.getElementById(id);
}


// ============================================================
// HTML ESCAPING
// ============================================================

function escapeHTML(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// ============================================================
// PRICE FORMAT
// ============================================================

function formatPrice(price) {

  return `UGX ${Number(
    price || 0
  ).toLocaleString("en-UG")}`;
}


// ============================================================
// MESSAGE
// ============================================================

function showMessage(message) {

  alert(message);
}


// ============================================================
// SAVED PRODUCTS
// ============================================================

function getSavedProducts() {

  try {

    return JSON.parse(
      localStorage.getItem(
        SAVED_KEY
      )
    ) || [];

  } catch {

    return [];
  }
}


function setSavedProducts(products) {

  localStorage.setItem(
    SAVED_KEY,
    JSON.stringify(products)
  );
}


function isSaved(productId) {

  return getSavedProducts().includes(
    Number(productId)
  );
}


function toggleSaved(productId) {

  const id =
    Number(productId);

  let saved =
    getSavedProducts();

  if (saved.includes(id)) {

    saved =
      saved.filter(
        item => item !== id
      );

  } else {

    saved.push(id);
  }

  setSavedProducts(saved);

  renderProducts(
    getVisibleProducts()
  );

  renderSavedProducts();

  if (
    currentProduct &&
    Number(currentProduct.id) === id
  ) {
    openProduct(id, false);
  }
}


// ============================================================
// NAVIGATION
// ============================================================

function navigate(screen) {

  if (!screen) {
    screen = "home";
  }

  screen =
    String(screen)
      .replace("#", "")
      .trim();

  if (
    screen === "listings"
  ) {
    screen = "my-listings";
  }

  const validScreens = [
    "home",
    "saved",
    "sell",
    "messages",
    "chat",
    "account",
    "my-listings",
    "product"
  ];

  if (
    !validScreens.includes(screen)
  ) {
    screen = "home";
  }

  if (
    window.location.hash !==
    `#${screen}`
  ) {
    window.location.hash =
      screen;
  }

  showScreen(screen);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


function showScreen(screen) {

  const screens =
    document.querySelectorAll(
      ".screen"
    );

  screens.forEach(element => {

    element.classList.add(
      "hidden"
    );

    element.classList.remove(
      "active"
    );

  });


  let targetId;

  switch (screen) {

    case "home":
      targetId =
        "homeScreen";
      break;

    case "saved":
      targetId =
        "savedScreen";
      break;

    case "sell":
      targetId =
        "sellScreen";
      break;

    case "messages":
      targetId =
        "messagesScreen";
      break;

    case "chat":
      targetId =
        "chatScreen";
      break;

    case "account":
      targetId =
        "accountScreen";
      break;

    case "my-listings":
      targetId =
        "myListingsScreen";
      break;

    case "product":
      targetId =
        "productScreen";
      break;

    default:
      targetId =
        "homeScreen";
  }


  const target =
    $(targetId);

  if (target) {

    target.classList.remove(
      "hidden"
    );

    target.classList.add(
      "active"
    );
  }


  // Bottom navigation

  document
    .querySelectorAll(
      ".bottom-nav .nav-item"
    )
    .forEach(item => {

      item.classList.remove(
        "active"
      );

      const route =
        item.dataset.nav;

      if (
        route === screen
      ) {
        item.classList.add(
          "active"
        );
      }

    });


  // Special handling for account

  if (
    screen === "account"
  ) {
    updateAccountScreen();
  }


  // Saved

  if (
    screen === "saved"
  ) {
    renderSavedProducts();
  }


  // Messages

  if (
    screen === "messages"
  ) {
    loadConversations();
  }


  // My listings

  if (
    screen === "my-listings"
  ) {
    loadMyListings();
  }


  closeMenu();
}


// ============================================================
// HASH NAVIGATION
// ============================================================

function handleHashChange() {

  let screen =
    window.location.hash
      .replace("#", "")
      .trim();

  if (!screen) {
    screen = "home";
  }

  showScreen(screen);
}


// ============================================================
// PRODUCTS
// ============================================================

async function loadProducts() {

  const grid =
    $("productGrid");

  if (!grid) {
    return;
  }

  grid.innerHTML = `
    <div class="loading-card">
      <div class="spinner"></div>
      <p>Loading products...</p>
    </div>
  `;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("products")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Products error:",
      error
    );

    grid.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">
          ⚠️
        </div>

        <h2>
          Unable to load products
        </h2>

        <p>
          ${escapeHTML(
            error.message
          )}
        </p>

        <button
          type="button"
          class="primary-button"
          onclick="loadProducts()"
        >
          Try again
        </button>

      </div>
    `;

    return;
  }


  allProducts =
    data || [];

  renderProducts(
    getVisibleProducts()
  );
}


// ============================================================
// GET VISIBLE PRODUCTS
// ============================================================

function getVisibleProducts() {

  let products =
    [...allProducts];


  // Category filter

  if (
    currentCategory &&
    currentCategory !== "All"
  ) {

    products =
      products.filter(
        product =>
          String(
            product.category || ""
          ).toLowerCase() ===
          String(
            currentCategory
          ).toLowerCase()
      );
  }


  // Search

  const searchInput =
    $("searchInput");

  const search =
    searchInput
      ?.value
      ?.toLowerCase()
      ?.trim() || "";


  if (search) {

    products =
      products.filter(
        product => {

          const name =
            String(
              product.name || ""
            ).toLowerCase();

          const description =
            String(
              product.description || ""
            ).toLowerCase();

          const category =
            String(
              product.category || ""
            ).toLowerCase();

          const campus =
            String(
              product.campus || ""
            ).toLowerCase();

          return (
            name.includes(search) ||
            description.includes(search) ||
            category.includes(search) ||
            campus.includes(search)
          );
        }
      );
  }


  // Sort

  if (
    currentSort === "price-low"
  ) {

    products.sort(
      (a, b) =>
        Number(a.price || 0) -
        Number(b.price || 0)
    );

  } else if (
    currentSort === "price-high"
  ) {

    products.sort(
      (a, b) =>
        Number(b.price || 0) -
        Number(a.price || 0)
    );

  } else {

    products.sort(
      (a, b) =>
        new Date(
          b.created_at || 0
        ) -
        new Date(
          a.created_at || 0
        )
    );
  }


  return products;
}


// ============================================================
// RENDER PRODUCTS
// ============================================================

function renderProducts(
  products
) {

  const grid =
    $("productGrid");

  if (!grid) {
    return;
  }


  if (!products.length) {

    grid.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">
          🔎
        </div>

        <h2>
          No products found
        </h2>

        <p>
          Try another search or category.
        </p>

        <button
          type="button"
          class="primary-button"
          onclick="clearFilters()"
        >
          Show all products
        </button>

      </div>
    `;

    updateProductTitle();

    return;
  }


  grid.innerHTML =
    products
      .map(product => {

        const images =
          Array.isArray(
            product.image_urls
          )
            ? product.image_urls
            : [];


        const image =
          images[0] ||
          "https://placehold.co/600x450?text=Cheal+Market";


        return `
          <article
            class="product-card"
            data-product-id="${product.id}"
          >

            <button
              type="button"
              class="save-button"
              data-action="save"
              data-product-id="${product.id}"
              aria-label="Save product"
            >
              ${
                isSaved(product.id)
                  ? "♥"
                  : "♡"
              }
            </button>


            <div
              class="product-image"
              data-action="open-product"
              data-product-id="${product.id}"
            >

              <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(
                  product.name
                )}"
                loading="lazy"
              >

            </div>


            <div
              class="product-info"
              data-action="open-product"
              data-product-id="${product.id}"
            >

              <h3>
                ${escapeHTML(
                  product.name
                )}
              </h3>

              <strong>
                ${formatPrice(
                  product.price
                )}
              </strong>

              <p>
                📍 ${escapeHTML(
                  product.campus ||
                  "Uganda"
                )}
              </p>

              <span>
                ${escapeHTML(
                  product.category ||
                  "Other"
                )}
              </span>

            </div>

          </article>
        `;
      })
      .join("");


  updateProductTitle();
}


// ============================================================
// PRODUCT TITLE
// ============================================================

function updateProductTitle() {

  const title =
    $("productSectionTitle");

  if (!title) {
    return;
  }


  const search =
    $("searchInput")
      ?.value
      ?.trim();


  if (
    currentCategory !== "All"
  ) {

    title.textContent =
      currentCategory;

  } else if (search) {

    title.textContent =
      `Results for "${search}"`;

  } else {

    title.textContent =
      "Latest listings";
  }
}


// ============================================================
// SEARCH
// ============================================================

function searchProducts() {

  const clearButton =
    $("clearSearch");

  const searchInput =
    $("searchInput");


  if (
    clearButton &&
    searchInput
  ) {

    clearButton.classList.toggle(
      "hidden",
      !searchInput.value
    );
  }


  currentCategory =
    "All";

  renderProducts(
    getVisibleProducts()
  );
}


function clearSearch() {

  const input =
    $("searchInput");

  if (input) {
    input.value = "";
  }

  const clear =
    $("clearSearch");

  if (clear) {
    clear.classList.add(
      "hidden"
    );
  }

  currentCategory =
    "All";

  renderProducts(
    getVisibleProducts()
  );
}


// ============================================================
// CATEGORY FILTER
// ============================================================

function filterCategory(
  category
) {

  currentCategory =
    category || "All";


  const searchInput =
    $("searchInput");

  if (searchInput) {
    searchInput.value = "";
  }


  const clear =
    $("clearSearch");

  if (clear) {
    clear.classList.add(
      "hidden"
    );
  }


  navigate("home");

  renderProducts(
    getVisibleProducts()
  );
}


// ============================================================
// CLEAR FILTERS
// ============================================================

function clearFilters() {

  currentCategory =
    "All";

  const input =
    $("searchInput");

  if (input) {
    input.value = "";
  }

  const clear =
    $("clearSearch");

  if (clear) {
    clear.classList.add(
      "hidden"
    );
  }

  renderProducts(
    getVisibleProducts()
  );
}


// ============================================================
// SORT
// ============================================================

function changeSort() {

  if (
    currentSort === "latest"
  ) {

    currentSort =
      "price-low";

  } else if (
    currentSort === "price-low"
  ) {

    currentSort =
      "price-high";

  } else {

    currentSort =
      "latest";
  }


  const button =
    $("sortButton");

  if (button) {

    if (
      currentSort === "price-low"
    ) {

      button.textContent =
        "Price ↑";

    } else if (
      currentSort === "price-high"
    ) {

      button.textContent =
        "Price ↓";

    } else {

      button.textContent =
        "Latest ▾";
    }
  }


  renderProducts(
    getVisibleProducts()
  );
}


// ============================================================
// SAVED SCREEN
// ============================================================

function renderSavedProducts() {

  const container =
    $("savedGrid");

  if (!container) {
    return;
  }


  const saved =
    getSavedProducts();


  const products =
    allProducts.filter(
      product =>
        saved.includes(
          Number(product.id)
        )
    );


  if (!products.length) {

    container.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">
          ♡
        </div>

        <h2>
          No saved items
        </h2>

        <p>
          Tap the heart on a product to save it here.
        </p>

        <button
          type="button"
          class="primary-button"
          data-route="home"
        >
          Browse products
        </button>

      </div>
    `;

    return;
  }


  container.innerHTML =
    products
      .map(product => {

        const images =
          Array.isArray(
            product.image_urls
          )
            ? product.image_urls
            : [];


        const image =
          images[0] ||
          "https://placehold.co/600x450?text=Cheal+Market";


        return `
          <article
            class="product-card"
          >

            <button
              type="button"
              class="save-button"
              data-action="save"
              data-product-id="${product.id}"
            >
              ♥
            </button>


            <div
              class="product-image"
              data-action="open-product"
              data-product-id="${product.id}"
            >

              <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(
                  product.name
                )}"
                loading="lazy"
              >

            </div>


            <div
              class="product-info"
              data-action="open-product"
              data-product-id="${product.id}"
            >

              <h3>
                ${escapeHTML(
                  product.name
                )}
              </h3>

              <strong>
                ${formatPrice(
                  product.price
                )}
              </strong>

              <p>
                📍 ${escapeHTML(
                  product.campus ||
                  "Uganda"
                )}
              </p>

              <span>
                ${escapeHTML(
                  product.category ||
                  "Other"
                )}
              </span>

            </div>

          </article>
        `;
      })
      .join("");
}


// ============================================================
// PRODUCT DETAILS
// ============================================================

function openProduct(
  productId,
  shouldNavigate = true
) {

  const product =
    allProducts.find(
      item =>
        Number(item.id) ===
        Number(productId)
    );


  if (!product) {
    showMessage(
      "Product could not be found."
    );
    return;
  }


  currentProduct =
    product;


  const container =
    $("productDetails");

  if (!container) {
    return;
  }


  const images =
    Array.isArray(
      product.image_urls
    )
      ? product.image_urls
      : [];


  const mainImage =
    images[0] ||
    "https://placehold.co/800x600?text=Cheal+Market";


  const gallery =
    images.length
      ? images
      : [mainImage];


  container.innerHTML = `

    <div class="page-header">

      <button
        type="button"
        class="back-button"
        data-route="home"
      >
        ← Back to products
      </button>

    </div>


    <div class="details-gallery">

      <img
        src="${escapeHTML(mainImage)}"
        alt="${escapeHTML(
          product.name
        )}"
      >

    </div>


    ${
      gallery.length > 1
        ? `
          <div class="image-preview-grid">

            ${gallery
              .map(
                image => `
                  <img
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(
                      product.name
                    )}"
                  >
                `
              )
              .join("")}

          </div>
        `
        : ""
    }


    <div class="details-content">

      <div class="details-header">

        <div>

          <span>
            ${escapeHTML(
              product.category ||
              "Other"
            )}
          </span>

          <h1>
            ${escapeHTML(
              product.name
            )}
          </h1>

          <h2>
            ${formatPrice(
              product.price
            )}
          </h2>

        </div>


        <button
          type="button"
          class="save-button large"
          data-action="save"
          data-product-id="${product.id}"
        >
          ${
            isSaved(product.id)
              ? "♥"
              : "♡"
          }
        </button>

      </div>


      <div class="details-meta">

        <p>
          📍 ${escapeHTML(
            product.campus ||
            "Uganda"
          )}
        </p>

        <p>
          🕒 Recently listed
        </p>

      </div>


      <div class="details-description">

        <h3>
          Description
        </h3>

        <p>
          ${escapeHTML(
            product.description ||
            "No description provided."
          )}
        </p>

      </div>


      ${
        currentUser &&
        product.seller_id ===
          currentUser.id

          ? `

            <button
              type="button"
              class="secondary-button"
              data-route="my-listings"
            >
              📦 My listing
            </button>

          `

          : `

            <button
              type="button"
              class="primary-button full-button"
              data-action="chat-seller"
              data-product-id="${product.id}"
            >
              💬 Chat with seller
            </button>

          `
      }

    </div>
  `;


  if (shouldNavigate) {
    navigate("product");
  }
}


// ============================================================
// IMAGE SELECTION
// ============================================================

function handleImageSelection(
  event
) {

  const files =
    Array.from(
      event.target.files || []
    );


  if (!files.length) {
    return;
  }


  if (files.length > 5) {

    showMessage(
      "You can upload a maximum of 5 images."
    );

    event.target.value =
      "";

    return;
  }


  for (
    const file of files
  ) {

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {

      showMessage(
        "Only image files are allowed."
      );

      event.target.value =
        "";

      return;
    }


    if (
      file.size >
      10 * 1024 * 1024
    ) {

      showMessage(
        "Each image must be 10 MB or smaller."
      );

      event.target.value =
        "";

      return;
    }
  }


  selectedImages =
    files;


  renderImagePreviews();
}


// ============================================================
// IMAGE PREVIEWS
// ============================================================

function renderImagePreviews() {

  const container =
    $("imagePreview");

  if (!container) {
    return;
  }


  container.innerHTML =
    "";


  selectedImages.forEach(
    (file, index) => {

      const reader =
        new FileReader();


      reader.onload =
        event => {

          const wrapper =
            document.createElement(
              "div"
            );

          wrapper.className =
            "image-preview-item";


          wrapper.innerHTML = `

            <img
              src="${event.target.result}"
              alt="Product image ${index + 1}"
            >

            <button
              type="button"
              class="image-remove-button"
              data-action="remove-image"
              data-image-index="${index}"
              aria-label="Remove image"
            >
              ×
            </button>

          `;


          container.appendChild(
            wrapper
          );
        };


      reader.readAsDataURL(file);
    }
  );
}


// ============================================================
// REMOVE SELECTED IMAGE
// ============================================================

function removeSelectedImage(
  index
) {

  selectedImages =
    selectedImages.filter(
      (_, i) =>
        i !== Number(index)
    );


  const input =
    $("productImages");

  if (input) {
    input.value = "";
  }


  renderImagePreviews();
}


// ============================================================
// UPLOAD PRODUCT IMAGES
// ============================================================

async function uploadProductImages(
  userId
) {

  const urls = [];


  for (
    const file of selectedImages
  ) {

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() ||
      "jpg";


    const fileName =
      `${userId}/${crypto.randomUUID()}.${extension}`;


    const {
      error
    } =
      await supabaseClient.storage
        .from(BUCKET_NAME)
        .upload(
          fileName,
          file,
          {
            cacheControl:
              "3600",
            upsert:
              false,
            contentType:
              file.type
          }
        );


    if (error) {
      throw error;
    }


    const {
      data
    } =
      supabaseClient.storage
        .from(BUCKET_NAME)
        .getPublicUrl(
          fileName
        );


    urls.push(
      data.publicUrl
    );
  }


  return urls;
}


// ============================================================
// SELL PRODUCT
// ============================================================

async function submitProduct(
  event
) {

  event.preventDefault();


  if (!currentUser) {

    openAuth("login");

    return;
  }


  const name =
    $("productName")
      ?.value
      ?.trim();


  const price =
    $("productPrice")
      ?.value;


  const category =
    $("productCategory")
      ?.value;


  const campus =
    $("productCampus")
      ?.value
      ?.trim();


  const description =
    $("productDescription")
      ?.value
      ?.trim();


  if (
    !name ||
    !price ||
    !category ||
    !campus
  ) {

    showMessage(
      "Please complete all required fields."
    );

    return;
  }


  const button =
    event.submitter;


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "Publishing...";
  }


  try {

    let imageUrls = [];


    if (
      selectedImages.length
    ) {

      imageUrls =
        await uploadProductImages(
          currentUser.id
        );
    }


    const {
      error
    } =
      await supabaseClient
        .from("products")
        .insert({

          name,

          price:
            Number(price),

          category,

          campus,

          description,

          seller_id:
            currentUser.id,

          image_urls:
            imageUrls

        });


    if (error) {
      throw error;
    }


    showMessage(
      "Your product has been listed successfully!"
    );


    event.target.reset();


    selectedImages =
      [];


    renderImagePreviews();


    await loadProducts();


    navigate("home");


  } catch (error) {

    console.error(
      "Product publishing error:",
      error
    );


    showMessage(
      `Unable to publish product: ${error.message}`
    );


  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        "Publish listing";
    }
  }
}


// ============================================================
// AUTH MODAL
// ============================================================

let authMode =
  "login";


function openAuth(
  mode = "login"
) {

  authMode =
    mode;


  const overlay =
    $("authOverlay");

  if (!overlay) {
    return;
  }


  overlay.classList.remove(
    "hidden"
  );


  const signupFields =
    $("signupFields");

  const title =
    $("authTitle");

  const subtitle =
    $("authSubtitle");

  const submitText =
    $("authSubmitText");

  const switchButton =
    $("authSwitch");

  const message =
    $("authMessage");


  if (message) {
    message.textContent =
      "";
  }


  if (
    mode === "signup"
  ) {

    if (signupFields) {
      signupFields.classList.remove(
        "hidden"
      );
    }


    if (title) {
      title.textContent =
        "Create your account";
    }


    if (subtitle) {
      subtitle.textContent =
        "Join Cheal Market and start buying or selling.";
    }


    if (submitText) {
      submitText.textContent =
        "Create account";
    }


    if (switchButton) {
      switchButton.innerHTML =
        "Already have an account? <strong>Sign in</strong>";
    }


  } else {

    if (signupFields) {
      signupFields.classList.add(
        "hidden"
      );
    }


    if (title) {
      title.textContent =
        "Welcome to Cheal Market";
    }


    if (subtitle) {
      subtitle.textContent =
        "Sign in to buy, sell and chat.";
    }


    if (submitText) {
      submitText.textContent =
        "Sign in";
    }


    if (switchButton) {
      switchButton.innerHTML =
        "Don't have an account? <strong>Sign up</strong>";
    }
  }
}


function closeAuth() {

  const overlay =
    $("authOverlay");

  if (overlay) {

    overlay.classList.add(
      "hidden"
    );
  }
}


function switchAuth() {

  if (
    authMode === "login"
  ) {

    openAuth("signup");

  } else {

    openAuth("login");
  }
}


// ============================================================
// AUTH FORM
// ============================================================

async function handleAuthSubmit(
  event
) {

  event.preventDefault();


  if (
    authMode === "signup"
  ) {

    await signUp(
      event
    );

  } else {

    await signIn(
      event
    );
  }
}


// ============================================================
// SIGN UP
// ============================================================

async function signUp(
  event
) {

  const fullName =
    $("authName")
      ?.value
      ?.trim();


  const campus =
    $("authCampus")
      ?.value
      ?.trim();


  const email =
    $("authEmail")
      ?.value
      ?.trim();


  const password =
    $("authPassword")
      ?.value;


  const message =
    $("authMessage");


  if (
    !fullName ||
    !email ||
    !password
  ) {

    if (message) {
      message.textContent =
        "Please complete all required fields.";
    }

    return;
  }


  if (
    password.length < 6
  ) {

    if (message) {
      message.textContent =
        "Password must contain at least 6 characters.";
    }

    return;
  }


  const submit =
    $("authSubmitText");


  if (submit) {
    submit.textContent =
      "Creating account...";
  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth
        .signUp({

          email,

          password,

          options: {

            data: {

              full_name:
                fullName,

              campus:
                campus || null
            }
          }
        });


    if (error) {
      throw error;
    }


    if (!data.user) {
      throw new Error(
        "Account could not be created."
      );
    }


    if (data.session) {

      currentUser =
        data.user;

      await loadCurrentProfile();

      closeAuth();

      updateAccountScreen();

      navigate("account");

      showMessage(
        "Account created successfully!"
      );


    } else {

      if (message) {
        message.textContent =
          "Account created. If email confirmation is enabled, check your email before signing in.";
      }
    }


  } catch (error) {

    console.error(
      "Signup error:",
      error
    );


    if (message) {
      message.textContent =
        error.message;
    }


  } finally {

    if (submit) {

      submit.textContent =
        authMode === "signup"
          ? "Create account"
          : "Sign in";
    }
  }
}


// ============================================================
// SIGN IN
// ============================================================

async function signIn(
  event
) {

  const email =
    $("authEmail")
      ?.value
      ?.trim();


  const password =
    $("authPassword")
      ?.value;


  const message =
    $("authMessage");


  if (
    !email ||
    !password
  ) {

    if (message) {
      message.textContent =
        "Enter your email and password.";
    }

    return;
  }


  const submit =
    $("authSubmitText");


  if (submit) {
    submit.textContent =
      "Signing in...";
  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth
        .signInWithPassword({

          email,

          password
        });


    if (error) {
      throw error;
    }


    currentUser =
      data.user;


    await loadCurrentProfile();


    closeAuth();


    updateAccountScreen();


    navigate("account");


    showMessage(
      "Welcome back!"
    );


  } catch (error) {

    console.error(
      "Login error:",
      error
    );


    if (message) {
      message.textContent =
        error.message;
    }


  } finally {

    if (submit) {
      submit.textContent =
        "Sign in";
    }
  }
}


// ============================================================
// LOAD CURRENT USER
// ============================================================

async function loadCurrentUser() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth
        .getUser();


    if (error) {

      currentUser =
        null;

      currentProfile =
        null;

      return;
    }


    currentUser =
      data.user || null;


    if (currentUser) {
      await loadCurrentProfile();
    } else {
      currentProfile =
        null;
    }


  } catch (error) {

    console.error(
      "Current user error:",
      error
    );

    currentUser =
      null;

    currentProfile =
      null;
  }
}


// ============================================================
// LOAD PROFILE
// ============================================================

async function loadCurrentProfile() {

  if (!currentUser) {
    return;
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select("*")
      .eq(
        "id",
        currentUser.id
      )
      .maybeSingle();


  if (error) {

    console.error(
      "Profile error:",
      error
    );

    return;
  }


  currentProfile =
    data;
}


// ============================================================
// ACCOUNT SCREEN
// ============================================================

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

    if (loggedOut) {
      loggedOut.classList.remove(
        "hidden"
      );
    }

    if (loggedIn) {
      loggedIn.classList.add(
        "hidden"
      );
    }

    if (name) {
      name.textContent =
        "Welcome";
    }

    if (email) {
      email.textContent =
        "Sign in to manage your account.";
    }

    if (avatar) {
      avatar.textContent =
        "M";
    }

    return;
  }


  if (loggedOut) {
    loggedOut.classList.add(
      "hidden"
    );
  }

  if (loggedIn) {
    loggedIn.classList.remove(
      "hidden"
    );
  }


  const fullName =
    currentProfile?.full_name ||
    currentUser.email ||
    "Cheal Market User";


  if (name) {
    name.textContent =
      fullName;
  }


  if (email) {
    email.textContent =
      currentUser.email ||
      "";
  }


  if (avatar) {

    avatar.textContent =
      fullName
        .charAt(0)
        .toUpperCase();
  }
}


// ============================================================
// ACCOUNT LOGIN BUTTON
// ============================================================

function handleAccountLogin() {

  openAuth("login");
}


// ============================================================
// SETTINGS
// ============================================================

function openSettings() {

  if (!currentUser) {

    openAuth("login");

    return;
  }


  showMessage(
    "Account settings will be added here."
  );
}


// ============================================================
// LOGOUT
// ============================================================

async function logout() {

  try {

    const {
      error
    } =
      await supabaseClient.auth
        .signOut();


    if (error) {
      throw error;
    }


    currentUser =
      null;

    currentProfile =
      null;

    currentConversation =
      null;


    if (messageChannel) {

      await supabaseClient
        .removeChannel(
          messageChannel
        );

      messageChannel =
        null;
    }


    updateAccountScreen();


    navigate("home");


    showMessage(
      "You have been signed out."
    );


  } catch (error) {

    console.error(
      "Logout error:",
      error
    );


    showMessage(
      `Logout failed: ${error.message}`
    );
  }
}


// ============================================================
// MY LISTINGS
// ============================================================

async function loadMyListings() {

  const container =
    $("myListingsGrid");


  if (!container) {
    return;
  }


  if (!currentUser) {

    container.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          👤
        </div>

        <h2>
          Sign in required
        </h2>

        <p>
          Sign in to see your listings.
        </p>

        <button
          type="button"
          class="primary-button"
          data-action="login"
        >
          Sign in
        </button>

      </div>

    `;

    return;
  }


  container.innerHTML = `

    <div class="loading-card">

      <div class="spinner"></div>

      <p>
        Loading your listings...
      </p>

    </div>

  `;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("products")
      .select("*")
      .eq(
        "seller_id",
        currentUser.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    container.innerHTML = `

      <div class="empty-state">

        <h2>
          Unable to load listings
        </h2>

        <p>
          ${escapeHTML(
            error.message
          )}
        </p>

      </div>

    `;

    return;
  }


  if (!data?.length) {

    container.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          📦
        </div>

        <h2>
          No listings yet
        </h2>

        <p>
          Products you sell will appear here.
        </p>

        <button
          type="button"
          class="primary-button"
          data-route="sell"
        >
          Sell an item
        </button>

      </div>

    `;

    return;
  }


  container.innerHTML =
    data
      .map(product => {

        const images =
          Array.isArray(
            product.image_urls
          )
            ? product.image_urls
            : [];


        const image =
          images[0] ||
          "https://placehold.co/600x450?text=Cheal+Market";


        return `

          <article
            class="product-card"
          >

            <div
              class="product-image"
              data-action="open-product"
              data-product-id="${product.id}"
            >

              <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(
                  product.name
                )}"
                loading="lazy"
              >

            </div>


            <div
              class="product-info"
              data-action="open-product"
              data-product-id="${product.id}"
            >

              <h3>
                ${escapeHTML(
                  product.name
                )}
              </h3>

              <strong>
                ${formatPrice(
                  product.price
                )}
              </strong>

              <p>
                📍 ${escapeHTML(
                  product.campus ||
                  "Uganda"
                )}
              </p>

              <span>
                ${escapeHTML(
                  product.category ||
                  "Other"
                )}
              </span>

            </div>

          </article>

        `;
      })
      .join("");
}


// ============================================================
// START CHAT WITH SELLER
// ============================================================

async function startChatWithSeller(
  productId
) {

  if (!currentUser) {

    openAuth("login");

    return;
  }


  const product =
    allProducts.find(
      item =>
        Number(item.id) ===
        Number(productId)
    );


  if (!product) {
    showMessage(
      "Product not found."
    );

    return;
  }


  if (
    product.seller_id ===
    currentUser.id
  ) {

    showMessage(
      "You cannot chat with yourself."
    );

    return;
  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("conversations")
        .upsert(
          {

            buyer_id:
              currentUser.id,

            seller_id:
              product.seller_id,

            product_id:
              product.id

          },
          {

            onConflict:
              "buyer_id,seller_id,product_id",

            ignoreDuplicates:
              false

          }
        )
        .select()
        .single();


    if (error) {
      throw error;
    }


    currentConversation =
      data;


    await openConversation(
      data.id
    );


  } catch (error) {

    console.error(
      "Chat error:",
      error
    );


    showMessage(
      `Unable to start chat: ${error.message}`
    );
  }
}


// ============================================================
// LOAD CONVERSATIONS
// ============================================================

async function loadConversations() {

  const container =
    $("conversationList");


  if (!container) {
    return;
  }


  if (!currentUser) {

    container.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          👤
        </div>

        <h2>
          Sign in to view messages
        </h2>

        <p>
          Your private conversations will appear here.
        </p>

        <button
          type="button"
          class="primary-button"
          data-action="login"
        >
          Sign in
        </button>

      </div>

    `;

    return;
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("conversations")
      .select("*")
      .or(
        `buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Conversation error:",
      error
    );


    container.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          ⚠️
        </div>

        <h2>
          Unable to load messages
        </h2>

        <p>
          ${escapeHTML(
            error.message
          )}
        </p>

      </div>

    `;

    return;
  }


  if (!data?.length) {

    container.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          💬
        </div>

        <h2>
          No conversations yet
        </h2>

        <p>
          When you message a seller, your conversation will appear here.
        </p>

        <button
          type="button"
          class="primary-button"
          data-route="home"
        >
          Find products
        </button>

      </div>

    `;

    return;
  }


  const rows = [];


  for (
    const conversation of data
  ) {

    const otherUserId =
      conversation.buyer_id ===
      currentUser.id

        ? conversation.seller_id

        : conversation.buyer_id;


    const {
      data: profile
    } =
      await supabaseClient
        .from("profiles")
        .select(
          "full_name,campus"
        )
        .eq(
          "id",
          otherUserId
        )
        .maybeSingle();


    const product =
      allProducts.find(
        item =>
          Number(item.id) ===
          Number(
            conversation.product_id
          )
      );


    rows.push({

      conversation,

      profile,

      product

    });
  }


  container.innerHTML =
    rows
      .map(
        ({
          conversation,
          profile,
          product
        }) => {

          const initial =
            (
              profile?.full_name ||
              "U"
            )
              .charAt(0)
              .toUpperCase();


          return `

            <button
              type="button"
              class="conversation-item"
              data-action="open-conversation"
              data-conversation-id="${conversation.id}"
            >

              <div
                class="conversation-avatar"
              >
                ${escapeHTML(
                  initial
                )}
              </div>


              <div>

                <strong>
                  ${escapeHTML(
                    profile?.full_name ||
                    "User"
                  )}
                </strong>

                <span>
                  ${
                    product
                      ? escapeHTML(
                          product.name
                        )
                      : escapeHTML(
                          profile?.campus ||
                          ""
                        )
                  }
                </span>

              </div>

            </button>

          `;
        }
      )
      .join("");
}


// ============================================================
// OPEN CONVERSATION
// ============================================================

async function openConversation(
  conversationId
) {

  if (!currentUser) {

    openAuth("login");

    return;
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("conversations")
      .select("*")
      .eq(
        "id",
        conversationId
      )
      .single();


  if (error) {

    showMessage(
      `Unable to open conversation: ${error.message}`
    );

    return;
  }


  currentConversation =
    data;


  const otherUserId =
    data.buyer_id ===
    currentUser.id

      ? data.seller_id

      : data.buyer_id;


  const {
    data: profile
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "full_name,campus"
      )
      .eq(
        "id",
        otherUserId
      )
      .maybeSingle();


  const chatName =
    $("chatName");


  if (chatName) {

    chatName.textContent =
      profile?.full_name ||
      "User";
  }


  const chatProduct =
    $("chatProduct");


  if (chatProduct) {

    const product =
      allProducts.find(
        item =>
          Number(item.id) ===
          Number(
            data.product_id
          )
      );


    chatProduct.textContent =
      product?.name || "";
  }


  await loadMessages(
    conversationId
  );


  navigate("chat");


  subscribeToMessages(
    conversationId
  );
}


// ============================================================
// LOAD MESSAGES
// ============================================================

async function loadMessages(
  conversationId
) {

  const container =
    $("chatMessages");


  if (!container) {
    return;
  }


  container.innerHTML = `

    <div class="empty-state">

      <div class="spinner"></div>

      <p>
        Loading messages...
      </p>

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
      .order(
        "created_at",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(
      "Messages error:",
      error
    );


    container.innerHTML = `

      <div class="empty-state">

        <h2>
          Unable to load messages
        </h2>

        <p>
          ${escapeHTML(
            error.message
          )}
        </p>

      </div>

    `;

    return;
  }


  renderMessages(
    data || []
  );
}


// ============================================================
// RENDER MESSAGES
// ============================================================

function renderMessages(
  messages
) {

  const container =
    $("chatMessages");


  if (!container) {
    return;
  }


  if (!messages.length) {

    container.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          💬
        </div>

        <p>
          Start the conversation.
        </p>

      </div>

    `;

    return;
  }


  container.innerHTML =
    messages
      .map(message => {

        const mine =
          message.sender_id ===
          currentUser?.id;


        return `

          <div
            class="
              message-row
              ${mine ? "mine" : "theirs"}
            "
          >

            <div
              class="message-bubble"
            >
              ${escapeHTML(
                message.message
              )}
            </div>

          </div>

        `;
      })
      .join("");


  container.scrollTop =
    container.scrollHeight;
}


// ============================================================
// SEND MESSAGE
// ============================================================

async function sendMessage(
  event
) {

  event.preventDefault();


  if (
    !currentUser ||
    !currentConversation
  ) {

    if (!currentUser) {
      openAuth("login");
    }

    return;
  }


  const input =
    $("chatInput");


  if (!input) {
    return;
  }


  const message =
    input.value.trim();


  if (!message) {
    return;
  }


  const sendButton =
    event.submitter;


  if (sendButton) {
    sendButton.disabled =
      true;
  }


  try {

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

          message

        });


    if (error) {
      throw error;
    }


    input.value = "";


    await loadMessages(
      currentConversation.id
    );


  } catch (error) {

    console.error(
      "Send message error:",
      error
    );


    showMessage(
      `Message failed: ${error.message}`
    );


  } finally {

    if (sendButton) {
      sendButton.disabled =
        false;
    }
  }
}


// ============================================================
// REALTIME CHAT
// ============================================================

function subscribeToMessages(
  conversationId
) {

  if (messageChannel) {

    supabaseClient
      .removeChannel(
        messageChannel
      );

    messageChannel =
      null;
  }


  messageChannel =
    supabaseClient
      .channel(
        `cheal-chat-${conversationId}-${Date.now()}`
      )
      .on(
        "postgres_changes",
        {

          event:
            "INSERT",

          schema:
            "public",

          table:
            "messages",

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


// ============================================================
// MENU
// ============================================================

function openMenu() {

  const overlay =
    $("menuOverlay");


  if (!overlay) {
    return;
  }


  overlay.classList.remove(
    "hidden"
  );


  const button =
    $("menuButton");


  if (button) {
    button.setAttribute(
      "aria-expanded",
      "true"
    );
  }
}


function closeMenu() {

  const overlay =
    $("menuOverlay");


  if (!overlay) {
    return;
  }


  overlay.classList.add(
    "hidden"
  );


  const button =
    $("menuButton");


  if (button) {
    button.setAttribute(
      "aria-expanded",
      "false"
    );
  }
}


function toggleMenu() {

  const overlay =
    $("menuOverlay");


  if (
    overlay?.classList.contains(
      "hidden"
    )
  ) {

    openMenu();

  } else {

    closeMenu();
  }
}


// ============================================================
// LOCATION
// ============================================================

function handleLocation() {

  showMessage(
    "Location selection will be added next. Your current marketplace location is Kampala."
  );
}


// ============================================================
// EVENT DELEGATION
// ============================================================
//
// This is important.
// Instead of relying on hundreds of individual onclick
// attributes, one listener handles the touch/click controls.
// It works on iPhone, Android and desktop.
// ============================================================

function setupGlobalEvents() {

  document.addEventListener(
    "click",
    async event => {

      const routeElement =
        event.target.closest(
          "[data-route]"
        );


      if (routeElement) {

        event.preventDefault();

        const route =
          routeElement.dataset.route;

        navigate(route);

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


      // Save

      if (
        action === "save"
      ) {

        event.preventDefault();

        toggleSaved(
          actionElement.dataset.productId
        );

        return;
      }


      // Open product

      if (
        action === "open-product"
      ) {

        event.preventDefault();

        openProduct(
          actionElement.dataset.productId
        );

        return;
      }


      // Chat seller

      if (
        action === "chat-seller"
      ) {

        event.preventDefault();

        await startChatWithSeller(
          actionElement.dataset.productId
        );

        return;
      }


      // Open conversation

      if (
        action ===
        "open-conversation"
      ) {

        event.preventDefault();

        await openConversation(
          actionElement.dataset.conversationId
        );

        return;
      }


      // Remove image

      if (
        action ===
        "remove-image"
      ) {

        event.preventDefault();

        removeSelectedImage(
          actionElement.dataset.imageIndex
        );

        return;
      }


      // Login

      if (
        action === "login"
      ) {

        event.preventDefault();

        openAuth("login");

        return;
      }

    }
  );


  // Menu

  const menuButton =
    $("menuButton");


  if (menuButton) {

    menuButton.addEventListener(
      "click",
      toggleMenu
    );
  }


  // Close menu

  const closeMenuButton =
    $("closeMenu");


  if (closeMenuButton) {

    closeMenuButton.addEventListener(
      "click",
      closeMenu
    );
  }


  // Close menu by tapping outside

  const menuOverlay =
    $("menuOverlay");


  if (menuOverlay) {

    menuOverlay.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          menuOverlay
        ) {
          closeMenu();
        }

      }
    );
  }


  // Top account

  const topAccount =
    $("topAccountButton");


  if (topAccount) {

    topAccount.addEventListener(
      "click",
      () => navigate("account")
    );
  }


  // Location

  const locationButton =
    $("locationButton");


  if (locationButton) {

    locationButton.addEventListener(
      "click",
      handleLocation
    );
  }


  // Search

  const searchInput =
    $("searchInput");


  if (searchInput) {

    searchInput.addEventListener(
      "input",
      searchProducts
    );
  }


  // Clear search

  const clearButton =
    $("clearSearch");


  if (clearButton) {

    clearButton.addEventListener(
      "click",
      clearSearch
    );
  }


  // Sort

  const sortButton =
    $("sortButton");


  if (sortButton) {

    sortButton.addEventListener(
      "click",
      changeSort
    );
  }


  // Category buttons

  document
    .querySelectorAll(
      ".category-card"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          filterCategory(
            button.dataset.category
          );

        }
      );

    });


  // Auth

  const authForm =
    $("authForm");


  if (authForm) {

    authForm.addEventListener(
      "submit",
      handleAuthSubmit
    );
  }


  // Close auth

  const closeAuthButton =
    $("closeAuth");


  if (closeAuthButton) {

    closeAuthButton.addEventListener(
      "click",
      closeAuth
    );
  }


  // Auth switch

  const authSwitch =
    $("authSwitch");


  if (authSwitch) {

    authSwitch.addEventListener(
      "click",
      switchAuth
    );
  }


  // Close auth when tapping outside

  const authOverlay =
    $("authOverlay");


  if (authOverlay) {

    authOverlay.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          authOverlay
        ) {

          closeAuth();
        }

      }
    );
  }


  // Account login

  const accountLogin =
    $("accountLoginButton");


  if (accountLogin) {

    accountLogin.addEventListener(
      "click",
      () => openAuth("login")
    );
  }


  // Settings

  const settings =
    $("settingsButton");


  if (settings) {

    settings.addEventListener(
      "click",
      openSettings
    );
  }


  // Logout

  const logoutButton =
    $("logoutButton");


  if (logoutButton) {

    logoutButton.addEventListener(
      "click",
      logout
    );
  }


  // Sell form

  const sellForm =
    $("sellForm");


  if (sellForm) {

    sellForm.addEventListener(
      "submit",
      submitProduct
    );
  }


  // Image upload

  const imageInput =
    $("productImages");


  if (imageInput) {

    imageInput.addEventListener(
      "change",
      handleImageSelection
    );
  }


  // Chat form

  const chatForm =
    $("chatForm");


  if (chatForm) {

    chatForm.addEventListener(
      "submit",
      sendMessage
    );
  }
}


// ============================================================
// KEYBOARD / ESCAPE
// ============================================================

function setupEscapeKey() {

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key !==
        "Escape"
      ) {
        return;
      }


      closeMenu();

      closeAuth();
    }
  );
}


// ============================================================
// AUTH STATE LISTENER
// ============================================================

function setupAuthListener() {

  supabaseClient.auth.onAuthStateChange(
    (event, session) => {

      currentUser =
        session?.user ||
        null;


      if (!currentUser) {

        currentProfile =
          null;

      } else {

        // Load profile without blocking
        // the auth callback.

        loadCurrentProfile()
          .then(() => {

            updateAccountScreen();

          })
          .catch(error => {

            console.error(
              "Profile loading error:",
              error
            );

          });
      }


      updateAccountScreen();
    }
  );
}


// ============================================================
// START APPLICATION
// ============================================================

async function startApp() {

  console.log(
    "Cheal Market starting..."
  );


  setupGlobalEvents();

  setupEscapeKey();

  setupAuthListener();


  await loadCurrentUser();


  updateAccountScreen();


  let initialScreen =
    window.location.hash
      .replace("#", "")
      .trim();


  if (!initialScreen) {
    initialScreen =
      "home";
  }


  showScreen(
    initialScreen
  );


  await loadProducts();


  console.log(
    "Cheal Market ready."
  );
}


// ============================================================
// HASH CHANGE
// ============================================================

window.addEventListener(
  "hashchange",
  handleHashChange
);


// ============================================================
// START WHEN PAGE LOADS
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  startApp
);


// ============================================================
// EXPOSE FUNCTIONS
// ============================================================

window.navigate =
  navigate;

window.showScreen =
  showScreen;

window.openAuth =
  openAuth;

window.closeAuth =
  closeAuth;

window.switchAuth =
  switchAuth;

window.logout =
  logout;

window.toggleSaved =
  toggleSaved;

window.openProduct =
  openProduct;

window.filterCategory =
  filterCategory;

window.clearSearch =
  clearSearch;

window.clearFilters =
  clearFilters;

window.changeSort =
  changeSort;

window.startChatWithSeller =
  startChatWithSeller;

window.openConversation =
  openConversation;

window.openMenu =
  openMenu;

window.closeMenu =
  closeMenu;

window.toggleMenu =
  toggleMenu;

window.loadProducts =
  loadProducts;

window.loadConversations =
  loadConversations;

window.loadMyListings =
  loadMyListings;

window.sendMessage =
  sendMessage;

window.handleImageSelection =
  handleImageSelection;

window.removeSelectedImage =
  removeSelectedImage;

window.updateAccountScreen =
  updateAccountScreen;
