/* =========================================================
   CHEAL MARKET — APP.JS
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


        <button
          type="button"
          class="productChatButton"
          onclick="openProductChat()"
        >
          💬 Chat with seller
        </button>

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
   PRODUCT CHAT
========================================================= */

function openProductChat() {

  const chatSection =
    document.querySelector(
      "#chat"
    );


  if (!chatSection) return;


  chatSection.scrollIntoView({
    behavior: "smooth"
  });


  const input =
    document.querySelector(
      "#message"
    );


  if (input) {

    setTimeout(
      () => input.focus(),
      500
    );

  }

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
   CHAT
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


      const text =
        message
          ? message.value.trim()
          : "";


      if (!text) return;


      const bubble =
        document.createElement(
          "div"
        );


      bubble.className =
        "buyerMsg";


      bubble.textContent =
        text;


      messages.appendChild(
        bubble
      );


      messages.scrollTop =
        messages.scrollHeight;


      message.value = "";

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
   MESSAGES BUTTON
========================================================= */

if (messagesButton) {

  messagesButton.onclick =
    () => {

      document
        .querySelector(
          "#chat"
        )
        ?.scrollIntoView({
          behavior: "smooth"
        });

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


          updateAuthButtons();


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


        updateAuthButtons();

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
    () => {

      updateAuthButtons();

    }
  );


/* =========================================================
   START APPLICATION
========================================================= */

createCategories();

loadProducts();

updateAuthButtons();
