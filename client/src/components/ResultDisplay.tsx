import { getBgColorClass } from '@/lib/utils';
import { FormattedResult } from '@/lib/types';

interface ResultDisplayProps {
  results: FormattedResult[];
}

const ResultDisplay = ({ results }: ResultDisplayProps) => {
  return (
    <div className="mb-8">
      <h3 className="font-semibold text-lg mb-3">Last Results</h3>
      <div className="flex space-x-3 overflow-x-auto pb-2">
        {results.map((result) => (
          <div key={result.roundNumber} className="flex-shrink-0">
            <div 
              className={`w-12 h-12 rounded-full ${getBgColorClass(result.resultColor)} flex items-center justify-center text-white font-bold text-xl shadow-sm`}
            >
              {result.formattedNumber}
            </div>
            <div className="text-xs text-center mt-1 text-gray-600">#{result.roundNumber}</div>
          </div>
        ))}
        
        {/* Show placeholders if we have fewer than 5 results */}
        {[...Array(Math.max(0, 5 - results.length))].map((_, index) => (
          <div key={`placeholder-${index}`} className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold text-xl shadow-sm">
              ?
            </div>
            <div className="text-xs text-center mt-1 text-gray-400">...</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultDisplay;
