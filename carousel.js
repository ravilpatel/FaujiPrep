(function () {
  const carousel = document.getElementById('ppt-carousel');
  if (!carousel) {
    return;
  }

  const slides = Array.from(carousel.querySelectorAll('.ppt-slide'));
  if (slides.length === 0) {
    return;
  }

  const prevBtn = carousel.querySelector('.ppt-nav.prev');
  const nextBtn = carousel.querySelector('.ppt-nav.next');

  let current = 0;
  let timerId;

  const render = (index) => {
    current = (index + slides.length) % slides.length;
    const left = (current - 1 + slides.length) % slides.length;
    const right = (current + 1) % slides.length;

    slides.forEach((slide, idx) => {
      slide.classList.remove('is-left', 'is-center', 'is-right');
      slide.setAttribute('aria-hidden', 'true');
      if (idx === left) {
        slide.classList.add('is-left');
      } else if (idx === current) {
        slide.classList.add('is-center');
        slide.setAttribute('aria-hidden', 'false');
      } else if (idx === right) {
        slide.classList.add('is-right');
      }
    });
  };

  const next = () => render(current + 1);
  const prev = () => render(current - 1);

  const restartAuto = () => {
    if (timerId) {
      window.clearInterval(timerId);
    }
    timerId = window.setInterval(next, 7000);
  };

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      next();
      restartAuto();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prev();
      restartAuto();
    });
  }

  render(0);
  restartAuto();
})();
