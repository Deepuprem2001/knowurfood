import React from 'react';
import { useSwipeable } from 'react-swipeable';
import { motion } from 'framer-motion';

function MealCard({ name, nutrients, kcal = null, onEdit, onDelete, unit = 'g', disableSwipe }) {
  const [swipeAction, setSwipeAction] = React.useState(null);

  const getCalories = (nutrients = []) => {
    let kcal = 0;
    nutrients.forEach(n => {
      const c = parseFloat(n.count || 0);
      if (n.type?.toLowerCase() === 'fat') kcal += c * 9;
      if (n.type?.toLowerCase() === 'protein') kcal += c * 4;
      if (n.type?.toLowerCase().includes('carbohydrate')) kcal += c * 4;
    });
    return Math.round(kcal);
  };

  const displayCalories = kcal ?? getCalories(nutrients); // Use prop if available

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (!disableSwipe) {
        setSwipeAction('left');
        setTimeout(() => {
          onDelete && onDelete();
          setSwipeAction(null);
        }, 300);
      }
    },
    onSwipedRight: () => {
      if (!disableSwipe) {
        setSwipeAction('right');
        setTimeout(() => {
          onEdit && onEdit();
          setSwipeAction(null);
        }, 300);
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  return (
    <div {...handlers} className="position-relative mb-2">
      {swipeAction === 'left' && (
        <div className="position-absolute top-50 start-100 translate-middle-y text-danger fw-bold" style={{ zIndex: 1 }}>
          🗑️
        </div>
      )}
      {swipeAction === 'right' && (
        <div className="position-absolute top-50 start-0 translate-middle-y text-warning fw-bold" style={{ zIndex: 1 }}>
          🖊️
        </div>
      )}

      <motion.div
        initial={{ x: 0 }}
        animate={{ x: swipeAction === 'left' ? -100 : swipeAction === 'right' ? 100 : 0 }}
        transition={{ duration: 0.3 }}
        className="meal-card text-white p-3 rounded shadow-sm"
        style={{ backgroundColor: '#00bfff17' }}
      >
        <p className="MealCardText mb-1 fw-bold">{name}</p>
        <p className="MealCardText mb-1">Calories: {displayCalories} kcal</p>

        {nutrients
          .filter(n =>
            ['protein', 'fat', 'carbohydrate', 'sugar', 'sugars', 'fibre', 'fiber', 'salt', 'caffeine']
              .includes(n.type?.toLowerCase())
          )
          .map((n, i) => (
            <p key={i} className="MealCardText mb-1">
              {capitalize(n.type)}: {n.total} {unit}
            </p>
        ))}
      </motion.div>
    </div>
  );
}

export default MealCard;
