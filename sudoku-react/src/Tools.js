import React from "react";

//the buttons at the bottom for switching to notes, undo, clear and show solution

export default function Tools({
  toggleNotesSetting,
  notesSetting,
  undoLastMove,
  clearBoard,
  endGame,
}) {
  return (
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
  );
}
