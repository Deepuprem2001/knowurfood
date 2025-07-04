import React, { useState } from 'react';
import AddMealModal from './AddMeal';

function Navbar(props) {

  return (
    <nav className="navbar">
      <button>Home</button>
      <button>History</button>
      <button onClick={props.onAddClick}>Add</button>
      <button>Calander</button>
      <button>Profile</button>
    </nav>
  );
}

export default Navbar;
