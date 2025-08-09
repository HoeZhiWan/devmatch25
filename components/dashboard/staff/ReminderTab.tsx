'use client';

import React, { useEffect, useRef, useState } from "react";
import { ReminderConfig, ReminderLog } from "../../../types/reminder";

export default function ReminderTab() {
  const [finishSchoolTime, setFinishSchoolTime] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [parents, setParents] = useState<ReminderLog[]>([]);
  const [statusList, setStatusList] = useState<Record<string, ReminderLog["status"]>>({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastSentAutoDate, setLastSentAutoDate] = useState<string | null>(null);
  const [lastSentManualDate, setLastSentManualDate] = useState<string | null>(null);
  const finishTimeRef = useRef<string>("");
  const lastSentAutoRef = useRef<string | null>(null);

  useEffect(() => {
    fetchConfig();
    fetchParents();
    // Restore last sent date to avoid duplicate sends on refresh
    try {
      const storedAuto = localStorage.getItem('reminders_last_sent_auto');
      if (storedAuto) setLastSentAutoDate(storedAuto);
      const storedManual = localStorage.getItem('reminders_last_sent_manual');
      if (storedManual) setLastSentManualDate(storedManual);
    } catch {}

    // Check more frequently to avoid missing the exact minute
    const interval = setInterval(checkAndSend, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchConfig() {
    try {
      const res = await fetch("/api/reminders/config");
      const data: ReminderConfig = await res.json();
      setFinishSchoolTime(data.finishSchoolTime || "");
      finishTimeRef.current = data.finishSchoolTime || "";
      setMessageTemplate(data.messageTemplate || "");
    } catch (err) {
      console.error("Error fetching config:", err);
    }
  }

  async function fetchParents() {
    try {
      const res = await fetch("/api/reminders/parents");
      const data: ReminderLog[] = await res.json();
      setParents(data);
      setStatusList(Object.fromEntries(data.map((p) => [p.parentName, "pending"])));
    } catch (err) {
      console.error("Error fetching parents:", err);
    }
  }

  async function updateConfig(type: "time" | "message") {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/reminders/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finishSchoolTime, messageTemplate }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to update config");
      }
      await fetchConfig();
      setSuccessMsg(
        type === "time" 
          ? "✅ Finish School Time updated successfully!" 
          : "✅ Reminder Message Template updated successfully!"
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  }

  // Keep refs in sync with latest state
  useEffect(() => {
    finishTimeRef.current = finishSchoolTime;
  }, [finishSchoolTime]);
  useEffect(() => {
    lastSentAutoRef.current = lastSentAutoDate;
  }, [lastSentAutoDate]);

  async function checkAndSend() {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; // local date

    const parseTimeToMinutes = (timeStr: string): number | null => {
      if (!timeStr) return null;
      const s = timeStr.trim().toLowerCase().replace(/\./g, ":");
      const ampmMatch = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
      if (ampmMatch) {
        let h = parseInt(ampmMatch[1], 10);
        const m = parseInt(ampmMatch[2], 10);
        const mer = ampmMatch[3];
        if (mer === 'pm' && h !== 12) h += 12;
        if (mer === 'am' && h === 12) h = 0;
        return h * 60 + m;
      }
      const hhmmMatch = s.match(/^(\d{1,2}):(\d{2})$/);
      if (hhmmMatch) {
        const h = parseInt(hhmmMatch[1], 10);
        const m = parseInt(hhmmMatch[2], 10);
        if (h >= 0 && h < 24 && m >= 0 && m < 60) return h * 60 + m;
      }
      return null;
    };

    const targetMinutes = parseTimeToMinutes(finishTimeRef.current);
    // Trigger once per day when we reach or pass the target time
    if (targetMinutes !== null && nowMinutes >= targetMinutes && lastSentAutoRef.current !== today) {
      try {
        const res = await fetch("/api/reminders/send", { method: "POST" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || "Failed to send reminders");
        }
        const updated: ReminderLog[] = await res.json();
        setStatusList(Object.fromEntries(updated.map((p) => [p.parentName, p.status])));
        setLastSentAutoDate(today);
        lastSentAutoRef.current = today;
        try { localStorage.setItem('reminders_last_sent_auto', today); } catch {}
      } catch (err) {
        console.error("Error sending reminders:", err);
      }
    }
  }

  async function sendNow() {
    try {
      setLoading(true);
      const res = await fetch("/api/reminders/send", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to send reminders");
      }
      const updated: ReminderLog[] = await res.json();
      setStatusList(Object.fromEntries(updated.map((p) => [p.parentName, p.status])));
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; // local date
      setLastSentManualDate(today);
      try { localStorage.setItem('reminders_last_sent_manual', today); } catch {}
      setSuccessMsg("✅ Reminders sent now");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Send failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-800">Reminder Settings</h2>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-600">{successMsg}</p>
        </div>
      )}

      {/* Finish School Time */}
      <div className="bg-slate-50 rounded-xl p-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Finish School Time <span className="text-red-500">*</span>
        </label>
        <input
          type="time"
          value={finishSchoolTime}
          onChange={(e) => setFinishSchoolTime(e.target.value)}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={() => updateConfig("time")}
          disabled={loading || !finishSchoolTime.trim()}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
            loading || !finishSchoolTime.trim()
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {loading ? "Updating..." : "Update Finish School Time"}
        </button>
      </div>

      {/* Reminder Message Template */}
      <div className="bg-slate-50 rounded-xl p-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Reminder Message Template <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={messageTemplate}
          onChange={(e) => setMessageTemplate(e.target.value)}
          placeholder="Enter reminder message..."
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={() => updateConfig("message")}
          disabled={loading || !messageTemplate.trim()}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
            loading || !messageTemplate.trim()
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {loading ? "Updating..." : "Update Reminder Message Template"}
        </button>
      </div>

      {/* Parent Reminder List */}
      <div className="bg-slate-50 rounded-xl p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Parent Reminder List</h3>
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={sendNow}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              loading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {loading ? 'Sending...' : 'Send reminders now'}
          </button>
          {lastSentManualDate && (
            <span className="text-sm text-slate-500">Last sent : {lastSentManualDate}</span>
          )}
        </div>
        <table className="min-w-full border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">Parent Address</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">Children Names</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {parents.map((parent, idx) => (
              <tr key={idx} className="border-t border-slate-200">
                <td className="px-4 py-2">{parent.parentName}</td>
                <td className="px-4 py-2">{parent.studentsNames}</td>
                <td className="px-4 py-2">
                  <span
                    role="button"
                    title="Click to reset to pending"
                    onClick={() =>
                      setStatusList((prev) => ({ ...prev, [parent.parentName]: 'pending' }))
                    }
                    className={`cursor-pointer px-2 py-1 rounded-full text-xs font-medium ${
                    statusList[parent.parentName] === "sent"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                  >
                    {statusList[parent.parentName] || "pending"}
                  </span>
                </td>
              </tr>
            ))}
            {parents.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                  No parents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
