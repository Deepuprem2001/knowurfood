import React from 'react';

function Navbar(props) {
  return (
    <nav className="navbar">
      <button>Home</button>
      <button>History</button>
      <button onClick={props.onAddClick}>Add</button>
      <button>Calendar</button>
      <button onClick={props.onLogout}>Profile</button> {/* Logs out on click */}
    </nav>
  );
}

export default Navbar;
