'use client';

import React, { useState, useEffect } from 'react';
import { useFirebaseData } from '../../../hooks/useFirebaseData';
import { useFirebaseAuth } from '../../../hooks/useFirebaseAuth';
import TabContainer from '../TabContainer';

interface Staff {
  id: string;
  name: string;
  role: string;
  walletAddress: string;
  isActive: boolean;
  createdAt: string;
}

const StaffManagementTab: React.FC = () => {
  const { students, allUsers, refreshData } = useFirebaseData();
  const { getIdToken } = useFirebaseAuth();
  
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'staff-list' | 'add-staff'>('users');
  
  // User management states
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    grade: '',
    parentName: '',
    walletId: '',
    relationship: '',
    phone: '',
  });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [addUserSuccess, setAddUserSuccess] = useState<string | null>(null);

  // Staff management states
  const [staff, setStaff] = useState<Staff[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  const [staffForm, setStaffForm] = useState({
    name: "",
    role: "",
    walletAddress: "",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  // Filter users to get parents
  const parents = allUsers.filter(user => user.role === 'parent');

  // Generate unique student ID
  const generateStudentId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    return `CH${timestamp}${random}`;
  };

  // Fetch staff list from API
  useEffect(() => {
    async function fetchStaff() {
      setStaffLoading(true);
      setStaffError(null);
      try {
        const res = await fetch("/api/staff?isActive=true&limit=100");
        const data = await res.json();
        
        if (res.ok && data.success) {
          setStaff(data.staff || []);
        } else {
          const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || "Failed to fetch staff");
          setStaffError(errorMsg);
        }
      } catch (err) {
        setStaffError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setStaffLoading(false);
      }
    }
    fetchStaff();
  }, []);

  const isFormValid = Object.values(formData).every((value) => value.trim() !== '');

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setAddUserLoading(true);
    setAddUserError(null);
    setAddUserSuccess(null);
    
    try {
      const idToken = await getIdToken();
      if (!idToken) {
        throw new Error('Authentication required');
      }

      // First, create the parent user if they don't exist
      const parentResponse = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: formData.walletId,
          name: formData.parentName,
          contactNumber: formData.phone,
          role: 'parent',
          idToken,
        }),
      });

      let parentCreated = false;
      if (parentResponse.ok) {
        parentCreated = true;
      } else if (parentResponse.status === 409) {
        // User already exists, that's fine
        parentCreated = true;
      } else {
        const errorData = await parentResponse.json();
        throw new Error(errorData.error || 'Failed to create parent');
      }

      if (!parentCreated) {
        throw new Error('Failed to create parent user');
      }

      // Generate student ID if not provided
      const studentId = formData.studentId || generateStudentId();

      // Create the student
      const studentResponse = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: studentId,
          name: formData.studentName,
          grade: formData.grade,
          parentId: formData.walletId,
          idToken,
        }),
      });

      if (!studentResponse.ok) {
        const errorData = await studentResponse.json();
        throw new Error(errorData.error || 'Failed to create student');
      }

      setAddUserSuccess(`Successfully added student ${formData.studentName} and parent ${formData.parentName}!`);
      
      // Reset form
      setFormData({
        studentName: '',
        studentId: '',
        grade: '',
        parentName: '',
        walletId: '',
        relationship: '',
        phone: '',
      });

      // Refresh data
      await refreshData();
      
    } catch (error: any) {
      setAddUserError(error.message || 'Failed to add student and parent');
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleStaffFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStaffForm({ ...staffForm, [e.target.name]: e.target.value });
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
        body: JSON.stringify(staffForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddSuccess("Staff added successfully!");
        setStaff(prev => [...prev, data.staff]);
        setStaffForm({ name: "", role: "", walletAddress: "" });
      } else {
        setAddError(data.error || "Failed to add staff");
      }
    } catch (err) {
      setAddError("Error adding staff");
    } finally {
      setAddLoading(false);
    }
  };

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'users':
        return (
          <div className="space-y-8">
            {/* Add New Student/Parent Form */}
            <div className="bg-slate-50 rounded-xl p-6">
              <h4 className="text-lg font-bold text-slate-800 mb-4">Add New Student & Parent</h4>
              
              {addUserError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center">
                    <span className="text-red-500 text-xl mr-3">⚠️</span>
                    <p className="text-red-600 text-sm">{addUserError}</p>
                  </div>
                </div>
              )}

              {addUserSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center">
                    <span className="text-green-500 text-xl mr-3">✅</span>
                    <p className="text-green-600 text-sm">{addUserSuccess}</p>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleAddStudent} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Student Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="studentName"
                      value={formData.studentName}
                      onChange={handleFormChange}
                      placeholder="Enter student's full name"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Student ID <span className="text-slate-500">(Optional - auto-generated if empty)</span>
                    </label>
                    <input
                      type="text"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleFormChange}
                      placeholder="CH001 (leave empty to auto-generate)"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Grade <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="grade"
                      value={formData.grade}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select grade</option>
                      <option value="Kindergarten">Kindergarten</option>
                      <option value="Grade 1">Grade 1</option>
                      <option value="Grade 2">Grade 2</option>
                      <option value="Grade 3">Grade 3</option>
                      <option value="Grade 4">Grade 4</option>
                      <option value="Grade 5">Grade 5</option>
                      <option value="Grade 6">Grade 6</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Parent Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="parentName"
                      value={formData.parentName}
                      onChange={handleFormChange}
                      placeholder="Enter parent's full name"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Relationship <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="relationship"
                      value={formData.relationship}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Parent Wallet Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="walletId"
                    value={formData.walletId}
                    onChange={handleFormChange}
                    placeholder="0x1234567890abcdef1234567890abcdef12345678"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={!isFormValid || addUserLoading}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    !isFormValid || addUserLoading
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {addUserLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </div>
                  ) : (
                    '➕ Add Student & Parent'
                  )}
                </button>
              </form>
            </div>

            {/* Students and Parents Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Students List */}
              <div className="bg-slate-50 rounded-xl p-6">
                <h4 className="text-lg font-bold text-slate-800 mb-4">Students ({students.length})</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {students.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-slate-400 text-4xl mb-2">👨‍🎓</div>
                      <p className="text-slate-500">No students added yet</p>
                    </div>
                  ) : (
                    students.map((student) => (
                      <div key={student.id} className="bg-white rounded-lg p-3 border">
                        <div className="font-medium text-slate-800">{student.name}</div>
                        <div className="text-sm text-slate-600">ID: {student.id} • Grade: {student.grade}</div>
                        <div className="text-xs text-slate-500">Parent: {student.parentId.slice(0, 8)}...{student.parentId.slice(-4)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Parents List */}
              <div className="bg-slate-50 rounded-xl p-6">
                <h4 className="text-lg font-bold text-slate-800 mb-4">Parents ({parents.length})</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {parents.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-slate-400 text-4xl mb-2">👨‍👩‍👧‍👦</div>
                      <p className="text-slate-500">No parents added yet</p>
                    </div>
                  ) : (
                    parents.map((parent) => (
                      <div key={parent.id} className="bg-white rounded-lg p-3 border">
                        <div className="font-medium text-slate-800">{parent.name}</div>
                        <div className="text-sm text-slate-600">
                          Role: Parent • Contact: {parent.contactNumber || 'Not provided'}
                        </div>
                        <div className="text-xs text-slate-500">
                          Wallet: {parent.walletAddress.slice(0, 8)}...{parent.walletAddress.slice(-4)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'staff-list':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-slate-800">Staff Members ({staff.length})</h4>
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                🔄 Refresh
              </button>
            </div>

            {staffLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-slate-600">Loading staff...</span>
              </div>
            )}

            {staffError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <span className="text-red-500 text-xl mr-3">⚠️</span>
                  <div>
                    <h5 className="font-medium text-red-800">Error Loading Staff</h5>
                    <p className="text-red-600 text-sm">{staffError}</p>
                  </div>
                </div>
              </div>
            )}

            {!staffLoading && !staffError && staff.length === 0 && (
              <div className="text-center py-12">
                <div className="text-slate-400 text-6xl mb-4">👥</div>
                <h5 className="text-xl font-medium text-slate-600 mb-2">No Staff Members</h5>
                <p className="text-slate-500">No staff members have been added yet.</p>
              </div>
            )}

            {!staffLoading && !staffError && staff.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staff.map((member) => (
                  <div key={member.id} className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">👤</span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{member.name}</div>
                        <div className="text-sm text-slate-600">{member.role}</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 mb-2">
                      {member.walletAddress}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        member.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {member.isActive ? '✅ Active' : '❌ Inactive'}
                      </span>
                      <div className="text-xs text-slate-500">
                        {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'add-staff':
        return (
          <div className="bg-slate-50 rounded-xl p-6">
            <h4 className="text-lg font-bold text-slate-800 mb-4">Add New Staff Member</h4>
            
            {addError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-center">
                  <span className="text-red-500 text-xl mr-3">⚠️</span>
                  <p className="text-red-600 text-sm">{addError}</p>
                </div>
              </div>
            )}

            {addSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <div className="flex items-center">
                  <span className="text-green-500 text-xl mr-3">✅</span>
                  <p className="text-green-600 text-sm">{addSuccess}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleAddStaff} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={staffForm.name}
                    onChange={handleStaffFormChange}
                    placeholder="Enter staff member's full name"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="role"
                    value={staffForm.role}
                    onChange={handleStaffFormChange}
                    placeholder="e.g., Teacher, Administrator, Security"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Wallet Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="walletAddress"
                  value={staffForm.walletAddress}
                  onChange={handleStaffFormChange}
                  placeholder="0x1234567890abcdef1234567890abcdef12345678"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={addLoading || !staffForm.name.trim() || !staffForm.role.trim() || !staffForm.walletAddress.trim()}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  addLoading || !staffForm.name.trim() || !staffForm.role.trim() || !staffForm.walletAddress.trim()
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
                  '➕ Add Staff Member'
                )}
              </button>
            </form>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <TabContainer
      title="Management Panel"
      description="Manage users, students, parents, and staff members"
      icon="👥"
      gradientColors="from-purple-500 to-purple-600"
    >
      <div className="space-y-6">
        {/* Sub-navigation */}
        <div className="flex space-x-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setActiveSubTab('users')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeSubTab === 'users' 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            👨‍👩‍👧‍👦 Users
          </button>
          <button
            onClick={() => setActiveSubTab('staff-list')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeSubTab === 'staff-list' 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            📋 Staff List
          </button>
          <button
            onClick={() => setActiveSubTab('add-staff')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeSubTab === 'add-staff' 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            ➕ Add Staff
          </button>
        </div>

        {/* Sub-tab content */}
        {renderSubTabContent()}
      </div>
    </TabContainer>
  );
};

export default StaffManagementTab;
