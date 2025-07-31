// AddMeal.jsx
import React, { useState, useEffect, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { parseNutritionFromText } from '../utils/mlparser';

function AddMealModal({ isOpen, onClose, onSave, editMeal }) {
  const [mealType, setMealType] = useState('Breakfast');
  const [mealDate, setMealDate] = useState(new Date());
  const [foodNames, setFoodNames] = useState([""]);
  const [foodSections, setFoodSections] = useState([[{ type: 'Protein', count: '', serving: '1', total: '' }]]);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showAutoEntry, setShowAutoEntry] = useState(false); 
  const videoRef = useRef(null);

  useEffect(() => {
    if (editMeal) {
      stopScan();
      setMealType(editMeal.mealType);
      setMealDate(new Date(editMeal.timestamp));
      setFoodNames(editMeal.foodItems.map(f => f.name));
      setFoodSections(editMeal.foodItems.map(f => f.nutrients));
      setShowManualEntry(true);
      setShowAutoEntry(false);
      setScanning(false);
    }
  }, [editMeal]);

  const resetModel = () => {
    stopScan();
    setFoodSections([[{ type: 'Protein', count: '', serving: '1', total: '' }]]);
    setFoodNames([""]);
    setMealDate(new Date());
    setShowManualEntry(false);
    setShowAutoEntry(false);
    setScanning(false);
  };

  const switchMode = (mode) => {
    stopScan();
    setShowManualEntry(mode === 'manual');
    setShowAutoEntry(mode === 'auto');
    setScanning(mode === 'scan');
  };

  const addFoodSection = () => {
    setFoodSections([...foodSections, [{ type: 'Protein', count: '', serving: '1', total: '' }]]);
    setFoodNames([...foodNames, ""]);
  };

  const addRow = (sectionIndex) => {
    const updated = [...foodSections];
    updated[sectionIndex].push({ type: 'Protein', count: '', serving: '1', total: '' });
    setFoodSections(updated);
  };

  const removeRow = (sectionIndex, rowIndex) => {
    const updated = [...foodSections];
    updated[sectionIndex].splice(rowIndex, 1);
    setFoodSections(updated);
  };

  const isSaveDisabled = foodSections.every(section =>
    section.every(n => !n.count || parseFloat(n.count) === 0)
  );

  const updateRow = (sectionIndex, rowIndex, field, value) => {
    const updated = [...foodSections];
    const section = updated[sectionIndex];

    if (field === 'serving') {
      section.forEach((row) => {
        row.serving = value;
        const count = parseFloat(row.count) || 0;
        const serving = parseFloat(value) || 1;
        row.total = (count * serving).toFixed(2);
      });
    } else {
      const row = section[rowIndex];
      row[field] = value;
      const count = parseFloat(row.count) || 0;
      const serving = parseFloat(row.serving) || 1;
      row.total = (count * serving).toFixed(2);
    }

    setFoodSections(updated);
  };

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

  const startScan = async () => {
    switchMode('scan');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      alert('Camera access denied.');
      setScanning(false);
    }
  };

  const stopScan = () => {
    const video = videoRef.current;
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
    setScanning(false);
  };

  const captureAndScan = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      alert("Camera not ready yet. Wait a moment.");
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg;
      data[i + 1] = avg;
      data[i + 2] = avg;
    }
    ctx.putImageData(imageData, 0, 0);

    Tesseract.recognize(canvas, 'eng').then(({ data: { text } }) => {
      const parsed = parseNutritionFromText(text);
      if (parsed.length > 0) {
        setFoodSections([parsed]);
        switchMode('manual');
      } else {
        alert("No nutritional values detected. Try again or enter manually.");
      }
      stopScan();
    });
  };

  const fetchNutritionByFoodName = async (name, index) => {
    try {
      const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(name)}&search_simple=1&action=process&json=1`);
      const data = await res.json();
      const top = data.products?.find(p => p.nutriments && p.nutriments['energy-kcal_100g'] && p.nutriments['proteins_100g']);

      if (!top || !top.nutriments) throw new Error("No valid nutrition info found.");

      const n = top.nutriments;

      const newRows = [
        n.proteins_100g && { type: 'Protein', count: parseFloat(n.proteins_100g).toFixed(2), serving: '1', total: parseFloat(n.proteins_100g).toFixed(2) },
        n.fat_100g && { type: 'Fat', count: parseFloat(n.fat_100g).toFixed(2), serving: '1', total: parseFloat(n.fat_100g).toFixed(2) },
        n.carbohydrates_100g && { type: 'Carbohydrate', count: parseFloat(n.carbohydrates_100g).toFixed(2), serving: '1', total: parseFloat(n.carbohydrates_100g).toFixed(2) },
        n.sugars_100g && { type: 'Carbs as Sugar', count: parseFloat(n.sugars_100g).toFixed(2), serving: '1', total: parseFloat(n.sugars_100g).toFixed(2) },
        n.fiber_100g && { type: 'Fibre', count: parseFloat(n.fiber_100g).toFixed(2), serving: '1', total: parseFloat(n.fiber_100g).toFixed(2) },
        n.salt_100g && { type: 'Salt', count: parseFloat(n.salt_100g).toFixed(2), serving: '1', total: parseFloat(n.salt_100g).toFixed(2) },
      ].filter(Boolean);

      const updated = [...foodSections];
      updated[index] = newRows;
      setFoodSections(updated);
      switchMode('auto');
    } catch (err) {
      alert("⚠️ Could not fetch nutrition info. Try a more specific food name.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container bg-dark">
        <div className="modal-header col-md-12 mb-2" style={{ display: 'flex' }}>
          <div style={{ display: 'flex', width: '100%', marginRight: '5%', alignItems: 'center' }}>
            <p className='ModelTitleName'>Select Meal</p>
            <select className='DropDownMeal' value={mealType} onChange={(e) => setMealType(e.target.value)}>
              <option>Breakfast</option>
              <option>Lunch</option>
              <option>Dinner</option>
            </select>
          </div>
          <input
            type="date"
            className="form-control"
            value={mealDate.toISOString().split('T')[0]}
            onChange={(e) => setMealDate(new Date(e.target.value))}
            max={new Date().toISOString().split('T')[0]}
            style={{ width: '30%' }}
          />
        </div>

        <div className="manual-scan-buttons mb-2">
          <button className="btn btn-primary btn-sm" onClick={() => switchMode('manual')}>Manual Entry</button>
          <button className="btn btn-primary btn-sm" onClick={() => switchMode('auto')}>Auto Fill</button>
          <button className="btn btn-primary btn-sm" onClick={startScan}>Scan It</button>
        </div>

        {/* SCAN UI */}
        {scanning && (
          <div className="scan-box text-center">
            <video ref={videoRef} style={{ width: '100%', maxHeight: '200px' }} />
            <button className="btn btn-primary mt-2" onClick={captureAndScan}>Capture</button>
            <button className="btn btn-danger mt-2 ms-2" onClick={stopScan}>Cancel</button>
          </div>
        )}

        {/* MANUAL UI */}
        {showManualEntry && renderFoodSections()}

        {/* AUTO FILL UI */}
        {showAutoEntry && renderFoodSections(true)}

        <div className="modal-footer mt-3">
          <button
            className="btn btn-save btn-primary"
            onClick={handleSave}
            disabled={isSaveDisabled}
          >
            Save
          </button>
          <button className="btn btn-exit btn-danger" onClick={() => { resetModel(); onClose(); }}>Exit</button>
        </div>
      </div>
    </div>
  );

  function renderFoodSections(showAuto = false) {
    return (
      <div className='TotalFoodSection'>
        {foodSections.map((rows, sectionIndex) => (
          <div className="food-section" key={sectionIndex}>
            <div className='FoodNameSection d-flex align-items-center gap-2'>
              <textarea
                className='FoodNameTextArea'
                value={foodNames[sectionIndex]}
                style={{width:'100%'}}
                onChange={(e) => {
                  const updated = [...foodNames];
                  updated[sectionIndex] = e.target.value;
                  setFoodNames(updated);
                }}
                placeholder="Enter food name (e.g., boiled egg)"
              />
              {showAuto && (
                <button
                  className="btn btn-sm btn-info"
                  style={{ fontSize: '12px', width:'35%' }}
                  onClick={() => fetchNutritionByFoodName(foodNames[sectionIndex], sectionIndex)}
                >
                  🔍 Auto-Fill
                </button>
              )}
            </div>

            <div className="row fw-bold mb-2 text-white" style={{ fontSize: '12px', padding: '0 10px' }}>
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
                    <select className='form-select' value={row.type} onChange={(e) => updateRow(sectionIndex, rowIndex, 'type', e.target.value)}>
                      <option>Protein</option>
                      <option>Fat</option>
                      <option>Carbohydrate</option>
                      <option>Carbs as Sugar</option>
                      <option>Fibre</option>
                      <option>Salt</option>
                    </select>
                  </div>
                  <div className="col">
                    <input type="number" className="form-control" value={row.count} onChange={(e) => updateRow(sectionIndex, rowIndex, 'count', e.target.value)} />
                  </div>
                  <div className="col">
                    <select className='form-select' value={row.serving} onChange={(e) => updateRow(sectionIndex, rowIndex, 'serving', e.target.value)}>
                      {[...Array(10)].map((_, i) => (<option key={i + 1}>{i + 1}</option>))}
                    </select>
                  </div>
                  <div className="col">
                    <input type="number" className="form-control" value={row.total} disabled />
                  </div>
                  <div className="col text-center">
                    <button className="btn btn-danger btn-sm" onClick={() => removeRow(sectionIndex, rowIndex)}>×</button>
                  </div>
                </div>
              ))}
            </div>
            <button className="AddItemButton mt-1" onClick={() => addRow(sectionIndex)}>Add Nutrient</button>
          </div>
        ))}
        <button className="AddItemButton mt-3" onClick={addFoodSection}>Add Food Item</button>
      </div>
    );
  }
}

export default AddMealModal;
