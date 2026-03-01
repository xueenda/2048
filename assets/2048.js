const size = 4;

// Returns a fresh 4x4 grid filled with zeros
function resetGrid() {
  return Array.from({ length: 4 }, () => Array(4).fill(0));
}

let board = resetGrid();

// Rebuilds the DOM grid from the current board state
function render() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.style.backgroundColor = getColor(board[r][c]);

      // Only show the number for non-empty cells
      if (board[r][c] !== 0) {
        cell.textContent = board[r][c];
      }
      grid.appendChild(cell);
    }
  }
}

// Resets the board and seeds it with a random number of 2s (at least 1)
function initializeBoard() {
  board = resetGrid();
  message(); // clear any previous win/lose message

  // Pick between 1–16 random cells to seed with 2
  const numsOf2 = Math.floor(Math.random() * 16) + 1;
  const range = Array.from({ length: 16 }, (_, i) => i);
  const shuffled = range.sort(() => Math.random() - 0.5).slice(0, numsOf2);
  shuffled.forEach(i => board[Math.floor(i / 4)][i % 4] = 2);

  render();
}

initializeBoard();

// Displays a status message (win/lose). Called with no args to clear it.
function message(msg) {
  const status = document.getElementById("status");
  status.innerText = msg || "";
}

// Maps a tile value to a color. Higher values become darker shades of orange.
function getColor(value) {
  if (value === 0) return "#cdc1b4";

  const level = Math.log2(value); // e.g. 2→1, 4→2, 2048→11
  const hue = 35;           // orange
  const saturation = 80;
  const lightness = 90 - level * 5; // darkens as tiles get larger

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Slides and merges all rows to the left in-place.
// Each row: strip zeros → merge adjacent equals → pad zeros back on the right.
// Returns true if any cell changed (used to skip no-op moves).
function moveBoardLeft() {
  let changed = false;
  for (let r = 0; r < size; r++) {
    let newRow = board[r].filter(value => value !== 0);

    // Merge adjacent equal tiles (left-to-right, one merge per tile)
    for (let c = 0; c < newRow.length - 1; c++) {
      if (newRow[c] === newRow[c + 1]) {
        newRow[c] *= 2;
        newRow[c + 1] = 0;
        changed = true;
      }
    }

    // Remove the zeros created by merging, then pad the row back to full size
    newRow = newRow.filter(v => v !== 0);
    while (newRow.length < size) {
      newRow.push(0);
      changed = true;
    }

    board[r] = newRow;
  }
  return changed;
}

// Rotates the board 90° counter-clockwise (transpose then flip vertically).
// Used to reuse moveBoardLeft for up/down moves.
function rotateLeft90() {
  for (let r = 0; r < size; r++) {
    for (let c = r + 1; c < size; c++) {
      [board[r][c], board[c][r]] = [board[c][r], board[r][c]];
    }
  }
  board.reverse();
}

// Rotates the board 90° clockwise (anti-transpose then flip vertically).
// Inverse of rotateLeft90, used to restore orientation after a move.
function rotateRigth90() {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - r - 1; c++) {
      [board[r][c], board[size - 1 - c][size - 1 - r]] =
        [board[size - 1 - c][size - 1 - r], board[r][c]];
    }
  }
  board.reverse();
}

// Reuses moveBoardLeft by reversing each row before and after
function moveBoardRight() {
  board = board.map(row => [...row].reverse());
  const changed = moveBoardLeft();
  board = board.map(row => [...row].reverse());
  return changed;
}

// Reuses moveBoardLeft by rotating the board so "up" becomes "left"
function moveBoardUp() {
  rotateLeft90();
  const changed = moveBoardLeft();
  rotateRigth90(); // restore original orientation
  return changed;
}

// Reuses moveBoardLeft by rotating the board so "down" becomes "left"
function moveBoardDown() {
  rotateRigth90();
  const changed = moveBoardLeft();
  rotateLeft90(); // restore original orientation
  return changed;
}

// Returns all [row, col] positions that are currently empty (value === 0)
function getEmptyCells() {
  const empty = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === 0) empty.push([r, c]);
    }
  }
  return empty;
}

// Adds a 2 (90% chance) or 4 (10% chance) in a random empty cell
function addRandom() {
  const twoOrFour = Math.random() < 0.9 ? 2 : 4;
  const empty = getEmptyCells();
  if (empty.length) {
    const idx = Math.floor(Math.random() * empty.length);
    const [r, c] = empty[idx];
    board[r][c] = twoOrFour;
  }
}

function gameComplete() {
  return board.some(row => row.includes(2048));
}

// Called after every move. Handles rendering, win detection, and adding a new tile.
// Skips everything if the board didn't change (no-op move).
function afterMove(changed) {
  if (!changed) return;

  render();

  if (gameComplete()) {
    message("Congratulations! You win!");
    return;
  }

  // Adding a new tile then re-render to show it
  addRandom();
  render();
}

function handleKeyMove(e) {
  // Prevent arrow keys from scrolling the page and cursor
  e.preventDefault();

  let changed = false;
  switch (e.key) {
    case "ArrowLeft": changed = moveBoardLeft(); break;
    case "ArrowRight": changed = moveBoardRight(); break;
    case "ArrowUp": changed = moveBoardUp(); break;
    case "ArrowDown": changed = moveBoardDown(); break;
  }

  afterMove(changed);
}

document.addEventListener("keydown", handleKeyMove);