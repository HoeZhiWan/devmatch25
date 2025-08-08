'use client';

import React, { useState, useEffect } from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';

interface SchoolSchedule {
  id: string;
  schoolName: string;
  finishTime: string;
  timezone: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ParentInfo {
  parentName: string;
  childrenNames: string;
  walletAddress: string;
  status: 'valid' | 'invalid_address' | 'no_wallet';
}

const ReminderManager: React.FC = () => {
  const { user } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState<'schedule' | 'reminders' | 'parents'>('schedule');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  
  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    schoolName: 'DevMatch25 School',
    finishTime: '15:30',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  
  // Auto-detect timezone on component mount
  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setScheduleForm(prev => ({
      ...prev,
      timezone: detectedTimezone
    }));
  }, []);
  
  // Current schedule state
  const [currentSchedule, setCurrentSchedule] = useState<SchoolSchedule | null>(null);
  
  // Reminder status state
  const [reminderStatuses, setReminderStatuses] = useState<any[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  
  // Parent list state
  const [parentList, setParentList] = useState<ParentInfo[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);
  
  // Template variables for reminder messages
  const templateVariables = {
    '{parentName}': 'Parent\'s name',
    '{childName}': 'Child\'s name',
    '{schoolName}': 'School name',
    '{finishTime}': 'School finish time',
    '{pickupLocation}': 'Pickup location'
  };

  // Load current schedule and reminder statuses on component mount
  useEffect(() => {
    loadCurrentSchedule();
    loadReminderStatuses();
    loadParentList();
  }, []);

  const loadCurrentSchedule = async () => {
    try {
      const response = await fetch('/api/reminders/schedule');
      const data = await response.json();
      
      if (data.success && data.schedule) {
        setCurrentSchedule(data.schedule);
        setScheduleForm({
          schoolName: data.schedule.schoolName,
          finishTime: data.schedule.finishTime,
          timezone: data.schedule.timezone,
        });
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  };

  const loadParentList = async () => {
    setLoadingParents(true);
    try {
      const response = await fetch('/api/reminders/parents');
      const data = await response.json();
      
      if (data.success) {
        setParentList(data.parents);
      } else {
        console.error('Error loading parent list:', data.error);
      }
    } catch (error) {
      console.error('Error loading parent list:', error);
    } finally {
      setLoadingParents(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/reminders/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...scheduleForm,
          createdBy: user?.wallet || '',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('✅ School schedule updated successfully!');
        await loadCurrentSchedule();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Error updating schedule');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReminderStatuses = async () => {
    setLoadingStatuses(true);
    try {
      const response = await fetch('/api/reminders/status');
      const data = await response.json();
      
      if (data.success) {
        setReminderStatuses(data.statuses);
      } else {
        console.error('Error loading reminder statuses:', data.error);
      }
    } catch (error) {
      console.error('Error loading reminder statuses:', error);
    } finally {
      setLoadingStatuses(false);
    }
  };

  const handleReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Calculate scheduled time based on school finish time
      const today = new Date();
      const [hours, minutes] = scheduleForm.finishTime.split(':');
      const scheduledTime = new Date(today);
      scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // If the time has already passed today, schedule for tomorrow
      if (scheduledTime <= today) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      
      const response = await fetch('/api/reminders/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: customMessage,
          scheduledFor: scheduledTime.toISOString(),
          createdBy: user?.wallet || '',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const formattedTime = new Date(scheduledTime).toLocaleString();
        setMessage(`✅ Reminders scheduled successfully! ${data.stats.successful} notifications will be sent at ${formattedTime}`);
        // Clear the custom message field
        setCustomMessage('');
        // Reload reminder statuses
        await loadReminderStatuses();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Error sending reminders');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800';
      case 'invalid_address':
        return 'bg-red-100 text-red-800';
      case 'no_wallet':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return '✅';
      case 'invalid_address':
        return '❌';
      case 'no_wallet':
        return '⚠️';
      default:
        return '❓';
    }
  };

  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-2">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'schedule' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span>⏰</span>
              <span>School Schedule</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'reminders' 
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' 
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span>📢</span>
              <span>Send Reminders</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('parents')}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'parents' 
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg' 
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span>👥</span>
              <span>Parent List</span>
            </div>
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-xl border ${
          message.startsWith('✅') 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            <span>{message.startsWith('✅') ? '✅' : '❌'}</span>
            <span>{message}</span>
          </div>
        </div>
      )}

      {/* School Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">⏰</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">School Schedule</h3>
              <p className="text-slate-600">Configure school schedule for reminder timing</p>
            </div>
          </div>
          
          <form onSubmit={handleScheduleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 rounded-xl p-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  School Name
                </label>
                <input
                  className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white transition-all duration-200"
                  value={scheduleForm.schoolName}
                  onChange={e => setScheduleForm(prev => ({ ...prev, schoolName: e.target.value }))}
                  placeholder="Enter school name"
                />
              </div>
              
              <div className="bg-slate-50 rounded-xl p-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Finish Time
                </label>
                <input
                  type="time"
                  className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white transition-all duration-200"
                  value={scheduleForm.finishTime}
                  onChange={e => setScheduleForm(prev => ({ ...prev, finishTime: e.target.value }))}
                />
              </div>
              
              <div className="bg-slate-50 rounded-xl p-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Timezone
                </label>
                <input
                  className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white transition-all duration-200"
                  value={scheduleForm.timezone}
                  onChange={e => setScheduleForm(prev => ({ ...prev, timezone: e.target.value }))}
                  placeholder="Auto-detected"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>💾</span>
                  <span>Update Schedule</span>
                </div>
              )}
            </button>
          </form>

          {currentSchedule && (
            <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-900 mb-4">Current Schedule</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-800">School:</span>
                  <span className="ml-2 text-blue-700">{currentSchedule.schoolName}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Finish Time:</span>
                  <span className="ml-2 text-blue-700">{currentSchedule.finishTime}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Timezone:</span>
                  <span className="ml-2 text-blue-700">{currentSchedule.timezone}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Send Reminders Tab */}
      {activeTab === 'reminders' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">📢</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Send Reminders</h3>
              <p className="text-slate-600">Send pickup reminders to parents with valid wallet addresses</p>
            </div>
          </div>
          
          <form onSubmit={handleReminderSubmit} className="space-y-6">
            <div className="bg-slate-50 rounded-xl p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Custom Message (Optional)
              </label>
              <textarea
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-500 bg-white transition-all duration-200 resize-none"
                rows={4}
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                placeholder="Leave empty to use default message. Use template variables: {parentName}, {childName}, {schoolName}, {finishTime}, {pickupLocation}"
              />
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-blue-900 mb-3">Template Variables</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {Object.entries(templateVariables).map(([variable, description]) => (
                  <div key={variable} className="flex items-center space-x-2">
                    <code className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono">
                      {variable}
                    </code>
                    <span className="text-blue-700">{description}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>📢</span>
                  <span>Send Reminders</span>
                </div>
              )}
            </button>
          </form>

          {/* Reminder Status Table */}
          {!loadingStatuses && reminderStatuses.length > 0 && (
            <div className="mt-8">
              <h4 className="text-lg font-semibold text-slate-900 mb-4">Recent Reminder Status</h4>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Parent</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Student</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Status</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Scheduled For</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Sent At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reminderStatuses.slice(0, 10).map((status, index) => (
                      <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-900">{status.parentName}</td>
                        <td className="py-3 px-4 text-slate-900">{status.studentName}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            status.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : status.status === 'sent' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {status.status === 'pending' ? '⏳ Pending' : 
                             status.status === 'sent' ? '✅ Sent' : '❌ Failed'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-sm">
                          {status.scheduledFor ? new Date(status.scheduledFor).toLocaleString() : '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-sm">
                          {status.sentAt ? new Date(status.sentAt).toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Parent List Tab */}
      {activeTab === 'parents' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">👥</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Parent List</h3>
              <p className="text-slate-600">Complete list of all parents and their status</p>
            </div>
          </div>
          
          {loadingParents ? (
            <div className="flex items-center justify-center space-x-3 py-12">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-600">Loading parent list...</span>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Parent Name</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Children</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Wallet Address</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parentList.map((parent, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-900 font-medium">{parent.parentName}</td>
                      <td className="py-3 px-4 text-slate-700">{parent.childrenNames}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-sm">
                        {parent.walletAddress === 'No wallet' ? '-' : parent.walletAddress}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(parent.status)}`}>
                          <span className="mr-1">{getStatusIcon(parent.status)}</span>
                          {parent.status === 'valid' ? 'Valid' : 
                           parent.status === 'invalid_address' ? 'Invalid Address' : 
                           'No Wallet'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {!loadingParents && parentList.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h4 className="text-xl font-semibold text-slate-700 mb-2">No parents found</h4>
              <p className="text-slate-500">No parents are currently registered in the system.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReminderManager;
