import "./App.css";
import { sudokuSolver, createRandomBoard, trimBoard } from "./sudoku";
import Board from "./Board";
import { useState, useEffect, useMemo, useRef } from "react";
import React from "react";
import ReactSwitch from "react-switch";
import Confetti from "react-confetti";

//initialBoard doesn't need to be state bc it doesn't cause a rerender. It needs to udpate on a new game...
//however it appears some other variables depend on it

function App() {
  const [initialBoard, setInitialBoard] = useState(); //this is the original state board in object form, stored for resetting upon clear
  const [board, setBoard] = useState(); //this is the current updating board in obj form
  const [gameOn, setGameOn] = useState(false); //game has started - board has been created
  const [win, setWin] = useState(false);
  const [mode, setMode] = useState("Easy"); //for toggling between coloring correct answers and not
  const [difficulty, setDifficulty] = useState(40); //user can select how many starting cells
  const [notesSetting, setNotesSetting] = useState(false); //toggle between inputting notes and not

  const undoMoves = useRef([]); //array containing the state of each cell before it was changed

  //solutionBoard only changes if a new game is made, hence it only listens for the initalBoard to change
  const solutionBoard = useMemo(() => {
    if (gameOn) return solveBoard();
  }, [initialBoard]);

  //every time the board changes, check for win
  useEffect(() => {
    if (!gameOn) return;

    if (checkWin()) {
      setWin(true);
      endGame();
    }
  }, [board]);

  //compares each cell's value with the solutionBoard
  function checkWin() {
    for (let i = 0; i < 9; i++)
      for (let j = 0; j < 9; j++)
        if (board[i][j].value !== solutionBoard[i][j]) return false;

    return true;
  }

  //this gets called when create new board button is pressed
  //resets everything to default values
  function startGame() {
    setGameOn(true);
    setWin(false);
    setMode("Easy");
    setNotesSetting(false);
    undoMoves.current = [];
    let randomBoard = createRandomBoard();
    trimBoard(randomBoard, difficulty);

    randomBoard = randomBoard.map((row) =>
      row.map((value) => ({
        value,
        noteValues: new Set(),
        fixed: value !== 0,
        previouslyChanged: false,
        correctLocation: true,
        highlighted: false,
      }))
    );
    setInitialBoard(randomBoard);
    setBoard(randomBoard);
  }

  //event listener for input field onChange
  function cellChanged(event) {
    let enteredValue = event.target.value; //comes in as a string
    if (enteredValue !== "")
      enteredValue = enteredValue[enteredValue.length - 1]; //get the most recent digit if there is more than one digit

    if (enteredValue === "0" || isNaN(enteredValue)) return;

    let cellNum = event.target.id; //each cell in Board component has an id 0 to 80, which gets converted to a row and col
    let row = Math.floor(cellNum / 9);
    let col = cellNum % 9;

    //holds objects with the row, col and previous obj
    undoMoves.current.push({
      row,
      col,
      prevPlacement: board[row][col],
    });

    adjustBoard(row, col, Number(enteredValue)); // note that a value of "" gets converted to 0 by Number()
  }

  //EventListener for input onFocus
  //just like cellChanged, but only focus is set
  //need to check that it's not the previous focus or it goes into infinite loop on having focusing and changing state
  //used for determining what to highlight
  function cellFocused(event) {
    let cellNum = event.target.id;
    let row = Math.floor(cellNum / 9);
    let col = cellNum % 9;
    let focusedValue = board[row][col].value;

    if (!board[row][col].previouslyChanged) {
      //otherwise infinite loop since whatever I'm setting to focus will call this again
      setBoard((prevBoard) => {
        let newBoard = [[], [], [], [], [], [], [], [], []];
        for (let i = 0; i < 9; i++)
          for (let j = 0; j < 9; j++)
            newBoard[i][j] = {
              ...prevBoard[i][j],
              noteValues: new Set([...prevBoard[i][j].noteValues]), //felt like there was a glitch with pointers and needed to re copy the entire set
              previouslyChanged: i === row && j === col,
              highlighted:
                focusedValue !== 0 && prevBoard[i][j].value === focusedValue,
            };

        return newBoard;
      });
    }
  }

  //this gets called by cellChanged and does the work to change the board
  function adjustBoard(row, col, enteredValue) {
    let noteValue;
    if (notesSetting) {
      //this puts the value in the noteValue variable and sets the value to 0
      noteValue = enteredValue;
      enteredValue = 0;
    }

    setBoard((prevBoard) => {
      let newBoard = [[], [], [], [], [], [], [], [], []];
      for (let i = 0; i < 9; i++)
        for (let j = 0; j < 9; j++)
          if (i === row && j === col) {
            newBoard[i][j] = {
              ...prevBoard[i][j],
              value: enteredValue, //was set to 0 above if in note setting
              noteValues: new Set([...prevBoard[i][j].noteValues]), //same as before, but will add or remove currentnoteValue below
              previouslyChanged: true,
              correctLocation:
                enteredValue === 0 || enteredValue === solutionBoard[i][j],
              highlighted: enteredValue !== 0, //if not a notevalue, then definitely highlight because it's the one with focus
            };
            //this is where noteValues are updated, by trying to delete if already there or adding if not
            if (notesSetting && noteValue !== 0)
              !newBoard[i][j].noteValues.delete(noteValue) &&
                newBoard[i][j].noteValues.add(noteValue);
            else newBoard[i][j].noteValues.clear(); //if not in noteSetting, then all notes clear
          } else
            newBoard[i][j] = {
              ...prevBoard[i][j],
              previouslyChanged: false,
              highlighted:
                prevBoard[i][j].value === enteredValue && enteredValue !== 0, //highlights if it matches the entered value
            };

      return newBoard;
    });
  }

  function undoLastMove() {
    //does nothing if not more undo's in list

    if (undoMoves.current.length === 0) return;
    let lastMove = undoMoves.current.pop();

    let row = lastMove.row;
    let col = lastMove.col;
    let obj = lastMove.prevPlacement;

    let returningToANote = obj.noteValues.size !== 0; //if the last state has notes, then we are returning to that

    setBoard((prevBoard) => {
      let newBoard = [[], [], [], [], [], [], [], [], []];
      for (let i = 0; i < 9; i++)
        for (let j = 0; j < 9; j++)
          if (i === row && j === col)
            newBoard[i][j] = {
              ...obj, //copy everything from last state
              //don't think i need prevouslyChanged: true since it will be by default
            };
          else
            newBoard[i][j] = {
              ...prevBoard[i][j],
              previouslyChanged: false,
              highlighted:
                !returningToANote &&
                prevBoard[i][j].value === obj.value &&
                obj.value !== 0,
            };
      return newBoard;
    });
  }

  //reset
  function clearBoard() {
    undoMoves.current = [];
    setBoard(initialBoard);
  }

  //initialize empty board - copy initalBoard's value contents (not object) into it and call sudoku solver
  function solveBoard() {
    let boardToSolve = [];
    for (let i = 0; i < 9; i++) {
      boardToSolve.push([]);
      for (let j = 0; j < 9; j++)
        boardToSolve[i].push(initialBoard[i][j].value);
    }

    sudokuSolver(boardToSolve, 0, 0);
    return boardToSolve;
  }

  //to not allow further changes - setBoard to the solutionBoard by converting it to objects (everything fixed)
  function endGame() {
    setGameOn(false);

    let solutionBoardDisplay = solutionBoard.map((row) =>
      row.map((value) => ({
        value,
        noteValues: new Set(),
        fixed: true,
        previouslyChanged: false,
        correctLocation: true,
      }))
    );
    setBoard(solutionBoardDisplay);
  }

  function toggleMode() {
    setMode((prevMode) => (prevMode === "Easy" ? "Hard" : "Easy"));
  }

  function toggleNotesSetting() {
    setNotesSetting((prevNotesSetting) => !prevNotesSetting);
  }

  function handleSliderChange(event) {
    setDifficulty(event.target.value);
  }

  return (
    <>
      {win && <Confetti></Confetti>}

      <div className="settings-container">
        <div className="slider-container">
          <div className="flex-container">
            <label>17</label>
            <input
              type="range"
              min="17"
              max="80"
              className="slider"
              value={difficulty}
              onChange={handleSliderChange}
            ></input>
            <label>80</label>
          </div>
          <label>Starting Cells: {difficulty}</label>
        </div>
        <button className="button-create-board" onClick={startGame}>
          Create New Board
        </button>
        <label className="switch-label">Easy Mode</label>
        <ReactSwitch
          className="switch"
          checked={mode === "Easy"}
          onChange={toggleMode}
        ></ReactSwitch>
      </div>
      {board !== undefined && (
        <Board
          board={board}
          handleChange={cellChanged}
          handleFocus={cellFocused}
          mode={mode}
          notesSetting={notesSetting}
        ></Board>
      )}
      {gameOn && (
        <div className="settings-container">
          <button className="button-notes" onClick={toggleNotesSetting}>
            Notes
            {notesSetting && <div className="on-tooltip">ON</div>}
          </button>
          <button className="button-undo" onClick={undoLastMove}>
            Undo
          </button>
          <button className="button-clear" onClick={clearBoard}>
            Clear
          </button>
          <button className="button-solution" onClick={endGame}>
            Show Solution
          </button>
        </div>
      )}
    </>
  );
}
export default App;

//I think I way overcomplicated last move
//I could've copied the entire state of the board and then just did set board...

//im in trial
