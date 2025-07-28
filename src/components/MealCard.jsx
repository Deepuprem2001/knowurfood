import React from 'react';
import { useSwipeable } from 'react-swipeable';
import { motion } from 'framer-motion';

function MealCard({ name, nutrients, onEdit, onDelete, unit = 'g', disableSwipe }) {
  const [swipeAction, setSwipeAction] = React.useState(null);

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
      {/* Overlay Icons */}
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

      {/* Swipeable Card */}
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: swipeAction === 'left' ? -100 : swipeAction === 'right' ? 100 : 0 }}
        transition={{ duration: 0.3 }}
        className="meal-card text-white p-3 rounded shadow-sm"
        style={{backgroundColor:'#00bfff17'}}
      >
        <p className="MealCardText mb-1 fw-bold">{name}</p>
        <p className="MealCardText mb-1">Calories: {getCalories()} kcal</p>
        {nutrients.map((n, i) => (
          <p key={i} className="MealCardText mb-1">
            {capitalize(n.type)}: {n.total} {unit}
          </p>
        ))}
        {/* <div className="d-flex justify-content-end gap-2 mt-2">
          <button className="btn btn-warning btn-sm" onClick={onEdit}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={onDelete}>Delete</button>
        </div> */}
      </motion.div>
    </div>
  );
}

export default MealCard;
