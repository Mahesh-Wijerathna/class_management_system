import React, { useState } from 'react';
import { FaQrcode, FaBarcode, FaDownload, FaPrint } from 'react-icons/fa';

const BarcodeGenerator = ({ classId, className }) => {
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [generatedBarcodes, setGeneratedBarcodes] = useState([]);

  // Sample student data (in real app, this would come from database)
  const sampleStudents = [
    { id: 'STUDENT_001', name: 'John Doe', indexNo: '2024001' },
    { id: 'STUDENT_002', name: 'Jane Smith', indexNo: '2024002' },
    { id: 'STUDENT_003', name: 'Mike Johnson', indexNo: '2024003' },
    { id: 'STUDENT_004', name: 'Sarah Wilson', indexNo: '2024004' },
    { id: 'STUDENT_005', name: 'David Brown', indexNo: '2024005' },
  ];

  const generateBarcodes = () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }

    console.log('Generating barcodes for:', selectedStudents.length, 'students');
    console.log('Class ID:', classId);
    console.log('Class Name:', className);

    const barcodes = selectedStudents.map(studentId => {
      const student = sampleStudents.find(s => s.id === studentId);
      if (!student) {
        console.error('Student not found:', studentId);
        return null;
      }

      // Create a more realistic barcode format
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const barcodeData = `${classId}_${student.id}_${timestamp}_${randomSuffix}`;
      
      console.log('Generated barcode for', student.name, ':', barcodeData);

      return {
        id: student.id,
        name: student.name,
        indexNo: student.indexNo,
        barcodeData: barcodeData,
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

  const downloadBarcodes = () => {
    if (generatedBarcodes.length === 0) {
      alert('No barcodes generated yet');
      return;
    }

    // Create CSV content
    const csvContent = [
      ['Student ID', 'Student Name', 'Index No', 'Barcode Data', 'Class', 'Generated At'],
      ...generatedBarcodes.map(barcode => [
        barcode.id,
        barcode.name,
        barcode.indexNo,
        barcode.barcodeData,
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
              width: 200px;
              page-break-inside: avoid;
            }
            .barcode-data { 
              font-family: monospace; 
              font-size: 12px; 
              background: #f0f0f0; 
              padding: 5px; 
              margin: 10px 0;
              word-break: break-all;
            }
            .student-info { margin-bottom: 10px; }
            .class-info { 
              background: #e0e0e0; 
              padding: 5px; 
              margin-bottom: 10px;
              font-weight: bold;
            }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Attendance Barcodes - ${className}</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <div class="barcode-container">
            ${generatedBarcodes.map(barcode => `
              <div class="barcode-item">
                <div class="class-info">${barcode.className}</div>
                <div class="student-info">
                  <strong>${barcode.name}</strong><br>
                  ID: ${barcode.id}<br>
                  Index: ${barcode.indexNo}
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
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <FaBarcode className="text-blue-600" />
        Barcode Generator
      </h2>
      
      <div className="mb-4">
        <p className="text-gray-600 mb-2">Class: <strong>{className}</strong></p>
        <p className="text-gray-600">Select students to generate attendance barcodes:</p>
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
                onClick={downloadBarcodes}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-1"
              >
                <FaDownload />
                Download CSV
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
                <div className="bg-white p-2 rounded border text-center">
                  <div className="font-mono text-xs text-gray-800 mb-1">Barcode Data:</div>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                    {barcode.barcodeData}
                  </div>
                </div>
                <div className="text-xs text-gray-500 text-center mt-2">
                  Scan this barcode to mark attendance
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h4 className="font-semibold mb-2">Instructions:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Select students you want to generate barcodes for</li>
          <li>• Click "Generate Barcodes" to create attendance barcodes</li>
          <li>• Print the barcodes and distribute to students</li>
          <li>• Students can scan these barcodes during class to mark attendance</li>
          <li>• Use the test barcodes (STUDENT_001, STUDENT_002, etc.) in the attendance scanner</li>
        </ul>
      </div>
    </div>
  );
};

export default BarcodeGenerator; 