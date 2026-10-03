/* =========================================================
   CHEAL MARKET — APP.JS
   Marketplace + Supabase Auth + Real Chat Inbox
========================================================= */


/* =========================================================
   SUPABASE CONFIGURATION
========================================================= */

const SUPABASE_URL =
  "https://qwlklqjfbrhythpynghr.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_HVAjJNZAQIiyf1aFosvH0A_fnYoFpHx";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================================================
   DEMO FALLBACK PRODUCTS
========================================================= */

const demoProducts = [

  {
    name: "iPhone 13 Pro",
    price: 1850000,
    category: "Phones",
    seller: "Sarah",
    campus: "KIU",
    icon: "📱",
    time: "2 hours ago"
  },

  {
    name: "Samsung Galaxy A55",
    price: 980000,
    category: "Phones",
    seller: "Daniel",
    campus: "Makerere",
    icon: "📱",
    time: "3 hours ago"
  },

  {
    name: "HP EliteBook Laptop",
    price: 1250000,
    category: "Computers",
    seller: "Michael",
    campus: "KIU",
    icon: "💻",
    time: "5 hours ago"
  },

  {
    name: "Campus Hoodie",
    price: 35000,
    category: "Clothes",
    seller: "Brian",
    campus: "KIU",
    icon: "👕",
    time: "1 hour ago"
  },

  {
    name: "Nike Sneakers",
    price: 85000,
    category: "Clothes",
    seller: "Joan",
    campus: "Kyambogo",
    icon: "👟",
    time: "4 hours ago"
  },

  {
    name: "Calculus Textbook",
    price: 45000,
    category: "Books",
    seller: "Irene",
    campus: "KIU",
    icon: "📚",
    time: "30 minutes ago"
  },

  {
    name: "Wireless Headphones",
    price: 120000,
    category: "Electronics",
    seller: "Kevin",
    campus: "Makerere",
    icon: "🎧",
    time: "6 hours ago"
  },

  {
    name: "Scientific Calculator",
    price: 55000,
    category: "Other",
    seller: "Amina",
    campus: "KIU",
    icon: "🧮",
    time: "1 day ago"
  },

  {
    name: "Laptop Stand",
    price: 65000,
    category: "Electronics",
    seller: "Mark",
    campus: "KIU",
    icon: "💻",
    time: "2 hours ago"
  },

  {
    name: "Gaming Controller",
    price: 95000,
    category: "Gaming",
    seller: "Alex",
    campus: "Makerere",
    icon: "🎮",
    time: "8 hours ago"
  },

  {
    name: "Study Desk",
    price: 180000,
    category: "Home",
    seller: "David",
    campus: "KIU",
    icon: "🪑",
    time: "1 day ago"
  },

  {
    name: "USB Flash Drive 64GB",
    price: 25000,
    category: "Electronics",
    seller: "Grace",
    campus: "Kyambogo",
    icon: "💾",
    time: "3 hours ago"
  }

];


let products = [];

let activeCategory = "All";


/* =========================================================
   CHAT STATE
========================================================= */

let conversations = [];

let activeConversationId = null;

let activeConversation = null;

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
   MONEY FORMAT
========================================================= */

function money(value) {

  return (
    "UGX " +
    Number(value || 0)
      .toLocaleString("en-UG")
  );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================================================
   CATEGORY ICON
========================================================= */

function categoryIcon(category) {

  const icons = {

    Phones: "📱",

    Computers: "💻",

    Clothes: "👕",

    Books: "📚",

    Electronics: "🎧",

    Home: "🏠",

    Gaming: "🎮",

    Other: "🛍️"

  };


  return icons[category] || "🛍️";

}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

async function loadProducts() {

  if (productsEl) {

    productsEl.innerHTML = `
      <div class="emptyProducts">
        <div>⏳</div>
        <h3>Loading listings...</h3>
        <p>Please wait.</p>
      </div>
    `;

  }


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
        "Supabase product error:",
        error
      );


      products = [
        ...demoProducts
      ];


      render();

      return;

    }


    if (
      data &&
      data.length > 0
    ) {

      products =
        data.map(
          (item) => ({

            id:
              item.id,

            seller_id:
              item.seller_id,

            name:
              item.name,

            price:
              item.price,

            category:
              item.category,

            seller:
              item.seller_name ||
              "Student",

            campus:
              item.campus ||
              "Uganda",

            description:
              item.description ||
              "",

            icon:
              categoryIcon(
                item.category
              ),

            time:
              formatTime(
                item.created_at
              )

          })
        );

    } else {

      products = [
        ...demoProducts
      ];

    }


    render();

  }


  catch (error) {

    console.error(
      "Product loading error:",
      error
    );


    products = [
      ...demoProducts
    ];


    render();

  }

}


/* =========================================================
   TIME FORMAT
========================================================= */

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


/* =========================================================
   PRODUCT CARD
========================================================= */

function productCard(product) {

  const canChat =
    Boolean(
      product.id &&
      product.seller_id
    );


  return `
    <article class="product">

      <div class="pic">

        <span class="productIcon">
          ${product.icon || "🛍️"}
        </span>

        <button
          type="button"
          class="favoriteButton"
          aria-label="Add to favorites"
          onclick="toggleFavorite(this)"
        >
          ♡
        </button>

      </div>


      <div class="productBody">

        <div class="productCategory">
          ${escapeHTML(
            product.category || "Other"
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
              product.seller
                ? product.seller
                    .charAt(0)
                    .toUpperCase()
                : "U"
            )}
          </div>


          <div>

            <strong>
              ${escapeHTML(
                product.seller ||
                "Student"
              )}
            </strong>

            <span>
              ${escapeHTML(
                product.time ||
                "Recently"
              )}
            </span>

          </div>

        </div>


        ${
          canChat
            ? `
              <button
                type="button"
                class="productChatButton"
                onclick="openProductChat(${Number(product.id)})"
              >
                💬 Chat with seller
              </button>
            `
            : `
              <button
                type="button"
                class="productChatButton"
                onclick="openAuth('Sign in')"
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
      (product) => {

        const categoryMatch =
          activeCategory === "All" ||
          product.category ===
            activeCategory;


        const searchableText = [

          product.name,
          product.category,
          product.seller,
          product.campus,
          product.description

        ]
          .join(" ")
          .toLowerCase();


        const searchMatch =
          searchableText
            .includes(query);


        return (
          categoryMatch &&
          searchMatch
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

        <div>🔎</div>

        <h3>
          No products found
        </h3>

        <p>
          Try another search or category.
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
  "Clothes",
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
    (category) => {

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
              (item) =>
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
   SEARCH
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
          behavior: "smooth"
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

function toggleFavorite(
  button
) {

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
   GET CURRENT USER
========================================================= */

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
      "Get user error:",
      error
    );


    return null;

  }


  return data.user;

}


/* =========================================================
   SELL PRODUCT
========================================================= */

if (sellForm) {

  sellForm.onsubmit =
    async (event) => {

      event.preventDefault();


      const user =
        await getUser();


      if (!user) {

        alert(
          "Please create an account or sign in before listing a product."
        );


        openAuth(
          "Create account"
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
        !category
      ) {

        alert(
          "Please complete the required product details."
        );


        return;

      }


      try {

        const {
          data,
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

            })
            .select()
            .single();


        if (error) {

          console.error(
            "Product insert error:",
            error
          );


          alert(
            "Could not list the product: " +
            error.message
          );


          return;

        }


        products.unshift({

          id:
            data?.id,

          seller_id:
            user.id,

          name:
            productName,

          price:
            price,

          category:
            category,

          seller:
            sellerName,

          campus:
            campus,

          description:
            description,

          icon:
            categoryIcon(
              category
            ),

          time:
            "Just now"

        });


        render();


        sellForm.reset();


        alert(
          "Your product has been listed successfully!"
        );

      }


      catch (error) {

        console.error(
          "Product publishing error:",
          error
        );


        alert(
          "Something went wrong. Please try again."
        );

      }

    };

}


/* =========================================================
   CHAT — CREATE / OPEN CONVERSATION
========================================================= */

async function openProductChat(
  productId
) {

  const user =
    await getUser();


  if (!user) {

    alert(
      "Please sign in to chat with a seller."
    );


    openAuth(
      "Sign in"
    );


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


  if (!product.seller_id) {

    alert(
      "This demo listing does not have a real seller account yet."
    );


    return;

  }


  if (
    product.seller_id ===
    user.id
  ) {

    alert(
      "You cannot chat with yourself about your own product."
    );


    return;

  }


  try {

    let conversation =
      await findConversation(
        user.id,
        product.seller_id,
        product.id
      );


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
          .select()
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


    const chatSection =
      document.querySelector(
        "#chat"
      );


    if (chatSection) {

      chatSection.scrollIntoView({
        behavior: "smooth"
      });

    }


  }


  catch (error) {

    console.error(
      "Open chat error:",
      error
    );


    alert(
      "Could not open the chat. Please try again."
    );

  }

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
      "Find conversation error:",
      error
    );


    return null;

  }


  return data;

}


/* =========================================================
   LOAD CHAT INBOX
========================================================= */

async function loadConversations() {

  const user =
    await getUser();


  if (!user) {

    conversations = [];

    renderConversationInbox();

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

      renderConversationInbox();

      return;

    }


    const rows =
      data || [];


    if (!rows.length) {

      conversations = [];

      renderConversationInbox();

      return;

    }


    const profileIds =
      [
        ...new Set(
          rows.flatMap(
            (conversation) => [
              conversation.buyer_id,
              conversation.seller_id
            ]
          )
        )
      ];


    const productIds =
      [
        ...new Set(
          rows
            .map(
              (conversation) =>
                conversation.product_id
            )
            .filter(Boolean)
        )
      ];


    let profiles = [];

    let productRows = [];


    if (profileIds.length) {

      const {
        data:
          profileData,
        error:
          profileError
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


      if (profileError) {

        console.error(
          "Profile loading error:",
          profileError
        );

      }


      profiles =
        profileData || [];

    }


    if (productIds.length) {

      const {
        data:
          productData,
        error:
          productError
      } =
        await supabaseClient
          .from("products")
          .select(
            "id, name, price, seller_name"
          )
          .in(
            "id",
            productIds
          );


      if (productError) {

        console.error(
          "Chat product loading error:",
          productError
        );

      }


      productRows =
        productData || [];

    }


    conversations =
      rows.map(
        (conversation) => {

          const otherUserId =
            conversation.buyer_id ===
            user.id
              ? conversation.seller_id
              : conversation.buyer_id;


          const otherProfile =
            profiles.find(
              (profile) =>
                profile.id ===
                otherUserId
            );


          const product =
            productRows.find(
              (item) =>
                Number(item.id) ===
                Number(
                  conversation.product_id
                )
            );


          return {

            ...conversation,

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


    renderConversationInbox();


  }


  catch (error) {

    console.error(
      "Conversation inbox error:",
      error
    );


    conversations = [];

    renderConversationInbox();

  }

}


/* =========================================================
   RENDER CONVERSATION INBOX
========================================================= */

function renderConversationInbox() {

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


    inbox.style.marginBottom =
      "20px";


    const chatFormElement =
      document.querySelector(
        "#chatForm"
      );


    if (
      chatFormElement &&
      chatFormElement.parentNode
    ) {

      chatFormElement.parentNode.insertBefore(
        inbox,
        chatFormElement
      );

    }

    else {

      chatSection.prepend(
        inbox
      );

    }

  }


  const userPromise =
    getUser();


  userPromise.then(
    (user) => {

      if (!user) {

        inbox.innerHTML = `
          <div
            style="
              padding:18px;
              border:1px solid #e5e7eb;
              border-radius:14px;
              background:#fff;
            "
          >
            <strong>💬 Cheal Chat</strong>
            <p style="margin:6px 0 0;color:#667085;">
              Sign in to see your conversations.
            </p>
          </div>
        `;

        return;

      }


      if (!conversations.length) {

        inbox.innerHTML = `
          <div
            style="
              padding:18px;
              border:1px solid #e5e7eb;
              border-radius:14px;
              background:#fff;
            "
          >
            <div style="font-size:24px;margin-bottom:6px;">
              💬
            </div>

            <strong>Cheal Chat</strong>

            <p style="margin:6px 0 0;color:#667085;">
              Your conversations will appear here when you chat with a seller.
            </p>
          </div>
        `;

        return;

      }


      inbox.innerHTML = `
        <div
          style="
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
            <strong style="font-size:18px;">
              💬 Cheal Chat
            </strong>

            <div
              style="
                color:#667085;
                font-size:13px;
                margin-top:3px;
              "
            >
              Your conversations
            </div>
          </div>

          <div>
            ${conversations
              .map(
                (conversation) => {

                  const active =
                    Number(
                      activeConversationId
                    ) ===
                    Number(
                      conversation.id
                    );


                  return `
                    <button
                      type="button"
                      onclick="selectConversation(${Number(conversation.id)})"
                      style="
                        width:100%;
                        display:flex;
                        align-items:center;
                        gap:12px;
                        text-align:left;
                        padding:14px 16px;
                        border:0;
                        border-bottom:1px solid #f0f2f5;
                        background:${
                          active
                            ? "#f0fdf4"
                            : "#fff"
                        };
                        cursor:pointer;
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
                          flex:none;
                        "
                      >
                        ${escapeHTML(
                          conversation.otherName
                            .charAt(0)
                            .toUpperCase()
                        )}
                      </div>

                      <div style="min-width:0;flex:1;">

                        <strong
                          style="
                            display:block;
                            color:#172033;
                          "
                        >
                          ${escapeHTML(
                            conversation.otherName
                          )}
                        </strong>

                        <span
                          style="
                            display:block;
                            color:#667085;
                            font-size:13px;
                            white-space:nowrap;
                            overflow:hidden;
                            text-overflow:ellipsis;
                          "
                        >
                          ${escapeHTML(
                            conversation.productName
                          )}
                        </span>

                      </div>

                      <span
                        style="
                          color:#16a34a;
                          font-size:18px;
                        "
                      >
                        ›
                      </span>

                    </button>
                  `;

                }
              )
              .join("")}
          </div>

        </div>
      `;

    }

  );

}


/* =========================================================
   SELECT CONVERSATION
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


  const conversation =
    conversations.find(
      (item) =>
        Number(item.id) ===
        Number(conversationId)
    );


  if (!conversation) {

    await loadConversations();


    const refreshed =
      conversations.find(
        (item) =>
          Number(item.id) ===
          Number(conversationId)
      );


    if (!refreshed) {

      alert(
        "Conversation could not be found."
      );


      return;

    }

  }


  activeConversation =
    conversations.find(
      (item) =>
        Number(item.id) ===
        Number(conversationId)
    );


  activeConversationId =
    Number(
      conversationId
    );


  renderConversationInbox();


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
      Loading conversation...
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
          ascending: true
        }
      );


  if (error) {

    console.error(
      "Message loading error:",
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
        <div style="font-size:30px;">
          💬
        </div>

        <strong>Start the conversation</strong>

        <p style="margin:5px 0 0;">
          Send the seller a message about this product.
        </p>
      </div>
    `;


    return;

  }


  messages.innerHTML = "";


  rows.forEach(
    (row) =>
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
    currentUserId();


  const isMine =
    row.sender_id ===
    userId;


  const bubble =
    document.createElement(
      "div"
    );


  bubble.className =
    isMine
      ? "buyerMsg"
      : "sellerMsg";


  bubble.style.marginBottom =
    "10px";


  bubble.style.padding =
    "10px 13px";


  bubble.style.borderRadius =
    "12px";


  bubble.style.maxWidth =
    "80%";


  bubble.style.width =
    "fit-content";


  bubble.style.marginLeft =
    isMine
      ? "auto"
      : "0";


  bubble.style.background =
    isMine
      ? "#dcfce7"
      : "#f3f4f6";


  bubble.style.color =
    "#172033";


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
   CURRENT USER ID
========================================================= */

function currentUserId() {

  const sessionUser =
    window.chealCurrentUser;


  return sessionUser
    ? sessionUser.id
    : null;

}


/* =========================================================
   REALTIME MESSAGE SUBSCRIPTION
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
        "cheal-chat-" +
        conversationId
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
        (payload) => {

          const row =
            payload.new;


          if (
            !messages ||
            Number(
              row.conversation_id
            ) !==
            Number(
              activeConversationId
            )
          ) {

            return;

          }


          appendMessageBubble(
            row,
            true
          );

        }
      )
      .subscribe(
        (status) => {

          console.log(
            "Cheal Chat realtime:",
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
    async (event) => {

      event.preventDefault();


      const user =
        await getUser();


      if (!user) {

        alert(
          "Please sign in to send messages."
        );


        openAuth(
          "Sign in"
        );


        return;

      }


      if (!activeConversationId) {

        alert(
          "Open a conversation first."
        );


        return;

      }


      const text =
        message
          ? message.value.trim()
          : "";


      if (!text) return;


      const submitButton =
        chatForm.querySelector(
          'button[type="submit"]'
        );


      if (submitButton) {

        submitButton.disabled =
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
            "Message insert error:",
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
          "Send message error:",
          error
        );


        alert(
          "Could not send the message."
        );

      }


      finally {

        if (submitButton) {

          submitButton.disabled =
            false;

        }

      }

    };

}


/* =========================================================
   PRODUCT CHAT / INBOX BUTTON
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


      const chatSection =
        document.querySelector(
          "#chat"
        );


      if (chatSection) {

        chatSection.scrollIntoView({
          behavior: "smooth"
        });

      }

    };

}


/* =========================================================
   AUTH MODAL
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
      "Your account will allow you to buy, sell and chat.";


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


/* =========================================================
   AUTH BUTTONS
========================================================= */

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
    (event) => {

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
   LOCATION BUTTON
========================================================= */

if (locationButton) {

  locationButton.onclick =
    () => {

      alert(
        "Campus locations will be available as Cheal Market grows."
      );

    };

}


/* =========================================================
   AUTH SUBMIT
========================================================= */

if (auth) {

  auth.onsubmit =
    async (event) => {

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

        /* =================================================
           SIGN IN
        ================================================= */

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


          alert(
            "Welcome back!"
          );


          modal.classList.add(
            "hidden"
          );


          auth.reset();


          await updateAuthButtons();

          await loadConversations();


          return;

        }


        /* =================================================
           CREATE ACCOUNT
        ================================================= */

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


        /* =================================================
           CREATE PROFILE
        ================================================= */

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
              "Profile creation error:",
              profileError
            );

          }

        }


        /* =================================================
           SUCCESS MESSAGE
        ================================================= */

        if (
          !data.session
        ) {

          alert(
            "Account created! Please check your email to confirm your account, then sign in."
          );

        }

        else {

          alert(
            "Account created successfully!"
          );

        }


        modal.classList.add(
          "hidden"
        );


        auth.reset();


        await updateAuthButtons();

        await loadConversations();

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
   UPDATE AUTH BUTTONS
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
   AUTH STATE LISTENER
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

        await loadConversations();

      }

      else {

        conversations = [];

        activeConversationId =
          null;

        activeConversation =
          null;


        if (messageChannel) {

          supabaseClient
            .removeChannel(
              messageChannel
            );

          messageChannel =
            null;

        }


        renderConversationInbox();

      }

    }
  );


/* =========================================================
   START APPLICATION
========================================================= */

window.chealCurrentUser =
  null;


createCategories();

loadProducts();

updateAuthButtons();

loadConversations();
