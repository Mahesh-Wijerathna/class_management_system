import React, { useState, useEffect, useRef } from 'react';
import { FaQrcode, FaBarcode, FaDownload, FaPrint, FaCamera, FaEye } from 'react-icons/fa';
import JsBarcode from 'jsbarcode';
import JSZip from 'jszip';

const RealBarcodeGenerator = ({ classId, className }) => {
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [generatedBarcodes, setGeneratedBarcodes] = useState([]);
  const [barcodeType, setBarcodeType] = useState('CODE128'); // CODE128, EAN13, QR, etc.
  const [showPreview, setShowPreview] = useState(false);
  const [previewBarcode, setPreviewBarcode] = useState(null);

  // Sample student data (in real app, this would come from database)
  const sampleStudents = [
    { id: 'STUDENT_001', name: 'John Doe', indexNo: '2024001' },
    { id: 'STUDENT_002', name: 'Jane Smith', indexNo: '2024002' },
    { id: 'STUDENT_003', name: 'Mike Johnson', indexNo: '2024003' },
    { id: 'STUDENT_004', name: 'Sarah Wilson', indexNo: '2024004' },
    { id: 'STUDENT_005', name: 'David Brown', indexNo: '2024005' },
  ];

  const barcodeTypes = [
    { value: 'CODE128', label: 'Code 128 (Most Common)' },
    { value: 'CODE39', label: 'Code 39' },
    { value: 'EAN13', label: 'EAN-13 (13 digits)' },
    { value: 'EAN8', label: 'EAN-8 (8 digits)' },
    { value: 'UPC', label: 'UPC-A (12 digits)' },
    { value: 'ITF14', label: 'ITF-14' },
    { value: 'MSI', label: 'MSI' },
    { value: 'pharmacode', label: 'Pharma Code' },
  ];

  const generateBarcodes = () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }

    console.log('Generating barcodes for:', selectedStudents.length, 'students');
    console.log('Barcode type:', barcodeType);

    const barcodes = selectedStudents.map(studentId => {
      const student = sampleStudents.find(s => s.id === studentId);
      if (!student) {
        console.error('Student not found:', studentId);
        return null;
      }

      // Create a unique barcode data
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const barcodeData = `${classId}_${student.id}_${timestamp}_${randomSuffix}`;
      
      console.log('Generated barcode for', student.name, ':', barcodeData);

      return {
        id: student.id,
        name: student.name,
        indexNo: student.indexNo,
        barcodeData: barcodeData,
        barcodeType: barcodeType,
        classId: classId,
        className: className,
        generatedAt: new Date().toISOString()
      };
    }).filter(barcode => barcode !== null);

    console.log('Generated barcodes:', barcodes);
    setGeneratedBarcodes(barcodes);
    
    if (barcodes.length > 0) {
      alert(`Successfully generated ${barcodes.length} barcodes!`);
    }
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAll = () => {
    setSelectedStudents(sampleStudents.map(s => s.id));
  };

  const clearAll = () => {
    setSelectedStudents([]);
  };

  const handlePreviewBarcode = (barcode) => {
    setPreviewBarcode(barcode);
    setShowPreview(true);
  };

  const downloadBarcodeImage = (barcode) => {
    const canvas = document.getElementById(`barcode-${barcode.id}`);
    if (canvas) {
      const link = document.createElement('a');
      link.download = `barcode_${barcode.name}_${barcode.id}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const downloadAllBarcodes = () => {
    if (generatedBarcodes.length === 0) {
      alert('No barcodes generated yet');
      return;
    }

    // Create a zip file with all barcode images
    const zip = new JSZip();
    
    generatedBarcodes.forEach(barcode => {
      const canvas = document.getElementById(`barcode-${barcode.id}`);
      if (canvas) {
        const imageData = canvas.toDataURL().split(',')[1];
        zip.file(`barcode_${barcode.name}_${barcode.id}.png`, imageData, {base64: true});
      }
    });

    zip.generateAsync({type: 'blob'}).then(content => {
      const link = document.createElement('a');
      link.download = `barcodes_${className}_${new Date().toISOString().split('T')[0]}.zip`;
      link.href = URL.createObjectURL(content);
      link.click();
    });
  };

  const downloadBarcodesCSV = () => {
    if (generatedBarcodes.length === 0) {
      alert('No barcodes generated yet');
      return;
    }

    // Create CSV content
    const csvContent = [
      ['Student ID', 'Student Name', 'Index No', 'Barcode Data', 'Barcode Type', 'Class', 'Generated At'],
      ...generatedBarcodes.map(barcode => [
        barcode.id,
        barcode.name,
        barcode.indexNo,
        barcode.barcodeData,
        barcode.barcodeType,
        barcode.className,
        new Date(barcode.generatedAt).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `barcodes_${className}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printBarcodes = () => {
    if (generatedBarcodes.length === 0) {
      alert('No barcodes generated yet');
      return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Barcodes - ${className}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .barcode-container { display: flex; flex-wrap: wrap; gap: 20px; }
            .barcode-item { 
              border: 1px solid #ccc; 
              padding: 15px; 
              text-align: center; 
              width: 250px;
              page-break-inside: avoid;
            }
            .barcode-image { 
              margin: 10px 0;
              max-width: 100%;
              height: auto;
            }
            .student-info { margin-bottom: 10px; }
            .class-info { 
              background: #e0e0e0; 
              padding: 5px; 
              margin-bottom: 10px;
              font-weight: bold;
            }
            .barcode-data { 
              font-family: monospace; 
              font-size: 10px; 
              background: #f0f0f0; 
              padding: 5px; 
              margin: 10px 0;
              word-break: break-all;
            }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Attendance Barcodes - ${className}</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Barcode Type: ${barcodeType}</p>
          <div class="barcode-container">
            ${generatedBarcodes.map(barcode => `
              <div class="barcode-item">
                <div class="class-info">${barcode.className}</div>
                <div class="student-info">
                  <strong>${barcode.name}</strong><br>
                  ID: ${barcode.id}<br>
                  Index: ${barcode.indexNo}
                </div>
                <div class="barcode-image">
                  <canvas id="print-barcode-${barcode.id}" width="200" height="100"></canvas>
                </div>
                <div class="barcode-data">${barcode.barcodeData}</div>
                <div style="font-size: 10px; color: #666;">
                  Scan this barcode to mark attendance
                </div>
              </div>
            `).join('')}
          </div>
          <div class="no-print" style="margin-top: 20px;">
            <button onclick="window.print()">Print</button>
            <button onclick="window.close()">Close</button>
          </div>
          <script>
            // Generate barcodes in print window
            ${generatedBarcodes.map(barcode => `
              try {
                JsBarcode("#print-barcode-${barcode.id}", "${barcode.barcodeData}", {
                  format: "${barcode.barcodeType}",
                  width: 2,
                  height: 50,
                  displayValue: true,
                  fontSize: 12,
                  margin: 5
                });
              } catch(e) {
                console.error('Error generating barcode for ${barcode.id}:', e);
              }
            `).join('')}
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Generate barcode when component mounts or barcode data changes
  useEffect(() => {
    generatedBarcodes.forEach(barcode => {
      const canvasId = `barcode-${barcode.id}`;
      const canvas = document.getElementById(canvasId);
      if (canvas) {
        try {
          JsBarcode(`#${canvasId}`, barcode.barcodeData, {
            format: barcode.barcodeType,
            width: 2,
            height: 50,
            displayValue: true,
            fontSize: 12,
            margin: 5,
            background: "#ffffff",
            lineColor: "#000000"
          });
        } catch (error) {
          console.error(`Error generating barcode for ${barcode.id}:`, error);
        }
      }
    });
  }, [generatedBarcodes, barcodeType]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <FaBarcode className="text-blue-600" />
        Production Barcode Generator
      </h2>
      
      <div className="mb-4">
        <p className="text-gray-600 mb-2">Class: <strong>{className}</strong></p>
        <p className="text-gray-600">Generate scannable barcodes for attendance tracking:</p>
      </div>

      {/* Barcode Type Selection */}
      <div className="mb-6">
        <label className="block font-semibold mb-2">Barcode Type:</label>
        <select
          value={barcodeType}
          onChange={(e) => setBarcodeType(e.target.value)}
          className="border rounded px-3 py-2 w-full md:w-auto"
        >
          {barcodeTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Student Selection */}
      <div className="mb-6">
        <div className="flex gap-2 mb-3">
          <button
            onClick={selectAll}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Select All
          </button>
          <button
            onClick={clearAll}
            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
          >
            Clear All
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sampleStudents.map(student => (
            <label key={student.id} className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStudents.includes(student.id)}
                onChange={() => toggleStudent(student.id)}
                className="rounded"
              />
              <div>
                <div className="font-semibold">{student.name}</div>
                <div className="text-sm text-gray-600">ID: {student.id}</div>
                <div className="text-sm text-gray-600">Index: {student.indexNo}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <div className="mb-6">
        <button
          onClick={generateBarcodes}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
          disabled={selectedStudents.length === 0}
        >
          <FaQrcode />
          Generate Barcodes ({selectedStudents.length} selected)
        </button>
      </div>

      {/* Generated Barcodes */}
      {generatedBarcodes.length > 0 && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Generated Barcodes</h3>
            <div className="flex gap-2">
              <button
                onClick={downloadAllBarcodes}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-1"
              >
                <FaDownload />
                Download All
              </button>
              <button
                onClick={downloadBarcodesCSV}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center gap-1"
              >
                <FaDownload />
                CSV
              </button>
              <button
                onClick={printBarcodes}
                className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm flex items-center gap-1"
              >
                <FaPrint />
                Print
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generatedBarcodes.map(barcode => (
              <div key={barcode.id} className="border rounded p-4 bg-gray-50">
                <div className="font-semibold text-center mb-2">{barcode.name}</div>
                <div className="text-sm text-gray-600 text-center mb-3">
                  ID: {barcode.id}<br/>
                  Index: {barcode.indexNo}
                </div>
                
                {/* Barcode Canvas */}
                <div className="bg-white p-3 rounded border text-center mb-3">
                  <canvas 
                    id={`barcode-${barcode.id}`} 
                    width="200" 
                    height="100"
                    className="mx-auto"
                  ></canvas>
                </div>
                
                <div className="text-xs text-gray-500 text-center mb-3">
                  {barcode.barcodeType} • Scan to mark attendance
                </div>
                
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => handlePreviewBarcode(barcode)}
                    className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs flex items-center gap-1"
                  >
                    <FaEye />
                    Preview
                  </button>
                  <button
                    onClick={() => downloadBarcodeImage(barcode)}
                    className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs flex items-center gap-1"
                  >
                    <FaDownload />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barcode Preview Modal */}
      {showPreview && previewBarcode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Barcode Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="text-center">
              <div className="font-semibold mb-2">{previewBarcode.name}</div>
              <div className="text-sm text-gray-600 mb-4">
                ID: {previewBarcode.id} • Index: {previewBarcode.indexNo}
              </div>
              
              <div className="bg-white p-4 rounded border mb-4">
                <canvas 
                  id={`preview-barcode-${previewBarcode.id}`} 
                  width="300" 
                  height="150"
                  className="mx-auto"
                ></canvas>
              </div>
              
              <div className="text-xs text-gray-500 mb-4">
                {previewBarcode.barcodeType} • {previewBarcode.barcodeData}
              </div>
              
              <button
                onClick={() => downloadBarcodeImage(previewBarcode)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Download Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h4 className="font-semibold mb-2">Production Features:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>Real Scannable Barcodes</strong> - Generated using industry-standard JsBarcode library</li>
          <li>• <strong>Multiple Barcode Types</strong> - Code 128, Code 39, EAN-13, UPC, and more</li>
          <li>• <strong>High Quality Images</strong> - Download individual barcodes or all as ZIP</li>
          <li>• <strong>Print Ready</strong> - Professional layout for printing and distribution</li>
          <li>• <strong>Compatible Scanners</strong> - Works with all standard barcode scanners</li>
          <li>• <strong>Unique Identifiers</strong> - Each barcode has timestamp and random suffix</li>
        </ul>
      </div>
    </div>
  );
};

export default RealBarcodeGenerator; 