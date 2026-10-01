// TODO: YANDEX_METRIKA_ID — указать номер счётчика перед запуском рекламы
const CONFIG = {
  LEAD_ENDPOINT: "send.php",
  YANDEX_METRIKA_ID: null,
};

document.addEventListener("DOMContentLoaded", () => {
  initHeaderScroll();
  initBurgerMenu();
  initScrollButtons();
  initCalculator();
  initAccordion();
  initPhoneMask();
  initLeadForm();
  initTrackedLinks();
  initContactWidget();
  initCookieBanner();
  initGalleries();
});

function initHeaderScroll() {
  const header = document.getElementById("header");
  if (!header) return;
  window.addEventListener("scroll", () => {
    header.classList.toggle("is-scrolled", window.scrollY > 10);
  });
}

function initBurgerMenu() {
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");
  if (!burger || !nav) return;
  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    burger.classList.toggle("is-active", open);
    burger.setAttribute("aria-expanded", String(open));
  };
  burger.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });
}

function initScrollButtons() {
  document.querySelectorAll("[data-scroll-to]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.querySelector(btn.dataset.scrollTo);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function initCalculator() {
  const range = document.getElementById("areaRange");
  const areaValue = document.getElementById("areaValue");
  const cards = document.querySelectorAll(".tariff-card");
  if (!range) return;

  const update = () => {
    const area = Number(range.value);
    areaValue.textContent = area;
    cards.forEach((card) => {
      const rate = Number(card.dataset.rate);
      const price = Math.round((rate * area) / 1000) * 1000;
      const priceEl = card.querySelector(".calc-price");
      if (priceEl) priceEl.textContent = price.toLocaleString("ru-RU");
    });
  };

  range.addEventListener("input", update);
  update();
}

function initAccordion() {
  document.querySelectorAll(".accordion-item__head").forEach((head) => {
    head.addEventListener("click", () => {
      const item = head.closest(".accordion-item");
      const body = item.querySelector(".accordion-item__body");
      const isOpen = item.classList.contains("is-open");

      item.classList.toggle("is-open", !isOpen);
      body.style.maxHeight = !isOpen ? body.scrollHeight + "px" : "0px";
    });
  });
}

function initPhoneMask() {
  const input = document.querySelector('input[name="phone"]');
  if (!input) return;

  input.addEventListener("input", () => {
    let digits = input.value.replace(/\D/g, "");
    if (digits.startsWith("8")) digits = "7" + digits.slice(1);
    if (!digits.startsWith("7")) digits = "7" + digits;
    digits = digits.slice(0, 11);

    let formatted = "+7";
    if (digits.length > 1) formatted += " (" + digits.slice(1, 4);
    if (digits.length >= 4) formatted += ") " + digits.slice(4, 7);
    if (digits.length >= 7) formatted += "-" + digits.slice(7, 9);
    if (digits.length >= 9) formatted += "-" + digits.slice(9, 11);

    input.value = formatted;
  });
}

function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const utm = {};
  keys.forEach((key) => {
    if (params.get(key)) utm[key] = params.get(key);
  });
  return utm;
}

function initLeadForm() {
  const form = document.getElementById("leadForm");
  const status = document.getElementById("formStatus");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const phone = form.phone.value.trim();

    if (!name || !phone || !form.consent.checked) {
      status.textContent = "Заполните имя, телефон и согласие на обработку данных";
      status.className = "form-status error";
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    status.textContent = "Отправляем...";
    status.className = "form-status";

    const utm = getUtmParams();
    const website = form.website ? form.website.value : "";
    const ok = await sendLead({ name, phone, website, utm });

    submitBtn.disabled = false;

    if (ok) {
      status.textContent = "Заявка отправлена! Мы скоро перезвоним.";
      status.className = "form-status success";
      form.reset();
      trackGoal("lead_form_submit");
    } else {
      status.textContent = "Не получилось отправить. Позвоните нам напрямую: +7 (902) 940-79-19";
      status.className = "form-status error";
    }
  });
}

async function sendLead({ name, phone, website, utm }) {
  try {
    const res = await fetch(CONFIG.LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, website, utm }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.ok === true;
  } catch (err) {
    console.error("Ошибка отправки заявки:", err);
    return false;
  }
}

function initTrackedLinks() {
  document.querySelectorAll("[data-track]").forEach((el) => {
    el.addEventListener("click", () => trackGoal(el.dataset.track));
  });
}

function trackGoal(goalName) {
  if (typeof window.ym === "function" && CONFIG.YANDEX_METRIKA_ID) {
    window.ym(CONFIG.YANDEX_METRIKA_ID, "reachGoal", goalName);
  }
}

function initContactWidget() {
  const widget = document.getElementById("contactWidget");
  const toggle = document.getElementById("contactToggle");
  const close = document.getElementById("contactClose");
  if (!widget || !toggle) return;

  toggle.addEventListener("click", () => widget.classList.toggle("is-open"));
  close?.addEventListener("click", () => widget.classList.remove("is-open"));

  document.addEventListener("click", (e) => {
    if (!widget.contains(e.target)) widget.classList.remove("is-open");
  });
}

function initCookieBanner() {
  const banner = document.getElementById("cookieBanner");
  const accept = document.getElementById("cookieAccept");
  if (!banner || !accept) return;

  let accepted = false;
  try {
    accepted = localStorage.getItem("cookieAccepted") === "1";
  } catch (e) {}
  if (accepted) return;

  banner.hidden = false;
  accept.addEventListener("click", () => {
    try {
      localStorage.setItem("cookieAccepted", "1");
    } catch (e) {}
    banner.hidden = true;
  });
}

function initGalleries() {
  document.querySelectorAll("[data-gallery]").forEach((gallery) => {
    const track = gallery.querySelector(".gallery__track");
    const prev = gallery.querySelector(".gallery__btn--prev");
    const next = gallery.querySelector(".gallery__btn--next");
    const counter = gallery.querySelector(".gallery__counter");
    const total = track.children.length;
    if (total < 2) { [prev, next, counter].forEach((el) => el && el.remove()); return; }
    if (!prev || !next) return;

    const current = () => Math.round(track.scrollLeft / track.clientWidth);
    const update = () => {
      const i = current();
      counter.textContent = `${i + 1} / ${total}`;
      prev.disabled = i === 0;
      next.disabled = i === total - 1;
    };
    const go = (step) => track.scrollTo({ left: (current() + step) * track.clientWidth });

    prev.addEventListener("click", () => go(-1));
    next.addEventListener("click", () => go(1));
    track.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
    update();
  });
}
