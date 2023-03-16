import "./App.css";
import { sudokuSolver, createRandomBoard, trimBoard } from "./sudoku";
import Board from "./Board";
import { useState, useEffect, useMemo, useRef } from "react";
import React from "react";
import ReactSwitch from "react-switch";
import Confetti from "react-confetti";

//objects that have value, fixed property, previouslyChanged to stay focused...

//idea: initialBoard, board, solutionBoard
function App() {
  const [initialBoard, setInitialBoard] = useState();
  const [board, setBoard] = useState();
  const [gameOn, setGameOn] = useState(false);
  const [win, setWin] = useState(false);
  const [mode, setMode] = useState("Easy");
  const [difficulty, setDifficulty] = useState(40);
  const [notesSetting, setNotesSetting] = useState(false);

  const undoMoves = useRef([]);

  //solutionBoard only changes if a new game is made
  const solutionBoard = useMemo(() => {
    if (gameOn) return solveBoard();
  }, [initialBoard]);
  //perhaps make it a useRef and then update it in the start game function...

  useEffect(() => {
    if (!gameOn) return;

    if (checkWin()) {
      setWin(true);
      endGame();
    }
  }, [board]);

  function checkWin() {
    for (let i = 0; i < 9; i++)
      for (let j = 0; j < 9; j++)
        if (board[i][j].value !== solutionBoard[i][j]) return false;

    return true;
  }

  function startGame() {
    setGameOn(true);
    setWin(false);
    setMode("Easy");
    setNotesSetting(false);
    undoMoves.current = [];
    //somehow get randomBoard before i trim it and store int a value... use memo?
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

    if (enteredValue === "0" || isNaN(enteredValue) || enteredValue.length > 1)
      return;

    let cellNum = event.target.id;
    let row = Math.floor(cellNum / 9);
    let col = cellNum % 9;

    if (!notesSetting) {
      //holds objects with the row, col and previous board value before the change
      //only allow undo on actual moves, not notes added or created
      undoMoves.current.push({ row, col, value: board[row][col].value });
    }

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

    //i dont think i have the case of if delete is pressed, all notes disappear
    let noteValue;
    if (notesSetting) {
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
              value: enteredValue,
              previouslyChanged: true,
              correctLocation:
                enteredValue === 0 || enteredValue === solutionBoard[i][j],
              highlighted: enteredValue !== 0,
            };
            //try to delete if already there, otherwise add
            if (notesSetting)
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
    adjustBoard(lastMove.row, lastMove.col, lastMove.value);
  }

  function clearBoard() {
    undoMoves.current = [];
    setBoard(initialBoard);
  }

  function solveBoard() {
    let boardToSolve = [];
    //initialize empty board - copy boards value contents (not object) into it
    for (let i = 0; i < 9; i++) {
      boardToSolve.push([]);
      for (let j = 0; j < 9; j++)
        boardToSolve[i].push(initialBoard[i][j].value);
    }

    sudokuSolver(boardToSolve, 0, 0);
    return boardToSolve;
  }

  function endGame() {
    setGameOn(false);

    //if win - confetti!!!

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

//feature - note taking - when cell is highlighted - display a button for add note - and input in small text in corner
//position relative, absolute, fixed?
//onFocus listener
