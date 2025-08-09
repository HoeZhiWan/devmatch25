'use client';

import React, { useEffect, useMemo, useState } from 'react';
import TabContainer from '../TabContainer';

type CanonicalHistory = {
  id: string;
  studentId: string;
  pickupBy: string;
  staffId: string;
  time: string; // ISO string
  blockchainHash?: string;
  contractTxHash?: string;
};

type StudentLite = { id: string; name: string };

const StaffPickupLogsTab: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("All students");
  const [history, setHistory] = useState<CanonicalHistory[]>([]);
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [users, setUsers] = useState<{ id: string; walletAddress: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/pickup/history');
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to load pickup history');
        }
        const items = Array.isArray(data.history) ? data.history : [];
        // Normalize time to safe ISO string
        setHistory(items.map((h: any) => {
          const isoTime = typeof h.time === 'string' && h.time
            ? h.time
            : h.time && typeof h.time?.toDate === 'function'
            ? h.time.toDate().toISOString()
            : (() => { const d = new Date(h.time); return isNaN(d.getTime()) ? '' : d.toISOString(); })();
          return {
            id: h.id,
            studentId: h.studentId,
            studentName: (h as any).studentName,
            pickupBy: h.pickupBy,
            staffId: h.staffId,
            time: isoTime,
            blockchainHash: h.blockchainHash,
            contractTxHash: h.contractTxHash,
          };
        }));
      } catch (e: any) {
        setError(e.message || 'Failed to load pickup history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch('/api/students');
        const data = await res.json();
        if (res.ok && data.success) {
          const list = (data.students || []).map((s: any) => ({ id: s.id, name: s.name }));
          setStudents(list);
        }
      } catch {
        // ignore
      }
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        if (res.ok && data.success) {
          const list = (data.users || []).map((u: any) => ({
            id: u.id,
            walletAddress: (u.walletAddress || u.id || '').toLowerCase(),
            name: u.name || 'Unknown User',
          }));
          setUsers(list);
        }
      } catch {
        // ignore
      }
    };
    fetchUsers();
  }, []);

  const studentNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of students) map[s.id] = s.name;
    return map;
  }, [students]);

  const userNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const u of users) map[u.walletAddress] = u.name;
    return map;
  }, [users]);

  const shortenWallet = (addr?: string) => {
    if (!addr || typeof addr !== 'string') return '';
    const a = addr.toLowerCase();
    return a.length > 12 ? `${a.slice(0, 6)}...${a.slice(-4)}` : a;
  };

  const rows = useMemo(() => history.map((h: any) => {
    const pickupWallet = (h.pickupBy || '').toLowerCase();
    return {
      id: h.id,
      studentId: h.studentId,
      // prefer API-provided name; fallback to student map; finally show ID
      studentName: h.studentName || studentNameMap[h.studentId] || h.studentId,
      pickupWallet,
      timestamp: h.time,
      status: 'completed' as const,
    };
  }), [history, studentNameMap, userNameMap]);

  const allStudents = useMemo(() => {
    const names = Array.from(new Set(rows.map(h => h.studentName).filter(Boolean)));
    return ["All students", ...names];
  }, [rows]);

  const filteredHistory = useMemo(() => {
    return rows.filter(item => {
      const matchesDate = !selectedDate || (item.timestamp || '').includes(selectedDate);
      const matchesStudent = selectedStudent === 'All students' || item.studentName === selectedStudent;
      return matchesDate && matchesStudent;
    });
  }, [rows, selectedDate, selectedStudent]);

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
          <button
            onClick={async () => {
              // simple refresh
              try {
                setLoading(true);
                const res = await fetch('/api/pickup/history');
                const data = await res.json();
                if (res.ok && data.success) {
                  const items = Array.isArray(data.history) ? data.history : [];
                  setHistory(items.map((h: any) => {
                    const isoTime = typeof h.time === 'string' && h.time
                      ? h.time
                      : h.time && typeof h.time?.toDate === 'function'
                      ? h.time.toDate().toISOString()
                      : (() => { const d = new Date(h.time); return isNaN(d.getTime()) ? '' : d.toISOString(); })();
                    return {
                      id: h.id,
                      studentId: h.studentId,
                      studentName: (h as any).studentName,
                      pickupBy: h.pickupBy,
                      staffId: h.staffId,
                      time: isoTime,
                      blockchainHash: h.blockchainHash,
                      contractTxHash: h.contractTxHash,
                    };
                  }));
                }
              } finally {
                setLoading(false);
              }
            }}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Refresh
          </button>
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
        {loading ? (
          <div className="text-center py-12">
            <div className="text-slate-400 text-6xl mb-4">⏳</div>
            <h3 className="text-xl font-medium text-slate-600 mb-2">Loading History...</h3>
            <p className="text-slate-500">Please wait while we fetch pickup records.</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-slate-400 text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-medium text-slate-600 mb-2">Failed to load history</h3>
            <p className="text-slate-500">{error}</p>
          </div>
        ) : filteredHistory.length === 0 ? (
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
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">Pickup Wallet</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">Date & Time</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((record) => (
                  <tr key={record.id || `${record.studentId}-${record.timestamp}`}
                      className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors`}>
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-800">{record.studentName}</div>
                    </td>
                    <td className="py-4 px-4">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                        {record.pickupWallet}
                      </code>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-slate-600 text-sm">
                        {(() => { const d = new Date(record.timestamp); return isNaN(d.getTime()) ? record.timestamp : d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: 'numeric', minute: '2-digit', hour12: true }); })()}
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
              <span className="ml-2 text-green-800">{rows.length}</span>
            </div>
            <div>
              <span className="text-green-700 font-medium">Completed:</span>
              <span className="ml-2 text-green-800">
                {rows.filter(h => h.status === 'completed').length}
              </span>
            </div>
            {/* Pending is always zero because we record only completed pickups */}
            <div>
              <span className="text-green-700 font-medium">Pending:</span>
              <span className="ml-2 text-green-800">0</span>
            </div>
            <div>
              <span className="text-green-700 font-medium">Today:</span>
              <span className="ml-2 text-green-800">
                {rows.filter(h => (h.timestamp || '').includes(new Date().toISOString().split('T')[0])).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </TabContainer>
  );
};

export default StaffPickupLogsTab;
