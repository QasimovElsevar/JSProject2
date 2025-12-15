const buttonsLeft = document.querySelectorAll(".buttons-left p");
const buttonsRight = document.querySelectorAll(".buttons-right p");
const inputLeft = document.querySelector(".input-left");
const inputRight = document.querySelector(".input-right");
const changeLeft = document.querySelector(".change-left");
const changeRight = document.querySelector(".change-right");
const noInternetElement = document.querySelector(".no-internet");
const internetElement = document.querySelector(".internet");
const menu = document.querySelector(".menu");
const menuOpen = document.querySelector(".menu-open");

const API_KEY = "7b83f04bbf434bfe5e9da4b9f0c98047";
let lastChanged = null;
let savedConvert = null;
let inputTimer = null;

menu.addEventListener("click", toggleMenu);

inputLeft.addEventListener("input", () => handleInput("left"));
inputRight.addEventListener("input", () => handleInput("right"));

window.addEventListener("offline", handleOffline);
window.addEventListener("online", handleOnline);

buttonsLeft.forEach(btn =>
  btn.addEventListener("click", () => handleCurrencyChange("left", btn))
);

buttonsRight.forEach(btn =>
  btn.addEventListener("click", () => handleCurrencyChange("right", btn))
);

window.addEventListener("resize", () => {
  if (window.innerWidth >= 1024) {
    menuOpen.style.display = "none";
  }
});

function toggleMenu() {
  menuOpen.style.display =
    menuOpen.style.display === "block" ? "none" : "block";
}

function handleCurrencyChange(side, btn) {
  const group = side === "left" ? buttonsLeft : buttonsRight;
  group.forEach(b => b.classList.remove("active-button"));
  btn.classList.add("active-button");
  update(getLeftCurrency(), getRightCurrency());
}

function handleInput(side) {
  let input;
  let otherInput;
  let from;
  let to;

  if (side === "left") {
    input = inputLeft;
    otherInput = inputRight;
    from = getLeftCurrency();
    to = getRightCurrency();
  } else {
    input = inputRight;
    otherInput = inputLeft;
    from = getRightCurrency();
    to = getLeftCurrency();
  }

  input.value = cleanInput(input.value);
  lastChanged = side;

  if (!navigator.onLine && from !== to) {
    otherInput.value = "";
    savedConvert = { side, value: input.value, from, to };
    return;
  }

  if (from === to) {
    otherInput.value = input.value;
    update(from, to);
    return;
  }

  clearTimeout(inputTimer);

  inputTimer = setTimeout(() => {
    convertCurrency(from, to, input.value).then(result => {
      otherInput.value = cleanInput(String(result));
    });
  }, 400);
}

function update(from, to) {
  if (from === to) {
    changeLeft.textContent = `1 ${from} = 1 ${to}`;
    changeRight.textContent = `1 ${to} = 1 ${from}`;
    syncInputs();
    return;
  }

  fetch(
    `https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=1&access_key=${API_KEY}`
  )
    .then(res => res.json())
    .then(data => {
      if (!data.success) return;

      const rate = data.result;

      changeLeft.textContent = `1 ${from} = ${rate.toFixed(5)} ${to}`;
      changeRight.textContent = `1 ${to} = ${(1 / rate).toFixed(5)} ${from}`;

      if (lastChanged === "left") {
        inputRight.value = cleanInput(
          String((parseFloat(inputLeft.value || 0) * rate).toFixed(5))
        );
      }

      if (lastChanged === "right") {
        inputLeft.value = cleanInput(
          String((parseFloat(inputRight.value || 0) / rate).toFixed(5))
        );
      }
    });
}

function convertCurrency(from, to, amount) {
  return fetch(
    `https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=${amount}&access_key=${API_KEY}`
  )
    .then(res => res.json())
    .then(data => (data.success ? data.result : "error"))
    .catch(() => "error");
}

function cleanInput(value) {
  value = value.replace(/,/g, ".").replace(/[^\d.]/g, "");

  let dotIndex = value.indexOf(".");
  if (dotIndex !== -1) {
    let left = value.slice(0, dotIndex + 1);
    let right = value.slice(dotIndex + 1).replace(/\./g, "").slice(0, 5);
    value = left + right;
  }

  return value.startsWith(".") ? "0" + value : value;
}

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

  if (savedConvert) {
    const { side, value, from, to } = savedConvert;
    convertCurrency(from, to, value).then(result => {
      if (side === "left") inputRight.value = cleanInput(String(result));
      else inputLeft.value = cleanInput(String(result));
      savedConvert = null;
    });
  }
}

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
