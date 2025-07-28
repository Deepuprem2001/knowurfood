import React from 'react';

function Navbar({ onAddClick, onLogout, onTabChange, currentTab }) {
  return (
    <nav className="navbar">
      <button
        onClick={() => onTabChange('dashboard')}
        title="Dashboard"
        className={currentTab === 'dashboard' ? 'text-warning' : 'text-info'}
      >
        <i className="bi bi-house-fill"></i>
      </button>

      <button onClick={() => onTabChange('history')} title="History">
        <i className={`bi bi-clock-history ${currentTab === 'history' ? 'text-warning' : 'text-info'}`}></i>
      </button>
      <button onClick={onAddClick} title="Add Meal">
        <i className={`bi bi-plus-circle-fill ${currentTab === 'addmead' ? 'text-warning' : 'text-info'}`}></i>
      </button>
      <button title="Suggestions" onClick={() => onTabChange('suggestions')}>
        <i className={`bi bi-lightbulb-fill	 ${currentTab === 'suggestions' ? 'text-warning' : 'text-info'}`}></i>
      </button>
      <button onClick={() => onTabChange('profile')} title="Profile">
        <i className={`bi bi-person-circle ${currentTab === 'profile' ? 'text-warning' : 'text-info'}`}></i>
      </button>
    </nav>
  );
}

export default Navbar;
