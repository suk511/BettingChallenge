import { useAuthContext } from '@/hooks/use-auth';
import { formatCurrency } from '@/lib/utils';
import { useLocation } from 'wouter';
import UserBalance from './UserBalance';

const Header = () => {
  const { user, logout } = useAuthContext();
  const [_, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  return (
    <header className="bg-[#3f51b5] text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <span className="material-icons mr-2">casino</span>
          <h1 className="font-montserrat font-bold text-2xl">BetMaster</h1>
        </div>
        {user && (
          <div className="flex items-center space-x-4">
            <UserBalance balance={user.balance} />
            
            <div className="relative">
              <div className="flex items-center space-x-2">
                <span className="hidden md:inline-block font-medium">{user.username}</span>
                <div className="group relative">
                  <button className="flex items-center space-x-2 focus:outline-none">
                    <span className="material-icons">account_circle</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <div className="font-medium text-gray-900">{user.username}</div>
                      <div className="text-gray-500">{user.email}</div>
                    </div>
                    {user.isAdmin && (
                      <a 
                        href="/admin" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={(e) => {
                          e.preventDefault();
                          setLocation('/admin');
                        }}
                      >
                        Admin Panel
                      </a>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
