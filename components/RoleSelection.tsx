'use client';

import React, { useState } from 'react';

export type UserRole = 'parent' | 'pickup' | 'staff';

interface RoleSelectionProps {
  onRoleSelect: (role: UserRole) => void;
  isLoading?: boolean;
  error?: string | null;
  title?: string;
  description?: string;
}

const roleDefinitions = [
  {
    id: 'parent' as UserRole,
    title: 'Parent',
    description: 'Authorize pickup persons for your children',
    icon: '👨‍👩‍👧‍👦',
    color: 'blue'
  },
  {
    id: 'pickup' as UserRole,
    title: 'Pickup Person',
    description: 'Receive authorization to pick up children',
    icon: '🚗',
    color: 'green'
  },
  {
    id: 'staff' as UserRole,
    title: 'School Staff',
    description: 'Verify and manage pickup authorizations',
    icon: '🏫',
    color: 'purple'
  }
];

export const RoleSelection: React.FC<RoleSelectionProps> = ({
  onRoleSelect,
  isLoading = false,
  error = null,
  title = 'Select Your Role',
  description = 'Choose your role in the pickup authorization system'
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleRoleSubmit = () => {
    if (selectedRole && !isLoading) {
      onRoleSelect(selectedRole);
    }
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colorMap = {
      blue: {
        border: isSelected ? 'border-blue-500' : 'border-gray-200 hover:border-blue-300',
        bg: isSelected ? 'bg-blue-50' : 'bg-white hover:bg-blue-25',
        button: 'bg-blue-600 hover:bg-blue-700'
      },
      green: {
        border: isSelected ? 'border-green-500' : 'border-gray-200 hover:border-green-300',
        bg: isSelected ? 'bg-green-50' : 'bg-white hover:bg-green-25',
        button: 'bg-green-600 hover:bg-green-700'
      },
      purple: {
        border: isSelected ? 'border-purple-500' : 'border-gray-200 hover:border-purple-300',
        bg: isSelected ? 'bg-purple-50' : 'bg-white hover:bg-purple-25',
        button: 'bg-purple-600 hover:bg-purple-700'
      }
    };
    
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          <p className="text-gray-600">
            {description}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {roleDefinitions.map((role) => {
            const isSelected = selectedRole === role.id;
            const colors = getColorClasses(role.color, isSelected);
            
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                disabled={isLoading}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${colors.border} ${colors.bg} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{role.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{role.title}</h3>
                    <p className="text-sm text-gray-600">{role.description}</p>
                  </div>
                  {isSelected && (
                    <div className="text-blue-500">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-red-500">⚠️</span>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleRoleSubmit}
          disabled={!selectedRole || isLoading}
          className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Setting up account...</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>Continue with {selectedRole ? roleDefinitions.find(r => r.id === selectedRole)?.title : 'Role'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default RoleSelection;
