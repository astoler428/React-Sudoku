let sudokuContainer = document.getElementById("sudoku-grid");
let cellDivs = [[], [], [], [], [], [], [], [], []];

let testBoard = [
  [8, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 3, 6, 0, 0, 0, 0, 0],
  [0, 7, 0, 0, 9, 0, 2, 0, 0],
  [0, 5, 0, 0, 0, 7, 0, 0, 0],
  [0, 0, 0, 0, 4, 5, 7, 0, 0],
  [0, 0, 0, 1, 0, 0, 0, 3, 0],
  [0, 0, 1, 0, 0, 0, 0, 6, 8],
  [0, 0, 8, 5, 0, 0, 0, 1, 0],
  [0, 9, 0, 0, 0, 0, 4, 0, 0],
];

// for (let row = 0; row < 9; row++)
//   for (let col = 0; col < 9; col++) board[row][col] = 0;

for (let i = 0; i < 81; i++) {
  let cell = document.createElement("div");
  cellDivs[Math.floor(i / 9)].push(cell);
  cell.classList.add("cell");
  if (i % 27 < 9) cell.classList.add("top");
  if (i % 9 === 0 || i % 9 === 3 || i % 9 === 6) cell.classList.add("left");
  if (i % 9 === 8) cell.classList.add("right");
  if (i >= 72) cell.classList.add("bottom");

  sudokuContainer.appendChild(cell);
}

function displayBoard(board) {
  for (let i = 0; i < board.length; i++)
    for (let j = 0; j < board[i].length; j++)
      if (board[i][j] !== 0) cellDivs[i][j].innerHTML = board[i][j];
}

//somehow update this to look for multiple solutions
function sudokuSolver(board, x, y) {
  if (x === 8 && y === 8) return true;

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
  if (x === 8 && y === 8) return true;

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

function isValidPlacement(board, val, row, col) {
  return (
    rowChecker(board, val, row) &&
    colChecker(board, val, col) &&
    boxChecker(board, val, row, col)
  );
}

function rowChecker(board, val, row) {
  for (let j = 0; j < 9; j++) if (board[row][j] === val) return false;

  return true;
}

function colChecker(board, val, col) {
  for (let i = 0; i < 9; i++) if (board[i][col] === val) return false;

  return true;
}

function boxChecker(board, val, row, col) {
  let initialRow = 3 * Math.floor(row / 3);
  let initialCol = 3 * Math.floor(col / 3);

  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      if (board[initialRow + i][initialCol + j] === val) return false;

  return true;
}

function checkBoardValidity(board) {
  let cols = Array.from(Array(9), () => new Array(9));
  let boxes = [];
  for (i = 0; i < 9; i++) boxes.push([]);

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
  let newList = list.filter((entry) => entry !== 0);
  let set = new Set(newList);
  if (set.size === newList.length) return true;
  else return false;
}

//definitely a way to minimize redundant code as this method
//is very similar to solver - just has some randomization
//could make the other random val choices, but then need extra storage (not as clean)
//or could have values go in order, but choose random cells, but then i have to keep track of how many
function generateBoard(board, availableOptions, x, y) {
  if (x === 8 && y === 8) return true;

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
// function sudokuSolver(board, x, y) {
//   if (x === 8 && y === 8) return true;

//   for (let i = 0; i < 9; i++)
//     for (let j = 0; j < 9; j++)
//       if (board[i][j] === 0) {
//         for (let val = 1; val <= 9; val++)
//           if (isValidPlacement(board, val, i, j)) {
//             board[i][j] = val;
//             if (sudokuSolver(board, i, j)) return true;
//           }
//         board[i][j] = 0;
//         return false;
//       }
// }

function createRandomBoard(board) {
  //initialize possible options for each cell and the randomBoard to be returned
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
}

function editList(board) {
  let i = 0;
  let j = 0;
  board[i][j] = 0;
}

//too much computing power to check uniqueness for thin boards, so stopping at 50
function trimRandomBoard(board) {
  let cellIdxs = [];
  for (let idx = 0; idx < 81; idx++) cellIdxs.push(idx);

  cellIdxs.sort((a, b) => 0.5 - Math.random());
  let count = 0;
  for (let idx of cellIdxs) {
    count++;
    //convert number 0 to 80 into row and col
    let row = Math.floor(idx / 9);
    let col = idx % 9;

    let val = board[row][col];
    board[row][col] = 0;
    if (!uniqueness(board)) {
      board[row][col] = val;
    }
    if (count == 50) break;
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

  // console.log("checkbing forward");

  sudokuSolver(board1);
  // console.log("checkbing backward");

  sudokuSolverBackwards(board2);

  // console.log(board2);

  for (let i = 0; i < 9; i++)
    for (let j = 0; j < 9; j++) if (board1[i][j] !== board2[i][j]) return false;

  return true;
}

// displayBoard(testBoard);

// sudokuSolver(testBoard, 0, 0);
// console.log(testBoard);
// displayBoard(testBoard);

let randomBoard = [];
createRandomBoard(randomBoard);
console.log(randomBoard);
trimRandomBoard(randomBoard);
displayBoard(randomBoard);

// setTimeout(() => {
//   trimRandomBoard(randomBoard);
//   displayBoard(randomBoard);
//   // setTimeout(() => {
//   //   sudokuSolver(randomBoard);
//   //   console.log(randomBoard);
//   // }, 3000);
// }, 5000);

// displayBoard(randomBoard);
