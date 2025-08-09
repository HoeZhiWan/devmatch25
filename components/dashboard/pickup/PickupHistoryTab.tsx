'use client';

import React, { useState } from 'react';
import { PickupHistory } from '../../../types/dashboard';
import TabContainer from '../TabContainer';

const PickupHistoryTab: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedChild, setSelectedChild] = useState("All children");

  // Mock data - in real app, fetch from database based on pickup person's history
  const [pickupHistory] = useState<PickupHistory[]>([
    { id: '1', studentId: 'STU001', studentName: 'Alice Johnson', pickupPerson: 'You', timestamp: '2024-01-15 14:30', status: 'completed' },
    { id: '2', studentId: 'STU002', studentName: 'Bob Smith', pickupPerson: 'You', timestamp: '2024-01-15 15:45', status: 'completed' },
  ]);

  const allChildren = ["All children", ...Array.from(new Set(pickupHistory.map(h => h.studentName)))];

  const filteredHistory = pickupHistory.filter(item => {
    const matchesDate = !selectedDate || item.timestamp.includes(selectedDate);
    const matchesChild = selectedChild === "All children" || item.studentName === selectedChild;
    return matchesDate && matchesChild;
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
            <label htmlFor="childFilter" className="block text-sm font-medium text-slate-700 mb-2">
              Filter by Child
            </label>
            <select
              id="childFilter"
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-500"
            >
              {allChildren.map((child) => (
                <option key={child} value={child}>
                  {child}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedDate('');
                setSelectedChild('All children');
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
              {selectedDate || selectedChild !== 'All children' 
                ? 'No records match your current filters.' 
                : 'You haven\'t picked up any children yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">Child</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">Student ID</th>
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
          <h3 className="font-medium text-green-800 mb-2">📊 Your Pickup Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-green-700 font-medium">Total Pickups:</span>
              <span className="ml-2 text-green-800">{pickupHistory.length}</span>
            </div>
            <div>
              <span className="text-green-700 font-medium">This Month:</span>
              <span className="ml-2 text-green-800">
                {pickupHistory.filter(h => h.timestamp.includes('2024-01')).length}
              </span>
            </div>
            <div>
              <span className="text-green-700 font-medium">Children:</span>
              <span className="ml-2 text-green-800">
                {new Set(pickupHistory.map(h => h.studentName)).size}
              </span>
            </div>
          </div>
        </div>
      </div>
    </TabContainer>
  );
};

export default PickupHistoryTab;
