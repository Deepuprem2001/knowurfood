import React, { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library'; // for barcode scan fallback
import WeightLogger from './WeightLogger'; // for logging weight
import { useToast } from '../contexts/ToastContext'; 
import Tesseract from 'tesseract.js'; // OCR for nutrition labels
import { parseNutritionFromText } from '../utils/mlparser'; 

/**
 * AddMealModal.jsx
 * ----------------
 * Handles logging meals (Manual, Auto, Barcode, OCR) OR logging weight.
 * Entry point modal that switches between modes:
 *  - Meal logging (auto/manual/barcode/ocr)
 *  - Weight logging
 */
function AddMealModal({ isOpen, onClose, onSave, editMeal, user }) {
  // Core state
  const [mealType, setMealType] = useState('Breakfast');
  const [mealDate, setMealDate] = useState(new Date());
  const [foodNames, setFoodNames] = useState([""]);
  const [foodSections, setFoodSections] = useState([[{ type: 'Protein', count: '', serving: '1', total: '' }]]);
  const [mode, setMode] = useState(null); // 'meal' or 'weight'

  // UI flags
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showAutoEntry, setShowAutoEntry] = useState(false); 
  const [scanning, setScanning] = useState(false);
  const [barcodeFallbackPrompt, setBarcodeFallbackPrompt] = useState(false);

  // Nutrition helpers
  const [scannedKcal, setScannedKcal] = useState(null);
  const { showToast } = useToast();
  const videoRef = useRef(null);

  // Serving controls
  const servingOptions = [
    { label: "100 g", value: 100 },
    { label: "slice (30 g)", value: 30 },
    { label: "cup (200 ml)", value: 200 },
    { label: "package (250 g)", value: 250 },
  ];
  const [quantity, setQuantity] = useState(1);
  const [selectedServing, setSelectedServing] = useState(servingOptions[0].value);
  const [customServing, setCustomServing] = useState(0);

  // Allowed nutrient types
  const ALLOWED_NUTRIENTS = [
    'Protein', 'Fat', 'Carbohydrate', 'Sugar', 'Sugars',
    'Fibre', 'Fiber', 'Salt', 'Caffeine'
  ];

  // If editing an existing meal, preload fields
  useEffect(() => {
    if (editMeal) {
      stopScan();
      setMode(null);
      setMealType(editMeal.mealType);
      setMealDate(new Date(editMeal.timestamp));
      setFoodNames(editMeal.foodItems.map(f => f.name));
      setFoodSections(editMeal.foodItems.map(f => f.nutrients));
      setShowManualEntry(true);
      setShowAutoEntry(false);
      setScanning(false);
    }
  }, [editMeal]);

  //Normalize nutrient labels into consistent form 
  const normalizeNutrient = (type = '') => {
    const t = type.toLowerCase();
    if (t === 'sugars') return 'Sugar';
    if (t === 'fiber') return 'Fibre';
    if (t === 'proteins') return 'Protein';
    if (t === 'carbohydrates') return 'Carbohydrate';
    if (t === 'saturated fat') return 'Fat';
    return type;
  };

  // Reset modal state 
  const resetModel = () => {
    stopScan();
    setMode(null);
    setFoodSections([[{ type: 'Protein', count: '', serving: '1', total: '' }]]);
    setFoodNames([""]);
    setMealDate(new Date());
    setShowManualEntry(false);
    setShowAutoEntry(false);
    setScanning(false);
    setScannedKcal(null);
  };

  // Switch UI mode 
  const switchMode = (mode) => {
    stopScan();
    setShowManualEntry(mode === 'manual');
    setShowAutoEntry(mode === 'auto');
    setScanning(mode === 'scan');
  };

  // Add/remove/edit rows & sections 
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
  const updateRow = (sectionIndex, rowIndex, field, value) => {
    const updated = [...foodSections];
    const section = updated[sectionIndex];
    const row = section[rowIndex];
    row[field] = value;

    const count = parseFloat(row.count) || 0;
    const serving = parseFloat(row.serving) || 1;
    row.total = (count * serving).toFixed(2);

    setFoodSections(updated);
  };
  const isSaveDisabled = foodSections.every(section =>
    section.every(n => !n.count || parseFloat(n.count) === 0)
  );

  //Save meal 
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
      kcal: scannedKcal || calculateCalories(foodItems),
    };

    onSave(mealData);
    resetModel();
    onClose();
  };

  //Stop camera scan 
  const stopScan = () => {
    const video = videoRef.current;
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
    setScanning(false);
  };

  // Capture frame from camera and OCR via Tesseract 
  const captureAndScan = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      showToast("Camera not ready yet. Wait a moment.");
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    Tesseract.recognize(canvas, 'eng').then(({ data: { text } }) => {
      const parsed = parseNutritionFromText(text);
      if (parsed.length > 0) {
        setFoodSections([parsed]);
        switchMode('manual');
      } else {
        showToast("No nutritional values detected. Try again or enter manually.");
      }
      stopScan();
    });
  };

  // Fetch nutrition by food name (OpenFoodFacts API) 
  const fetchNutritionByFoodName = async (name, index) => {
    try {
      const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(name)}&search_simple=1&action=process&json=1`);
      const data = await res.json();
      const top = data.products?.find(p => p.nutriments?.['energy-kcal_100g'] && p.nutriments?.['proteins_100g']);
      if (!top) throw new Error("No valid nutrition info found.");

      const n = top.nutriments;
      const rawNutrients = {
        Protein: n.proteins_100g,
        Fat: n.fat_100g,
        Carbohydrate: n.carbohydrates_100g,
        Sugar: n.sugars_100g,
        Fibre: n.fiber_100g,
        Salt: n.salt_100g,
        Caffeine: n.caffeine_100g,
      };

      const newRows = Object.entries(rawNutrients)
        .filter(([key, val]) => ALLOWED_NUTRIENTS.includes(key) && val !== undefined)
        .map(([type, count]) => ({
          type,
          count: parseFloat(count).toFixed(2),
          serving: '1',
          total: parseFloat(count).toFixed(2),
        }));

      const updated = [...foodSections];
      updated[index] = newRows;
      setFoodSections(updated);
      switchMode('auto');
    } catch {
      showToast("⚠️ Could not fetch nutrition info. Try a more specific food name.");
    }
  };

  // Fetch nutrition by barcode (OpenFoodFacts API) 
  const fetchNutritionByBarcode = async (barcode) => {
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();
      if (data.status === 0) {
        showToast('❌ Product not found.');
        return;
      }

      const nutriments = data.product.nutriments;
      const foodName = data.product.product_name || 'Scanned Product';

      const rawNutrients = {
        Fat: nutriments.fat_100g,
        Carbohydrate: nutriments.carbohydrates_100g,
        Protein: nutriments.proteins_100g,
        Sugar: nutriments.sugars_100g,
        Fibre: nutriments.fiber_100g,
        Salt: nutriments.salt_100g,
        Caffeine: nutriments.caffeine_100g,
      };

      setScannedKcal(parseFloat(nutriments['energy-kcal_100g']) || 0);

      const nutrients = Object.entries(rawNutrients)
        .filter(([key, val]) => ALLOWED_NUTRIENTS.includes(key) && val !== undefined)
        .map(([type, count]) => ({
          type,
          count: parseFloat(count).toFixed(2),
          serving: '1',
          total: parseFloat(count).toFixed(2),
        }));

      setFoodNames([foodName]);
      setFoodSections([nutrients]);
      switchMode('manual');
    } catch (err) {
      showToast("⚠️ Nutrition fetch failed.");
      console.error(err);
    }
  };

  // Simple calorie calculator if kcal not provided 
  const calculateCalories = (foodItems) => {
    let total = 0;
    foodItems.forEach(item =>
      item.nutrients.forEach(n => {
        if (n.type.toLowerCase().includes("calorie") || n.type.toLowerCase().includes("kcal")) {
          total += parseFloat(n.total || 0);
        }
      })
    );
    return total;
  };

  // ---------------- UI RENDER -----------------
  if (!isOpen) return null;

  // Mode select UI
  if (mode === null) {
    return (
      <div className="modal-backdrop">
        <div className="modal-container bg-dark text-white p-4 text-center">
          <h5 className="mb-3">What would you like to log?</h5>
          <div className="d-flex flex-column gap-2">
            <button className="btn btn-primary" onClick={() => setMode('meal')}>Log Meal</button>
            <button className="btn btn-outline-light" onClick={() => setMode('weight')}>Log Weight</button>
            <button className="btn btn-danger mt-2" onClick={() => { resetModel(); onClose(); }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {mode === 'meal' && (
        <div className="modal-backdrop">
          <div className="modal-container bg-dark">
            {/* Header: Meal type + Date */}
            <div className="modal-header col-md-12 mb-2 d-flex">
              <div className="d-flex flex-grow-1 me-3 align-items-center">
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

            {/* Entry mode buttons */}
            <div className="manual-scan-buttons mb-2">
              <button className="btn btn-primary btn-sm" onClick={() => switchMode('manual')}>Manual Entry</button>
              <button className="btn btn-primary btn-sm" onClick={() => switchMode('auto')}>Auto Fill</button>
              <label className="btn btn-primary btn-sm">
                Scan Barcode
                <input type="file" accept="image/*" capture="environment" onChange={e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const img = new Image();
                  img.src = URL.createObjectURL(file);
                  img.onload = async () => {
                    try {
                      const result = await new BrowserMultiFormatReader().decodeFromImageElement(img);
                      await fetchNutritionByBarcode(result.getText());
                    } catch {
                      setBarcodeFallbackPrompt(true);
                    }
                  };
                }} style={{ display: 'none' }} />
              </label>
            </div>

            {/* Fallback if barcode scan fails */}
            {barcodeFallbackPrompt && (
              <div className="modal-backdrop">
                <div className="modal-container bg-dark text-white p-4 text-center">
                  <h5 className="mb-3">Barcode not recognized</h5>
                  <p>Would you like to try scanning the nutrition label instead?</p>
                  <div className="d-flex justify-content-center gap-3">
                    <button className="btn btn-secondary" onClick={() => setBarcodeFallbackPrompt(false)}>Cancel</button>
                    <label className="btn btn-primary">
                      📷 Scan Label
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => { handleOCRImage(e); setBarcodeFallbackPrompt(false); }}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* OCR scanning live preview */}
            {scanning && (
              <div className="scan-box text-center">
                <video ref={videoRef} style={{ width: '100%', maxHeight: '200px' }} />
                <button className="btn btn-primary mt-2" onClick={captureAndScan}>Capture</button>
                <button className="btn btn-danger mt-2 ms-2" onClick={stopScan}>Cancel</button>
              </div>
            )}

            {/* Manual / Auto entry forms */}
            {showManualEntry && renderFoodSections()}
            {showAutoEntry && renderFoodSections(true)}

            {/* Footer actions */}
            <div className="modal-footer mt-3">
              <button className="btn btn-save btn-primary" onClick={handleSave} disabled={isSaveDisabled}>Save</button>
              <button className="btn btn-exit btn-danger" onClick={() => { resetModel(); onClose(); }}>Exit</button>
            </div>
          </div>
        </div>
      )}

      {mode === 'weight' && (
        <div className='modal-backdrop'>
          <div className="modal-container bg-dark text-white p-4 text-center">
            <WeightLogger user={user} onClose={() => { resetModel(); onClose(); }}/>
            <div className="d-flex justify-content-end">
              <button className="btn btn-danger mt-2" onClick={() => { resetModel(); onClose(); }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Render nutrient entry form 
  function renderFoodSections(showAuto = false) {
    return (
      <div className='TotalFoodSection'>
        {foodSections.map((rows, sectionIndex) => (
          <div className="food-section" key={sectionIndex}>
            {/* Food name + optional auto fill button */}
            <div className='FoodNameSection d-flex align-items-center gap-2'>
              <textarea
                className='FoodNameTextArea'
                value={foodNames[sectionIndex]}
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
                  onClick={() => fetchNutritionByFoodName(foodNames[sectionIndex], sectionIndex)}
                >
                  🔍 Auto-Fill
                </button>
              )}
            </div>

            {/* Serving controls */}
            <div className="d-flex align-items-center mb-3 mt-2">
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="form-control me-2"
                style={{ width: "80px" }}
              />
              <select className="form-select" value={selectedServing} onChange={(e) => setSelectedServing(e.target.value)}>
                {servingOptions.map((opt, i) => (
                  <option key={i} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Table headers */}
            <div className="row fw-bold mb-2 text-white" style={{ fontSize: '12px', padding: '0 10px' }}>
              <div className="col">Type</div>
              <div className="col">Count (per 100g)</div>
              <div className="col">Total</div>
              <div className="col">Remove</div>
            </div>

            {/* Nutrient rows */}
            <div className='SplitTable'>
              {rows.map((row, rowIndex) => {
                const servingInGrams = selectedServing === "custom" ? customServing : selectedServing;
                const multiplier = servingInGrams > 0 ? (quantity * servingInGrams) / 100 : 1;

                return (
                  <div className="row mb-1" key={rowIndex}>
                    <div className="col">
                      <input
                        list={`nutrient-options-${sectionIndex}-${rowIndex}`}
                        className="form-control"
                        value={row.type}
                        onChange={(e) => updateRow(sectionIndex, rowIndex, 'type', normalizeNutrient(e.target.value))}
                      />
                      <datalist id={`nutrient-options-${sectionIndex}-${rowIndex}`}>
                        {ALLOWED_NUTRIENTS.map(n => <option key={n} value={n} />)}
                      </datalist>
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
                      <input
                        type="number"
                        className="form-control"
                        value={(parseFloat(row.count || 0) * multiplier).toFixed(2)}
                        disabled
                      />
                    </div>
                    <div className="col text-center">
                      <button className="btn btn-danger btn-sm" onClick={() => removeRow(sectionIndex, rowIndex)}>×</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add nutrient row */}
            <button className="AddItemButton mt-1" onClick={() => addRow(sectionIndex)}>Add Nutrient</button>
          </div>
        ))}

        {/* Add food item */}
        <button className="AddItemButton mt-3" onClick={addFoodSection}>Add Food Item</button>
      </div>
    );
  }
}

export default AddMealModal;
