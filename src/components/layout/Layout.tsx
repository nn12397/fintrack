import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  CreditCard, 
  LayoutDashboard, 
  Receipt, 
  PiggyBank, 
  Target, 
  User,
  Menu as MenuIcon,
  LogOut,
  BadgePercent,
  ChevronLeft,
  ChevronRight,
  Wallet,
  DollarSign
} from 'lucide-react';
import Button from '../ui/Button';
import { signOut } from '../../services/auth-service';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigation = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/' },
    { name: 'Income', icon: <DollarSign size={20} />, href: '/income' },
    { name: 'Bills', icon: <Receipt size={20} />, href: '/bills' },
    { name: 'Credit Cards', icon: <CreditCard size={20} />, href: '/credit-cards' },
    { name: 'Debit Cards', icon: <Wallet size={20} />, href: '/debit-cards' },
    { name: 'Savings', icon: <PiggyBank size={20} />, href: '/savings' },
    { name: 'Payoff Plans', icon: <BadgePercent size={20} />, href: '/payoff-plans' },
    { name: 'Spending Budget', icon: <PiggyBank size={20} />, href: '/budget' },
    { name: 'Purchase Goals', icon: <Target size={20} />, href: '/goals' },
    { name: 'Profile', icon: <User size={20} />, href: '/profile' },
  ];

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isCurrentPage = (href: string) => {
    if (href === '/' && location.pathname === '/') return true;
    if (href !== '/' && location.pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-primary-950/50 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-primary-950 to-primary-900 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:hidden`}>
        <div className="flex items-center justify-between h-16 px-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-white via-primary-100 to-accent-200 text-transparent bg-clip-text">
            FinTrack
          </h1>
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg text-primary-400 hover:text-white hover:bg-primary-800/50">
            <ChevronLeft size={24} />
          </button>
        </div>
        <nav className="mt-6 px-3 space-y-1.5">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`
                flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all
                ${isCurrentPage(item.href)
                  ? 'bg-gradient-to-r from-accent-500/20 to-accent-500/10 text-white shadow-inner-sm'
                  : 'text-primary-100 hover:bg-primary-800/50 hover:text-white'}
              `}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="mr-3 opacity-70">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-6">
          <Button
            variant="outline"
            fullWidth
            leftIcon={<LogOut size={18} />}
            onClick={handleSignOut}
            isLoading={isLoading}
            className="text-primary-100 border-primary-800 hover:bg-primary-800/50"
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col bg-gradient-to-b from-primary-950 to-primary-900 transition-all duration-300 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
        <div className="flex items-center justify-between h-16 px-6">
          <h1 className={`font-bold bg-gradient-to-r from-white via-primary-100 to-accent-200 text-transparent bg-clip-text transition-all ${isCollapsed ? 'text-lg' : 'text-2xl'}`}>
            {isCollapsed ? 'FT' : 'FinTrack'}
          </h1>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-primary-400 hover:text-white hover:bg-primary-800/50 transition-colors"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        <div className="flex flex-col flex-1 mt-6">
          <nav className="flex-1 px-3 space-y-1.5">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all
                  ${isCurrentPage(item.href)
                    ? 'bg-gradient-to-r from-accent-500/20 to-accent-500/10 text-white shadow-inner-sm'
                    : 'text-primary-100 hover:bg-primary-800/50 hover:text-white'}
                `}
                title={isCollapsed ? item.name : undefined}
              >
                <span className={`opacity-70 group-hover:opacity-100 transition-opacity ${isCollapsed ? '' : 'mr-3'}`}>
                  {item.icon}
                </span>
                {!isCollapsed && item.name}
              </Link>
            ))}
          </nav>
          
          <div className="p-6">
            <Button
              variant="outline"
              fullWidth
              leftIcon={<LogOut size={18} />}
              onClick={handleSignOut}
              isLoading={isLoading}
              className="text-primary-100 border-primary-800 hover:bg-primary-800/50"
            >
              {!isCollapsed && 'Sign Out'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Top navbar */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-primary-100">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <div className="flex items-center lg:hidden">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-primary-600 hover:text-primary-700 rounded-lg hover:bg-primary-50"
              >
                <MenuIcon size={24} />
              </button>
              <h1 className="ml-3 text-lg font-semibold bg-gradient-to-r from-primary-600 to-accent-500 text-transparent bg-clip-text">
                FinTrack
              </h1>
            </div>
            <div className="hidden lg:block">
              <h2 className="text-2xl font-semibold text-primary-950">
                {navigation.find(item => isCurrentPage(item.href))?.name || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              {/* User profile dropdown or other header components can go here */}
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;