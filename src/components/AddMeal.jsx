// AddMeal.jsx
import React, { useState, useEffect, useRef } from 'react';
import Tesseract from 'tesseract.js';
import DatePicker from 'react-datepicker';
import '../../node_modules/react-datepicker/dist/react-datepicker.css';
import { parseNutritionFromText } from '../utils/mlparser';

function AddMealModal({ isOpen, onClose, onSave, editMeal }) {
  const [mealType, setMealType] = useState('Breakfast');
  const [mealDate, setMealDate] = useState(new Date());
  const [foodNames, setFoodNames] = useState([""]);
  const [foodSections, setFoodSections] = useState([[{ type: 'Protein', count: '', serving: '1', total: '' }]]);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const videoRef = useRef(null);

  useEffect(() => {
    if (editMeal) {
      setMealType(editMeal.mealType);
      setMealDate(new Date(editMeal.timestamp));
      setFoodNames(editMeal.foodItems.map(f => f.name));
      setFoodSections(editMeal.foodItems.map(f => f.nutrients));
      setShowManualEntry(true);
    }
  }, [editMeal]);

  const resetModel = () => {
    setFoodSections([[{ type: 'Protein', count: '', serving: '1', total: '' }]]);
    setFoodNames([""]);
    setMealDate(new Date());
    setShowManualEntry(false);
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

  const updateRow = (sectionIndex, rowIndex, field, value) => {
    const updated = [...foodSections];
    const row = updated[sectionIndex][rowIndex];
    row[field] = value;
    const count = parseFloat(row.count) || 0;
    const serving = parseFloat(row.serving) || 1;
    row.total = (count * serving).toFixed(2);
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
    try {
      setScanning(true);
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

  // Preprocessing: convert to grayscale
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg;     // Red
    data[i + 1] = avg; // Green
    data[i + 2] = avg; // Blue
  }
  ctx.putImageData(imageData, 0, 0);

  const imageUrl = canvas.toDataURL();
  console.log("📷 Preview URL:", imageUrl);

  Tesseract.recognize(canvas, 'eng').then(({ data: { text } }) => {
    console.log("🔍 OCR Text:\n", text);

    const parsed = parseNutritionFromText(text);
    if (parsed.length > 0) {
      setShowManualEntry(true);
      setFoodSections([parsed]);
    } else {
      alert("No nutritional values detected. Try again or enter manually.");
    }
    stopScan();
  });
};

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <div className="modal-header col-md-12 mb-1" style={{ display: 'flex' }}>
          <div style={{ display: 'flex', width: '100%', marginRight: '5%' }}>
            <p className='ModelTitleName'>Select Meal</p>
            <select className='DropDownMeal' value={mealType} onChange={(e) => setMealType(e.target.value)}>
              <option>Breakfast</option>
              <option>Lunch</option>
              <option>Dinner</option>
            </select>
          </div>
          <DatePicker selected={mealDate} onChange={(date) => setMealDate(date)} className="form-control" dateFormat="yyyy-MM-dd" maxDate={new Date()} />
        </div>

        <div className="modal-body">
          <div className="manual-scan-buttons">
            <button className="btn-manual" onClick={() => setShowManualEntry(true)}>Manual Entry</button>
            <button className="btn-scan" onClick={startScan}>Scan It</button>
          </div>

          {scanning && (
            <div className="scan-box text-center">
              <video ref={videoRef} style={{ width: '100%', maxHeight: '200px' }} />
              <button className="btn btn-warning mt-2" onClick={captureAndScan}>Capture</button>
              <button className="btn btn-secondary mt-2 ms-2" onClick={stopScan}>Cancel</button>
            </div>
          )}
          {showManualEntry && (
            <div className='TotalFoodSection'>
              {foodSections.map((rows, sectionIndex) => (
                <div className="food-section" key={sectionIndex}>
                  <div className='FoodNameSection'>
                    <p className='FoodName'>Food</p>
                    <textarea className='FoodNameTextArea' value={foodNames[sectionIndex]} onChange={(e) => {
                      const updated = [...foodNames];
                      updated[sectionIndex] = e.target.value;
                      setFoodNames(updated);
                    }} />
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
