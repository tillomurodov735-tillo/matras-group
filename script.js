// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Meta Pixel: track phone CTA clicks as Lead events
document.querySelectorAll('a[href^="tel:"]').forEach(link => {
  link.addEventListener('click', () => {
    if (typeof fbq === 'function') {
      fbq('track', 'Lead', { content_name: 'phone_click' });
    }
  });
});

// Image carousels in catalog cards
document.querySelectorAll('.carousel').forEach(carousel => {
  const track = carousel.querySelector('.carousel-track');
  const slides = track ? track.querySelectorAll('img') : [];
  const dots = carousel.querySelectorAll('.carousel-dot');
  const prev = carousel.querySelector('.carousel-arrow.prev');
  const next = carousel.querySelector('.carousel-arrow.next');
  if (!track || slides.length < 2) return;

  let index = 0;
  const count = slides.length;

  function go(i) {
    index = (i + count) % count;
    track.style.transform = 'translateX(' + (-index * 100) + '%)';
    dots.forEach((d, di) => d.classList.toggle('active', di === index));
  }

  if (prev) prev.addEventListener('click', () => go(index - 1));
  if (next) next.addEventListener('click', () => go(index + 1));
  dots.forEach((d, di) => d.addEventListener('click', () => go(di)));

  // Touch swipe
  let startX = 0, dragging = false;
  carousel.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX; dragging = true;
  }, { passive: true });
  carousel.addEventListener('touchend', e => {
    if (!dragging) return;
    dragging = false;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) go(dx < 0 ? index + 1 : index - 1);
  });
});

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => observer.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('is-visible'));
}

// Order form -> Google Sheets (Apps Script)
const ORDER_FORM_ENDPOINT = "https://script.google.com/macros/s/AKfycbx8n6MszNAjtoMnKoschAeNOwPNwA5A_UU2h31OUAfvX3WAi2Vu98Lk_wuoPJ3Pd41Hsg/exec";

// Capture UTM parameters from the URL (from ad campaigns)
const urlParams = new URLSearchParams(window.location.search);
const utmSource = urlParams.get('utm_source') || '';
const utmCampaign = urlParams.get('utm_campaign') || '';

// "Buyurtma berish" buttons set the model, then scroll to the form
const orderModelInput = document.getElementById('orderModel');
document.querySelectorAll('.js-order').forEach(btn => {
  btn.addEventListener('click', () => {
    const model = btn.getAttribute('data-model') || '';
    if (orderModelInput) orderModelInput.value = model;
    // focus the first field shortly after the scroll begins
    setTimeout(() => {
      const nameField = document.querySelector('#orderForm input[name="ism"]');
      if (nameField) nameField.focus();
    }, 500);
  });
});

const orderForm = document.getElementById('orderForm');
if (orderForm) {
  const statusEl = document.getElementById('formStatus');
  const submitBtn = document.getElementById('orderSubmit');

  orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      ism: orderForm.ism.value.trim(),
      telefon: orderForm.telefon.value.trim(),
      model: (orderModelInput && orderModelInput.value) || '',
      utm_source: utmSource,
      utm_campaign: utmCampaign
    };

    if (!data.ism || !data.telefon) {
      statusEl.textContent = "Iltimos, ism va telefon raqamini kiriting.";
      statusEl.className = 'form-status error';
      return;
    }

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Yuborilmoqda...";
    statusEl.textContent = "";
    statusEl.className = 'form-status';

    try {
      await fetch(ORDER_FORM_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data)
      });
      statusEl.textContent = "Rahmat! So'rovingiz qabul qilindi. Operatorimiz tez orada siz bilan bog'lanadi.";
      statusEl.className = 'form-status success';
      orderForm.reset();
      if (orderModelInput) orderModelInput.value = '';
      if (typeof fbq === 'function') {
        fbq('track', 'Lead', { content_name: 'order_form', content_category: data.model });
      }
    } catch (err) {
      statusEl.textContent = "Xatolik yuz berdi. Iltimos, to'g'ridan-to'g'ri qo'ng'iroq qiling.";
      statusEl.className = 'form-status error';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}
