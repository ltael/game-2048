'use strict';

/* =========================================================
   2048 · Закат
   Поле генерируется через JavaScript, элементы создаются
   методами DOM (createElement, append).
   ========================================================= */

const SIZE = 4;
const MOVE_TIME = 120; // длительность сдвига плитки, мс (как в CSS)

/* ---------- Ссылки на элементы ---------- */

const ui = {
  board: document.getElementById('board'),
  score: document.getElementById('score'),
  scoreGain: document.getElementById('score-gain'),
  best: document.getElementById('best'),
  undoBtn: document.getElementById('undo-btn'),
  restartBtn: document.getElementById('restart-btn'),
  leadersBtn: document.getElementById('leaders-btn'),
  gameOver: document.getElementById('game-over'),
  gameOverTitle: document.getElementById('game-over-title'),
  gameOverText: document.getElementById('game-over-text'),
  saveForm: document.getElementById('save-form'),
  nameInput: document.getElementById('player-name'),
  overRestartBtn: document.getElementById('over-restart-btn'),
  overLeadersBtn: document.getElementById('over-leaders-btn'),
  leaders: document.getElementById('leaders'),
  leadersClose: document.getElementById('leaders-close'),
  leadersBody: document.getElementById('leaders-body'),
  leadersTable: document.getElementById('leaders-table'),
  leadersEmpty: document.getElementById('leaders-empty'),
  tileLayer: null, // создаётся в buildBoard()
};

/* ---------- Состояние ---------- */

let grid = [];            // 4x4: { id, value, x, y } или null
let score = 0;
let best = 0;
let prev = null;          // снимок для отмены хода: { cells, score }
let over = false;
let saved = false;        // сохранён ли результат законченной игры
let lastSavedId = null;   // для подсветки строки в таблице

let nextTileId = 1;
const tileElements = new Map(); // id плитки -> DOM-элемент
let pendingRemovals = [];       // плитки, которые исчезнут после анимации слияния

/* ---------- Вспомогательные функции ---------- */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function emptyGrid() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

function createTile(value, x, y) {
  return { id: nextTileId++, value, x, y };
}

/** Числовой снимок поля (0 — пустая клетка). */
function toCells(source) {
  return source.map((row) => row.map((tile) => (tile ? tile.value : 0)));
}

function fromCells(cells) {
  const result = emptyGrid();
  cells.forEach((row, y) => row.forEach((value, x) => {
    if (value) result[y][x] = createTile(value, x, y);
  }));
  return result;
}

function emptyPositions() {
  const result = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (!grid[y][x]) result.push({ x, y });
    }
  }
  return result;
}

/* ---------- Отрисовка ---------- */

/** Сетка 4x4 создаётся динамически. */
function buildBoard() {
  const cells = [];
  for (let i = 0; i < SIZE * SIZE; i++) {
    cells.push(el('div', 'cell'));
  }
  ui.tileLayer = el('div', 'tile-layer');
  ui.board.append(...cells, ui.tileLayer);
}

function placeElement(node, x, y) {
  node.style.setProperty('--x', x);
  node.style.setProperty('--y', y);
}

function createTileElement(tile, kind) {
  const node = el('div', 'tile');
  const inner = el('div', 'tile__inner', String(tile.value));
  node.dataset.value = tile.value > 2048 ? 'super' : String(tile.value);
  node.dataset.digits = String(tile.value).length;
  if (kind) node.classList.add(`tile--${kind}`); // new | merged
  node.append(inner);
  placeElement(node, tile.x, tile.y);
  ui.tileLayer.append(node);
  tileElements.set(tile.id, node);
  return node;
}

/** Полная перерисовка без анимации движения (старт, отмена хода, загрузка). */
function renderAll(kind) {
  flushRemovals();
  ui.tileLayer.replaceChildren();
  tileElements.clear();
  grid.flat().filter(Boolean).forEach((tile) => createTileElement(tile, kind));
}

function flushRemovals() {
  pendingRemovals.forEach(({ node, timer }) => {
    clearTimeout(timer);
    node.remove();
  });
  pendingRemovals = [];
}

/* ---------- Новая игра ---------- */

function spawnTiles(count) {
  const spawned = [];
  for (let i = 0; i < count; i++) {
    const free = emptyPositions();
    if (free.length === 0) break;
    const { x, y } = free[randomInt(0, free.length - 1)];
    const value = Math.random() < 0.9 ? 2 : 4;
    const tile = createTile(value, x, y);
    grid[y][x] = tile;
    spawned.push(tile);
  }
  return spawned;
}

function newGame() {
  grid = emptyGrid();
  score = 0;
  prev = null;
  over = false;
  saved = false;
  spawnTiles(randomInt(1, 3)); // в начале игры 1–3 плитки
  renderAll('new');
}

/* ---------- Старт ---------- */

function init() {
  buildBoard();
  newGame();
}

init();
