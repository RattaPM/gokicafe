/* Goki's Café — site behaviour */
(function () {
  "use strict";

  /* ---- mobile sheet ---- */
  var toggle = document.querySelector(".nav__toggle");
  var sheet = document.querySelector(".sheet");
  var sheetClose = document.querySelector(".sheet__close");
  function setSheet(open) {
    if (!sheet || !toggle) return;
    sheet.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  }
  if (toggle) toggle.addEventListener("click", function () { setSheet(!sheet.classList.contains("open")); });
  if (sheetClose) sheetClose.addEventListener("click", function () { setSheet(false); });
  if (sheet) sheet.addEventListener("click", function (e) { if (e.target.closest(".sheet__links a")) setSheet(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { setSheet(false); closeLightbox(); } });

  /* ---- opening hours: live "open now" + today highlight ---- */
  // Goki's Café: Thursday(4) to Monday(1), 09:00–17:00, Europe/Amsterdam
  var OPEN_DAYS = [4, 5, 6, 0, 1]; // Thu Fri Sat Sun Mon
  var OPEN_H = 9, CLOSE_H = 17;
  function amsNow() {
    var s = new Date().toLocaleString("en-US", { timeZone: "Europe/Amsterdam" });
    return new Date(s);
  }
  function updateHours() {
    var now = amsNow();
    var day = now.getDay();
    var hour = now.getHours() + now.getMinutes() / 60;
    var isOpenDay = OPEN_DAYS.indexOf(day) !== -1;
    var openNow = isOpenDay && hour >= OPEN_H && hour < CLOSE_H;
    // today's row highlight
    document.querySelectorAll(".h-row[data-days]").forEach(function (row) {
      var days = row.getAttribute("data-days").split(",").map(Number);
      row.classList.toggle("today", days.indexOf(day) !== -1);
    });
    // status pill(s)
    var label;
    if (openNow) {
      label = "Open now · until 17:00";
    } else if (isOpenDay && hour < OPEN_H) {
      label = "Opens today at 9:00";
    } else {
      // find next open day
      for (var i = 1; i <= 7; i++) {
        var d = (day + i) % 7;
        if (OPEN_DAYS.indexOf(d) !== -1) {
          var names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          label = (i === 1 ? "Closed · opens tomorrow at 9:00" : "Closed · opens " + names[d] + " at 9:00");
          break;
        }
      }
    }
    document.querySelectorAll("[data-open-now]").forEach(function (el) {
      el.textContent = label;
      el.classList.toggle("is-open", openNow);
    });
  }
  updateHours();

  /* ---- menu flip (mobile) ---- */
  var flip = document.querySelector(".flip");
  if (flip) {
    var dots = flip.parentElement.querySelectorAll(".flip-dots span");
    function setFlip(flipped) {
      flip.classList.toggle("flipped", flipped);
      var front = flip.querySelector(".flip__face--front");
      var back = flip.querySelector(".flip__face--back");
      if (front) front.setAttribute("aria-hidden", String(flipped));
      if (back) back.setAttribute("aria-hidden", String(!flipped));
      if (dots.length === 2) { dots[0].classList.toggle("on", !flipped); dots[1].classList.toggle("on", flipped); }
    }
    flip.addEventListener("click", function () { setFlip(!flip.classList.contains("flipped")); });
    var ftog = document.querySelector(".flip-toggle");
    if (ftog) ftog.addEventListener("click", function (e) { e.stopPropagation(); setFlip(!flip.classList.contains("flipped")); });
  }

  /* ---- lightbox (desktop menu zoom) ---- */
  var lb = document.querySelector(".lightbox");
  var lbImg = lb ? lb.querySelector("img") : null;
  function openLightbox(src, alt) {
    if (!lb) return;
    lbImg.src = src; lbImg.alt = alt || "";
    lb.classList.add("open"); document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove("open"); document.body.style.overflow = "";
  }
  document.querySelectorAll("[data-zoom]").forEach(function (el) {
    el.addEventListener("click", function () {
      var img = el.querySelector("img") || el;
      openLightbox(img.getAttribute("data-full") || img.src, img.alt);
    });
  });
  if (lb) {
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.closest(".lightbox__close")) closeLightbox(); });
  }

  /* ---- carousels (reasons + reviews) ---- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-carousel]"), function (root) {
    var vp = root.querySelector(".carousel__viewport");
    var track = root.querySelector(".carousel__track");
    if (!vp || !track || !track.children.length) return;
    var items = Array.prototype.slice.call(track.children);
    var prev = root.querySelector("[data-prev]");
    var next = root.querySelector("[data-next]");
    var dotsWrap = root.querySelector("[data-dots]");
    var dots = [];

    if (dotsWrap) {
      items.forEach(function (_, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "carousel__dot";
        b.setAttribute("aria-label", "Go to item " + (i + 1));
        b.addEventListener("click", function () { goTo(i); });
        dotsWrap.appendChild(b);
        dots.push(b);
      });
    }

    function gap() {
      var cs = getComputedStyle(track);
      return parseFloat(cs.columnGap || cs.gap) || 0;
    }
    function step() { return items[0].getBoundingClientRect().width + gap(); }
    function index() { return Math.round(vp.scrollLeft / step()); }
    function goTo(i) {
      i = Math.max(0, Math.min(items.length - 1, i));
      vp.scrollTo({ left: Math.round(i * step()), behavior: "smooth" });
    }
    function sync() {
      var overflow = track.scrollWidth - vp.clientWidth > 2;
      root.classList.toggle("is-static", !overflow);
      var max = vp.scrollWidth - vp.clientWidth;
      if (prev) prev.disabled = vp.scrollLeft <= 2;
      if (next) next.disabled = vp.scrollLeft >= max - 2;
      var idx = index();
      dots.forEach(function (d, i) {
        var on = i === idx;
        d.classList.toggle("on", on);
        d.setAttribute("aria-current", on ? "true" : "false");
      });
    }

    if (prev) prev.addEventListener("click", function () { vp.scrollBy({ left: -step(), behavior: "smooth" }); });
    if (next) next.addEventListener("click", function () { vp.scrollBy({ left: step(), behavior: "smooth" }); });

    var tmr;
    vp.addEventListener("scroll", function () { clearTimeout(tmr); tmr = setTimeout(sync, 70); }, { passive: true });
    window.addEventListener("resize", function () { clearTimeout(tmr); tmr = setTimeout(sync, 120); });
    sync();
  });

})();
