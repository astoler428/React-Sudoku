export function sudokuSolver(board, x, y) {
  if (checkFullBoard(board)) return true;

  for (let i = 0; i < 9; i++)
    for (let j = 0; j < 9; j++)
      if (board[i][j] === 0) {
        for (let val = 1; val <= 9; val++)
          if (isValidPlacement(board, val, i, j)) {
            board[i][j] = val;
            if (sudokuSolver(board, i, j)) return true;
          }
        board[i][j] = 0;
        return false;
      }
}

function sudokuSolverBackwards(board, x, y) {
  if (checkFullBoard(board)) return true;

  for (let i = 0; i < 9; i++)
    for (let j = 0; j < 9; j++)
      if (board[i][j] === 0) {
        for (let val = 9; val >= 1; val--)
          if (isValidPlacement(board, val, i, j)) {
            board[i][j] = val;
            if (sudokuSolverBackwards(board, i, j)) return true;
          }
        board[i][j] = 0;
        return false;
      }
}

export function checkFullBoard(board) {
  for (let row of board) for (let entry of row) if (entry === 0) return false;

  return true;
}

export function isValidPlacement(board, val, row, col) {
  return (
    rowChecker(board, val, row) &&
    colChecker(board, val, col) &&
    boxChecker(board, val, row, col)
  );
}

export function rowChecker(board, val, row) {
  for (let j = 0; j < 9; j++) if (board[row][j] === val) return false;

  return true;
}

export function colChecker(board, val, col) {
  for (let i = 0; i < 9; i++) if (board[i][col] === val) return false;

  return true;
}

export function boxChecker(board, val, row, col) {
  let initialRow = 3 * Math.floor(row / 3);
  let initialCol = 3 * Math.floor(col / 3);

  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      if (board[initialRow + i][initialCol + j] === val) return false;

  return true;
}

export function checkBoardValidity(board) {
  let cols = Array.from(Array(9), () => new Array(9));
  let boxes = [];
  for (let i = 0; i < 9; i++) boxes.push([]);

  for (let row = 0; row < 9; row++) {
    //check rows (easy because already made into lists)
    if (!allUnique(board[row])) return false;

    //as we go, create the cols lists and the boxes lists
    for (let col = 0; col < 9; col++) {
      cols[col][row] = board[row][col];
      //calculation to determine which of the 9 rows it falls into
      boxes[3 * Math.floor(row / 3) + Math.floor(col / 3)].push(
        board[row][col]
      );
    }
  }
  //check uniquness for columns and boxes
  for (let i = 0; i < 9; i++) {
    if (!allUnique(cols[i]) || !allUnique(boxes[i])) return false;
  }

  return true;
}

function allUnique(list) {
  let newList = list.map((entry) => entry.value);
  newList = newList.filter((entry) => entry !== 0);
  let set = new Set(newList);
  if (set.size === newList.length) return true;
  else return false;
}

function generateBoard(board, availableOptions, x, y) {
  if (checkFullBoard(board)) return true;

  for (let i = 0; i < 9; i++)
    for (let j = 0; j < 9; j++) {
      if (board[i][j] === 0) {
        while (availableOptions[i][j].length > 0) {
          //each cell in the 9x9 has 9 possible options
          let idx = Math.floor(Math.random() * availableOptions[i][j].length);
          let val = availableOptions[i][j][idx];
          if (isValidPlacement(board, val, i, j)) {
            board[i][j] = val;
            if (generateBoard(board, availableOptions, i, j)) return true;
          }
          availableOptions[i][j] = availableOptions[i][j].filter(
            (entry) => entry !== val
          );
        }
        board[i][j] = 0;
        availableOptions[i][j] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        return false;
      }
    }
}

export function createRandomBoard() {
  let board = [];
  let availableOptions = []; //each cell in the 9x9 has 9 possible options
  for (let i = 0; i < 9; i++) {
    board.push([]);
    availableOptions.push([]);
    for (let j = 0; j < 9; j++) {
      availableOptions[i][j] = [];
      board[i].push(0);
      for (let k = 1; k <= 9; k++) availableOptions[i][j].push(k);
    }
  }
  //this function calls generateBoard, which is recursive

  generateBoard(board, availableOptions, 0, 0);
  return board;
}

//too much computing power to check uniqueness for thin boards, so stopping at 50
export function trimBoard(board, difficulty) {
  let cellIdxs = [];
  for (let idx = 0; idx < 81; idx++) cellIdxs.push(idx);

  cellIdxs.sort((a, b) => 0.5 - Math.random());
  let count = 0;
  for (let idx of cellIdxs) {
    //convert number 0 to 80 into row and col
    let row = Math.floor(idx / 9);
    let col = idx % 9;

    let val = board[row][col];
    board[row][col] = 0;
    if (!uniqueness(board)) {
      board[row][col] = val;
    } else count++;
    if (count === 81 - difficulty) break;
  }
}

function uniqueness(board) {
  let board1 = [[], [], [], [], [], [], [], [], []];
  let board2 = [[], [], [], [], [], [], [], [], []];
  for (let row = 0; row < 9; row++)
    for (let col = 0; col < 9; col++) {
      let val = board[row][col];
      board1[row][col] = val;
      board2[row][col] = val;
    }

  sudokuSolver(board1);
  sudokuSolverBackwards(board2);

  for (let i = 0; i < 9; i++)
    for (let j = 0; j < 9; j++) if (board1[i][j] !== board2[i][j]) return false;

  return true;
}
