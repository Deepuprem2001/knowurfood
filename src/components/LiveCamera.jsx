import React, { useEffect, useRef, useState } from 'react';
import Tesseract from 'tesseract.js';

function LiveScanner({ onClose, onResult }) {
  const videoRef = useRef(null);
  const [text, setText] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      let stream = null;
      try {
        // Try forcing rear camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: 'environment' } },
          audio: false,
        });
      } catch (err) {
        console.warn('Exact facingMode failed, falling back:', err.message);
        try {
          // Try preferred rear camera
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false,
          });
        } catch (e) {
          alert('Camera access denied or no rear camera available.');
          return;
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        videoRef.current.style.transform = 'scaleX(1)'; // Ensure not mirrored
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  const captureAndRecognize = async () => {
    if (!videoRef.current) return;

    setProcessing(true);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);

    const {
      data: { text },
    } = await Tesseract.recognize(canvas, 'eng');
    setText(text);
    setProcessing(false);
  };

  return (
    <div className="scanner-modal">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: '100%', maxHeight: 300 }}
      />

      <div className="scanner-controls mt-2 text-center">
        <button
          className="btn btn-primary"
          onClick={captureAndRecognize}
          disabled={processing}
        >
          {processing ? 'Scanning...' : 'Capture'}
        </button>
        <button className="btn btn-secondary ms-2" onClick={onClose}>
          Close
        </button>
      </div>

      {text && (
        <div className="scanner-output mt-2 text-white">
          <p className="fw-bold">Extracted Text:</p>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{text}</pre>
          <button className="btn btn-success" onClick={() => onResult(text)}>
            Use This Text
          </button>
        </div>
      )}
    </div>
  );
} 

export default LiveScanner;
