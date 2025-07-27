import React from 'react';

function Navbar({ onAddClick, onLogout, onTabChange, currentTab }) {
  return (
    <nav className="navbar">
      <button onClick={() => onTabChange('dashboard')} title="Home">
        <i className={`bi bi-house-fill ${currentTab === 'dashboard' ? 'text-info' : ''}`}></i>
      </button>
      <button onClick={() => onTabChange('history')} title="History">
        <i className={`bi bi-clock-history ${currentTab === 'history' ? 'text-info' : ''}`}></i>
      </button>
      <button onClick={onAddClick} title="Add Meal">
        <i className="bi bi-plus-circle-fill "></i>
      </button>
      <button title="Suggestions" onClick={() => onTabChange('suggestions')}>
        <i className={`bi bi-lightbulb-fill	 ${currentTab === 'suggestions' ? 'text-info' : ''}`}></i>
      </button>
      <button onClick={() => onTabChange('profile')} title="Profile">
        <i className={`bi bi-person-circle ${currentTab === 'profile' ? 'text-info' : ''}`}></i>
      </button>
    </nav>
  );
}

export default Navbar;
