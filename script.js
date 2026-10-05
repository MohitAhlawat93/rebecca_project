(() => {
  const header = document.querySelector('[data-header]');
  const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const dialog = document.querySelector('[data-concierge-dialog]');
  document.querySelectorAll('[data-open-concierge]').forEach((button) => {
    button.addEventListener('click', () => dialog?.showModal());
  });
  document.querySelectorAll('[data-close-concierge]').forEach((button) => {
    button.addEventListener('click', () => dialog?.close());
  });
  dialog?.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  const reviews = [...document.querySelectorAll('[data-review]')];
  const counter = document.querySelector('[data-review-count]');
  let current = 0;
  const showReview = (index) => {
    if (!reviews.length) return;
    current = (index + reviews.length) % reviews.length;
    reviews.forEach((review, i) => {
      review.hidden = i !== current;
      review.classList.toggle('is-active', i === current);
    });
    if (counter) counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(reviews.length).padStart(2, '0')}`;
  };
  document.querySelector('[data-review-prev]')?.addEventListener('click', () => showReview(current - 1));
  document.querySelector('[data-review-next]')?.addEventListener('click', () => showReview(current + 1));
  showReview(0);
})();
