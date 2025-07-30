import React, { useState, useRef, useEffect } from 'react';
import { FaCamera, FaQrcode, FaBarcode, FaStop, FaPlay, FaTimes } from 'react-icons/fa';

const BarcodeScanner = ({ onScan, onClose, className, classId }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startScanning = async () => {
    try {
      setError(null);
      setScanResult(null);
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
      }
      
      // Start barcode detection
      detectBarcodes();
      
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions and try again.');
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
  };

  const detectBarcodes = () => {
    if (!isScanning || !videoRef.current) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    // Get image data for barcode detection
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Simple barcode detection (in production, use a proper library like QuaggaJS or ZXing)
    // For now, we'll simulate barcode detection
    setTimeout(() => {
      // Simulate barcode detection
      const mockBarcode = simulateBarcodeDetection();
      if (mockBarcode) {
        handleBarcodeDetected(mockBarcode);
      } else {
        // Continue scanning
        if (isScanning) {
          detectBarcodes();
        }
      }
    }, 1000);
  };

  const simulateBarcodeDetection = () => {
    // Simulate random barcode detection (for demo purposes)
    // In production, this would use actual barcode detection algorithms
    const random = Math.random();
    if (random < 0.1) { // 10% chance of detecting a barcode
      const testBarcodes = [
        `${classId}_STUDENT_001_${Date.now()}_001`,
        `${classId}_STUDENT_002_${Date.now()}_002`,
        `${classId}_STUDENT_003_${Date.now()}_003`,
        'STUDENT_001',
        'STUDENT_002',
        'STUDENT_003'
      ];
      return testBarcodes[Math.floor(Math.random() * testBarcodes.length)];
    }
    return null;
  };

  const handleBarcodeDetected = (barcodeData) => {
    setScanResult(barcodeData);
    stopScanning();
    
    if (onScan) {
      onScan(barcodeData);
    }
  };

  const handleManualInput = (e) => {
    if (e.key === 'Enter') {
      const value = e.target.value.trim();
      if (value) {
        handleBarcodeDetected(value);
      }
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Barcode Scanner</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <FaTimes />
        </button>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Class: <strong>{className}</strong><br/>
        {isScanning ? 'Point camera at barcode' : 'Start scanning or enter manually'}
      </p>

      {/* Camera Video */}
      <div className="relative mb-4">
        <video
          ref={videoRef}
          className={`w-full h-64 bg-gray-900 rounded ${isScanning ? 'block' : 'hidden'}`}
          autoPlay
          playsInline
          muted
        />
        
        {!isScanning && (
          <div className="w-full h-64 bg-gray-100 rounded flex items-center justify-center">
            <div className="text-center">
              <FaCamera className="text-4xl text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Camera not active</p>
            </div>
          </div>
        )}
        
        {/* Scanning Overlay */}
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="border-2 border-blue-500 w-48 h-32 rounded-lg relative">
              <div className="absolute inset-0 border-2 border-blue-500 rounded-lg animate-pulse"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <FaBarcode className="text-blue-500 text-2xl" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Or enter barcode manually:
        </label>
        <input
          type="text"
          placeholder="Enter barcode data"
          className="w-full border rounded px-3 py-2"
          onKeyPress={handleManualInput}
          disabled={isScanning}
        />
      </div>

      {/* Control Buttons */}
      <div className="flex gap-2 mb-4">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <FaPlay />
            Start Scanning
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center gap-2"
          >
            <FaStop />
            Stop Scanning
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}

      {/* Scan Result */}
      {scanResult && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
          <strong>Barcode Detected:</strong><br/>
          {scanResult}
        </div>
      )}

      {/* Test Barcodes */}
      <div className="p-3 bg-gray-100 rounded text-sm">
        <strong>Test Barcodes:</strong><br/>
        <div className="mt-2 space-y-1">
          <button
            onClick={() => handleBarcodeDetected('STUDENT_001')}
            className="block w-full text-left px-2 py-1 bg-white rounded hover:bg-gray-50"
          >
            STUDENT_001
          </button>
          <button
            onClick={() => handleBarcodeDetected('STUDENT_002')}
            className="block w-full text-left px-2 py-1 bg-white rounded hover:bg-gray-50"
          >
            STUDENT_002
          </button>
          <button
            onClick={() => handleBarcodeDetected('STUDENT_003')}
            className="block w-full text-left px-2 py-1 bg-white rounded hover:bg-gray-50"
          >
            STUDENT_003
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
        <h4 className="font-semibold mb-2">Instructions:</h4>
        <ul className="space-y-1 text-gray-700">
          <li>• Click "Start Scanning" to use camera</li>
          <li>• Point camera at barcode</li>
          <li>• Or enter barcode manually</li>
          <li>• Use test barcodes for quick testing</li>
        </ul>
      </div>
    </div>
  );
};

export default BarcodeScanner; 