'use client';

import React, { useState } from 'react';
import { PickupHistory } from '../../../types/dashboard';
import TabContainer from '../TabContainer';

interface StaffPickupLogsTabProps {
  newPickups?: PickupHistory[];
}

const StaffPickupLogsTab: React.FC<StaffPickupLogsTabProps> = ({ newPickups = [] }) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("All students");

  // Available students for filtering (should be fetched from database)
  const allStudents = ["All students", "Jenny", "Tom", "Sara", "Phoebe", "Alice Johnson", "Bob Smith"];

  // Mock data combined with new pickups
  const [baseHistory] = useState<PickupHistory[]>([
    { id: '1', studentId: 'STU001', studentName: 'Alice Johnson', pickupPerson: '0x1234...5678', timestamp: '2024-01-15 14:30', status: 'completed' },
    { id: '2', studentId: 'STU002', studentName: 'Bob Smith', pickupPerson: '0x8765...4321', timestamp: '2024-01-15 15:45', status: 'pending' },
    { id: '3', studentId: '123', studentName: 'Jenny', pickupPerson: 'Parent', timestamp: '2025-08-05 17:40', status: 'completed' },
    { id: '4', studentId: '456', studentName: 'Tom', pickupPerson: 'Guardian', timestamp: '2025-08-06 16:20', status: 'completed' },
  ]);

  const pickupHistory = [...newPickups, ...baseHistory];

  const filteredHistory = pickupHistory.filter(item => {
    const matchesDate = !selectedDate || item.timestamp.includes(selectedDate);
    const matchesStudent = selectedStudent === "All students" || item.studentName === selectedStudent;
    return matchesDate && matchesStudent;
  });

  return (
    <TabContainer
      title="Pickup History"
      description="View and filter student pickup records"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Total Records: {filteredHistory.length}
          </div>
          {newPickups.length > 0 && (
            <div className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
              {newPickups.length} new pickup(s) today
            </div>
          )}
        </div>

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
                  <tr key={record.id} className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${newPickups.some(p => p.id === record.id) ? 'bg-green-50' : ''
                    }`}>
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-800">{record.studentName}</div>
                      {newPickups.some(p => p.id === record.id) && (
                        <div className="text-xs text-green-600 font-medium">NEW</div>
                      )}
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
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${record.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {record.status === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        <div className="p-4 border border-green-200 rounded-xl" style={{ backgroundColor: 'var(--light-green)' }}>
          <h3 className="font-medium text-green-800 mb-2">Pickup Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-green-700 font-medium">Total Pickups:</span>
              <span className="ml-2 text-green-800">{pickupHistory.length}</span>
            </div>
            <div>
              <span className="text-green-700 font-medium">Completed:</span>
              <span className="ml-2 text-green-800">
                {pickupHistory.filter(h => h.status === 'completed').length}
              </span>
            </div>
            <div>
              <span className="text-green-700 font-medium">Pending:</span>
              <span className="ml-2 text-green-800">
                {pickupHistory.filter(h => h.status === 'pending').length}
              </span>
            </div>
            <div>
              <span className="text-green-700 font-medium">Today:</span>
              <span className="ml-2 text-green-800">
                {pickupHistory.filter(h => h.timestamp.includes(new Date().toISOString().split('T')[0])).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </TabContainer>
  );
};

export default StaffPickupLogsTab;
