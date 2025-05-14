import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Stats } from '@/types';
import { formatNumber, formatPrice } from '@/utils/format';
import { motion } from 'framer-motion';
import { useSocket } from '@/contexts/SocketContext';

const RaffleStats: React.FC = () => {
  const { data: statsData, isLoading } = useQuery<Stats>({
    queryKey: ['/api/stats'],
  });
  
  const { raffles, winners } = useSocket();
  const [activeRaffles, setActiveRaffles] = useState(0);
  const [ticketsSold, setTicketsSold] = useState(0);
  const [winnersThisMonth, setWinnersThisMonth] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);

  useEffect(() => {
    if (statsData) {
      setActiveRaffles(statsData.activeRaffles);
      setTicketsSold(statsData.totalTicketsSold);
      setWinnersThisMonth(statsData.winnersThisMonth);
      setTotalSavings(statsData.totalSavings);
    } else if (raffles.length > 0) {
      // Fallback to socket data if API data isn't available
      const active = raffles.filter(raffle => raffle.isActive).length;
      const sold = raffles.reduce((acc, raffle) => acc + raffle.soldTickets, 0);
      
      setActiveRaffles(active);
      setTicketsSold(sold);
    }
  }, [statsData, raffles, winners]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section className="bg-white py-8 border-b">
      <div className="container mx-auto px-4">
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div className="text-center p-4" variants={itemVariants}>
            <p className="text-3xl md:text-4xl font-bold font-poppins text-[#FF5350] mb-2">
              {isLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                formatNumber(activeRaffles)
              )}
            </p>
            <p className="text-gray-600">Active Raffles</p>
          </motion.div>
          
          <motion.div className="text-center p-4" variants={itemVariants}>
            <p className="text-3xl md:text-4xl font-bold font-poppins text-[#3B4CCA] mb-2">
              {isLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                formatNumber(ticketsSold)
              )}
            </p>
            <p className="text-gray-600">Tickets Sold</p>
          </motion.div>
          
          <motion.div className="text-center p-4" variants={itemVariants}>
            <p className="text-3xl md:text-4xl font-bold font-poppins text-[#FFDE00] mb-2">
              {isLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                formatNumber(winnersThisMonth)
              )}
            </p>
            <p className="text-gray-600">Winners This Month</p>
          </motion.div>
          
          <motion.div className="text-center p-4" variants={itemVariants}>
            <p className="text-3xl md:text-4xl font-bold font-poppins text-green-500 mb-2">
              {isLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                formatPrice(totalSavings)
              )}
            </p>
            <p className="text-gray-600">Total Savings</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default RaffleStats;
