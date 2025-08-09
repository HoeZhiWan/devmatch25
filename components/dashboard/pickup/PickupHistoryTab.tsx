'use client';

import React, { useState } from 'react';
import { useFirebaseData } from '../../../hooks/useFirebaseData';
import { useWallet } from '../../../hooks/useWallet';
import TabContainer from '../TabContainer';

const PickupHistoryTab: React.FC = () => {
  const { address } = useWallet();
  const { pickupHistory, loading } = useFirebaseData();
  
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("All students");

  // Filter history to only show pickups by the current user
  const userPickupHistory = pickupHistory.filter(record => 
    record.pickupBy.toLowerCase() === address?.toLowerCase()
  );

  // Get student names from the history by looking up student data
  const { students } = useFirebaseData();
  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : studentId;
  };

  const allStudents = ["All students", ...Array.from(new Set(userPickupHistory.map(h => getStudentName(h.studentId))))];

  const filteredHistory = userPickupHistory.filter(item => {
    const itemDate = new Date(item.time).toISOString().split('T')[0];
    const studentName = getStudentName(item.studentId);
    const matchesDate = !selectedDate || itemDate === selectedDate;
    const matchesStudent = selectedStudent === "All students" || studentName === selectedStudent;
    return matchesDate && matchesStudent;
  });

  return (
    <TabContainer
      title="Pickup History"
      description="View your pickup history and records"
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="dateFilter" className="block text-sm font-medium text-slate-700 mb-2">
              Filter by Date
            </label>
            <input
              type="date"
              id="dateFilter"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-500"
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
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-500"
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
              className="w-full px-4 py-2 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors duration-200"
              style={{ backgroundColor: 'var(--light-blue)' }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* History Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-slate-400 text-6xl mb-4">⏳</div>
            <h3 className="text-xl font-medium text-slate-600 mb-2">Loading History...</h3>
            <p className="text-slate-500">Please wait while we fetch your pickup records.</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-slate-400 text-6xl mb-4">📋</div>
            <h3 className="text-xl font-medium text-slate-600 mb-2">No Pickup Records</h3>
            <p className="text-slate-500">
              {selectedDate || selectedStudent !== 'All students' 
                ? 'No records match your current filters.' 
                : 'You haven\'t picked up any students yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">Student</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">Student ID</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">Date & Time</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">Blockchain</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((record) => (
                  <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-800">{getStudentName(record.studentId)}</div>
                    </td>
                    <td className="py-4 px-4">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                        {record.studentId}
                      </code>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-slate-600 text-sm">
                        {new Date(record.time).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        record.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.status === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                      <div className="text-xs text-slate-500 mt-1">
                        Tx: {record.contractTxHash.slice(0, 8)}...
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        <div className="p-4 border border-green-200 rounded-xl" style={{ backgroundColor: 'var(--light-green)' }}>
          <h3 className="font-medium text-green-800 mb-2">📊 Your Pickup Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-green-700 font-medium">Total Pickups:</span>
              <span className="ml-2 text-green-800">{userPickupHistory.length}</span>
            </div>
            <div>
              <span className="text-green-700 font-medium">This Month:</span>
              <span className="ml-2 text-green-800">
                {userPickupHistory.filter(h => {
                  const recordDate = new Date(h.time);
                  const currentMonth = new Date().getMonth();
                  const currentYear = new Date().getFullYear();
                  return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
                }).length}
              </span>
            </div>
            <div>
              <span className="text-green-700 font-medium">Students:</span>
              <span className="ml-2 text-green-800">
                {new Set(userPickupHistory.map(h => h.studentId)).size}
              </span>
            </div>
          </div>
        </div>
      </div>
    </TabContainer>
  );
};

export default PickupHistoryTab;
