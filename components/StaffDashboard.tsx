import React, { useState, useEffect } from "react";
import QRCodeScanner from "./QRCodeScanner";
import { logPickup, verifyHash } from "../lib/web3";
import { createPickupHistoryLog, upsertUserRoot } from "@/lib/firebase";
import { useWallet } from "@/hooks/useWallet";

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

interface Staff {
  id: string;
  name: string;
  role: string;
  walletAddress: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const StaffDashboard: React.FC = () => {
  const { address: staffAddress } = useWallet();
  const [activeTab, setActiveTab] = useState<'pickup' | 'history' | 'users' | 'list' | 'add'>('pickup');
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

  // Staff management states
  const [staff, setStaff] = useState<Staff[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    role: "",
    walletAddress: "",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

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

  // Fetch staff list from API
  useEffect(() => {
    async function fetchStaff() {
      setStaffLoading(true);
      setStaffError(null);
      try {
        console.log('🔍 Frontend: Fetching staff from API...');
        const res = await fetch("/api/staff?isActive=true&limit=100");
        const data = await res.json();
        
        console.log('📦 Frontend: API Response:', { status: res.status, data });
        
        if (res.ok && data.success) {
          console.log('✅ Frontend: Successfully loaded', data.staff?.length || 0, 'staff members');
          setStaff(data.staff || []);
        } else {
          const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || "Failed to fetch staff");
          console.error('❌ Frontend: API Error:', errorMsg);
          setStaffError(errorMsg);
        }
      } catch (err) {
        console.error('❌ Frontend: Network/Parse Error:', err);
        setStaffError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setStaffLoading(false);
      }
    }
    fetchStaff();
  }, []);

  const handleValidatePickup = async () => {
    setLoading(true);
    setValidationResult(null);
    try {
      if (!scannedQR || !studentId) {
        throw new Error("Please scan QR code and enter student ID");
      }
      if (!availableIds.includes(studentId.trim())) {
        throw new Error("Student ID not found in system");
      }
      if (scannedQR.childId !== studentId) {
        throw new Error("QR code does not match student ID");
      }
      const currentTime = new Date();
      const validUntil = new Date(scannedQR.validUntil);
      if (currentTime > validUntil) {
        throw new Error("Pickup authorization has expired");
      }
      const timestamp = await verifyHash(scannedQR.hash);
      if (timestamp === 0) {
        throw new Error("Demo Mode: QR code not found on blockchain");
      }
      setValidationResult("✅ Demo Mode: Pickup authorized! Student can be released.");
      
      // Demo mode - simulate blockchain logging
      const contractTxHash = await logPickup(scannedQR.hash);

      // Ensure staff user root exists
      if (staffAddress) {
        await upsertUserRoot({ walletAddress: staffAddress, role: 'staff' });
      }

      // Persist pickup history
      if (staffAddress) {
        await createPickupHistoryLog({
          blockchainHash: scannedQR.hash,
          contractTxHash,
          pickupBy: scannedQR.pickupWallet || '',
          staffId: staffAddress,
          studentId: scannedQR.childId
        });
      }

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

  const isFormValid = Object.values(formData).every((value) => value.trim() !== '');

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    const newStudentId = generateStudentId();
    const newStudent: Student = {
      id: newStudentId,
      name: formData.studentName,
      parentWallet: formData.walletId
    };
    setStudents(prev => [...prev, newStudent]);
    const newParent: Parent = {
      name: formData.parentName,
      walletAddress: formData.walletId,
      relationship: formData.relationship,
      phoneNumber: formData.phone
    };
    setParents(prev => [...prev, newParent]);
    setFormData({
      studentName: '',
      parentName: '',
      walletId: '',
      relationship: '',
      phone: '',
    });
  };

  const filteredHistory = pickupHistory.filter(item => {
    const matchesDate = !selectedDate || item.timestamp.includes(selectedDate);
    const matchesStudent = selectedStudent === "All students" || item.studentName === selectedStudent;
    return matchesDate && matchesStudent;
  });

  const generateStudentId = () => {
    return 'STU' + Math.random().toString(36).substr(2, 6).toUpperCase();
  };

  const handleStaffFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);
    setAddSuccess(null);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddSuccess("Staff added successfully!");
        setStaff(prev => [...prev, data.staff]);
        setForm({ name: "", role: "", walletAddress: "" });
      } else {
        setAddError(data.error || "Failed to add staff");
      }
    } catch (err) {
      setAddError("Error adding staff");
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-2">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('pickup')}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${activeTab === 'pickup'
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
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${activeTab === 'history'
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
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${activeTab === 'users'
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
              : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span>👥</span>
              <span>Manage Users</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${activeTab === 'list'
              ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg'
              : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span>📋</span>
              <span>Staff List</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${activeTab === 'add'
              ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg'
              : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span>➕</span>
              <span>Add Staff</span>
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Pickup History</h2>
              <p className="text-slate-600 mt-1">View and filter student pickup records</p>
            </div>
            <div className="text-sm text-slate-600">
              Total Records: {filteredHistory.length}
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label htmlFor="dateFilter" className="block text-sm font-medium text-slate-700 mb-2">
                Filter by Date
              </label>
              <input
                type="date"
                id="dateFilter"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="studentFilter" className="block text-sm font-medium text-slate-700 mb-2">
                Filter by Student
              </label>
              <select
                id="studentFilter"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {allStudents.map((student) => (
                  <option key={student} value={student}>
                    {student}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedDate('');
                  setSelectedStudent('All students');
                }}
                className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors duration-200"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* History Table */}
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-400 text-6xl mb-4">📋</div>
              <h3 className="text-xl font-medium text-slate-600 mb-2">No Pickup Records</h3>
              <p className="text-slate-500">
                {selectedDate || selectedStudent !== 'All students' 
                  ? 'No records match your current filters.' 
                  : 'No pickup records available yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">Student</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">Student ID</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">Pickup Person</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">Date & Time</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((record) => (
                    <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-medium text-slate-800">{record.studentName}</div>
                      </td>
                      <td className="py-4 px-4">
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                          {record.studentId}
                        </code>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-slate-600">
                          {record.pickupPerson.startsWith('0x') ? (
                            <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                              {record.pickupPerson}
                            </code>
                          ) : (
                            record.pickupPerson
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-slate-600 text-sm">
                          {record.timestamp}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          record.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {record.status === 'completed' ? '✅ Completed' : '⏳ Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <h3 className="font-medium text-blue-800 mb-2">📊 History Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Total Pickups:</span>
                <span className="ml-2 text-blue-800">{pickupHistory.length}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Completed:</span>
                <span className="ml-2 text-blue-800">
                  {pickupHistory.filter(h => h.status === 'completed').length}
                </span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Pending:</span>
                <span className="ml-2 text-blue-800">
                  {pickupHistory.filter(h => h.status === 'pending').length}
                </span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Today:</span>
                <span className="ml-2 text-blue-800">
                  {pickupHistory.filter(h => h.timestamp.includes(new Date().toISOString().split('T')[0])).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <div className="space-y-8">
          {/* Add New Student/Parent Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Add New Student & Parent</h2>
              <p className="text-slate-600">Register a new student along with their parent information.</p>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="studentName" className="block text-sm font-medium text-slate-700 mb-2">
                    Student Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="studentName"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleFormChange}
                    placeholder="Enter student's full name"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="parentName" className="block text-sm font-medium text-slate-700 mb-2">
                    Parent Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="parentName"
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleFormChange}
                    placeholder="Enter parent's full name"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="relationship" className="block text-sm font-medium text-slate-700 mb-2">
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="relationship"
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="">Select relationship</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Grandparent">Grandparent</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="walletId" className="block text-sm font-medium text-slate-700 mb-2">
                  Parent Wallet Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="walletId"
                  name="walletId"
                  value={formData.walletId}
                  onChange={handleFormChange}
                  placeholder="0x1234567890abcdef1234567890abcdef12345678"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-mono text-sm"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Parent's Ethereum wallet address for authentication
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!isFormValid}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    !isFormValid
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-2">➕</span>
                    Add Student & Parent
                  </div>
                </button>
              </div>
            </form>
          </div>

          {/* Students List */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Registered Students</h3>
              <div className="text-sm text-slate-600">
                Total: {students.length}
              </div>
            </div>

            {students.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-slate-400 text-6xl mb-4">👨‍🎓</div>
                <h4 className="text-lg font-medium text-slate-600 mb-2">No Students Registered</h4>
                <p className="text-slate-500">Add your first student using the form above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-3 font-semibold text-slate-700">Student ID</th>
                      <th className="text-left py-3 px-3 font-semibold text-slate-700">Student Name</th>
                      <th className="text-left py-3 px-3 font-semibold text-slate-700">Parent Wallet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-3">
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                            {student.id}
                          </code>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800">{student.name}</div>
                        </td>
                        <td className="py-3 px-3">
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                            {student.parentWallet}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Parents List */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Registered Parents</h3>
              <div className="text-sm text-slate-600">
                Total: {parents.length}
              </div>
            </div>

            {parents.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-slate-400 text-6xl mb-4">👨‍👩‍👧‍👦</div>
                <h4 className="text-lg font-medium text-slate-600 mb-2">No Parents Registered</h4>
                <p className="text-slate-500">Parents will appear here when you add students.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-3 font-semibold text-slate-700">Name</th>
                      <th className="text-left py-3 px-3 font-semibold text-slate-700">Relationship</th>
                      <th className="text-left py-3 px-3 font-semibold text-slate-700">Phone</th>
                      <th className="text-left py-3 px-3 font-semibold text-slate-700">Wallet Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parents.map((parent, index) => (
                      <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800">{parent.name}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {parent.relationship}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-slate-600">{parent.phoneNumber}</div>
                        </td>
                        <td className="py-3 px-3">
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                            {parent.walletAddress}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Staff List Tab */}
      {activeTab === 'list' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Staff Management</h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
              >
                🔄 Refresh
              </button>
              <div className="text-sm text-slate-600">
                Total Staff: {staff.length}
              </div>
            </div>
          </div>

          {staffLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-slate-600">Loading staff...</span>
            </div>
          )}

          {staffError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <span className="text-red-500 text-xl mr-3">⚠️</span>
        <div>
                  <h3 className="font-medium text-red-800">Error Loading Staff</h3>
                  <p className="text-red-600 text-sm">{staffError}</p>
                </div>
              </div>
            </div>
          )}

          {!staffLoading && !staffError && staff.length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-400 text-6xl mb-4">👥</div>
              <h3 className="text-xl font-medium text-slate-600 mb-2">No Staff Members</h3>
              <p className="text-slate-500">No staff members have been added yet.</p>
            </div>
          )}

          {!staffLoading && !staffError && staff.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">Name</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">Role</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">Wallet Address</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => (
                    <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-medium text-slate-800">{member.name}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {member.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                          {member.walletAddress}
                        </code>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          member.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {member.isActive ? '✅ Active' : '❌ Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Staff Tab */}
      {activeTab === 'add' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Add New Staff Member</h2>
            <p className="text-slate-600">Add a new staff member to the system with their wallet address and role.</p>
          </div>

          {addError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <span className="text-red-500 text-xl mr-3">⚠️</span>
                <div>
                  <h3 className="font-medium text-red-800">Error</h3>
                  <p className="text-red-600 text-sm">{addError}</p>
                </div>
              </div>
            </div>
          )}

          {addSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <span className="text-green-500 text-xl mr-3">✅</span>
                <div>
                  <h3 className="font-medium text-green-800">Success</h3>
                  <p className="text-green-600 text-sm">{addSuccess}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleAddStaff} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleStaffFormChange}
                  placeholder="Enter staff member's full name"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleStaffFormChange}
                  placeholder="e.g., Teacher, Administrator, Security"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
            </div>

        <div>
              <label htmlFor="walletAddress" className="block text-sm font-medium text-slate-700 mb-2">
                Wallet Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="walletAddress"
                name="walletAddress"
                value={form.walletAddress}
                onChange={handleStaffFormChange}
                placeholder="0x1234567890abcdef1234567890abcdef12345678"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-mono text-sm"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Enter a valid Ethereum wallet address (42 characters starting with 0x)
              </p>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-slate-600">
                <span className="text-red-500">*</span> Required fields
              </div>
              <button
                type="submit"
                disabled={addLoading || !form.name.trim() || !form.role.trim() || !form.walletAddress.trim()}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  addLoading || !form.name.trim() || !form.role.trim() || !form.walletAddress.trim()
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {addLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding Staff...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="mr-2">➕</span>
                    Add Staff Member
                  </div>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <h3 className="font-medium text-blue-800 mb-2">💡 Tips</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Ensure the wallet address is valid and belongs to the staff member</li>
              <li>• Staff members can use their wallet to authenticate and access the system</li>
              <li>• Duplicate wallet addresses are not allowed</li>
              <li>• Staff will be marked as active by default</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;