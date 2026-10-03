/* =========================================================
   CHEAL MARKET — REAL MULTI-USER MARKETPLACE
   Supabase Products + Private Chats + Real-Time Messages
========================================================= */
/* =========================================================
   SUPABASE
========================================================= */
const SUPABASE_URL =
  "https://qwlklqjfbrhythpynghr.supabase.co";
const SUPABASE_URL =
  "https://qwlklqjfbrhythpynghr.supabase.co";
const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );
/* =========================================================
   APPLICATION STATE
========================================================= */
let products = [];
let conversations = [];
let activeCategory = "All";
let activeConversationId = null;
let messageChannel = null;
/* =========================================================
   ELEMENTS
========================================================= */
const productsEl =
  document.querySelector("#products");
const search =
  document.querySelector("#search");
const cats =
  document.querySelector("#cats");
const sort =
  document.querySelector("#sort");
const sellForm =
  document.querySelector("#sellForm");
const chatForm =
  document.querySelector("#chatForm");
const message =
  document.querySelector("#message");
const messages =
  document.querySelector("#messages");
const modal =
  document.querySelector("#modal");
const modalTitle =
  document.querySelector("#modalTitle");
const auth =
  document.querySelector("#auth");
const authName =
  document.querySelector("#authName");
const authEmail =
  document.querySelector("#authEmail");
const authPassword =
  document.querySelector("#authPassword");
const authCampus =
  document.querySelector("#authCampus");
const authSubmit =
  document.querySelector("#authSubmit");
const authMessage =
  document.querySelector("#authMessage");
const login =
  document.querySelector("#login");
const signup =
  document.querySelector("#signup");
const close =
  document.querySelector("#close");
const searchButton =
  document.querySelector("#searchButton");
const messagesButton =
  document.querySelector("#messagesButton");
const locationButton =
  document.querySelector("#locationButton");
/* =========================================================
   HELPERS
========================================================= */
function money(value) {
  return (
    "UGX " +
    Number(value || 0)
      .toLocaleString("en-UG")
  );
}
function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function formatTime(dateValue) {
  if (!dateValue) {
    return "Recently";
  }
  const date =
    new Date(dateValue);
  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Recently";
  }
  const seconds =
    Math.floor(
      (
        Date.now() -
        date.getTime()
      ) / 1000
    );
  if (seconds < 60) {
    return "Just now";
  }
  const minutes =
    Math.floor(
      seconds / 60
    );
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours =
    Math.floor(
      minutes / 60
    );
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days =
    Math.floor(
      hours / 24
    );
  return `${days}d ago`;
}
function categoryIcon(category) {
  const icons = {
    Phones: "📱",
    Computers: "💻",
    Fashion: "👕",
    Clothes: "👕",
    Books: "📚",
    Electronics: "🎧",
    Home: "🏠",
    Gaming: "🎮",
    Other: "🛍️"
  };
  return (
    icons[category] ||
    "🛍️"
  );
}
async function getUser() {
  const {
    data,
    error
  } =
    await supabaseClient
      .auth
      .getUser();
  if (error) {
    console.error(
      "User error:",
      error
    );
    return null;
  }
  return data.user;
}
/* =========================================================
   PRODUCTS — REAL SUPABASE PRODUCTS ONLY
========================================================= */
async function loadProducts() {
  if (!productsEl) return;
  productsEl.innerHTML = `
    <div class="emptyProducts">
      <div>⏳</div>
      <h3>Loading marketplace...</h3>
      <p>Getting real student listings.</p>
    </div>
  `;
  try {
    const {
      data,
      error
    } =
      await supabaseClient
        .from("products")
        .select(
          "id, seller_id, name, price, category, seller_name, campus, description, created_at"
        )
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
      products = [];
      render();
      return;
    }
    products =
      (data || [])
        .map(
          product => ({
            id:
              product.id,
            seller_id:
              product.seller_id,
            name:
              product.name,
            price:
              product.price,
            category:
              product.category,
            seller:
              product.seller_name ||
              "Student",
            campus:
              product.campus ||
              "Uganda",
            description:
              product.description ||
              "",
            icon:
              categoryIcon(
                product.category
              ),
            time:
              formatTime(
                product.created_at
              )
          })
        );
    render();
  }
  catch (error) {
    console.error(
      "Product loading failed:",
      error
    );
    products = [];
    render();
  }
}
/* =========================================================
   PRODUCT CARD
========================================================= */
function productCard(product) {
  const currentUser =
    window.chealCurrentUser;
  const ownProduct =
    currentUser &&
    product.seller_id ===
      currentUser.id;
  return `
    <article class="product">
      <div class="pic">
        <span class="productIcon">
          ${product.icon}
        </span>
        <button
          type="button"
          class="favoriteButton"
          aria-label="Favorite"
          onclick="toggleFavorite(this)"
        >
          ♡
        </button>
      </div>
      <div class="productBody">
        <div class="productCategory">
          ${escapeHTML(
            product.category
          )}
        </div>
        <h3>
          ${escapeHTML(
            product.name
          )}
        </h3>
        <div class="productPrice">
          ${money(
            product.price
          )}
        </div>
        <div class="productLocation">
          📍 ${escapeHTML(
            product.campus
          )}
        </div>
        <div class="productSeller">
          <div class="sellerAvatar">
            ${escapeHTML(
              (
                product.seller ||
                "S"
              )
                .charAt(0)
                .toUpperCase()
            )}
          </div>
          <div>
            <strong>
              ${escapeHTML(
                product.seller
              )}
            </strong>
            <span>
              ${escapeHTML(
                product.time
              )}
            </span>
          </div>
        </div>
        ${
          ownProduct
            ? `
              <div
                style="
                  margin-top:12px;
                  padding:9px;
                  border-radius:10px;
                  background:#f3f4f6;
                  color:#667085;
                  text-align:center;
                  font-size:13px;
                "
              >
                Your listing
              </div>
            `
            : `
              <button
                type="button"
                class="productChatButton"
                onclick="openProductChat(${Number(product.id)})"
              >
                💬 Chat with seller
              </button>
            `
        }
      </div>
    </article>
  `;
}
/* =========================================================
   RENDER PRODUCTS
========================================================= */
function render() {
  if (!productsEl) return;
  const query =
    search
      ? search.value
          .toLowerCase()
          .trim()
      : "";
  let filtered =
    products.filter(
      product => {
        const categoryMatch =
          activeCategory === "All" ||
          product.category ===
            activeCategory;
        const text = [
          product.name,
          product.category,
          product.seller,
          product.campus,
          product.description
        ]
          .join(" ")
          .toLowerCase();
        return (
          categoryMatch &&
          text.includes(query)
        );
      }
    );
  if (sort) {
    if (
      sort.value ===
      "priceLow"
    ) {
      filtered.sort(
        (a, b) =>
          Number(a.price) -
          Number(b.price)
      );
    }
    if (
      sort.value ===
      "priceHigh"
    ) {
      filtered.sort(
        (a, b) =>
          Number(b.price) -
          Number(a.price)
      );
    }
  }
  if (!filtered.length) {
    productsEl.innerHTML = `
      <div class="emptyProducts">
        <div>🛍️</div>
        <h3>
          No products listed yet
        </h3>
        <p>
          Be the first student to list something on Cheal Market.
        </p>
      </div>
    `;
    return;
  }
  productsEl.innerHTML =
    filtered
      .map(productCard)
      .join("");
}
/* =========================================================
   CATEGORIES
========================================================= */
const categories = [
  "All",
  "Phones",
  "Computers",
  "Fashion",
  "Books",
  "Electronics",
  "Home",
  "Gaming",
  "Other"
];
function createCategories() {
  if (!cats) return;
  cats.innerHTML = "";
  categories.forEach(
    category => {
      const button =
        document.createElement(
          "button"
        );
      button.type =
        "button";
      button.className =
        "cat" +
        (
          category ===
          activeCategory
            ? " active"
            : ""
        );
      button.textContent =
        category;
      button.onclick =
        () => {
          activeCategory =
            category;
          document
            .querySelectorAll(
              ".cat"
            )
            .forEach(
              item =>
                item.classList
                  .remove(
                    "active"
                  )
            );
          button.classList
            .add("active");
          render();
        };
      cats.appendChild(
        button
      );
    }
  );
}
/* =========================================================
   SEARCH / SORT
========================================================= */
if (search) {
  search.addEventListener(
    "input",
    render
  );
}
if (searchButton) {
  searchButton.onclick =
    () => {
      render();
      document
        .querySelector(
          "#market"
        )
        ?.scrollIntoView({
          behavior:
            "smooth"
        });
    };
}
if (sort) {
  sort.addEventListener(
    "change",
    render
  );
}
/* =========================================================
   FAVORITES
========================================================= */
function toggleFavorite(button) {
  button.classList.toggle(
    "favoriteActive"
  );
  button.textContent =
    button.classList.contains(
      "favoriteActive"
    )
      ? "♥"
      : "♡";
}
/* =========================================================
   SELL — REAL DATABASE INSERT
========================================================= */
if (sellForm) {
  sellForm.onsubmit =
    async event => {
      event.preventDefault();
      const user =
        await getUser();
      if (!user) {
        alert(
          "Please sign in before listing a product."
        );
        openAuth(
          "Sign in"
        );
        return;
      }
      const productName =
        document
          .querySelector("#name")
          .value
          .trim();
      const price =
        Number(
          document
            .querySelector("#price")
            .value
        );
      const category =
        document
          .querySelector("#cat")
          .value;
      const sellerName =
        document
          .querySelector("#seller")
          .value
          .trim();
      const campus =
        document
          .querySelector("#campus")
          .value
          .trim();
      const description =
        document
          .querySelector("#desc")
          .value
          .trim();
      if (
        !productName ||
        !price ||
        !category ||
        !sellerName ||
        !campus
      ) {
        alert(
          "Please complete all required product details."
        );
        return;
      }
      try {
        const {
          error
        } =
          await supabaseClient
            .from("products")
            .insert({
              seller_id:
                user.id,
              name:
                productName,
              price:
                price,
              category:
                category,
              seller_name:
                sellerName,
              campus:
                campus,
              description:
                description
            });
        if (error) {
          console.error(
            "Product insert error:",
            error
          );
          alert(
            "Could not list product: " +
            error.message
          );
          return;
        }
        sellForm.reset();
        await loadProducts();
        alert(
          "Your product has been listed successfully!"
        );
        document
          .querySelector(
            "#market"
          )
          ?.scrollIntoView({
            behavior:
              "smooth"
          });
      }
      catch (error) {
        console.error(
          "Listing error:",
          error
        );
        alert(
          "Something went wrong while listing the product."
        );
      }
    };
}
/* =========================================================
   CHAT — FIND OR CREATE CONVERSATION
========================================================= */
async function openProductChat(
  productId
) {
  const user =
    await getUser();
  if (!user) {
    openAuth(
      "Sign in"
    );
    return;
  }
  const product =
    products.find(
      item =>
        Number(item.id) ===
        Number(productId)
    );
  if (!product) {
    alert(
      "Product not found."
    );
    return;
  }
  if (
    product.seller_id ===
    user.id
  ) {
    alert(
      "This is your own listing."
    );
    return;
  }
  try {
    /* Find existing conversation */
    let conversation =
      await findConversation(
        user.id,
        product.seller_id,
        product.id
      );
    /* Create conversation if necessary */
    if (!conversation) {
      const {
        data,
        error
      } =
        await supabaseClient
          .from("conversations")
          .insert({
            buyer_id:
              user.id,
            seller_id:
              product.seller_id,
            product_id:
              product.id
          })
          .select(
            "id, buyer_id, seller_id, product_id, created_at"
          )
          .single();
      if (error) {
        console.error(
          "Conversation creation error:",
          error
        );
        alert(
          "Could not start chat: " +
          error.message
        );
        return;
      }
      conversation =
        data;
    }
    await loadConversations();
    await selectConversation(
      conversation.id
    );
    document
      .querySelector(
        "#chat"
      )
      ?.scrollIntoView({
        behavior:
          "smooth"
      });
  }
  catch (error) {
    console.error(
      "Open chat error:",
      error
    );
    alert(
      "Could not open chat."
    );
  }
}
/* =========================================================
   FIND CONVERSATION
========================================================= */
async function findConversation(
  buyerId,
  sellerId,
  productId
) {
  const {
    data,
    error
  } =
    await supabaseClient
      .from("conversations")
      .select(
        "id, buyer_id, seller_id, product_id, created_at"
      )
      .eq(
        "buyer_id",
        buyerId
      )
      .eq(
        "seller_id",
        sellerId
      )
      .eq(
        "product_id",
        productId
      )
      .maybeSingle();
  if (error) {
    console.error(
      "Conversation lookup error:",
      error
    );
    return null;
  }
  return data;
}
/* =========================================================
   LOAD CONVERSATIONS FOR CURRENT USER
========================================================= */
async function loadConversations() {
  const user =
    await getUser();
  if (!user) {
    conversations = [];
    renderChatInbox();
    return;
  }
  try {
    const {
      data,
      error
    } =
      await supabaseClient
        .from("conversations")
        .select(
          "id, buyer_id, seller_id, product_id, created_at"
        )
        .or(
          `buyer_id.eq.${user.id},seller_id.eq.${user.id}`
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );
    if (error) {
      console.error(
        "Conversation loading error:",
        error
      );
      conversations = [];
      renderChatInbox();
      return;
    }
    const rows =
      data || [];
    if (!rows.length) {
      conversations = [];
      renderChatInbox();
      return;
    }
    const profileIds =
      [
        ...new Set(
          rows.flatMap(
            row => [
              row.buyer_id,
              row.seller_id
            ]
          )
        )
      ];
    const productIds =
      [
        ...new Set(
          rows
            .map(
              row =>
                row.product_id
            )
            .filter(Boolean)
        )
      ];
    let profiles = [];
    let productRows = [];
    if (profileIds.length) {
      const {
        data:
          profileData
      } =
        await supabaseClient
          .from("profiles")
          .select(
            "id, full_name, campus"
          )
          .in(
            "id",
            profileIds
          );
      profiles =
        profileData || [];
    }
    if (productIds.length) {
      const {
        data:
          productData
      } =
        await supabaseClient
          .from("products")
          .select(
            "id, name, price"
          )
          .in(
            "id",
            productIds
          );
      productRows =
        productData || [];
    }
    conversations =
      rows.map(
        row => {
          const otherUserId =
            row.buyer_id ===
            user.id
              ? row.seller_id
              : row.buyer_id;
          const otherProfile =
            profiles.find(
              profile =>
                profile.id ===
                otherUserId
            );
          const product =
            productRows.find(
              item =>
                Number(item.id) ===
                Number(
                  row.product_id
                )
            );
          return {
            ...row,
            otherUserId:
              otherUserId,
            otherName:
              otherProfile
                ?.full_name ||
              "Student",
            otherCampus:
              otherProfile
                ?.campus ||
              "",
            productName:
              product
                ?.name ||
              "Marketplace item",
            productPrice:
              product
                ?.price ||
              0
          };
        }
      );
    renderChatInbox();
  }
  catch (error) {
    console.error(
      "Inbox error:",
      error
    );
    conversations = [];
    renderChatInbox();
  }
}
/* =========================================================
   CHAT INBOX UI
========================================================= */
function renderChatInbox() {
  const chatSection =
    document.querySelector(
      "#chat"
    );
  if (!chatSection) return;
  let inbox =
    document.querySelector(
      "#chealChatInbox"
    );
  if (!inbox) {
    inbox =
      document.createElement(
        "div"
      );
    inbox.id =
      "chealChatInbox";
    const heading =
      chatSection.querySelector(
        "h2, h3"
      );
    if (
      heading &&
      heading.parentNode
    ) {
      heading.parentNode
        .insertBefore(
          inbox,
          heading.nextSibling
        );
    }
    else {
      chatSection.prepend(
        inbox
      );
    }
  }
  const user =
    window.chealCurrentUser;
  if (!user) {
    inbox.innerHTML = `
      <div
        style="
          padding:18px;
          margin-bottom:18px;
          border:1px solid #e5e7eb;
          border-radius:14px;
          background:#fff;
        "
      >
        <strong>
          💬 Cheal Chat
        </strong>
        <p
          style="
            margin:6px 0 0;
            color:#667085;
          "
        >
          Sign in to access your private conversations.
        </p>
      </div>
    `;
    return;
  }
  if (!conversations.length) {
    inbox.innerHTML = `
      <div
        style="
          padding:20px;
          margin-bottom:18px;
          border:1px solid #e5e7eb;
          border-radius:14px;
          background:#fff;
        "
      >
        <div
          style="
            font-size:26px;
            margin-bottom:6px;
          "
        >
          💬
        </div>
        <strong>
          Cheal Chat
        </strong>
        <p
          style="
            margin:6px 0 0;
            color:#667085;
          "
        >
          Your private conversations will appear here.
        </p>
      </div>
    `;
    return;
  }
  inbox.innerHTML = `
    <div
      style="
        margin-bottom:18px;
        border:1px solid #e5e7eb;
        border-radius:14px;
        background:#fff;
        overflow:hidden;
      "
    >
      <div
        style="
          padding:16px;
          border-bottom:1px solid #e5e7eb;
        "
      >
        <strong
          style="
            font-size:18px;
          "
        >
          💬 Cheal Chat
        </strong>
        <div
          style="
            margin-top:3px;
            color:#667085;
            font-size:13px;
          "
        >
          Private conversations
        </div>
      </div>
      ${
        conversations
          .map(
            conversation => {
              const active =
                Number(
                  activeConversationId
                ) ===
                Number(
                  conversation.id
                );
              const initial =
                (
                  conversation
                    .otherName ||
                  "S"
                )
                  .charAt(0)
                  .toUpperCase();
              return `
                <button
                  type="button"
                  onclick="selectConversation(${Number(conversation.id)})"
                  style="
                    width:100%;
                    display:flex;
                    align-items:center;
                    gap:12px;
                    padding:14px 16px;
                    border:0;
                    border-bottom:1px solid #f0f2f5;
                    background:${
                      active
                        ? "#f0fdf4"
                        : "#fff"
                    };
                    text-align:left;
                    cursor:pointer;
                  "
                >
                  <div
                    style="
                      width:42px;
                      height:42px;
                      border-radius:50%;
                      background:#16a34a;
                      color:#fff;
                      display:grid;
                      place-items:center;
                      font-weight:700;
                      flex:none;
                    "
                  >
                    ${escapeHTML(
                      initial
                    )}
                  </div>
                  <div
                    style="
                      min-width:0;
                      flex:1;
                    "
                  >
                    <strong
                      style="
                        display:block;
                        color:#172033;
                      "
                    >
                      ${escapeHTML(
                        conversation
                          .otherName
                      )}
                    </strong>
                    <span
                      style="
                        display:block;
                        margin-top:2px;
                        color:#667085;
                        font-size:13px;
                        white-space:nowrap;
                        overflow:hidden;
                        text-overflow:ellipsis;
                      "
                    >
                      ${escapeHTML(
                        conversation
                          .productName
                      )}
                    </span>
                  </div>
                  <span
                    style="
                      color:#16a34a;
                      font-size:20px;
                    "
                  >
                    ›
                  </span>
                </button>
              `;
            }
          )
          .join("")
      }
    </div>
  `;
}
/* =========================================================
   SELECT CHAT
========================================================= */
async function selectConversation(
  conversationId
) {
  const user =
    await getUser();
  if (!user) {
    openAuth(
      "Sign in"
    );
    return;
  }
  let conversation =
    conversations.find(
      item =>
        Number(item.id) ===
        Number(conversationId)
    );
  if (!conversation) {
    await loadConversations();
    conversation =
      conversations.find(
        item =>
          Number(item.id) ===
          Number(conversationId)
      );
  }
  if (!conversation) {
    alert(
      "Conversation not found."
    );
    return;
  }
  activeConversationId =
    Number(
      conversationId
    );
  renderChatInbox();
  await renderActiveChatHeader(
    conversation
  );
  await loadMessages(
    activeConversationId
  );
  subscribeToMessages(
    activeConversationId
  );
  if (message) {
    setTimeout(
      () =>
        message.focus(),
      200
    );
  }
}
/* =========================================================
   ACTIVE CHAT HEADER
========================================================= */
async function renderActiveChatHeader(
  conversation
) {
  const chatSection =
    document.querySelector(
      "#chat"
    );
  if (!chatSection) return;
  let header =
    document.querySelector(
      "#chealActiveChat"
    );
  if (!header) {
    header =
      document.createElement(
        "div"
      );
    header.id =
      "chealActiveChat";
    const chatFormElement =
      document.querySelector(
        "#chatForm"
      );
    if (
      chatFormElement &&
      chatFormElement.parentNode
    ) {
      chatFormElement.parentNode
        .insertBefore(
          header,
          chatFormElement
        );
    }
    else {
      chatSection.appendChild(
        header
      );
    }
  }
  header.innerHTML = `
    <div
      style="
        margin-bottom:12px;
        padding:14px 16px;
        border:1px solid #e5e7eb;
        border-radius:14px;
        background:#fff;
      "
    >
      <div
        style="
          display:flex;
          align-items:center;
          gap:12px;
        "
      >
        <div
          style="
            width:42px;
            height:42px;
            border-radius:50%;
            background:#16a34a;
            color:white;
            display:grid;
            place-items:center;
            font-weight:700;
          "
        >
          ${escapeHTML(
            (
              conversation
                .otherName ||
              "S"
            )
              .charAt(0)
              .toUpperCase()
          )}
        </div>
        <div>
          <strong>
            ${escapeHTML(
              conversation
                .otherName
            )}
          </strong>
          <div
            style="
              color:#667085;
              font-size:13px;
              margin-top:2px;
            "
          >
            ${escapeHTML(
              conversation
                .productName
            )}
          </div>
        </div>
      </div>
    </div>
  `;
}
/* =========================================================
   LOAD MESSAGES
========================================================= */
async function loadMessages(
  conversationId
) {
  if (!messages) return;
  messages.innerHTML = `
    <div
      style="
        padding:20px;
        text-align:center;
        color:#667085;
      "
    >
      Loading messages...
    </div>
  `;
  const {
    data,
    error
  } =
    await supabaseClient
      .from("messages")
      .select(
        "id, conversation_id, sender_id, message, created_at"
      )
      .eq(
        "conversation_id",
        conversationId
      )
      .order(
        "created_at",
        {
          ascending:true
        }
      );
  if (error) {
    console.error(
      "Messages error:",
      error
    );
    messages.innerHTML = `
      <div
        style="
          padding:20px;
          color:#b42318;
        "
      >
        Could not load messages.
      </div>
    `;
    return;
  }
  const rows =
    data || [];
  if (!rows.length) {
    messages.innerHTML = `
      <div
        style="
          padding:25px;
          text-align:center;
          color:#667085;
        "
      >
        <div
          style="
            font-size:30px;
          "
        >
          💬
        </div>
        <strong>
          Start the conversation
        </strong>
        <p
          style="
            margin:5px 0 0;
          "
        >
          Send a private message about the product.
        </p>
      </div>
    `;
    return;
  }
  messages.innerHTML = "";
  rows.forEach(
    row =>
      appendMessageBubble(
        row,
        false
      )
  );
  messages.scrollTop =
    messages.scrollHeight;
}
/* =========================================================
   MESSAGE BUBBLE
========================================================= */
function appendMessageBubble(
  row,
  scroll = true
) {
  if (!messages) return;
  const userId =
    window.chealCurrentUser?.id;
  const mine =
    row.sender_id ===
    userId;
  const bubble =
    document.createElement(
      "div"
    );
  bubble.style.marginBottom =
    "10px";
  bubble.style.padding =
    "10px 13px";
  bubble.style.borderRadius =
    "14px";
  bubble.style.maxWidth =
    "80%";
  bubble.style.width =
    "fit-content";
  bubble.style.marginLeft =
    mine
      ? "auto"
      : "0";
  bubble.style.background =
    mine
      ? "#dcfce7"
      : "#f3f4f6";
  bubble.style.color =
    "#172033";
  bubble.style.whiteSpace =
    "pre-wrap";
  bubble.textContent =
    row.message || "";
  messages.appendChild(
    bubble
  );
  if (scroll) {
    messages.scrollTop =
      messages.scrollHeight;
  }
}
/* =========================================================
   REAL-TIME CHAT
========================================================= */
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
        "cheal-private-chat-" +
        conversationId +
        "-" +
        Date.now()
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
        payload => {
          if (
            Number(
              payload.new
                .conversation_id
            ) !==
            Number(
              activeConversationId
            )
          ) {
            return;
          }
          appendMessageBubble(
            payload.new,
            true
          );
        }
      )
      .subscribe(
        status => {
          console.log(
            "Cheal Chat:",
            status
          );
        }
      );
}
/* =========================================================
   SEND MESSAGE
========================================================= */
if (chatForm) {
  chatForm.onsubmit =
    async event => {
      event.preventDefault();
      const user =
        await getUser();
      if (!user) {
        openAuth(
          "Sign in"
        );
        return;
      }
      if (!activeConversationId) {
        alert(
          "Select a conversation first."
        );
        return;
      }
      const text =
        message
          ? message.value.trim()
          : "";
      if (!text) return;
      const sendButton =
        chatForm.querySelector(
          'button[type="submit"]'
        );
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
                activeConversationId,
              sender_id:
                user.id,
              message:
                text
            });
        if (error) {
          console.error(
            "Send message error:",
            error
          );
          alert(
            "Could not send message: " +
            error.message
          );
          return;
        }
        message.value =
          "";
      }
      catch (error) {
        console.error(
          "Message error:",
          error
        );
        alert(
          "Could not send message."
        );
      }
      finally {
        if (sendButton) {
          sendButton.disabled =
            false;
        }
      }
    };
}
/* =========================================================
   MESSAGES BUTTON
========================================================= */
if (messagesButton) {
  messagesButton.onclick =
    async () => {
      const user =
        await getUser();
      if (!user) {
        openAuth(
          "Sign in"
        );
        return;
      }
      await loadConversations();
      document
        .querySelector(
          "#chat"
        )
        ?.scrollIntoView({
          behavior:
            "smooth"
        });
    };
}
/* =========================================================
   AUTH
========================================================= */
let authMode =
  "signup";
function openAuth(title) {
  if (!modal) return;
  modalTitle.textContent =
    title;
  modal.classList.remove(
    "hidden"
  );
  if (
    title ===
    "Sign in"
  ) {
    authMode =
      "signin";
    authSubmit.textContent =
      "Sign in";
    authMessage.textContent =
      "Sign in to buy, sell and chat.";
    authName.style.display =
      "none";
    authCampus.style.display =
      "none";
    authName.required =
      false;
    authCampus.required =
      false;
  }
  else {
    authMode =
      "signup";
    authSubmit.textContent =
      "Create account";
    authMessage.textContent =
      "Create your Cheal Market account.";
    authName.style.display =
      "";
    authCampus.style.display =
      "";
    authName.required =
      true;
    authCampus.required =
      true;
  }
}
if (login) {
  login.onclick =
    () =>
      openAuth(
        "Sign in"
      );
}
if (signup) {
  signup.onclick =
    () =>
      openAuth(
        "Create account"
      );
}
if (close) {
  close.onclick =
    () =>
      modal.classList.add(
        "hidden"
      );
}
if (modal) {
  modal.onclick =
    event => {
      if (
        event.target ===
        modal
      ) {
        modal.classList.add(
          "hidden"
        );
      }
    };
}
/* =========================================================
   AUTH SUBMISSION
========================================================= */
if (auth) {
  auth.onsubmit =
    async event => {
      event.preventDefault();
      const email =
        authEmail.value.trim();
      const password =
        authPassword.value;
      authSubmit.disabled =
        true;
      authSubmit.textContent =
        "Please wait...";
      try {
        /* SIGN IN */
        if (
          authMode ===
          "signin"
        ) {
          const {
            error
          } =
            await supabaseClient
              .auth
              .signInWithPassword({
                email:
                  email,
                password:
                  password
              });
          if (error) {
            alert(
              "Sign in failed: " +
              error.message
            );
            return;
          }
          modal.classList.add(
            "hidden"
          );
          auth.reset();
          await updateAuthButtons();
          await loadProducts();
          await loadConversations();
          alert(
            "Welcome back!"
          );
          return;
        }
        /* SIGN UP */
        const fullName =
          authName.value.trim();
        const campus =
          authCampus.value.trim();
        const {
          data,
          error
        } =
          await supabaseClient
            .auth
            .signUp({
              email:
                email,
              password:
                password,
              options: {
                data: {
                  full_name:
                    fullName,
                  campus:
                    campus
                }
              }
            });
        if (error) {
          alert(
            "Account creation failed: " +
            error.message
          );
          return;
        }
        /* If email confirmation is disabled */
        if (
          data.user &&
          data.session
        ) {
          const {
            error:
              profileError
          } =
            await supabaseClient
              .from("profiles")
              .upsert({
                id:
                  data.user.id,
                full_name:
                  fullName,
                campus:
                  campus
              });
          if (profileError) {
            console.error(
              "Profile error:",
              profileError
            );
          }
        }
        modal.classList.add(
          "hidden"
        );
        auth.reset();
        if (
          data.session
        ) {
          alert(
            "Account created successfully!"
          );
        }
        else {
          alert(
            "Account created! Check your email to confirm your account, then sign in."
          );
        }
      }
      catch (error) {
        console.error(
          "Authentication error:",
          error
        );
        alert(
          "Something went wrong: " +
          error.message
        );
      }
      finally {
        authSubmit.disabled =
          false;
        authSubmit.textContent =
          authMode ===
          "signin"
            ? "Sign in"
            : "Create account";
      }
    };
}
/* =========================================================
   AUTH BUTTONS
========================================================= */
async function updateAuthButtons() {
  const user =
    await getUser();
  window.chealCurrentUser =
    user;
  if (!login) return;
  if (user) {
    login.innerHTML = `
      <span>👤</span>
      <div>
        <small>Account</small>
        <strong>Signed in</strong>
      </div>
    `;
    if (signup) {
      signup.textContent =
        "Account";
    }
  }
  else {
    login.innerHTML = `
      <span>👤</span>
      <div>
        <small>Account</small>
        <strong>Sign in</strong>
      </div>
    `;
    if (signup) {
      signup.textContent =
        "Create account";
    }
  }
}
/* =========================================================
   LOCATION
========================================================= */
if (locationButton) {
  locationButton.onclick =
    () => {
      alert(
        "Campus-based marketplace locations are coming soon."
      );
    };
}
/* =========================================================
   AUTH STATE CHANGES
========================================================= */
supabaseClient.auth
  .onAuthStateChange(
    async (
      event,
      session
    ) => {
      window.chealCurrentUser =
        session?.user ||
        null;
      await updateAuthButtons();
      if (
        session?.user
      ) {
        await loadProducts();
        await loadConversations();
      }
      else {
        conversations = [];
        activeConversationId =
          null;
        if (messageChannel) {
          supabaseClient
            .removeChannel(
              messageChannel
            );
          messageChannel =
            null;
        }
        renderChatInbox();
      }
    }
  );
/* =========================================================
   START CHEAL MARKET
========================================================= */
window.chealCurrentUser =
  null;
createCategories();
updateAuthButtons();
loadProducts();
loadConversations();
