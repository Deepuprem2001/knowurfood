import React from 'react';
import { useSwipeable } from 'react-swipeable';
import { motion } from 'framer-motion';

function MealCard({ name, nutrients, kcal = null, onEdit, onDelete, unit = 'g', disableSwipe }) {
  const [swipeX, setSwipeX] = React.useState(0);

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

  const displayCalories = kcal ?? getCalories(nutrients);

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const handlers = useSwipeable({
    onSwiping: ({ deltaX }) => {
      if (!disableSwipe) setSwipeX(deltaX); // track swipe
    },
    onSwiped: ({ dir, absX }) => {
      if (disableSwipe) return;
      if (dir === "Left" && absX > 120) {
        onDelete && onDelete();
      }
      if (dir === "Right" && absX > 120) {
        onEdit && onEdit();
      }
      setSwipeX(0); // reset after swipe
    },
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  const bgColor =
    swipeX < 0 ? "rgba(220,53,69,0.9)" : // red for delete
    swipeX > 0 ? "rgba(40,167,69,0.9)" : // green for edit
    "transparent"; // default

  const icon =
    swipeX < 0 ? <i className="bi bi-trash" style={{ fontSize: "1.5rem" }}></i> :
    swipeX > 0 ? <i className="bi bi-pencil" style={{ fontSize: "1.5rem" }}></i> :
    null;

  return (
    <div {...handlers} className="position-relative mb-2" style={{ overflow: "hidden" }}>
      {/* Background color + icon (stays fixed while card moves) */}
      <div
        className="position-absolute top-0 bottom-0 start-0 end-0 d-flex align-items-center justify-content-center"
        style={{ backgroundColor: bgColor, transition: "background-color 0.2s" }}
      >
        {icon}
      </div>

      {/* Foreground card that slides */}
      <motion.div
        animate={{ x: swipeX }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="meal-card text-white p-3 rounded shadow-sm position-relative"
        style={{ backgroundColor: "#1c1c1c" }}
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
