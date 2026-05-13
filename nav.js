const navHost = document.getElementById("site-header");

const navScript = document.currentScript;
const navBaseUrl = navScript && navScript.src
  ? new URL(".", navScript.src)
  : new URL("./", window.location.href);

function navPath(relativePath) {
  return new URL(relativePath, navBaseUrl).pathname;
}

// Load next-practice navigator on practice pages
(function(){
  try {
    const script = document.createElement('script');
    script.src = navPath("practice/next.js");
    script.defer = true;
    document.body.appendChild(script);
  } catch (e) {
    console.error('Failed to load practice/next.js', e);
  }
})();

if (navHost) {
  navHost.innerHTML = `
    <header class="site-header">
      <div class="container nav-wrap">
        <a href="${navPath("/")}" class="brand" aria-label="FaujiPrep home - India's Largest SSB Free Material & Tests Library">
          <img src="${navPath("https://faujiprep.app/img/Logo.png")}" alt="FaujiPrep logo - India's Largest SSB Free Material & Tests Library" class="brand-logo" />
        </a>

        <button class="nav-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="Toggle navigation menu">
          &#9776;
        </button>

        <nav id="site-nav" class="site-nav" aria-label="Main navigation">
          <ul class="nav-list">
            <li class="nav-item">
              <a href="${navPath("cognitive/linguistic-abilities.html")}" class="nav-link">CSSS</a>
            </li>
            <li class="nav-item">
              <a href="${navPath("opam/olqs.html")}" class="nav-link">OPAM</a>
            </li>
            <li class="nav-item">
              <a href="${navPath("practice/cognitive-tests.html")}" class="nav-link">Practice</a>
            </li>
            <li class="nav-item">
              <a href="${navPath("blueprint.pdf")}" class="nav-link nav-link-pdf" target="_blank" rel="noopener" download="CSSS-OPAM-blueprint.pdf" aria-label="Download free CSSS and OPAM Blueprint PDF">Free Blueprint PDF</a>
            </li>
          </ul>
        </nav>

        <a href="${navPath("practice/cognitive-tests.html")}" class="nav-cta" aria-label="Start free SSB Stage 1 practice">Free Practice</a>
      </div>
    </header>
  `;

  const navToggle = navHost.querySelector(".nav-toggle");
  const siteNav = navHost.querySelector(".site-nav");
  const navLinks = navHost.querySelectorAll(".nav-link");

  // ── ACTIVE LINK DETECTION ──
  const currentPath = window.location.pathname;
  navLinks.forEach(link => {
    const linkHref = link.getAttribute('href') || '';
    // Exact match or path-contains match (excluding root to avoid false positives)
    if (linkHref && linkHref !== '/' && currentPath.includes(linkHref.split('?')[0])) {
      link.classList.add('nav-link-active');
      link.setAttribute('aria-current', 'page');
    }
  });

  // ── SKIP NAV ──
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-nav';
  skipLink.textContent = 'Skip to main content';
  document.body.insertBefore(skipLink, document.body.firstChild);
  // Ensure main has id
  const main = document.querySelector('main');
  if (main && !main.id) main.id = 'main-content';

  // ── BREADCRUMBS ──
  const brandSuffixRegex = /FaujiPrep\s*(\||\u2013|\u2014|-)?\s*India's Largest SSB Free Material & Tests Library\s*/i;
  const brandRegex = /FaujiPrep\s*[\||\u2013\u2014-]?\s*/i;

  function stripBrand(title) {
    return title.replace(brandSuffixRegex, '').replace(brandRegex, '').trim();
  }

  (function injectBreadcrumbs() {
    const path = window.location.pathname;
    const isHome = path === '/' || path.endsWith('/index.html');
    if (isHome) return;

    const crumbs = [{ label: 'Home', href: navPath('/') }];

    if (path.includes('/cognitive/')) {
      crumbs.push({ label: 'CSSS Guides', href: navPath('cognitive/linguistic-abilities.html') });
      const pageName = stripBrand(document.title);
      if (pageName) crumbs.push({ label: pageName, href: null });
    } else if (path.includes('/opam/')) {
      crumbs.push({ label: 'OPAM & OLQ', href: navPath('opam/olqs.html') });
      const pageName = stripBrand(document.title);
      if (pageName) crumbs.push({ label: pageName, href: null });
    } else if (path.includes('/practice/verbal/') || path.includes('/practice/Sustained/')) {
      crumbs.push({ label: 'Practice Zone', href: navPath('practice/cognitive-tests.html') });
      const pageName = stripBrand(document.title);
      if (pageName) crumbs.push({ label: pageName, href: null });
    } else if (path.includes('/practice/')) {
      crumbs.push({ label: 'Practice Zone', href: null });
    } else if (path.includes('/resources/')) {
      crumbs.push({ label: 'Resources', href: null });
    } else if (path.includes('/tests/')) {
      crumbs.push({ label: 'Mock Tests', href: null });
    }

    if (crumbs.length < 2) return; // only inject if we have at least Home + one more

    const breadcrumbNav = document.createElement('nav');
    breadcrumbNav.setAttribute('aria-label', 'Breadcrumb');
    breadcrumbNav.className = 'breadcrumb-nav';

    const ol = document.createElement('ol');
    ol.className = 'breadcrumb-list';
    crumbs.forEach((crumb, i) => {
      const li = document.createElement('li');
      li.className = 'breadcrumb-item';
      if (crumb.href && i < crumbs.length - 1) {
        const a = document.createElement('a');
        a.href = crumb.href;
        a.textContent = crumb.label;
        li.appendChild(a);
      } else {
        const span = document.createElement('span');
        span.setAttribute('aria-current', 'page');
        span.textContent = crumb.label;
        li.appendChild(span);
      }
      ol.appendChild(li);
    });

    breadcrumbNav.appendChild(ol);

    // Inject breadcrumb inside main, before the first section
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.insertBefore(breadcrumbNav, mainEl.firstChild);
    }

    // JSON-LD BreadcrumbList schema for SEO
    const schemaItems = crumbs
      .filter(c => c.href)
      .map((c, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "name": c.label,
        "item": "https://faujiprep.app" + c.href
      }));
    if (schemaItems.length) {
      const schemaScript = document.createElement('script');
      schemaScript.type = 'application/ld+json';
      schemaScript.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": schemaItems
      });
      document.head.appendChild(schemaScript);
    }
  })();

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", () => {
      siteNav.classList.toggle("open");
      document.body.classList.toggle("nav-open");
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!expanded));

      if (siteNav.classList.contains("open")) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    });
  }

  // Close menu when clicking on nav links
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("open");
      document.body.classList.remove("nav-open");
      if (navToggle) navToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".site-nav") && !e.target.closest(".nav-toggle")) {
      siteNav.classList.remove("open");
      document.body.classList.remove("nav-open");
      if (navToggle) navToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
  });
}
