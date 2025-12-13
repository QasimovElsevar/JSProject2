const menu = document.querySelector(".menu");
const menuOpen = document.querySelector(".menu-open");
const buttonsLeft = document.querySelectorAll(".buttons-left p");
const buttonsRight = document.querySelectorAll(".buttons-right p");
const changeLeft = document.querySelector(".change-left");
const changeRight = document.querySelector(".change-right");
const inputLeft = document.querySelector(".input-left");
const inputRight = document.querySelector(".input-right");
const noInternetElement = document.querySelector(".no-internet");
const internetElement = document.querySelector(".internet");
 //  STATE
const API_KEY = "e2ce74fd7513a2726887672ec8f5bedb";
let lastChanged = null;
let pendingConversion = null;

// EVENTS

menu.addEventListener("click", toggleMenu);

buttonsLeft.forEach(btn =>
  btn.addEventListener("click", () => handleCurrencyChange("left", btn))
);

buttonsRight.forEach(btn =>
  btn.addEventListener("click", () => handleCurrencyChange("right", btn))
);

inputLeft.addEventListener("input", () => handleInput("left"));
inputRight.addEventListener("input", () => handleInput("right"));

window.addEventListener("offline", handleOffline);
window.addEventListener("online", handleOnline);

//   UI FUNCTIONS

function toggleMenu() {
  menuOpen.style.display =
    (menuOpen.style.display === "block" ? "none" : "block");
}

function handleCurrencyChange(side, btn) {
  const group = side === "left" ? buttonsLeft : buttonsRight;
  group.forEach(b => b.classList.remove("active-button"));
  btn.classList.add("active-button");

  update(getLeftCurrency(), getRightCurrency());
}

window.addEventListener("resize", () => {
  if (window.innerWidth >= 1024) {
    menuOpen.style.display = "none";
  }
});

 //  INPUT 

function handleInput(side) {
  const input = side === "left" ? inputLeft : inputRight;
  const otherInput = side === "left" ? inputRight : inputLeft;

  input.value = cleanInput(input.value);
  lastChanged = side;

  const from = side === "left" ? getLeftCurrency() : getRightCurrency();
  const to = side === "left" ? getRightCurrency() : getLeftCurrency();

  if (!navigator.onLine && from !== to) {
    otherInput.value = "";
    pendingConversion = { side, value: input.value, from, to };
    return;
  }

  if (from === to) {
    otherInput.value = input.value;
    update(from, to);
    return;
  }

  convertCurrency(from, to, input.value).then(result => {
    otherInput.value = cleanInput(String(result));
  });
}

 //  CURRENCY 

function update(from, to) {
  if (from === to) {
    setRateText(1, 1, from, to);
    syncInputs();
    return;
  }

  fetchRate(from, to, changeLeft, "left");
  fetchRate(to, from, changeRight, "right");
}

function fetchRate(from, to, outputEl, side) {
  fetch(
    `https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=1&access_key=${API_KEY}`
  )
    .then(res => res.json())
    .then(data => {
      if (!data.success) throw new Error();

      const rate = data.result;
      outputEl.textContent = `1 ${from} = ${rate.toFixed(5)} ${to}`;

      if (lastChanged === side) {
        applyRate(side, rate);
      }
    })
    .catch(() => {
      outputEl.textContent = "Error fetching rate";
    });
}

function applyRate(side, rate) {
  if (side === "left") {
    inputRight.value = cleanInput(
      (parseFloat(inputLeft.value || 0) * rate).toFixed(5)
    );
  } else {
    inputLeft.value = cleanInput(
      (parseFloat(inputRight.value || 0) * rate).toFixed(5)
    );
  }
}

//   API

function convertCurrency(from, to, amount) {
  return fetch(
    `https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=${amount}&access_key=${API_KEY}`
  )
    .then(res => res.json())
    .then(data => (data.success ? data.result : "error"))
    .catch(() => "error");
}

//   HELPERS

function getLeftCurrency() {
  return document.querySelector(".buttons-left .active-button").textContent;
}

function getRightCurrency() {
  return document.querySelector(".buttons-right .active-button").textContent;
}

function syncInputs() {
  if (lastChanged === "left") {
    inputRight.value = inputLeft.value;
  } else {
    inputLeft.value = inputRight.value;
  }
}

function setRateText(l, r, from, to) {
  changeLeft.textContent = `1 ${from} = ${l} ${to}`;
  changeRight.textContent = `1 ${to} = ${r} ${from}`;
}

//   INPUT CLEAN

function cleanInput(value) {
  value = value
    .replace(/\s/g, "")
    .replace(/[^0-9.,]/g, "")
    .replace(/,/g, ".");
  value = oneDot(value);
  if (value.startsWith(".")) value = "0" + value;

  const parts = value.split(".");
  if (parts.length === 2) parts[1] = parts[1].slice(0, 5);
  return parts.join(".");
}

function oneDot(value) {
  const i = value.indexOf(".");
  return i === -1
    ? value
    : value.slice(0, i + 1) + value.slice(i + 1).replace(/\./g, "");
}

//   ONLINE / OFFLINE

function handleOffline() {
  noInternetElement.style.display = "block";
  internetElement.style.display = "none";
}

function handleOnline() {
  noInternetElement.style.display = "none";
  internetElement.style.display = "block";

  setTimeout(() => {
    internetElement.style.display = "none";
  }, 3000);

  if (pendingConversion) {
    const { side, value, from, to } = pendingConversion;
    convertCurrency(from, to, value).then(result => {
      if (side === "left") inputRight.value = cleanInput(String(result));
      else inputLeft.value = cleanInput(String(result));
      pendingConversion = null;
    });
  }
}
