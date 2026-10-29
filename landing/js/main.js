import { initDemo } from './demo.js';

const ZOOM = {
  gost: {
    src: 'assets/img/gost-gear-2800.webp',
    alt: 'Чертёж зубчатого колеса по ГОСТ: главный вид с размерами, разрез Б–Б, вид слева и основная надпись.',
    caption: 'ГОСТ. Зубчатое колесо «Привод масляного насоса», лист построен генератором по STEP-модели.',
  },
  iso: {
    src: 'assets/img/iso-fork-2400.webp',
    alt: 'Чертёж вилки с валом по ISO: разрез D–D, вид сбоку, вид сверху, допуски, шероховатость и примечания.',
    caption: 'ISO. Вилка с валом, лист построен генератором по STEP-модели.',
  },
};

function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
}

function initZoom() {
  const dialog = document.getElementById('zoom-dialog');
  const image = document.getElementById('zoom-image');
  const caption = document.getElementById('zoom-caption');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  document.querySelectorAll('[data-zoom]').forEach((button) => {
    button.addEventListener('click', () => {
      const item = ZOOM[button.dataset.zoom];
      if (!item) return;
      image.src = item.src;
      image.alt = item.alt;
      caption.textContent = item.caption;
      dialog.showModal();
    });
  });

  // щелчок по затемнению вокруг окна закрывает его
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}

initNav();
initZoom();
initDemo();
