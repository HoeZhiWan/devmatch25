import React from 'react';

interface DashboardNavbarProps {
  wallet: string;
  role: string;
  isLoading: boolean;
  onLogout: () => void;
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'parent':
      return '👨‍👩‍👧‍👦';
    case 'staff':
      return '👩‍🏫';
    case 'pickup':
      return '🚗';
    default:
      return '👤';
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'parent':
      return 'from-blue-500 to-blue-600';
    case 'staff':
      return 'from-green-500 to-green-600';
    case 'pickup':
      return 'from-purple-500 to-purple-600';
    default:
      return 'from-slate-500 to-slate-600';
  }
};

const DashboardNavbar: React.FC<DashboardNavbarProps> = ({ wallet, role, isLoading, onLogout }) => (
  <header className="border-b border-slate-200/50 bg-white/80 backdrop-blur-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center py-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              KidGuard
            </h1>
            <p className="text-sm text-slate-600">Secure Child Pickup System</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 bg-gradient-to-r ${getRoleColor(role)} rounded-xl flex items-center justify-center`}>
              <span className="text-white text-lg">{getRoleIcon(role)}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-slate-700">
                {wallet.slice(0, 6)}...{wallet.slice(-4)}
              </div>
              <div className="text-xs text-slate-500 capitalize">{role}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>
    </div>
  </header>
);

export default DashboardNavbar;
