let mobileToggle = document.querySelector(".mobile-toggle");
let mobileMenu = document.querySelector(".mobile-menu");
let selectorSource = document.querySelectorAll(".selector-source p");
let selectorTarget = document.querySelectorAll(".selector-target p");
let rateSource = document.querySelector(".rate-source");
let rateTarget = document.querySelector(".rate-target");
let amountSource = document.querySelector(".amount-source");
let amountTarget = document.querySelector(".amount-target");
let recentSide = null;
const ACCESS_KEY = "7b83f04bbf434bfe5e9da4b9f0c98047";
let queuedExchange = null;

const offlineMsg = document.querySelector(".offline-message");
const onlineMsg = document.querySelector(".online-message");

let debounceTimer = null;

window.addEventListener("offline", function () {
  offlineMsg.style.display = "block";
  onlineMsg.style.display = "none";
});

window.addEventListener("online", function () {
  offlineMsg.style.display = "none";
  onlineMsg.style.display = "block";
  setTimeout(function () {
    onlineMsg.style.display = "none";
  }, 3000);

  if (queuedExchange) {
    const { side, value, from, to } = queuedExchange;
    performExchange(from, to, value).then((data) => {
      if (side === "source") {
        amountTarget.value = sanitizeValue(String(data));
      } else {
        amountSource.value = sanitizeValue(String(data));
      }
      queuedExchange = null;
    });
  }
});

function performExchange(from, to, amount) {
  return fetch(
    `https://api.exchangerate.host/convert?access_key=${ACCESS_KEY}&from=${from}&to=${to}&amount=${amount}`
  )
    .then(res => res.json())
    .then(data => data.success ? data.result : "error")
    .catch(() => "error");
}

function sanitizeValue(value) {
  value = value.replace(/,/g, ".").replace(/[^\d.]/g, "");
  let dotIndex = value.indexOf(".");
  if (dotIndex !== -1) {
    let left = value.slice(0, dotIndex + 1);
    let right = value.slice(dotIndex + 1).replace(/\./g, "").slice(0, 5);
    value = left + right;
  }
  return value.startsWith(".") ? "0" + value : value;
}

mobileToggle.addEventListener("click", () => {
  mobileMenu.style.display =
    mobileMenu.style.display === "block" ? "none" : "block";
});

selectorSource.forEach((item) => {
  item.addEventListener("click", () => {
    selectorSource.forEach(b => b.classList.remove("selected-currency"));
    item.classList.add("selected-currency");
    refreshRates(getSource(), getTarget());
  });
});

selectorTarget.forEach((item) => {
  item.addEventListener("click", () => {
    selectorTarget.forEach(b => b.classList.remove("selected-currency"));
    item.classList.add("selected-currency");
    refreshRates(getSource(), getTarget());
  });
});

function refreshRates(from, to) {
  if (from === to) {
    rateSource.textContent = `1 ${from} = 1 ${to}`;
    rateTarget.textContent = `1 ${to} = 1 ${from}`;
    if (recentSide === "source") amountTarget.value = amountSource.value;
    else amountSource.value = amountTarget.value;
    return;
  }

  fetch(
    `https://api.exchangerate.host/convert?access_key=${ACCESS_KEY}&from=${from}&to=${to}&amount=1`
  )
    .then(res => res.json())
    .then(data => {
      if (!data.success) return;
      let rate = data.result;
      rateSource.textContent = `1 ${from} = ${rate.toFixed(5)} ${to}`;
      rateTarget.textContent = `1 ${to} = ${(1 / rate).toFixed(5)} ${from}`;

      if (recentSide === "source") {
        amountTarget.value = sanitizeValue(
          String((parseFloat(amountSource.value || 0) * rate).toFixed(5))
        );
      }
      if (recentSide === "target") {
        amountSource.value = sanitizeValue(
          String((parseFloat(amountTarget.value || 0) / rate).toFixed(5))
        );
      }
    });
}

amountSource.addEventListener("input", () => {
  amountSource.value = sanitizeValue(amountSource.value);
  recentSide = "source";
  handleDebouncedConvert();
});

amountTarget.addEventListener("input", () => {
  amountTarget.value = sanitizeValue(amountTarget.value);
  recentSide = "target";
  handleDebouncedConvert();
});

function handleDebouncedConvert() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const from = recentSide === "source" ? getSource() : getTarget();
    const to = recentSide === "source" ? getTarget() : getSource();
    const value = recentSide === "source" ? amountSource.value : amountTarget.value;

    if (!navigator.onLine && from !== to) {
      queuedExchange = { side: recentSide, value, from, to };
      if (recentSide === "source") amountTarget.value = "";
      else amountSource.value = "";
      return;
    }

    if (from === to) {
      if (recentSide === "source") amountTarget.value = value;
      else amountSource.value = value;
      return;
    }

    performExchange(from, to, value).then(result => {
      if (recentSide === "source") {
        amountTarget.value = sanitizeValue(String(result));
      } else {
        amountSource.value = sanitizeValue(String(result));
      }
    });
  }, 400);
}

function getSource() {
  return document.querySelector(".selector-source .selected-currency").textContent;
}

function getTarget() {
  return document.querySelector(".selector-target .selected-currency").textContent;
}
