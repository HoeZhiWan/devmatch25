import React, { useState } from "react";
import QRCodeScanner from "./QRCodeScanner";
import { logPickup, verifyHash } from "../lib/web3";

interface PickupHistory {
  id: string;
  studentId: string;
  studentName: string;
  pickupPerson: string;
  timestamp: string;
  status: 'completed' | 'pending';
}

interface Student {
  id: string;
  name: string;
  parentWallet: string;
}

interface Parent {
  name: string;
  walletAddress: string;
  relationship: string;
  phoneNumber: string;
}

const StaffDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pickup' | 'history' | 'users'>('pickup');
  const [studentId, setStudentId] = useState("");
  const [scannedQR, setScannedQR] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Enhanced state for history filtering
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("All students");

  // Form state for adding new student and parent
  const [formData, setFormData] = useState({
    studentName: '',
    parentName: '',
    walletId: '',
    relationship: '',
    phone: '',
  });

  // Available students for filtering (should be fetched from database)
  const allStudents = ["All students", "Jenny", "Tom", "Sara", "Phoebe", "Alice Johnson", "Bob Smith"];
  
  // Available student IDs for pickup validation
  const availableIds = ["123", "456", "789", "STU001", "STU002"];

  // Mock data - in real app, fetch from database
  const [pickupHistory, setPickupHistory] = useState<PickupHistory[]>([
    { id: '1', studentId: 'STU001', studentName: 'Alice Johnson', pickupPerson: '0x1234...5678', timestamp: '2024-01-15 14:30', status: 'completed' },
    { id: '2', studentId: 'STU002', studentName: 'Bob Smith', pickupPerson: '0x8765...4321', timestamp: '2024-01-15 15:45', status: 'pending' },
    { id: '3', studentId: '123', studentName: 'Jenny', pickupPerson: 'Parent', timestamp: '2025-08-05 17:40', status: 'completed' },
    { id: '4', studentId: '456', studentName: 'Tom', pickupPerson: 'Guardian', timestamp: '2025-08-06 16:20', status: 'completed' },
  ]);

  const [students, setStudents] = useState<Student[]>([
    { id: 'STU001', name: 'Alice Johnson', parentWallet: '0x1234...5678' },
    { id: 'STU002', name: 'Bob Smith', parentWallet: '0x8765...4321' },
    { id: '123', name: 'Jenny', parentWallet: '0x9999...1111' },
    { id: '456', name: 'Tom', parentWallet: '0x8888...2222' },
  ]);

  const [parents, setParents] = useState<Parent[]>([
    { name: 'John Johnson', walletAddress: '0x1234...5678', relationship: 'Father', phoneNumber: '+1234567890' },
    { name: 'Sarah Smith', walletAddress: '0x8765...4321', relationship: 'Mother', phoneNumber: '+0987654321' },
    { name: 'Mary Chen', walletAddress: '0x9999...1111', relationship: 'Mother', phoneNumber: '+1111222233' },
    { name: 'David Wilson', walletAddress: '0x8888...2222', relationship: 'Father', phoneNumber: '+4444555566' },
  ]);

  const handleValidatePickup = async () => {
    setLoading(true);
    setValidationResult(null);
    try {
      if (!scannedQR || !studentId) {
        throw new Error("Please scan QR code and enter student ID");
      }

      // Enhanced student ID validation
      if (!availableIds.includes(studentId.trim())) {
        throw new Error("Student ID not found in system");
      }

      // Validate QR data matches student
      if (scannedQR.childId !== studentId) {
        throw new Error("QR code does not match student ID");
      }

      // Check if pickup is authorized
      const currentTime = new Date();
      const validUntil = new Date(scannedQR.validUntil);
      
      if (currentTime > validUntil) {
        throw new Error("Pickup authorization has expired");
      }

      // Demo mode - simulate blockchain verification
      console.log('Demo Mode: Simulating blockchain verification');
      const timestamp = await verifyHash(scannedQR.hash);
      if (timestamp === 0) {
        throw new Error("Demo Mode: QR code not found on blockchain");
      }

      setValidationResult("✅ Demo Mode: Pickup authorized! Student can be released.");
      
      // Demo mode - simulate blockchain logging
      await logPickup(scannedQR.hash);

      // Add to pickup history
      const newPickup: PickupHistory = {
        id: Date.now().toString(),
        studentId: studentId,
        studentName: students.find(s => s.id === studentId)?.name || 'Unknown Student',
        pickupPerson: scannedQR.pickupWallet || 'Unknown Person',
        timestamp: new Date().toLocaleString(),
        status: 'completed'
      };
      setPickupHistory(prev => [newPickup, ...prev]);
      
    } catch (e: any) {
      setValidationResult(`❌ ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Form handling for adding new student and parent
  const isFormValid = Object.values(formData).every((value) => value.trim() !== '');

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Generate new student ID
    const newStudentId = generateStudentId();
    
    // Add new student
    const newStudent: Student = {
      id: newStudentId,
      name: formData.studentName,
      parentWallet: formData.walletId
    };
    setStudents(prev => [...prev, newStudent]);

    // Add new parent
    const newParent: Parent = {
      name: formData.parentName,
      walletAddress: formData.walletId,
      relationship: formData.relationship,
      phoneNumber: formData.phone
    };
    setParents(prev => [...prev, newParent]);

    // Reset form
    setFormData({
      studentName: '',
      parentName: '',
      walletId: '',
      relationship: '',
      phone: '',
    });
  };

  // Filter pickup history based on selected date and student
  const filteredHistory = pickupHistory.filter(item => {
    const matchesDate = !selectedDate || item.timestamp.includes(selectedDate);
    const matchesStudent = selectedStudent === "All students" || item.studentName === selectedStudent;
    return matchesDate && matchesStudent;
  });

  const generateStudentId = () => {
    return 'STU' + Math.random().toString(36).substr(2, 6).toUpperCase();
  };

  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-2">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('pickup')}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'pickup' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span>🚸</span>
              <span>Validate Pickup</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'history' 
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' 
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span>📋</span>
              <span>Pickup History</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'users' 
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg' 
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span>👥</span>
              <span>Manage Users</span>
            </div>
          </button>
        </div>
      </div>

      {/* Pickup Validation Tab */}
      {activeTab === 'pickup' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🚸</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Validate Student Pickup</h3>
              <p className="text-slate-600">Scan QR codes and validate pickup authorizations</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-xl p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Student ID
              </label>
              <input
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white transition-all duration-200"
                placeholder="Enter student ID (e.g., STU001, 123, 456)"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
              />
              {studentId && !availableIds.includes(studentId.trim()) && (
                <div className="mt-2 text-sm text-red-600">
                  ⚠️ Student ID not found in system
                </div>
              )}
              {studentId && availableIds.includes(studentId.trim()) && (
                <div className="mt-2 text-sm text-green-600">
                  ✅ Student ID found: {students.find(s => s.id === studentId)?.name || 'Student'}
                </div>
              )}
            </div>

            <div className="bg-slate-50 rounded-xl p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Scan Parent/Pickup Person QR Code
              </label>
              <QRCodeScanner onScan={setScannedQR} />
            </div>

            {scannedQR && (
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3">QR Code Data:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-700">
                  <div className="bg-white rounded-lg p-3">
                    <span className="font-medium">Child ID:</span> {scannedQR.childId}
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <span className="font-medium">Pickup Wallet:</span> {scannedQR.pickupWallet}
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <span className="font-medium">Valid Until:</span> {scannedQR.validUntil}
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <span className="font-medium">Parent Wallet:</span> {scannedQR.parentWallet}
                  </div>
                </div>
              </div>
            )}

            <button
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              onClick={handleValidatePickup}
              disabled={loading || !studentId || !scannedQR}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Validating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>🔍</span>
                  <span>Validate Pickup</span>
                </div>
              )}
            </button>

            {validationResult && (
              <div className={`p-4 rounded-xl border ${
                validationResult.startsWith('✅') 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center space-x-2">
                  <span>{validationResult.startsWith('✅') ? '✅' : '❌'}</span>
                  <span>{validationResult}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pickup History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">📋</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Pickup History</h3>
              <p className="text-slate-600">View and filter all pickup records</p>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-slate-50 rounded-xl p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Filter by Date
              </label>
              <input
                type="date"
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-500 bg-white transition-all duration-200"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            
            <div className="bg-slate-50 rounded-xl p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Filter by Student
              </label>
              <select
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-500 bg-white transition-all duration-200"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
              >
                {allStudents.map(student => (
                  <option key={student} value={student}>
                    {student}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(selectedDate || selectedStudent !== "All students") && (
            <div className="mb-6">
              <button
                onClick={() => {
                  setSelectedDate("");
                  setSelectedStudent("All students");
                }}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
          
          {/* History Results */}
          <div className="space-y-4">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-slate-400 text-2xl">📋</span>
                </div>
                <h4 className="text-lg font-medium text-slate-600 mb-2">No pickup records found</h4>
                <p className="text-slate-500">Try adjusting your filters or check back later.</p>
              </div>
            ) : (
              <>
                <div className="text-sm text-slate-600 mb-4">
                  Showing {filteredHistory.length} of {pickupHistory.length} pickup records
                </div>
                {filteredHistory.map((pickup) => (
                  <div key={pickup.id} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm">👤</span>
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-lg">{pickup.studentName}</div>
                            <div className="text-sm text-slate-600">ID: {pickup.studentId}</div>
                          </div>
                        </div>
                        <div className="text-sm text-slate-600">
                          Picked up by: {pickup.pickupPerson}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-500 mb-2">{pickup.timestamp}</div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          pickup.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {pickup.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <div className="space-y-8">
          {/* Add New Student & Parent */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">👨‍🎓</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Add New Student & Parent</h3>
                <p className="text-slate-600">Register new student and their main parent together</p>
              </div>
            </div>
            
            <form onSubmit={handleAddStudent} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student Information */}
                <div className="bg-slate-50 rounded-xl p-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Student Name
                  </label>
                  <input
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleFormChange}
                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 bg-white transition-all duration-200"
                    placeholder="Enter student name"
                    required
                  />
                </div>

                {/* Parent Name */}
                <div className="bg-slate-50 rounded-xl p-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Main Parent Name
                  </label>
                  <input
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleFormChange}
                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 bg-white transition-all duration-200"
                    placeholder="Enter parent name"
                    required
                  />
                </div>

                {/* Wallet Address */}
                <div className="bg-slate-50 rounded-xl p-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Wallet Address / ID
                  </label>
                  <input
                    name="walletId"
                    value={formData.walletId}
                    onChange={handleFormChange}
                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 bg-white transition-all duration-200"
                    placeholder="0x... or wallet identifier"
                    required
                  />
                </div>

                {/* Relationship */}
                <div className="bg-slate-50 rounded-xl p-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Relationship to Child
                  </label>
                  <select
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleFormChange}
                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 bg-white transition-all duration-200"
                    required
                  >
                    <option value="">Select relationship...</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Phone Number */}
                <div className="bg-slate-50 rounded-xl p-6 md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 bg-white transition-all duration-200"
                    placeholder="+1234567890"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!isFormValid}
                className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl ${
                  isFormValid 
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700' 
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isFormValid ? (
                  <div className="flex items-center justify-center space-x-2">
                    <span>✅</span>
                    <span>Add Student & Parent</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>📝</span>
                    <span>Please fill all fields</span>
                  </div>
                )}
              </button>
            </form>
          </div>

          {/* Current Students */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">📚</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Current Students</h3>
                <p className="text-slate-600">View all registered students</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {students.map((student) => (
                <div key={student.id} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">👤</span>
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-lg">{student.name}</div>
                        <div className="text-sm text-slate-600">ID: {student.id}</div>
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">
                      Parent: {student.parentWallet}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;