const SUPABASE_URL = "https://qwlklqjfbrhythpynghr.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_HVAjJNZAQIiyf1AosvH0A_fnYoFpHx";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


// ===============================
// DEMO PRODUCTS
// ===============================

const products = [
  ["iPhone 13 Pro", 1850000, "Phones", "Sarah", "KIU", "📱"],
  ["Samsung Galaxy A55", 980000, "Phones", "Daniel", "Makerere", "📱"],
  ["Campus Hoodie", 35000, "Clothes", "Brian", "KIU", "👕"],
  ["Sneakers", 85000, "Clothes", "Joan", "Kyambogo", "👟"],
  ["Calculus Textbook", 45000, "Books", "Irene", "KIU", "📚"],
  ["Wireless Headphones", 120000, "Electronics", "Kevin", "Makerere", "🎧"],
  ["Scientific Calculator", 55000, "Other", "Amina", "KIU", "🧮"],
  ["Laptop Stand", 65000, "Electronics", "Mark", "KIU", "💻"]
];

let active = "All";


// ===============================
// ELEMENTS
// ===============================

const productsEl = document.querySelector("#products");
const search = document.querySelector("#search");
const cats = document.querySelector("#cats");

const sellForm = document.querySelector("#sellForm");

const chatForm = document.querySelector("#chatForm");
const message = document.querySelector("#message");
const messages = document.querySelector("#messages");

const modal = document.querySelector("#modal");
const modalTitle = document.querySelector("#modalTitle");

const auth = document.querySelector("#auth");

const authName = document.querySelector("#authName");
const authEmail = document.querySelector("#authEmail");
const authPassword = document.querySelector("#authPassword");
const authCampus = document.querySelector("#authCampus");
const authSubmit = document.querySelector("#authSubmit");
const authMessage = document.querySelector("#authMessage");

const login = document.querySelector("#login");
const signup = document.querySelector("#signup");
const close = document.querySelector("#close");


// ===============================
// MONEY FORMAT
// ===============================

const money = (n) =>
  "UGX " + Number(n).toLocaleString();


// ===============================
// RENDER PRODUCTS
// ===============================

function render() {

  const q = search.value.toLowerCase().trim();

  const filtered = products.filter((p) => {

    const categoryMatch =
      active === "All" || p[2] === active;

    const searchMatch =
      p.join(" ").toLowerCase().includes(q);

    return categoryMatch && searchMatch;

  });


  if (filtered.length === 0) {

    productsEl.innerHTML = `
      <p class="muted">
        No products found.
      </p>
    `;

    return;
  }


  productsEl.innerHTML = filtered.map((p) => {

    return `
      <article class="product">

        <div class="pic">
          ${p[5]}
        </div>

        <h3>
          ${p[0]}
        </h3>

        <b>
          ${money(p[1])}
        </b>

        <p class="muted">
          ${p[3]} · ${p[4]}
        </p>

        <button
          type="button"
          onclick="document.querySelector('#chat').scrollIntoView({behavior:'smooth'})"
        >
          Chat with seller
        </button>

      </article>
    `;

  }).join("");

}


// ===============================
// CATEGORIES
// ===============================

[
  "All",
  "Phones",
  "Clothes",
  "Books",
  "Electronics",
  "Other"
].forEach((category) => {

  const button = document.createElement("button");

  button.className =
    "cat " + (category === "All" ? "active" : "");

  button.textContent = category;


  button.onclick = () => {

    active = category;

    document
      .querySelectorAll(".cat")
      .forEach((x) => x.classList.remove("active"));

    button.classList.add("active");

    render();

  };


  cats.appendChild(button);

});


search.oninput = render;


// ===============================
// CHECK LOGIN
// ===============================

async function getUser() {

  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  return user;

}


// ===============================
// SELL PRODUCT
// ===============================

sellForm.onsubmit = async (e) => {

  e.preventDefault();


  const user = await getUser();


  if (!user) {

    alert(
      "Please create an account or sign in before listing a product."
    );

    openAuth("Create account");

    return;
  }


  const productName =
    document.querySelector("#name").value.trim();

  const price =
    Number(document.querySelector("#price").value);

  const category =
    document.querySelector("#cat").value;

  const sellerName =
    document.querySelector("#seller").value.trim();

  const campus =
    document.querySelector("#campus").value.trim();

  const description =
    document.querySelector("#desc").value.trim();


  try {

    const { error } =
      await supabaseClient
        .from("products")
        .insert({

          seller_id: user.id,

          name: productName,

          price: price,

          category: category,

          seller_name: sellerName,

          campus: campus,

          description: description

        });


    if (error) {

      console.error(error);

      alert(
        "Could not list the product: " +
        error.message
      );

      return;
    }


    products.unshift([
      productName,
      price,
      category,
      sellerName,
      campus,
      "🛍️"
    ]);


    render();

    sellForm.reset();


    alert(
      "Your product has been listed successfully!"
    );


  } catch (error) {

    console.error(error);

    alert(
      "Something went wrong. Please try again."
    );

  }

};


// ===============================
// CHAT
// ===============================

chatForm.onsubmit = async (e) => {

  e.preventDefault();


  const user = await getUser();


  if (!user) {

    alert(
      "Please sign in to send messages."
    );

    openAuth("Sign in");

    return;
  }


  const text = message.value.trim();


  if (!text) return;


  const p = document.createElement("p");

  p.className = "buyerMsg";

  p.textContent = text;


  messages.appendChild(p);

  message.value = "";

};


// ===============================
// AUTH MODAL
// ===============================

let authMode = "signup";


function openAuth(title) {

  modalTitle.textContent = title;

  modal.classList.remove("hidden");


  if (title === "Sign in") {

    authMode = "signin";

    authSubmit.textContent = "Sign in";

    authMessage.textContent =
      "Sign in to buy, sell and chat.";

    authName.style.display = "none";

    authCampus.style.display = "none";

    authName.required = false;

    authCampus.required = false;

    authPassword.autocomplete = "current-password";

  } else {

    authMode = "signup";

    authSubmit.textContent = "Create account";

    authMessage.textContent =
      "Your account will allow you to buy, sell and chat.";

    authName.style.display = "";

    authCampus.style.display = "";

    authName.required = true;

    authCampus.required = true;

    authPassword.autocomplete = "new-password";

  }

}


// ===============================
// OPEN / CLOSE AUTH
// ===============================

login.onclick = () => {

  openAuth("Sign in");

};


signup.onclick = () => {

  openAuth("Create account");

};


close.onclick = () => {

  modal.classList.add("hidden");

};


// Close modal when clicking outside box

modal.onclick = (e) => {

  if (e.target === modal) {

    modal.classList.add("hidden");

  }

};


// ===============================
// SIGN IN / CREATE ACCOUNT
// ===============================

auth.onsubmit = async (e) => {

  e.preventDefault();


  const email =
    authEmail.value.trim();

  const password =
    authPassword.value;


  authSubmit.disabled = true;

  authSubmit.textContent = "Please wait...";


  try {

    // ---------------------------
    // SIGN IN
    // ---------------------------

    if (authMode === "signin") {

      const {
        data,
        error
      } = await supabaseClient.auth.signInWithPassword({

        email: email,

        password: password

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


      modal.classList.add("hidden");

      auth.reset();


      updateAuthButtons();


      return;
    }


    // ---------------------------
    // CREATE ACCOUNT
    // ---------------------------

    const fullName =
      authName.value.trim();

    const campus =
      authCampus.value;


    const {
      data,
      error
    } = await supabaseClient.auth.signUp({

      email: email,

      password: password,

      options: {

        data: {

          full_name: fullName,

          campus: campus

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


    // If a session is immediately available,
    // create the profile.

    if (data.user && data.session) {

      const {
        error: profileError
      } = await supabaseClient
        .from("profiles")
        .insert({

          id: data.user.id,

          full_name: fullName,

          campus: campus

        });


      if (
        profileError &&
        !profileError.message
          .toLowerCase()
          .includes("duplicate")
      ) {

        console.error(profileError);

      }

    }


    if (!data.session) {

      alert(
        "Account created! Please check your email to confirm your account, then sign in."
      );

    } else {

      alert(
        "Account created successfully!"
      );

    }


    modal.classList.add("hidden");

    auth.reset();

    updateAuthButtons();


  } catch (error) {

    console.error(error);

    alert(
      "Something went wrong. Please try again."
    );

  } finally {

    authSubmit.disabled = false;

    authSubmit.textContent =
      authMode === "signin"
        ? "Sign in"
        : "Create account";

  }

};


// ===============================
// UPDATE AUTH BUTTONS
// ===============================

async function updateAuthButtons() {

  const user = await getUser();


  if (user) {

    login.textContent = "Signed in";

    signup.textContent = "Account";

  } else {

    login.textContent = "Sign in";

    signup.textContent = "Create account";

  }

}


// ===============================
// AUTH STATE LISTENER
// ===============================

supabaseClient.auth.onAuthStateChange(
  (event, session) => {

    updateAuthButtons();

  }
);


// ===============================
// START APP
// ===============================

render();

updateAuthButtons();
