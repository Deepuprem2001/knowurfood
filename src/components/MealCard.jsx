import React from 'react';

function MealCard({ name, nutrients, onEdit, onDelete }) {
  // Calculate estimated calories per item
  const getCalories = () => {
    let total = 0;
    nutrients.forEach(n => {
      const val = parseFloat(n.total) || 0;
      if (n.type === "Carbohydrate" || n.type === "Protein") total += val * 4;
      if (n.type === "Fat") total += val * 9;
    });
    return Math.round(total);
  };

  // Function to determine unit (for display)
  const getUnit = (type) => {
    const typesWithG = [
      "Protein",
      "Fat",
      "Carbohydrate",
      "Carbs as Sugar",
      "Fibre",
      "Salt"
    ];
    return typesWithG.includes(type) ? "g" : "";
  };

  // Capitalize function
  const capitalize = (str) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <div className="meal-card">
      <p className='MealCardText'>{name}</p>
      <p className='MealCardText'>Calories: {getCalories()} kcal</p>
      {nutrients.map((n, i) => (
        <p key={i} className='MealCardText'>
          {capitalize(n.type)}: {n.total} {getUnit(n.type)}
        </p>
      ))}
      <button className="btn btn-sm mt-2" onClick={onEdit}>Edit</button>
      <button className="btn btn-sm mt-2" onClick={onDelete}>Delete</button>
    </div>
  );
}

export default MealCard;
