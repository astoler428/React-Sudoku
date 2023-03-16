import "./App.css";
import React from "react";

export default function Board(props) {
  let cellId = 0;

  let board = props.board.map((row) =>
    row.map((obj) => {
      let classes = getClasses(obj, cellId);
      let color = setColor(obj);
      let styles = {
        color: color,
        background: obj.highlighted ? "	rgb(211,211,211)" : "",
      };

      return (
        <input
          value={obj.value === 0 ? "" : obj.value}
          id={cellId++}
          className={classes}
          onChange={props.handleChange}
          onFocus={props.handleFocus}
          readOnly={obj.fixed}
          // onFocus={(e) => obj.fixed && e.target.blur()}
          autoFocus={obj.previouslyChanged}
          style={styles}
          autoComplete="off"
        ></input>
      );
    })
  );

  function setColor(obj) {
    let color = "gray";
    if (obj.fixed) color = "black";
    else if (props.mode === "Easy")
      if (obj.correctLocation) color = "green";
      else color = "red";
    return color;
  }

  function getClasses(obj, cellId) {
    let classes = "cell ";
    classes += cellId % 27 < 9 ? "top " : "";
    classes +=
      cellId % 9 === 0 || cellId % 9 === 3 || cellId % 9 === 6 ? "left " : "";
    classes += cellId % 9 === 8 ? "right " : "";
    classes += cellId >= 72 ? "bottom " : "";
    return classes;
  }

  return <div id="sudoku-grid">{board}</div>;
}

//id is assigned 0 to 80 so onChange event can figure out which cell
//onFocus blur doesn't allow starting values to be changed
//autoFocus makes it so the previously changed value is the focus - this was lost becase a new input was created each time
