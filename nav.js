const navHost = document.getElementById("site-header");

const navScript = document.currentScript;
const navBaseUrl = navScript && navScript.src
  ? new URL(".", navScript.src)
  : new URL("./", window.location.href);

function navPath(relativePath) {
  return new URL(relativePath, navBaseUrl).pathname;
}

if (navHost) {
  navHost.innerHTML = `
    <header class="site-header">
      <div class="container nav-wrap">
        <a href="${navPath("/")}" class="brand" aria-label="FaujiPrep home">
          <img src="${navPath("https://faujiprep.app/img/Logo.png")}" alt="FaujiPrep logo" class="brand-logo" />
        </a>

        <button class="nav-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="Toggle navigation">
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
              <a href="${navPath("practice/cognitive-tests.html")}" class="nav-link">Practice Test</a>
            </li>
          </ul>
        </nav>

        <a href="${navPath("tests/full-mock-test.html")}" class="nav-cta">Start Test</a>
      </div>
    </header>
  `;

  const navToggle = navHost.querySelector(".nav-toggle");
  const siteNav = navHost.querySelector(".site-nav");
  const navLinks = navHost.querySelectorAll(".nav-link");

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
      navToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".site-nav") && !e.target.closest(".nav-toggle")) {
      siteNav.classList.remove("open");
      document.body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
  });
}
