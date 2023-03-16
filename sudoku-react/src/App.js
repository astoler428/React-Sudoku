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

  function cellChanged(event) {
    //check that event.target.vale is a whole number 1 to 9
    let enteredValue = event.target.value;
    if (enteredValue !== "")
      enteredValue = enteredValue[enteredValue.length - 1]; //get the most recent digit

    if (enteredValue === "0" || isNaN(enteredValue)) return;

    let cellNum = event.target.id;
    let row = Math.floor(cellNum / 9);
    let col = cellNum % 9;

    //holds objects with the row, col and previous board value before the change
    undoMoves.current.push({
      row,
      col,
      prevPlacement: board[row][col],
    });

    //nothing entered is "" and then converting it to a number gives 0.
    adjustBoard(row, col, Number(enteredValue));
  }

  //just like cellChanged, but only focus is set
  //need to check that it's not the previous focus or it goes into infinite loop on having focusing and changing state
  function cellFocused(event) {
    let cellNum = event.target.id;
    let row = Math.floor(cellNum / 9);
    let col = cellNum % 9;
    let focusedValue = board[row][col].value;

    if (!board[row][col].previouslyChanged) {
      setBoard((prevBoard) => {
        let newBoard = [[], [], [], [], [], [], [], [], []];
        for (let i = 0; i < 9; i++)
          for (let j = 0; j < 9; j++)
            newBoard[i][j] = {
              ...prevBoard[i][j],
              noteValues: new Set([...prevBoard[i][j].noteValues]),
              previouslyChanged: i === row && j === col,
              highlighted:
                focusedValue !== 0 && prevBoard[i][j].value === focusedValue,
            };

        return newBoard;
      });
    }
    // adjustBoard(row, col, Number(event.target.value));
  }

  function adjustBoard(row, col, enteredValue) {
    //if value entered and value !== 0, remove all notes
    //if value !== 0 and a note entered, set value to 0

    console.log(enteredValue);
    //i dont think i have the case of if delete is pressed, all notes disappear
    let noteValue;
    if (notesSetting) {
      noteValue = enteredValue;
      enteredValue = 0;
    }

    //value to note and return back to value

    setBoard((prevBoard) => {
      let newBoard = [[], [], [], [], [], [], [], [], []];
      for (let i = 0; i < 9; i++)
        for (let j = 0; j < 9; j++)
          if (i === row && j === col) {
            newBoard[i][j] = {
              ...prevBoard[i][j],
              value: enteredValue,
              noteValues: new Set([...prevBoard[i][j].noteValues]),
              previouslyChanged: true,
              correctLocation:
                enteredValue === 0 || enteredValue === solutionBoard[i][j],
              highlighted: enteredValue !== 0,
            };
            //try to delete if already there, otherwise add
            if (notesSetting && noteValue !== 0)
              !newBoard[i][j].noteValues.delete(noteValue) &&
                newBoard[i][j].noteValues.add(noteValue);
            else newBoard[i][j].noteValues.clear();
          } else
            newBoard[i][j] = {
              ...prevBoard[i][j],
              previouslyChanged: false,
              highlighted:
                prevBoard[i][j].value === enteredValue && enteredValue !== 0,
            };

      return newBoard;
    });
  }

  function undoLastMove() {
    if (undoMoves.current.length === 0) return;
    let lastMove = undoMoves.current.pop();

    undoMove(lastMove.row, lastMove.col, lastMove.prevPlacement);
  }

  function undoMove(row, col, obj) {
    //if oldNoteValues has stuff - reseting to that
    //otherwise, old value
    let returningToANote = obj.noteValues.size !== 0;

    setBoard((prevBoard) => {
      let newBoard = [[], [], [], [], [], [], [], [], []];
      for (let i = 0; i < 9; i++)
        for (let j = 0; j < 9; j++)
          if (i === row && j === col)
            newBoard[i][j] = {
              ...obj,
              previouslyChanged: true,
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
  //what the heck - for some reason it's not displaying

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

//last thing is to allow undo with notes
//im off by one with what I'm pushing into the undo - it's the last state, so it doesn't matter if I'm settign a note or value
