"use client";
import React, { useState } from "react";
import { useUserRole } from "../hooks/useUserRole";
import StaffDashboard from "../components/StaffDashboard";
import ParentDashboard from "../components/ParentDashboard";

export default function HomePage() {
  const [address, setAddress] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'staff' | 'parent' | 'pickup' | null>(null);
  const role = useUserRole(address);

  // Mock login for demo
  const handleMockLogin = (role: 'staff' | 'parent' | 'pickup') => {
    setSelectedRole(role);
    setAddress('0xMockAddress123');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex justify-between items-center py-5">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">🛡️</span>
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  KID GUARD
                </h1>
                <p className="text-xs text-slate-500">Child Pickup Authorization System</p>
              </div>
            </div>
            {/* Badge */}
            <div className="px-3 py-1 bg-gradient-to-r from-green-100 to-green-200 text-green-800 rounded-full text-xs font-semibold shadow-sm">
              Demo Mode
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto px-6 lg:px-10 py-12">
        {!address && !selectedRole && (
          <div className="max-w-4xl mx-auto text-center">
            {/* Hero */}
            <div className="mb-14">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl mb-6 shadow-lg">
                <span className="text-4xl">🛡️</span>
              </div>
              <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
                Secure Child Pickup System
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Choose your role to safely access the child pickup authorization system.
                All blockchain functions are simulated in <span className="font-medium text-indigo-600">demo mode</span>.
              </p>
            </div>

            {/* Role Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Staff Card */}
              <RoleCard
                title="Staff Dashboard"
                emoji="👨‍🏫"
                description="Validate pickups, view history, and manage student records"
                gradient="from-blue-600 to-indigo-600"
                onClick={() => handleMockLogin('staff')}
              />

              {/* Parent Card */}
              <RoleCard
                title="Parent Dashboard"
                emoji="👨‍👩‍👧‍👦"
                description="Generate pickup QR codes and authorize pickup persons"
                gradient="from-indigo-600 to-purple-600"
                onClick={() => handleMockLogin('parent')}
              />

              {/* Pickup Card */}
              <RoleCard
                title="Pickup Person"
                emoji="🎫"
                description="Access authorized pickup QR codes for child collection"
                gradient="from-purple-600 to-pink-600"
                onClick={() => handleMockLogin('pickup')}
              />
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {(address || selectedRole) && !role && (
          <div className="flex justify-center py-16">
            <div className="flex items-center gap-3 text-slate-600">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-base font-medium">Detecting role...</span>
            </div>
          </div>
        )}

        {/* Dashboards */}
        {(address || selectedRole) && (role === "staff" || selectedRole === "staff") && (
          <DashboardSection
            emoji="👨‍🏫"
            gradient="from-blue-500 to-indigo-600"
            title="Staff Dashboard"
            subtitle="Manage student pickups and system administration"
          >
            <StaffDashboard />
          </DashboardSection>
        )}

        {(address || selectedRole) && (role === "parent" || selectedRole === "parent") && (
          <DashboardSection
            emoji="👨‍👩‍👧‍👦"
            gradient="from-indigo-500 to-purple-600"
            title="Parent Dashboard"
            subtitle="Generate pickup QR codes and manage authorizations"
          >
            <ParentDashboard />
          </DashboardSection>
        )}

        {(address || selectedRole) && (role === "pickup" || selectedRole === "pickup") && (
          <DashboardSection
            emoji="🎫"
            gradient="from-purple-500 to-pink-600"
            title="Pickup Person Dashboard"
            subtitle="Access authorized pickup QR codes"
          />
        )}
      </main>
    </div>
  );
}

/* ---------- Subcomponents ---------- */

// Role Card
function RoleCard({ title, emoji, description, gradient, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="group relative p-8 bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 w-full"
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300`}></div>
      <div className="relative flex flex-col items-center text-center space-y-4">
        <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
          <span className="text-2xl">{emoji}</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
        <div className="mt-4 px-5 py-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 rounded-lg text-sm font-medium shadow-sm group-hover:from-white group-hover:to-white">
          Access System
        </div>
      </div>
    </button>
  );
}

// Dashboard Section
function DashboardSection({ emoji, gradient, title, subtitle, children }: any) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-md`}>
          <span className="text-white text-xl">{emoji}</span>
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">{title}</h2>
          <p className="text-slate-600">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
