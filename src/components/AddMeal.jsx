import React, { useState, useEffect } from 'react';
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function AddMealModal({ isOpen, onClose, onSave , editMeal}) {
  const [mealType, setMealType] = useState('Breakfast');
  const [mealDate, setMealDate] = useState(new Date());

  const [foodNames, setFoodNames] = useState([""]);

  const [showManualEntry, setShowManualEntry] = useState(false);
  const [foodSections, setFoodSections] = useState([
    [{ type: 'Protein', count: '', serving: '1', total: '' }]
  ]);

   useEffect(() => {
    if (editMeal) {
      setMealType(editMeal.mealType);
      setMealDate(new Date(editMeal.timestamp));
      setFoodNames(editMeal.foodItems.map(f => f.name));
      setFoodSections(editMeal.foodItems.map(f => f.nutrients));
      setShowManualEntry(true);
    }
  }, [editMeal]);

  if (!isOpen) return null;

  const addFoodSection = () => {
    setFoodSections([...foodSections, [{ type: 'Protein', count: '', serving: '1', total: '' }]]);
    setFoodNames([...foodNames, ""]);
  };

  const addRow = (sectionIndex) => {
    const updatedSections = [...foodSections];
    updatedSections[sectionIndex].push({ type: 'Protein', count: '', serving: '1', total: '' });
    setFoodSections(updatedSections);
  };

  const removeRow = (sectionIndex, rowIndex) => {
    const updatedSections = [...foodSections];
    updatedSections[sectionIndex].splice(rowIndex, 1);
    setFoodSections(updatedSections);
  };

  const updateRow = (sectionIndex, rowIndex, field, value) => {
    const updatedSections = [...foodSections];
    const row = updatedSections[sectionIndex][rowIndex] ;

    row[field] = value;
    const count = parseFloat(row.count) || 0;
    const serving = parseFloat(row.serving) || 0;

    if(field === 'count' || field === 'serving') {
      row.total = (count * serving).toFixed(2);
    }

    setFoodSections(updatedSections);
  };

  const resetModel = () => {
    setFoodSections([[{ type: 'Protein', count: '', serving: '1', total: '' }]]);
    setFoodNames([""]);
    setMealDate(new Date());
    setShowManualEntry(false);
  }

  const handleSave = () => {
  const foodItems = foodSections.map((nutrients, i) => ({
    name: foodNames[i] || `Food ${i + 1}`,
    nutrients,
  }));

  const mealData = {
    mealType,
    date: mealDate.toISOString().split('T')[0],
    timestamp: mealDate.toISOString(),
    foodItems,
  };


  onSave(mealData);
  resetModel();
  onClose();
};



  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <div className="modal-header col-md-12 mb-1" style={{display:'flex'}}>
          <div style={{display:'flex', width:'100%', marginRight:'5%'}}>
            <p className='ModelTitleName'>Select Meal</p>
            <select className='DropDownMeal' value={mealType} onChange={(e) => setMealType(e.target.value)}>
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
            </select>
          </div>
          <DatePicker
            selected={mealDate}
            onChange={(date) => setMealDate(date)}
            className="form-control"
            dateFormat="yyyy-MM-dd"
            maxDate={new Date()} // Optional: restrict to today or earlier
            popperPlacement="bottom-start" // Optional: better positioning
            showPopperArrow={false}
          />
        </div>

        <div className="modal-body">
          <div className="manual-scan-buttons">
            <button className="btn-manual" onClick={() => setShowManualEntry(true)}>Manual Entry</button>
            <button className="btn-scan">Scan It</button>
          </div>

          {showManualEntry && (
            <div className='TotalFoodSection'>
              {foodSections.map((rows, sectionIndex) => (
                <div className="food-section" key={sectionIndex}>
                  <div className='FoodNameSection'>
                    <p className='FoodName'>Food</p>
                    <textarea
                      className='FoodNameTextArea'
                      value={foodNames[sectionIndex]}
                      onChange={(e) => {
                        const updated = [...foodNames];
                        updated[sectionIndex] = e.target.value;
                        setFoodNames(updated);
                      }}
                     />
                  </div>

                  <div className="row fw-bold mb-2 text-white" style={{ fontSize: '11px', padding: '0 10px' }}>
                    <div className="col">Type</div>
                    <div className="col">Count</div>
                    <div className="col">Servings</div>
                    <div className="col">Total</div>
                    <div className="col">Remove</div>
                  </div>

                  <div className='SplitTable'>
                    {rows.map((row, rowIndex) => (
                      <div className="row mb-1" key={rowIndex}>
                        <div className="col">
                          <select
                            className='form-select'
                            value={row.type}
                            onChange={(e) => updateRow(sectionIndex, rowIndex, 'type', e.target.value)}
                          >
                            <option>Protein</option>
                            <option>Fat</option>
                            <option>Carbohydrate</option>
                            <option>Carbs as Sugar</option>
                            <option>Fibre</option>
                            <option>Salt</option>
                          </select>
                        </div>

                        <div className="col">
                          <input
                            type="number"
                            className="form-control"
                            value={row.count}
                            onChange={(e) => updateRow(sectionIndex, rowIndex, 'count', e.target.value)}
                          />
                        </div>

                        <div className="col">
                          <select
                            className='form-select'
                            value={row.serving}
                            onChange={(e) => updateRow(sectionIndex, rowIndex, 'serving', e.target.value)}
                          >
                            {[...Array(10)].map((_, i) => (
                              <option key={i + 1}>{i + 1}</option>
                            ))}
                          </select>
                        </div>

                        <div className="col">
                          <input
                            type="number"
                            className="form-control"
                            value={row.total}
                            disabled
                          />
                        </div>

                        <div className="col text-center">
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => removeRow(sectionIndex, rowIndex)}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="AddItemButton mt-2" onClick={() => addRow(sectionIndex)}>Add Nutrient</button>
                </div>
              ))}

              <button className="AddItemButton mt-1" onClick={addFoodSection}>Add Food Item</button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-save" onClick={handleSave}>Save</button>
          <button className="btn-exit" onClick={() => { resetModel(); onClose(); }}>Exit</button>
        </div>
      </div>
    </div>
  );
}

export default AddMealModal;
