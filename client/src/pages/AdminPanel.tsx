import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useAuthContext } from "@/hooks/use-auth";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminPanel = () => {
  const { user } = useAuthContext();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false);
  const [isGameControlOpen, setIsGameControlOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newBalance, setNewBalance] = useState("");

  // Game control state
  const [roundNumber, setRoundNumber] = useState<number>(0);
  const [result, setResult] = useState<number>(0);
  const [resultColor, setResultColor] = useState<string>("green");
  const [resultSize, setResultSize] = useState<string>("small");

  // Check if user is admin
  useEffect(() => {
    if (user && !user.isAdmin) {
      setLocation("/");
      toast({
        title: "Access denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
    }
  }, [user, setLocation, toast]);

  // Fetch users
  const {
    data: users = [],
    isLoading: isLoadingUsers,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: !!user && user.isAdmin,
  });

  // Fetch transactions
  const {
    data: transactions = [],
    isLoading: isLoadingTransactions,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["/api/admin/transactions"],
    enabled: !!user && user.isAdmin && activeTab === "transactions",
  });

  // Update user balance mutation
  const updateBalanceMutation = useMutation({
    mutationFn: async ({ userId, balance }: { userId: number; balance: number }) => {
      return await apiRequest('PUT', `/api/admin/users/${userId}/balance`, { balance });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      toast({
        title: "Balance updated",
        description: "User balance has been updated successfully.",
      });
      setIsBalanceDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update balance",
        variant: "destructive",
      });
    },
  });

  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: number; status: string }) => {
      return await apiRequest('PUT', `/api/admin/users/${userId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Status updated",
        description: "User status has been updated successfully.",
      });
      setIsEditUserOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    },
  });

  // Control game round mutation
  const controlGameMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', `/api/admin/rounds`, data);
    },
    onSuccess: () => {
      toast({
        title: "Game round updated",
        description: "The game round has been successfully processed.",
      });
      setIsGameControlOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process game round",
        variant: "destructive",
      });
    },
  });

  // Filter users based on search query
  const filteredUsers = users.filter((user: any) => {
    if (!searchQuery) return true;
    return (
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toString().includes(searchQuery)
    );
  });

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenBalanceDialog = (user: any) => {
    setEditingUser(user);
    setNewBalance(user.balance.toString());
    setIsBalanceDialogOpen(true);
  };

  const handleUpdateBalance = () => {
    if (!editingUser) return;
    
    const balanceValue = parseFloat(newBalance);
    if (isNaN(balanceValue) || balanceValue < 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive number.",
        variant: "destructive",
      });
      return;
    }

    updateBalanceMutation.mutate({
      userId: editingUser.id,
      balance: balanceValue,
    });
  };

  const handleOpenEditUser = (user: any) => {
    setEditingUser(user);
    setIsEditUserOpen(true);
  };

  const handleUpdateStatus = (status: string) => {
    if (!editingUser) return;

    updateStatusMutation.mutate({
      userId: editingUser.id,
      status,
    });
  };

  const handleOpenGameControl = () => {
    // Get the latest round number + 1
    const latestRoundNumber = 28365; // Fallback value
    setRoundNumber(latestRoundNumber + 1);
    setIsGameControlOpen(true);
  };

  const handleSubmitGameControl = () => {
    controlGameMutation.mutate({
      roundNumber,
      result,
      resultColor,
      resultSize,
    });
  };

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-montserrat font-bold text-2xl text-dark">Admin Dashboard</h2>
        <div className="flex space-x-2">
          <Button 
            onClick={() => {
              refetchUsers();
              refetchTransactions();
            }}
            className="bg-[#3f51b5] hover:bg-[#3f51b5]/90"
          >
            <span className="material-icons text-sm mr-2">refresh</span>
            <span>Refresh</span>
          </Button>
          <Button variant="outline">
            <span className="material-icons text-sm mr-2">download</span>
            <span>Export</span>
          </Button>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="text-blue-500 mb-2 font-medium">Total Users</div>
          <div className="text-2xl font-bold">{isLoadingUsers ? "..." : users.length}</div>
          <div className="text-sm text-blue-600 mt-1">↑ 12% from last week</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <div className="text-green-500 mb-2 font-medium">Total Revenue</div>
          <div className="text-2xl font-bold">
            {isLoadingTransactions ? "..." : formatCurrency(
              transactions
                .filter((t: any) => t.type === "bet")
                .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0)
            )}
          </div>
          <div className="text-sm text-green-600 mt-1">↑ 8% from last week</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <div className="text-purple-500 mb-2 font-medium">Active Bets</div>
          <div className="text-2xl font-bold">
            {isLoadingTransactions ? "..." : 
              transactions.filter((t: any) => t.type === "bet" && 
                new Date(t.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000).length}
          </div>
          <div className="text-sm text-purple-600 mt-1">↑ 5% from yesterday</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
          <div className="text-orange-500 mb-2 font-medium">Payout Ratio</div>
          <div className="text-2xl font-bold">
            {isLoadingTransactions ? "..." : 
              Math.round((transactions
                .filter((t: any) => t.type === "win")
                .reduce((sum: number, t: any) => sum + t.amount, 0) /
                Math.abs(transactions
                  .filter((t: any) => t.type === "bet")
                  .reduce((sum: number, t: any) => sum + t.amount, 0)) || 0) * 100) + "%"}
          </div>
          <div className="text-sm text-orange-600 mt-1">↓ 2% from last week</div>
        </div>
      </div>
      
      {/* Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="border-b border-gray-200 mb-6 bg-transparent w-full flex space-x-8 overflow-x-auto">
          <TabsTrigger
            value="users"
            className="border-transparent data-[state=active]:border-[#3f51b5] data-[state=active]:text-[#3f51b5] border-b-2 pb-3 px-1 font-medium bg-transparent hover:text-gray-700"
          >
            User Management
          </TabsTrigger>
          <TabsTrigger
            value="game"
            className="border-transparent data-[state=active]:border-[#3f51b5] data-[state=active]:text-[#3f51b5] border-b-2 pb-3 px-1 font-medium bg-transparent hover:text-gray-700"
          >
            Game Control
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="border-transparent data-[state=active]:border-[#3f51b5] data-[state=active]:text-[#3f51b5] border-b-2 pb-3 px-1 font-medium bg-transparent hover:text-gray-700"
          >
            Transactions
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="border-transparent data-[state=active]:border-[#3f51b5] data-[state=active]:text-[#3f51b5] border-b-2 pb-3 px-1 font-medium bg-transparent hover:text-gray-700"
          >
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-0">
          <div className="flex justify-between mb-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="material-icons text-gray-400">search</span>
              </span>
              <Input
                type="text"
                placeholder="Search users..."
                className="pl-10 pr-4 py-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="bg-[#4caf50] hover:bg-[#4caf50]/90">
              <span className="material-icons text-sm mr-2">person_add</span>
              <span>Add User</span>
            </Button>
          </div>
          
          {isLoadingUsers ? (
            <div className="flex justify-center p-10">
              <div className="h-10 w-10 animate-spin rounded-full border-t-4 border-[#3f51b5]"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto shadow rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedUsers.map((user: any) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="material-icons text-gray-500">person</span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.username}</div>
                              <div className="text-sm text-gray-500">ID: #{user.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(user.balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${user.status === 'active' ? 'bg-green-100 text-green-800' : 
                              user.status === 'banned' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'}`}>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.joinedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button 
                              className="text-[#3f51b5] hover:text-[#3f51b5]/80" 
                              title="Edit User"
                              onClick={() => handleOpenEditUser(user)}
                            >
                              <span className="material-icons">edit</span>
                            </button>
                            <button 
                              className="text-gray-400 hover:text-gray-600" 
                              title="Adjust Balance"
                              onClick={() => handleOpenBalanceDialog(user)}
                            >
                              <span className="material-icons">payments</span>
                            </button>
                            <button 
                              className="text-[#f44336] hover:text-[#f44336]/80" 
                              title="Ban User"
                              onClick={() => {
                                setEditingUser(user);
                                handleUpdateStatus(user.status === 'banned' ? 'active' : 'banned');
                              }}
                            >
                              <span className="material-icons">
                                {user.status === 'banned' ? 'how_to_reg' : 'block'}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 mt-4 rounded-lg">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>{" "}
                        to{" "}
                        <span className="font-medium">
                          {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
                        </span>{" "}
                        of <span className="font-medium">{filteredUsers.length}</span> users
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <Button
                          variant="outline"
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          <span className="material-icons text-sm">chevron_left</span>
                        </Button>
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={i}
                              variant={pageNum === currentPage ? "default" : "outline"}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                                ${pageNum === currentPage 
                                  ? 'bg-[#3f51b5] text-white border-[#3f51b5]' 
                                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                        <Button
                          variant="outline"
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <span className="material-icons text-sm">chevron_right</span>
                        </Button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="game" className="mt-0">
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Game Control Panel</h3>
              <Button 
                className="bg-[#3f51b5] hover:bg-[#3f51b5]/90"
                onClick={handleOpenGameControl}
              >
                <span className="material-icons text-sm mr-2">gamepad</span>
                <span>Control Current Round</span>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h4 className="font-medium text-lg mb-4">Current Game Settings</h4>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Round Duration:</span>
                    <span className="font-medium">60 seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Number Payout:</span>
                    <span className="font-medium">10x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Color Payout (Green/Red):</span>
                    <span className="font-medium">2x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Color Payout (Violet):</span>
                    <span className="font-medium">3x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size Payout:</span>
                    <span className="font-medium">2x</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h4 className="font-medium text-lg mb-4">Game Statistics</h4>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Rounds Played:</span>
                    <span className="font-medium">1,248</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Bets Placed:</span>
                    <span className="font-medium">24,567</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">House Edge:</span>
                    <span className="font-medium">3.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Bet Size:</span>
                    <span className="font-medium">{formatCurrency(125.75)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total House Profit:</span>
                    <span className="font-medium">{formatCurrency(102450.25)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="transactions" className="mt-0">
          {isLoadingTransactions ? (
            <div className="flex justify-center p-10">
              <div className="h-10 w-10 animate-spin rounded-full border-t-4 border-[#3f51b5]"></div>
            </div>
          ) : (
            <div className="overflow-x-auto shadow rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.slice(0, 15).map((transaction: any) => {
                    // Find user for this transaction
                    const transactionUser = users.find((u: any) => u.id === transaction.userId);
                    
                    return (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{transaction.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {transactionUser ? transactionUser.username : transaction.userId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${transaction.type === 'win' ? 'bg-green-100 text-green-800' : 
                              transaction.type === 'bet' ? 'bg-blue-100 text-blue-800' : 
                                transaction.type === 'admin' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'}`}>
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium 
                          ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(transaction.balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatRelativeTime(transaction.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="settings" className="mt-0">
          <div className="space-y-6 max-w-3xl">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="font-medium text-lg mb-4">Game Settings</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="roundDuration">Round Duration (seconds)</Label>
                    <Input id="roundDuration" type="number" defaultValue={60} min={10} max={300} />
                  </div>
                  <div>
                    <Label htmlFor="minBet">Minimum Bet Amount</Label>
                    <Input id="minBet" type="number" defaultValue={10} min={1} max={100} />
                  </div>
                  <div>
                    <Label htmlFor="maxBet">Maximum Bet Amount</Label>
                    <Input id="maxBet" type="number" defaultValue={10000} min={100} max={100000} />
                  </div>
                  <div>
                    <Label htmlFor="numberMultiplier">Number Bet Multiplier</Label>
                    <Input id="numberMultiplier" type="number" defaultValue={10} min={2} max={20} />
                  </div>
                </div>
                <Button className="bg-[#3f51b5] hover:bg-[#3f51b5]/90 mt-2">
                  Save Settings
                </Button>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="font-medium text-lg mb-4">Site Settings</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input id="siteName" type="text" defaultValue="BetMaster" />
                </div>
                <div>
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Input id="siteDescription" type="text" defaultValue="The best betting game online" />
                </div>
                <div>
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                  <Select defaultValue="disabled">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="bg-[#3f51b5] hover:bg-[#3f51b5]/90 mt-2">
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="material-icons text-gray-500 text-2xl">person</span>
                </div>
                <div>
                  <h3 className="font-medium text-lg">{editingUser.username}</h3>
                  <p className="text-gray-500">{editingUser.email}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Account Status</Label>
                <Select 
                  defaultValue={editingUser.status}
                  onValueChange={(value) => handleUpdateStatus(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 pt-4">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="material-icons text-blue-500 text-sm">info</span>
                </div>
                <p className="text-sm text-gray-600">
                  User joined on {new Date(editingUser.joinedAt).toLocaleDateString()} with ID #{editingUser.id}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#3f51b5] hover:bg-[#3f51b5]/90"
              onClick={() => setIsEditUserOpen(false)}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Balance Dialog */}
      <Dialog open={isBalanceDialogOpen} onOpenChange={setIsBalanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust User Balance</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={editingUser.username} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentBalance">Current Balance</Label>
                <Input id="currentBalance" value={formatCurrency(editingUser.balance)} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newBalance">New Balance</Label>
                <Input 
                  id="newBalance" 
                  type="number" 
                  value={newBalance} 
                  onChange={(e) => setNewBalance(e.target.value)}
                  min="0"
                  step="1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBalanceDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#3f51b5] hover:bg-[#3f51b5]/90"
              onClick={handleUpdateBalance}
              disabled={updateBalanceMutation.isPending}
            >
              {updateBalanceMutation.isPending ? "Updating..." : "Update Balance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Game Control Dialog */}
      <Dialog open={isGameControlOpen} onOpenChange={setIsGameControlOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Control Game Round</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roundNumber">Round Number</Label>
              <Input 
                id="roundNumber" 
                type="number" 
                value={roundNumber} 
                onChange={(e) => setRoundNumber(parseInt(e.target.value))}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="result">Result Number (0-9)</Label>
              <Input 
                id="result" 
                type="number" 
                value={result} 
                onChange={(e) => setResult(parseInt(e.target.value))}
                min="0"
                max="9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resultColor">Result Color</Label>
              <Select 
                value={resultColor}
                onValueChange={setResultColor}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="violet">Violet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resultSize">Result Size</Label>
              <Select 
                value={resultSize}
                onValueChange={setResultSize}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (0-4)</SelectItem>
                  <SelectItem value="big">Big (5-9)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mt-4">
              <div className="flex items-start space-x-2">
                <span className="material-icons text-yellow-500">warning</span>
                <div className="text-sm text-yellow-700">
                  <p className="font-medium">Warning!</p>
                  <p>Setting a result for this round will process all bets and update user balances. This action cannot be undone.</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGameControlOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#3f51b5] hover:bg-[#3f51b5]/90"
              onClick={handleSubmitGameControl}
              disabled={controlGameMutation.isPending}
            >
              {controlGameMutation.isPending ? "Processing..." : "Set Result"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
