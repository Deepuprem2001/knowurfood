import React, { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library'; // NEW
import WeightLogger from './WeightLogger';
import { useToast } from '../contexts/ToastContext'; // adjust path if needed
import Tesseract from 'tesseract.js';
import { parseNutritionFromText } from '../utils/mlparser'; // Adjust path if needed


function AddMealModal({ isOpen, onClose, onSave, editMeal, user }) {
  const [mealType, setMealType] = useState('Breakfast');
  const [mealDate, setMealDate] = useState(new Date());
  const [foodNames, setFoodNames] = useState([""]);
  const [foodSections, setFoodSections] = useState([[{ type: 'Protein', count: '', serving: '1', total: '' }]]);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showAutoEntry, setShowAutoEntry] = useState(false); 
  const videoRef = useRef(null);

  const [mode, setMode] = useState(null); // 'meal' or 'weight'
  
  const [scannedKcal, setScannedKcal] = useState(null);

  const { showToast } = useToast();

  const [barcodeFallbackPrompt, setBarcodeFallbackPrompt] = useState(false);


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

  const ALLOWED_NUTRIENTS = [
  'Protein', 'Fat', 'Carbohydrate', 'Sugar', 'Sugars',
  'Fibre', 'Fiber', 'Salt', 'Caffeine'
  ];

  const normalizeNutrient = (type = '') => {
    const t = type.toLowerCase();
    if (t === 'sugars') return 'Sugar';
    if (t === 'fiber') return 'Fibre';
    if (t === 'proteins') return 'Protein';
    if (t === 'carbohydrates') return 'Carbohydrate';
    if (t === 'saturated fat') return 'Fat';
    return type;
  };

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
      kcal: scannedKcal || calculateCalories(foodItems),
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
      showToast('Camera access denied.');
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
      showToast("Camera not ready yet. Wait a moment.");
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
        showToast("No nutritional values detected. Try again or enter manually.");
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
    } catch (err) {
      showToast("⚠️ Could not fetch nutrition info. Try a more specific food name.");
    }
  };


  const handleBarcodeImage = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = async () => {
    const codeReader = new BrowserMultiFormatReader();
    try {
      const result = await codeReader.decodeFromImageElement(img);
      await fetchNutritionByBarcode(result.getText());
    } catch {
        setBarcodeFallbackPrompt(true); // state toggle for showing modal

    }
  };
  };

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

    const kcal = parseFloat(nutriments['energy-kcal_100g']) || 0;
    setScannedKcal(kcal); // ✅ SET CALORIES HERE

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

  const handleOCRImage = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    Tesseract.recognize(canvas, 'eng').then(({ data: { text } }) => {
      const parsed = parseNutritionFromText(text);
      if (parsed.length > 0) {
        setFoodSections([parsed]);
        setShowManualEntry(true);
        showToast("✅ Nutrients extracted from label", "success");
      } else {
        showToast("⚠️ Could not detect nutrients. Try again or enter manually.", "warning");
      }
    });
  };
};


  const calculateCalories = (foodItems) => {
  let total = 0;
  foodItems.forEach(item => {
    item.nutrients.forEach(n => {
      if (n.type.toLowerCase().includes("calorie") || n.type.toLowerCase().includes("kcal")) {
        total += parseFloat(n.total || 0);
      }
    });
  });
  return total;
  };



  if (!isOpen) return null;
  if (mode === null) {
  return (
    <div className="modal-backdrop">
      <div className="modal-container bg-dark text-white p-4 text-center">
        <h5 className="mb-3">What would you like to log?</h5>
        <div className="d-flex flex-column gap-2">
          <button className="btn btn-primary" onClick={() => setMode('meal')}>
            Log Meal
          </button>
          <button className="btn btn-outline-light" onClick={() => setMode('weight')}>
            Log Weight
          </button>
          <button className="btn btn-danger mt-2" onClick={() => { resetModel(); onClose(); }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}


  return (
  <>
  {mode === null && (
      <div className="modal-backdrop">
        <div className="modal-container bg-dark text-white p-4 text-center">
          <h5 className="mb-3">What would you like to log?</h5>
          <div className="d-flex flex-column gap-2">
            <button className="btn btn-primary" onClick={() => setMode('meal')}>
              ➕ Log Meal
            </button>
            <button className="btn btn-outline-light" onClick={() => setMode('weight')}>
              ⚖️ Log Weight
            </button>
            <button className="btn btn-secondary mt-2" onClick={() => { resetModel(); onClose(); }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
  )} 
  {mode === 'meal' && (
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
          <label className="btn btn-primary btn-sm">
            Scan Barcode
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleBarcodeImage}
              style={{ display: 'none' }}
            />
          </label>
        </div>

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
            onChange={(e) => {
              handleOCRImage(e); // same function you just fixed
              setBarcodeFallbackPrompt(false); // close prompt after scan
            }}
            style={{ display: 'none' }}
          />
        </label>
      </div>
    </div>
  </div>
)}


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
  )}
  {mode === 'weight' && (
    <div className='modal-backdrop'>
    <div className="modal-container bg-dark text-white p-4 text-center">
      <WeightLogger user={user} />
      <div className="d-flex justify-content-end">
        <button className="btn btn-danger mt-2" onClick={() => { resetModel(); onClose(); }}>
          Close
        </button>
      </div>
    </div>
    </div>
  )}

  </>
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
                    <input
                      list={`nutrient-options-${sectionIndex}-${rowIndex}`}
                      className="form-control"
                      value={row.type}
                      onChange={(e) => {
                        const newType = normalizeNutrient(e.target.value);
                        updateRow(sectionIndex, rowIndex, 'type', newType);
                      }}
                    />
                    <datalist id={`nutrient-options-${sectionIndex}-${rowIndex}`}>
                      {ALLOWED_NUTRIENTS.map(n => (
                        <option key={n} value={n} />
                      ))}
                    </datalist>


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
