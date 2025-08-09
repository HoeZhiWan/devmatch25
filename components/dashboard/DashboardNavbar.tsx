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
      return '/icons/family.png';
    case 'staff':
      return '/icons/teacher.png';
    case 'pickup':
      return '/icons/car.png';
    default:
      return '/icons/administrator.png';
  }
};

// const getRoleColor = (role: string) => {
//   switch (role) {
//     case 'parent':
//       return 'from-blue-500 to-blue-600';
//     case 'staff':
//       return '#fff6da'; 
//     case 'pickup':
//       return 'from-purple-500 to-purple-600';
//     default:
//       return 'from-slate-500 to-slate-600';
//   }
// };

const DashboardNavbar: React.FC<DashboardNavbarProps> = ({ wallet, role, isLoading, onLogout }) => (
  <header className="backdrop-blur-sm shadow-md" style={{ backgroundColor: 'var(--background)' }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center py-4">
        <div className="flex items-center space-x-3">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center">
            <img
              src='/logo.jpg'
              alt= 'Kid Guard Logo'
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text"
            style={{ color: 'var(--color-dark)' }}
            >
              KidGuard
            </h1>
            <p className="text-sm text-slate-600" style={{ color: 'var(--color-grey)' }}>Secure Child Pickup System</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center`}
              >
              <img
                src={getRoleIcon(role)}
                alt={role}
                className="w-9 h-9 object-contain"
              />
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
            className="text-slate-700 hover:text-slate-900 text-md font-medium transition-colors"
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
