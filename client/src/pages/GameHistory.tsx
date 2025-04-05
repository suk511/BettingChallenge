import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBgColorClass, formatCurrency } from "@/lib/utils";

const GameHistory = () => {
  const [dateRange, setDateRange] = useState("all");
  const [betType, setBetType] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [filteredBets, setFilteredBets] = useState<any[]>([]);
  
  // Fetch user bets
  const { data: bets, isLoading } = useQuery({
    queryKey: ['/api/bets/user'],
  });

  // Apply filters when data or filter values change
  useEffect(() => {
    if (!bets) return;

    let filtered = [...bets];

    // Apply date filter
    if (dateRange !== "all") {
      const now = new Date();
      let startDate: Date;
      
      switch (dateRange) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "yesterday":
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        default:
          startDate = new Date(0); // Beginning of time
      }
      
      filtered = filtered.filter(bet => new Date(bet.createdAt) >= startDate);
    }

    // Apply bet type filter
    if (betType !== "all") {
      filtered = filtered.filter(bet => bet.betType === betType);
    }

    // Apply status filter
    if (status !== "all") {
      filtered = filtered.filter(bet => bet.status === status);
    }

    setFilteredBets(filtered);
    setPage(1); // Reset to first page when filters change
  }, [bets, dateRange, betType, status]);

  // Calculate pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredBets.length / itemsPerPage);
  const paginatedBets = filteredBets.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="font-montserrat font-bold text-2xl text-[#212121] mb-6">Betting History</h2>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-grow md:flex-grow-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <select 
            className="rounded-lg border-gray-300 shadow-sm focus:border-[#3f51b5] focus:ring-[#3f51b5] py-2 px-3 bg-white border w-full"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
          </select>
        </div>
        <div className="flex-grow md:flex-grow-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">Bet Type</label>
          <select 
            className="rounded-lg border-gray-300 shadow-sm focus:border-[#3f51b5] focus:ring-[#3f51b5] py-2 px-3 bg-white border w-full"
            value={betType}
            onChange={(e) => setBetType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="number">Numbers</option>
            <option value="color">Colors</option>
            <option value="size">Sizes</option>
          </select>
        </div>
        <div className="flex-grow md:flex-grow-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select 
            className="rounded-lg border-gray-300 shadow-sm focus:border-[#3f51b5] focus:ring-[#3f51b5] py-2 px-3 bg-white border w-full"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-10">
          <div className="h-10 w-10 animate-spin rounded-full border-t-4 border-[#3f51b5]"></div>
        </div>
      ) : filteredBets.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No betting history found with the selected filters.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Round</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selection</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bet Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payout</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedBets.map((bet) => {
                  // Format date
                  const betDate = new Date(bet.createdAt);
                  const formattedDate = betDate.toLocaleDateString();
                  const formattedTime = betDate.toLocaleTimeString();
                  
                  // Determine bet display values
                  let displayColor = '';
                  let displayValue = '';
                  
                  if (bet.betType === 'number') {
                    displayColor = bet.betValue % 2 === 0 ? 'green' : 'red';
                    if (bet.betValue === '0') displayColor = 'green';
                    if (bet.betValue === '5') displayColor = 'violet';
                    displayValue = `Number ${bet.betValue}`;
                  } else if (bet.betType === 'color') {
                    displayColor = bet.betValue;
                    displayValue = bet.betValue.charAt(0).toUpperCase() + bet.betValue.slice(1);
                  } else if (bet.betType === 'size') {
                    displayColor = bet.betValue === 'big' ? 'blue-600' : 'orange-500';
                    displayValue = `${bet.betValue.charAt(0).toUpperCase() + bet.betValue.slice(1)} (${bet.betValue === 'big' ? '5-9' : '0-4'})`;
                  }
                  
                  // Status styling
                  let statusClass = '';
                  switch (bet.status) {
                    case 'won':
                      statusClass = 'bg-green-100 text-green-800';
                      break;
                    case 'lost': 
                      statusClass = 'bg-red-100 text-red-800';
                      break;
                    default:
                      statusClass = 'bg-blue-100 text-blue-800';
                  }
                  
                  return (
                    <tr key={bet.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{bet.roundId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formattedDate} {formattedTime}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center">
                          <span className={`w-6 h-6 rounded-full ${getBgColorClass(displayColor)} flex items-center justify-center text-white font-bold text-sm mr-2`}>
                            {bet.betType === 'number' ? bet.betValue : ''}
                          </span>
                          {displayValue}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(bet.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bet.status !== 'pending' && (
                          <span className="inline-flex items-center">
                            <span className={`w-6 h-6 rounded-full ${bet.status === 'won' ? getBgColorClass(displayColor) : 'bg-gray-300'} flex items-center justify-center text-white font-bold text-sm mr-2`}>
                              {bet.status === 'won' ? (bet.betType === 'number' ? bet.betValue : '') : ''}
                            </span>
                          </span>
                        )}
                        {bet.status === 'pending' && '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={bet.status === 'won' ? 'text-[#4caf50]' : bet.status === 'lost' ? 'text-[#f44336]' : 'text-gray-500'}>
                          {bet.status === 'pending' ? '-' : bet.status === 'won' ? formatCurrency(bet.payout || 0) : formatCurrency(-bet.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                          {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * itemsPerPage + 1}</span> to <span className="font-medium">
                  {Math.min(page * itemsPerPage, filteredBets.length)}
                </span> of <span className="font-medium">{filteredBets.length}</span> results
              </div>
              <div className="flex space-x-1">
                <button 
                  className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  <span className="material-icons text-sm">navigate_before</span>
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  // Display current page and 2 pages on either side
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <button 
                      key={i}
                      className={`px-3 py-1 rounded border ${
                        pageNum === page 
                          ? 'border-[#3f51b5] bg-[#3f51b5] text-white' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button 
                  className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  <span className="material-icons text-sm">navigate_next</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GameHistory;
