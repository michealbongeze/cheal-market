/* =========================================================
   CHEAL MARKET
   REAL MULTI-USER MARKETPLACE
   Supabase Products + Private Chats + Real-Time Messages
========================================================= */


/* =========================================================
   SUPABASE CONFIGURATION
========================================================= */

const SUPABASE_URL =
  "https://qwlklqjfbrhythpynghr.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_HVAjJNZAQIiyf1AosvH0A_fnYoFpHx";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;
let currentProfile = null;

let products = [];
let conversations = [];

let activeConversation = null;
let activeProduct = null;

let messagesChannel = null;

const renderedMessageIds = new Set();


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (selector) => document.querySelector(selector);

const searchInput = $("#search");
const searchButton = $("#searchButton");
const productsContainer = $("#products");
const categoryContainer = $("#cats");
const sortSelect = $("#sort");

const sellForm = $("#sellForm");

const chatContainer = $("#messages");
const chatForm = $("#chatForm");
const messageInput = $("#message");

const modal = $("#modal");
const modalTitle = $("#modalTitle");
const authForm = $("#auth");

const closeModal = $("#close");

const authName = $("#authName");
const authEmail = $("#authEmail");
const authPassword = $("#authPassword");
const authCampus = $("#authCampus");

const authSubmit = $("#authSubmit");
const authMessage = $("#authMessage");

const signupButton = $("#signup");
const loginButton = $("#login");


/* =========================================================
   SAFE TEXT
========================================================= */

function escapeHTML(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   PRICE FORMAT
========================================================= */

function formatPrice(price) {
  const number = Number(price || 0);

  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0
  }).format(number);
}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(date) {
  if (!date) {
    return "";
  }

  return new Date(date).toLocaleString("en-UG", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}


/* =========================================================
   AUTH USER
========================================================= */

async function getCurrentUser() {
  const {
    data,
    error
  } = await supabaseClient.auth.getUser();

  if (error) {
    console.error("Could not get user:", error);
    currentUser = null;
    return null;
  }

  currentUser = data.user || null;

  window.chealCurrentUser = currentUser;

  return currentUser;
}


/* =========================================================
   LOAD CURRENT PROFILE
========================================================= */

async function loadCurrentProfile() {
  if (!currentUser) {
    currentProfile = null;
    return null;
  }

  const {
    data,
    error
  } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error) {
    console.error("Profile loading error:", error);
    currentProfile = null;
    return null;
  }

  currentProfile = data;

  return currentProfile;
}


/* =========================================================
   AUTH UI
========================================================= */

function updateAuthUI() {
  const user = currentUser;

  const loginElements =
    document.querySelectorAll("#login");

  loginElements.forEach((element) => {
    if (user) {
      const name =
        currentProfile?.full_name ||
        user.user_metadata?.full_name ||
        user.email ||
        "Account";

      element.textContent = name;
      element.dataset.loggedIn = "true";
    } else {
      element.textContent = "Sign in";
      element.dataset.loggedIn = "false";
    }
  });

  const sellButton =
    document.querySelector(".sellHeaderButton");

  if (sellButton) {
    sellButton.textContent = user
      ? "＋ Sell"
      : "Sign in to Sell";
  }
}


/* =========================================================
   OPEN AUTH MODAL
========================================================= */

function openAuth(mode = "login") {
  if (!modal) {
    return;
  }

  modal.classList.add("show");

  if (modalTitle) {
    modalTitle.textContent =
      mode === "signup"
        ? "Create your account"
        : "Welcome back";
  }

  if (authMessage) {
    authMessage.textContent = "";
  }

  if (authName) {
    authName.style.display =
      mode === "signup" ? "block" : "none";
  }

  if (authCampus) {
    authCampus.style.display =
      mode === "signup" ? "block" : "none";
  }

  if (authSubmit) {
    authSubmit.textContent =
      mode === "signup"
        ? "Create Account"
        : "Sign In";
  }

  if (authForm) {
    authForm.dataset.mode = mode;
  }
}


/* =========================================================
   CLOSE AUTH MODAL
========================================================= */

function closeAuth() {
  if (!modal) {
    return;
  }

  modal.classList.remove("show");

  if (authMessage) {
    authMessage.textContent = "";
  }

  if (authForm) {
    authForm.reset();
  }
}


/* =========================================================
   SIGN UP / LOGIN
========================================================= */

async function handleAuthSubmit(event) {
  event.preventDefault();

  const mode =
    authForm?.dataset.mode || "login";

  const email =
    authEmail?.value.trim() || "";

  const password =
    authPassword?.value || "";

  const fullName =
    authName?.value.trim() || "";

  const campus =
    authCampus?.value.trim() || "";

  if (!email || !password) {
    if (authMessage) {
      authMessage.textContent =
        "Please enter your email and password.";
    }

    return;
  }

  if (authSubmit) {
    authSubmit.disabled = true;
    authSubmit.textContent =
      mode === "signup"
        ? "Creating account..."
        : "Signing in...";
  }

  if (authMessage) {
    authMessage.textContent = "";
  }

  try {
    if (mode === "signup") {
      const {
        data,
        error
      } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            campus: campus
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        currentUser = data.user;

        await loadCurrentProfile();

        updateAuthUI();

        closeAuth();

        await loadProducts();

        await loadConversations();

        alert("Account created successfully.");
      } else {
        if (authMessage) {
          authMessage.textContent =
            "Account created. Please check your email to confirm your account, then sign in.";
        }
      }

    } else {
      const {
        data,
        error
      } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      currentUser = data.user;

      await loadCurrentProfile();

      updateAuthUI();

      closeAuth();

      await loadProducts();

      await loadConversations();

      alert("Welcome back!");
    }

  } catch (error) {
    console.error("Authentication error:", error);

    if (authMessage) {
      authMessage.textContent =
        error.message ||
        "Authentication failed.";
    }

  } finally {
    if (authSubmit) {
      authSubmit.disabled = false;

      authSubmit.textContent =
        mode === "signup"
          ? "Create Account"
          : "Sign In";
    }
  }
}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {
  try {
    await supabaseClient.auth.signOut();
  } catch (error) {
    console.error("Logout error:", error);
  }

  currentUser = null;
  currentProfile = null;

  activeConversation = null;
  activeProduct = null;

  conversations = [];

  renderedMessageIds.clear();

  if (messagesChannel) {
    await supabaseClient.removeChannel(messagesChannel);
    messagesChannel = null;
  }

  if (chatContainer) {
    chatContainer.innerHTML =
      "<p>Select a conversation to start chatting.</p>";
  }

  updateAuthUI();
}


/* =========================================================
   AUTH BUTTONS
========================================================= */

if (signupButton) {
  signupButton.addEventListener("click", () => {
    openAuth("signup");
  });
}

if (loginButton) {
  loginButton.addEventListener("click", async () => {
    if (currentUser) {
      await logout();
      return;
    }

    openAuth("login");
  });
}

if (closeModal) {
  closeModal.addEventListener("click", closeAuth);
}

if (authForm) {
  authForm.addEventListener(
    "submit",
    handleAuthSubmit
  );
}


/* =========================================================
   LOAD REAL PRODUCTS
========================================================= */

async function loadProducts() {
  if (!productsContainer) {
    return;
  }

  productsContainer.innerHTML =
    "<p>Loading products...</p>";

  const {
    data,
    error
  } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error("Products loading error:", error);

    productsContainer.innerHTML =
      "<p>Unable to load products right now.</p>";

    return;
  }

  products = data || [];

  renderProducts();
}


/* =========================================================
   PRODUCT FILTERING
========================================================= */

function getSelectedCategory() {
  const active =
    document.querySelector(
      ".navCategory.active"
    );

  if (!active) {
    return "All";
  }

  return (
    active.dataset.category ||
    active.textContent.trim() ||
    "All"
  );
}


/* =========================================================
   FILTER + SORT PRODUCTS
========================================================= */

function getVisibleProducts() {
  let result = [...products];

  const search =
    searchInput?.value.trim().toLowerCase() || "";

  const category =
    getSelectedCategory();

  if (search) {
    result = result.filter((product) => {
      const text = [
        product.name,
        product.description,
        product.category,
        product.seller_name,
        product.campus
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(search);
    });
  }

  if (
    category &&
    category !== "All" &&
    category !== "all"
  ) {
    result = result.filter(
      (product) =>
        String(product.category || "").toLowerCase() ===
        String(category).toLowerCase()
    );
  }

  const sort =
    sortSelect?.value || "newest";

  if (sort === "price-low") {
    result.sort(
      (a, b) =>
        Number(a.price || 0) -
        Number(b.price || 0)
    );
  }

  if (sort === "price-high") {
    result.sort(
      (a, b) =>
        Number(b.price || 0) -
        Number(a.price || 0)
    );
  }

  if (sort === "newest") {
    result.sort(
      (a, b) =>
        new Date(b.created_at || 0) -
        new Date(a.created_at || 0)
    );
  }

  return result;
}


/* =========================================================
   RENDER PRODUCTS
========================================================= */

function renderProducts() {
  if (!productsContainer) {
    return;
  }

  const visibleProducts =
    getVisibleProducts();

  if (!visibleProducts.length) {
    productsContainer.innerHTML = `
      <div class="empty-state">
        <h3>No products found</h3>
        <p>Try another search or category.</p>
      </div>
    `;

    return;
  }

  productsContainer.innerHTML =
    visibleProducts
      .map((product) => {
        const image =
          product.image_url ||
          product.image ||
          "";

        const imageHTML = image
          ? `
            <img
              src="${escapeHTML(image)}"
              alt="${escapeHTML(product.name)}"
              loading="lazy"
            >
          `
          : `
            <div class="product-image-placeholder">
              📦
            </div>
          `;

        const sellerName =
          product.seller_name ||
          "Campus Seller";

        const campus =
          product.campus ||
          "Uganda";

        return `
          <article
            class="product-card"
            data-product-id="${product.id}"
          >

            <div class="product-image">
              ${imageHTML}
            </div>

            <div class="product-content">

              <div class="product-category">
                ${escapeHTML(product.category || "Other")}
              </div>

              <h3>
                ${escapeHTML(product.name)}
              </h3>

              <div class="product-price">
                ${formatPrice(product.price)}
              </div>

              <p class="product-description">
                ${escapeHTML(
                  product.description || ""
                )}
              </p>

              <div class="product-seller">
                <strong>
                  ${escapeHTML(sellerName)}
                </strong>

                <span>
                  ${escapeHTML(campus)}
                </span>
              </div>

              <div class="product-actions">

                <button
                  type="button"
                  class="like-button"
                  data-product-id="${product.id}"
                >
                  ♡
                </button>

                <button
                  type="button"
                  class="chat-seller-button"
                  data-product-id="${product.id}"
                >
                  Chat with seller
                </button>

              </div>

            </div>

          </article>
        `;
      })
      .join("");

  attachProductButtons();
}


/* =========================================================
   PRODUCT BUTTONS
========================================================= */

function attachProductButtons() {
  document
    .querySelectorAll(".chat-seller-button")
    .forEach((button) => {
      button.addEventListener(
        "click",
        async () => {
          const productId =
            Number(
              button.dataset.productId
            );

          await startProductChat(productId);
        }
      );
    });

  document
    .querySelectorAll(".like-button")
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          button.classList.toggle("liked");

          button.textContent =
            button.classList.contains("liked")
              ? "♥"
              : "♡";
        }
      );
    });
}


/* =========================================================
   SEARCH
========================================================= */

function performSearch() {
  renderProducts();
}

if (searchButton) {
  searchButton.addEventListener(
    "click",
    performSearch
  );
}

if (searchInput) {
  searchInput.addEventListener(
    "input",
    renderProducts
  );

  searchInput.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Enter") {
        performSearch();
      }
    }
  );
}


/* =========================================================
   SORT
========================================================= */

if (sortSelect) {
  sortSelect.addEventListener(
    "change",
    renderProducts
  );
}


/* =========================================================
   CATEGORY BUTTONS
========================================================= */

document
  .querySelectorAll(".navCategory")
  .forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        document
          .querySelectorAll(".navCategory")
          .forEach((item) => {
            item.classList.remove("active");
          });

        button.classList.add("active");

        renderProducts();
      }
    );
  });


/* =========================================================
   SELL PRODUCT
========================================================= */

if (sellForm) {
  sellForm.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      if (!currentUser) {
        openAuth("login");
        return;
      }

      const name =
        $("#name")?.value.trim() || "";

      const price =
        Number($("#price")?.value || 0);

      const category =
        $("#cat")?.value.trim() || "Other";

      const sellerName =
        $("#seller")?.value.trim() ||
        currentProfile?.full_name ||
        currentUser.email ||
        "Seller";

      const campus =
        $("#campus")?.value.trim() ||
        currentProfile?.campus ||
        "";

      const description =
        $("#desc")?.value.trim() || "";

      if (!name || !price) {
        alert(
          "Please enter a product name and price."
        );

        return;
      }

      const submitButton =
        sellForm.querySelector(
          'button[type="submit"]'
        );

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent =
          "Listing...";
      }

      try {
        const {
          data,
          error
        } = await supabaseClient
          .from("products")
          .insert({
            name,
            price,
            category,
            seller_name: sellerName,
            seller_id: currentUser.id,
            campus,
            description
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        products.unshift(data);

        renderProducts();

        sellForm.reset();

        alert(
          "Your product has been listed successfully!"
        );

      } catch (error) {
        console.error(
          "Product listing error:",
          error
        );

        alert(
          error.message ||
          "Unable to list your product."
        );

      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent =
            "List Product";
        }
      }
    }
  );
}


/* =========================================================
   FIND EXISTING CONVERSATION
========================================================= */

async function findConversation(
  buyerId,
  sellerId,
  productId
) {
  const {
    data,
    error
  } = await supabaseClient
    .from("conversations")
    .select("*")
    .eq("buyer_id", buyerId)
    .eq("seller_id", sellerId)
    .eq("product_id", productId)
    .maybeSingle();

  if (error) {
    console.error(
      "Find conversation error:",
      error
    );

    return null;
  }

  return data;
}


/* =========================================================
   CREATE OR GET CONVERSATION
========================================================= */

async function getOrCreateConversation(
  buyerId,
  sellerId,
  productId
) {
  let conversation =
    await findConversation(
      buyerId,
      sellerId,
      productId
    );

  if (conversation) {
    return conversation;
  }

  const {
    data,
    error
  } = await supabaseClient
    .from("conversations")
    .insert({
      buyer_id: buyerId,
      seller_id: sellerId,
      product_id: productId
    })
    .select()
    .single();

  if (!error) {
    return data;
  }

  /*
    Another request may have created the
    conversation at almost the same time.
    Fetch it again before returning an error.
  */

  conversation =
    await findConversation(
      buyerId,
      sellerId,
      productId
    );

  if (conversation) {
    return conversation;
  }

  throw error;
}


/* =========================================================
   START PRODUCT CHAT
========================================================= */

async function startProductChat(productId) {
  if (!currentUser) {
    openAuth("login");

    return;
  }

  const product =
    products.find(
      (item) =>
        Number(item.id) ===
        Number(productId)
    );

  if (!product) {
    alert(
      "This product could not be found."
    );

    return;
  }

  if (
    String(product.seller_id) ===
    String(currentUser.id)
  ) {
    alert(
      "You cannot start a chat with yourself."
    );

    return;
  }

  if (!product.seller_id) {
    alert(
      "This product does not have a valid seller account."
    );

    return;
  }

  try {
    const conversation =
      await getOrCreateConversation(
        currentUser.id,
        product.seller_id,
        product.id
      );

    activeConversation = conversation;

    activeProduct = product;

    await loadConversations();

    await openConversation(
      conversation.id,
      product
    );

    const chatSection =
      $("#chat");

    if (chatSection) {
      chatSection.scrollIntoView({
        behavior: "smooth"
      });
    }

  } catch (error) {
    console.error(
      "Starting chat failed:",
      error
    );

    alert(
      error.message ||
      "Unable to start this chat."
    );
  }
}


/* =========================================================
   LOAD CONVERSATION INBOX
========================================================= */

async function loadConversations() {
  if (!currentUser) {
    conversations = [];
    renderConversations();
    return;
  }

  const {
    data,
    error
  } = await supabaseClient
    .from("conversations")
    .select("*")
    .or(
      `buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`
    )
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error(
      "Conversations loading error:",
      error
    );

    conversations = [];

    renderConversations();

    return;
  }

  conversations = data || [];

  renderConversations();
}


/* =========================================================
   RENDER CONVERSATION INBOX
========================================================= */

function renderConversations() {
  const inbox =
    document.querySelector(
      "#conversationList"
    );

  if (!inbox) {
    return;
  }

  if (!conversations.length) {
    inbox.innerHTML = `
      <div class="empty-conversations">
        <p>No conversations yet.</p>
        <small>
          Chat with a seller from a product listing.
        </small>
      </div>
    `;

    return;
  }

  inbox.innerHTML =
    conversations
      .map((conversation) => {
        const isBuyer =
          String(
            conversation.buyer_id
          ) ===
          String(currentUser?.id);

        const otherUserId =
          isBuyer
            ? conversation.seller_id
            : conversation.buyer_id;

        const product =
          products.find(
            (item) =>
              String(item.id) ===
              String(
                conversation.product_id
              )
          );

        const productName =
          product?.name ||
          "Product conversation";

        return `
          <button
            type="button"
            class="conversation-item"
            data-conversation-id="${conversation.id}"
          >

            <strong>
              ${escapeHTML(productName)}
            </strong>

            <span>
              ${isBuyer ? "Seller" : "Buyer"}
            </span>

            <small>
              ${escapeHTML(otherUserId || "")}
            </small>

          </button>
        `;
      })
      .join("");

  document
    .querySelectorAll(
      ".conversation-item"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        async () => {
          const conversationId =
            Number(
              button.dataset.conversationId
            );

          const conversation =
            conversations.find(
              (item) =>
                Number(item.id) ===
                conversationId
            );

          if (!conversation) {
            return;
          }

          const product =
            products.find(
              (item) =>
                Number(item.id) ===
                Number(
                  conversation.product_id
                )
            );

          await openConversation(
            conversation.id,
            product
          );
        }
      );
    });
}


/* =========================================================
   OPEN CONVERSATION
========================================================= */

async function openConversation(
  conversationId,
  product = null
) {
  if (!currentUser) {
    openAuth("login");
    return;
  }

  const conversation =
    conversations.find(
      (item) =>
        Number(item.id) ===
        Number(conversationId)
    ) ||
    activeConversation;

  if (!conversation) {
    return;
  }

  activeConversation =
    conversation;

  activeProduct =
    product ||
    products.find(
      (item) =>
        Number(item.id) ===
        Number(
          conversation.product_id
        )
    ) ||
    null;

  renderedMessageIds.clear();

  await subscribeToMessages(
    conversation.id
  );

  await loadMessages(
    conversation.id
  );
}


/* =========================================================
   LOAD MESSAGES
========================================================= */

async function loadMessages(
  conversationId
) {
  if (!chatContainer) {
    return;
  }

  chatContainer.innerHTML =
    "<p>Loading messages...</p>";

  renderedMessageIds.clear();

  const {
    data,
    error
  } = await supabaseClient
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
      "Messages loading error:",
      error
    );

    chatContainer.innerHTML =
      "<p>Unable to load messages.</p>";

    return;
  }

  chatContainer.innerHTML = "";

  if (!data || !data.length) {
    chatContainer.innerHTML = `
      <div class="empty-chat">
        <p>No messages yet.</p>
        <small>
          Send the first message.
        </small>
      </div>
    `;
  } else {
    data.forEach((message) => {
      renderMessage(message);
    });
  }

  scrollChatToBottom();
}


/* =========================================================
   RENDER ONE MESSAGE
========================================================= */

function renderMessage(message) {
  if (!message) {
    return;
  }

  const messageId =
    String(message.id);

  if (
    renderedMessageIds.has(messageId)
  ) {
    return;
  }

  renderedMessageIds.add(
    messageId
  );

  if (!chatContainer) {
    return;
  }

  const mine =
    String(message.sender_id) ===
    String(currentUser?.id);

  const wrapper =
    document.createElement("div");

  wrapper.className =
    mine
      ? "chat-message sent"
      : "chat-message received";

  wrapper.dataset.messageId =
    messageId;

  wrapper.innerHTML = `
    <div class="message-bubble">
      ${escapeHTML(message.message)}
    </div>

    <small class="message-time">
      ${escapeHTML(
        formatDate(message.created_at)
      )}
    </small>
  `;

  chatContainer.appendChild(
    wrapper
  );
}


/* =========================================================
   REALTIME MESSAGE SUBSCRIPTION
========================================================= */

async function subscribeToMessages(
  conversationId
) {
  if (messagesChannel) {
    await supabaseClient.removeChannel(
      messagesChannel
    );

    messagesChannel = null;
  }

  messagesChannel =
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
        (payload) => {
          const message =
            payload.new;

          if (
            !message ||
            String(
              message.conversation_id
            ) !==
            String(conversationId)
          ) {
            return;
          }

          renderMessage(message);

          scrollChatToBottom();
        }
      )
      .subscribe(
        (status) => {
          console.log(
            "Chat realtime status:",
            status
          );
        }
      );
}


/* =========================================================
   SEND MESSAGE
========================================================= */

if (chatForm) {
  chatForm.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      if (!currentUser) {
        openAuth("login");
        return;
      }

      if (!activeConversation) {
        alert(
          "Please select a conversation first."
        );

        return;
      }

      const text =
        messageInput?.value.trim() || "";

      if (!text) {
        return;
      }

      const sendButton =
        chatForm.querySelector(
          'button[type="submit"]'
        );

      if (sendButton) {
        sendButton.disabled = true;
      }

      try {
        const {
          data,
          error
        } = await supabaseClient
          .from("messages")
          .insert({
            conversation_id:
              activeConversation.id,

            sender_id:
              currentUser.id,

            message: text
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        /*
          Render immediately.
          The realtime subscription will receive
          the same message, but renderMessage()
          prevents a duplicate bubble.
        */

        renderMessage(data);

        if (messageInput) {
          messageInput.value = "";
          messageInput.focus();
        }

        scrollChatToBottom();

      } catch (error) {
        console.error(
          "Message sending error:",
          error
        );

        alert(
          error.message ||
          "Unable to send message."
        );

      } finally {
        if (sendButton) {
          sendButton.disabled = false;
        }
      }
    }
  );
}


/* =========================================================
   CHAT SCROLL
========================================================= */

function scrollChatToBottom() {
  if (!chatContainer) {
    return;
  }

  chatContainer.scrollTop =
    chatContainer.scrollHeight;
}


/* =========================================================
   MESSAGE ENTER KEY
========================================================= */

if (messageInput) {
  messageInput.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        if (chatForm) {
          chatForm.requestSubmit();
        }
      }
    }
  );
}


/* =========================================================
   LOCATION BUTTON
========================================================= */

const locationButton =
  $("#locationButton");

if (locationButton) {
  locationButton.addEventListener(
    "click",
    () => {
      const location =
        currentProfile?.campus ||
        "Kampala";

      alert(
        `Current marketplace location: ${location}`
      );
    }
  );
}


/* =========================================================
   MESSAGES BUTTON
========================================================= */

const messagesButton =
  $("#messagesButton");

if (messagesButton) {
  messagesButton.addEventListener(
    "click",
    () => {
      const chatSection =
        $("#chat");

      if (chatSection) {
        chatSection.scrollIntoView({
          behavior: "smooth"
        });
      }
    }
  );
}


/* =========================================================
   SELL HEADER BUTTON
========================================================= */

const sellHeaderButton =
  document.querySelector(
    ".sellHeaderButton"
  );

if (sellHeaderButton) {
  sellHeaderButton.addEventListener(
    "click",
    () => {
      if (!currentUser) {
        openAuth("login");
        return;
      }

      const sellSection =
        $("#sell");

      if (sellSection) {
        sellSection.scrollIntoView({
          behavior: "smooth"
        });
      }
    }
  );
}


/* =========================================================
   AUTH STATE CHANGES
========================================================= */

supabaseClient.auth.onAuthStateChange(
  (event, session) => {
    /*
      Do not perform several Supabase requests
      directly inside the auth callback.
      Defer them to avoid auth callback deadlocks.
    */

    setTimeout(async () => {
      currentUser =
        session?.user || null;

      window.chealCurrentUser =
        currentUser;

      if (currentUser) {
        await loadCurrentProfile();
      } else {
        currentProfile = null;

        activeConversation = null;
        activeProduct = null;

        conversations = [];

        renderedMessageIds.clear();

        if (messagesChannel) {
          await supabaseClient.removeChannel(
            messagesChannel
          );

          messagesChannel = null;
        }
      }

      updateAuthUI();

      await loadProducts();

      await loadConversations();
    }, 0);
  }
);


/* =========================================================
   INITIALIZE APP
========================================================= */

async function initializeApp() {
  console.log(
    "Initializing Cheal Market..."
  );

  await getCurrentUser();

  if (currentUser) {
    await loadCurrentProfile();
  }

  updateAuthUI();

  await loadProducts();

  await loadConversations();

  console.log(
    "Cheal Market initialized."
  );
}


/* =========================================================
   START
========================================================= */

initializeApp();
