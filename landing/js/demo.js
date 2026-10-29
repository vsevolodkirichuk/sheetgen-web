import { buildSheet, dimensionCount, LAYERS, STANDARDS } from './sheet.js';

const MAX_SIZE = 30 * 1024 * 1024;
const ALLOWED = ['step', 'stp', 'iges', 'igs'];

const BUILD_STAGES = [
  ['В очереди', 300],
  ['Строятся виды и разрезы', 650],
  ['Проставляются размеры', 700],
  ['Компонуется лист', 350],
];

const SUMMARY = {
  GOST: 'ГОСТ, A4, масштаб 1:1',
  ISO: 'ISO, A4, масштаб 1:1',
  ASME: 'ASME, A4, дюймы, масштаб 1:1',
};

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function initDemo() {
  const form = document.getElementById('demo-form');
  const sheet = document.getElementById('demo-sheet');
  if (!form || !sheet) return;

  const buildButton = document.getElementById('build-button');
  const status = document.getElementById('build-status');
  const statusText = status.querySelector('.status-text');
  const downloadButton = document.getElementById('download-svg');
  const fileInput = document.getElementById('model-file');
  const fileMessage = document.getElementById('file-message');
  const dropzone = document.getElementById('dropzone');
  const fileName = document.getElementById('file-name');

  const state = {
    built: 'GOST',
    selected: 'GOST',
    running: false,
    layers: Object.fromEntries(LAYERS.map((name) => [name, true])),
  };

  function setStatus(kind, message) {
    status.dataset.state = kind;
    statusText.textContent = message;
  }

  function readyMessage(key) {
    return `Готово: ${SUMMARY[key]}, ${dimensionCount()} размеров`;
  }

  function render(key, animate) {
    sheet.innerHTML = buildSheet(key, state.layers);
    if (animate && !prefersReducedMotion()) {
      sheet.classList.remove('is-drawing');
      // перезапуск анимации прорисовки
      void sheet.offsetWidth;
      sheet.classList.add('is-drawing');
      setTimeout(() => sheet.classList.remove('is-drawing'), 1400);
    }
  }

  async function build() {
    if (state.running) return;
    state.running = true;
    buildButton.disabled = true;
    buildButton.classList.remove('is-attention');
    sheet.setAttribute('aria-busy', 'true');

    const fast = prefersReducedMotion() ? 0.4 : 1;
    for (const [label, ms] of BUILD_STAGES) {
      setStatus('running', `${label}…`);
      await wait(ms * fast);
    }

    state.built = state.selected;
    render(state.built, true);
    sheet.setAttribute('aria-busy', 'false');
    setStatus('ready', readyMessage(state.built));
    buildButton.disabled = false;
    state.running = false;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    build();
  });

  form.querySelectorAll('input[name="standard"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      state.selected = radio.value;
      if (state.running) return;
      if (state.selected === state.built) {
        buildButton.classList.remove('is-attention');
        setStatus('ready', readyMessage(state.built));
      } else {
        buildButton.classList.add('is-attention');
        setStatus('stale', `Выбран ${STANDARDS[state.selected].label}. Нажмите «Построить чертёж», чтобы перестроить лист.`);
      }
    });
  });

  form.querySelectorAll('input[name="layer"]').forEach((box) => {
    box.addEventListener('change', () => {
      state.layers[box.value] = box.checked;
      const group = sheet.querySelector(`[data-layer="${box.value}"]`);
      if (group) group.style.display = box.checked ? '' : 'none';
    });
  });

  downloadButton.addEventListener('click', () => {
    const markup = buildSheet(state.built, state.layers, { forExport: true });
    const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${markup}`], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flange-${state.built.toLowerCase()}.svg`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  /* Проверка своего файла: та же валидация, что будет в приложении. */
  function checkFile(file) {
    fileMessage.classList.remove('is-error');
    if (!file) {
      fileMessage.textContent = '';
      fileName.textContent = 'Файл не выбран';
      return;
    }
    fileName.textContent = file.name;
    const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
    let message;
    let isError = true;
    if (!ALLOWED.includes(ext)) {
      message = `Файл «${file.name}» не подойдёт: нужен .step, .stp, .iges или .igs.`;
    } else if (file.size === 0) {
      message = `Файл «${file.name}» пустой. Сохраните модель заново и попробуйте ещё раз.`;
    } else if (file.size > MAX_SIZE) {
      message = `Файл «${file.name}» больше 30 МБ. Загрузите модель одной детали.`;
    } else {
      isError = false;
      message = `Файл «${file.name}» подходит. В демо лист строится только для фланца-примера, свои модели можно будет загружать в приложении.`;
    }
    fileMessage.textContent = message;
    fileMessage.classList.toggle('is-error', isError);
  }

  fileInput.addEventListener('change', () => checkFile(fileInput.files[0]));

  ['dragenter', 'dragover'].forEach((type) =>
    dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      dropzone.classList.add('is-dragover');
    }),
  );
  ['dragleave', 'drop'].forEach((type) =>
    dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      dropzone.classList.remove('is-dragover');
    }),
  );
  dropzone.addEventListener('drop', (event) => {
    const file = event.dataTransfer?.files?.[0];
    checkFile(file);
  });

  render(state.built, false);
  setStatus('ready', readyMessage(state.built));
}
