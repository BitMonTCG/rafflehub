import React, { useState } from 'react';
import { useRaffles } from '@/hooks/useRaffles';
import { Raffle } from '@/types';
import RaffleCard from '@/components/raffle/RaffleCard';
import { Button } from '@/components/ui/button';
import { FilterIcon, ChevronDown } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSocket } from '@/contexts/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';

const ActiveRaffles: React.FC = () => {
  const { data: apiRaffles, isLoading } = useRaffles(true);
  const { raffles: socketRaffles } = useSocket();
  const [sortBy, setSortBy] = useState<string>('latest');
  const [visibleCount, setVisibleCount] = useState<number>(8);

  // Use socket data if available, otherwise use API data
  const raffles = apiRaffles || socketRaffles.filter(r => r.isActive);

  const sortRaffles = (raffleList: Raffle[]): Raffle[] => {
    if (!raffleList) return [];
    
    switch (sortBy) {
      case 'endingSoon':
        return [...raffleList].sort((a, b) => {
          if (!a.endDate || !b.endDate) return 0;
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        });
      case 'popular':
        return [...raffleList].sort((a, b) => b.soldTickets - a.soldTickets);
      case 'highestValue':
        return [...raffleList].sort((a, b) => b.retailPrice - a.retailPrice);
      case 'latest':
      default:
        return [...raffleList].sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }
  };

  const sortedRaffles = sortRaffles(raffles || []);
  const displayedRaffles = sortedRaffles.slice(0, visibleCount);
  const hasMore = sortedRaffles.length > visibleCount;

  const loadMore = () => {
    setVisibleCount(prev => prev + 4);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <section id="active-raffles" className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold font-montserrat">Active Raffles</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-md h-96 animate-pulse">
                <div className="h-56 bg-gray-300"></div>
                <div className="p-4">
                  <div className="h-6 w-3/4 bg-gray-300 mb-4 rounded"></div>
                  <div className="h-4 w-full bg-gray-300 mb-2 rounded"></div>
                  <div className="h-4 w-full bg-gray-300 mb-4 rounded"></div>
                  <div className="h-10 w-full bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="active-raffles" className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold font-montserrat">Active Raffles</h2>
          <div className="flex space-x-2">
            <Button variant="outline" className="flex items-center space-x-2">
              <FilterIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[100px] sm:w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="endingSoon">Ending Soon</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="highestValue">Highest Value</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <AnimatePresence>
          {sortedRaffles.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">No active raffles found</h3>
              <p className="text-gray-500">Check back soon for new raffles!</p>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {displayedRaffles.map((raffle) => (
                <motion.div key={raffle.id} variants={item}>
                  <RaffleCard raffle={raffle} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        
        {hasMore && (
          <div className="mt-8 text-center">
            <Button 
              variant="outline" 
              className="px-6 py-3 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors inline-flex items-center"
              onClick={loadMore}
            >
              <span>Load More Raffles</span>
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ActiveRaffles;
