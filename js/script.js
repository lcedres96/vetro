(function () {
  "use strict";

  // ---- marquee: rAF-driven scroll, clones enough copies to cover any viewport width ----
  var MARQUEE_SPEED = 36; // px/second
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll(".marquee-track").forEach(function (track) {
    var originalSet = track.querySelector(".marquee-set");
    if (!originalSet) return;
    var bar = track.parentElement;
    var setWidth = 0;

    function ensureCoverage() {
      setWidth = originalSet.getBoundingClientRect().width;
      if (setWidth <= 0) return;
      var needed = Math.ceil((bar.getBoundingClientRect().width * 2) / setWidth) + 1;
      var clones = track.querySelectorAll(".marquee-set:not(:first-child)");
      clones.forEach(function (c) { c.remove(); });
      for (var i = 0; i < needed - 1; i++) {
        var clone = originalSet.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        track.appendChild(clone);
      }
    }

    ensureCoverage();
    window.addEventListener("resize", ensureCoverage);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(ensureCoverage);
    }

    if (prefersReducedMotion) {
      track.style.transform = "translateX(0)";
      return;
    }

    var offset = 0;
    var lastTime = null;
    function tick(now) {
      if (lastTime !== null && setWidth > 0) {
        var dt = (now - lastTime) / 1000;
        offset += MARQUEE_SPEED * dt;
        if (offset >= setWidth) offset -= setWidth;
        track.style.transform = "translateX(-" + offset + "px)";
      }
      lastTime = now;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });

  // ---- decorative background videos: pause for reduced-motion users ----
  if (prefersReducedMotion) {
    document.querySelectorAll(".visual-blob-video video, .creamos-glass-video video, .cristallino-gem-video video, .contacto-glass-video video, .forma-video-rotator video, .page-hero-video-bg, .video-hero video").forEach(function (v) {
      v.removeAttribute("autoplay");
      v.pause();
    });
  }

  // ---- forma-teaser bg video: rotated 90deg, sized so it fills its wrap after rotating ----
  var formaWrap = document.querySelector(".forma-video-wrap");
  var formaRotator = document.querySelector(".forma-video-rotator");
  if (formaWrap && formaRotator) {
    var sizeFormaRotator = function () {
      var w = formaWrap.clientWidth;
      var h = formaWrap.clientHeight;
      formaRotator.style.width = h + "px";
      formaRotator.style.height = w + "px";
    };
    sizeFormaRotator();
    if ("ResizeObserver" in window) {
      new ResizeObserver(sizeFormaRotator).observe(formaWrap);
    } else {
      window.addEventListener("resize", sizeFormaRotator);
    }
  }

  // ---- header scroll state ----
  var header = document.getElementById("site-header");
  function onScroll() {
    if (window.scrollY > 20) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---- mobile nav toggle ----
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("main-nav");
  toggle.addEventListener("click", function () {
    var isOpen = nav.classList.toggle("open");
    toggle.classList.toggle("open", isOpen);
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      nav.classList.remove("open");
      toggle.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });

  // ---- scroll reveal ----
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in-view"); });
  }

  // ---- services category nav: mostrar una sola categoría a la vez ----
  var categoryNav = document.querySelector(".category-nav");
  if (categoryNav) {
    var catLinks = Array.prototype.slice.call(categoryNav.querySelectorAll("a"));
    var catSections = Array.prototype.slice.call(document.querySelectorAll(".service-category"));
    var validIds = catLinks.map(function (l) { return l.getAttribute("href").slice(1); });

    function showCategory(id) {
      catSections.forEach(function (section) {
        section.classList.toggle("active", section.id === id);
      });
      catLinks.forEach(function (link) {
        link.classList.toggle("active", link.getAttribute("href") === "#" + id);
      });
    }

    catLinks.forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        var id = link.getAttribute("href").slice(1);
        showCategory(id);
        history.replaceState(null, "", "#" + id);
      });
    });

    var initialId = location.hash ? location.hash.slice(1) : null;
    if (!initialId || validIds.indexOf(initialId) === -1) {
      initialId = validIds[0];
    }
    showCategory(initialId);
  }

  // ---- subservice blocks: mostrar la lista al presionar el botón ----
  document.querySelectorAll(".subservice-block").forEach(function (block) {
    var toggle = block.querySelector(".subservice-toggle");
    var panel = block.querySelector(".subservice-panel");
    if (!toggle || !panel) return;
    toggle.addEventListener("click", function () {
      var isOpen = panel.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  });

  // ---- contact form ----
  var form = document.getElementById("contact-form");
  var mensajeField = document.getElementById("mensaje");

  // Prefill message from ?asunto= query param (link comes from Servicios/Forma CTAs)
  var params = new URLSearchParams(window.location.search);
  var asunto = params.get("asunto");
  if (asunto && mensajeField && !mensajeField.value) {
    mensajeField.value = "Quiero consultar sobre: " + asunto + "\n\n";
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = document.getElementById("form-status");
      var submitBtn = form.querySelector('button[type="submit"]');

      var data = new FormData(form);
      if (asunto) data.set("asunto", asunto);

      if (submitBtn) submitBtn.disabled = true;
      if (status) {
        status.style.display = "block";
        status.textContent = "Enviando...";
      }

      fetch("contacto.php", { method: "POST", body: data })
        .then(function (res) { return res.json(); })
        .then(function (result) {
          if (status) status.textContent = result.mensaje;
          if (result.ok) form.reset();
        })
        .catch(function () {
          if (status) status.textContent = "No se pudo enviar el mensaje. Escribinos a hola@vetro.ar.";
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }
})();
