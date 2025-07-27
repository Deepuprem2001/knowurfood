import React from 'react';

function MealCard({ name, nutrients, onEdit, onDelete, unit = 'g' }) {
  const getCalories = () => {
    let total = 0;
    nutrients.forEach(n => {
      const val = parseFloat(n.total) || 0;
      if (n.type === "Carbohydrate" || n.type === "Protein") total += val * 4;
      if (n.type === "Fat") total += val * 9;
    });
    return Math.round(total);
  };

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <div className="meal-card">
      <p className='MealCardText'>{name}</p>
      <p className='MealCardText'>Calories: {getCalories()} kcal</p>
      {nutrients.map((n, i) => (
        <p key={i} className='MealCardText'>
          {capitalize(n.type)}: {n.total} {unit}
        </p>
      ))}
      <div className='d-flex' style={{ justifyContent: 'end' }}>
        <button className="btn btn-warning btn-sm m-2 mb-0" onClick={onEdit}>Edit</button>
        <button className="btn btn-danger btn-sm m-2 mb-0" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

export default MealCard;
