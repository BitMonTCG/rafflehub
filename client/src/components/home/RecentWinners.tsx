import React from 'react';
import { Link } from 'wouter';
import { ChevronRight } from 'lucide-react';
import { useWinners } from '@/hooks/useWinners';
import { getRelativeTimeString, formatPrice } from '@/utils/format';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { User, Raffle } from '@/types';

const RecentWinners: React.FC = () => {
  const { data: winners, isLoading: isLoadingWinners } = useWinners();
  
  // Get users and raffles for the winners
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  const { data: raffles } = useQuery<Raffle[]>({
    queryKey: ['/api/raffles', { active: false }],
  });
  
  const getWinnerWithDetails = (winnerId: number) => {
    const winner = winners?.find(w => w.id === winnerId);
    if (!winner) return null;
    
    const user = users?.find(u => u.id === winner.userId);
    const raffle = raffles?.find(r => r.id === winner.raffleId);
    
    return { winner, user, raffle };
  };
  
  // Take the 3 most recent winners
  const recentWinners = winners?.slice(0, 3);
  
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
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };
  
  // Loading state
  if (isLoadingWinners) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold font-montserrat">Recent Winners</h2>
            <Link href="/winners">
              <a className="text-[#3B4CCA] font-medium hover:underline flex items-center">
                <span>View All Winners</span>
                <ChevronRight className="ml-1 h-4 w-4" />
              </a>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-xl overflow-hidden shadow-md p-6">
                <div className="flex items-center mb-4">
                  <Skeleton className="w-12 h-12 rounded-full mr-4" />
                  <div>
                    <Skeleton className="h-5 w-20 mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="ml-auto">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
                
                <Skeleton className="h-16 w-full mb-4" />
                
                <div className="flex items-center">
                  <Skeleton className="w-16 h-24 rounded-md mr-3" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  
  // No winners yet
  if (!winners || winners.length === 0) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold font-montserrat mb-8">Recent Winners</h2>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No winners yet! Be the first to win a raffle.</p>
            <Link href="/raffles">
              <a className="text-[#3B4CCA] font-medium hover:underline">Check out our active raffles</a>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold font-montserrat">Recent Winners</h2>
          <Link href="/winners">
            <a className="text-[#3B4CCA] font-medium hover:underline flex items-center">
              <span>View All Winners</span>
              <ChevronRight className="ml-1 h-4 w-4" />
            </a>
          </Link>
        </div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {recentWinners?.map((winner) => {
            const winnerDetails = getWinnerWithDetails(winner.id);
            if (!winnerDetails) return null;
            
            const { user, raffle } = winnerDetails;
            const savingsAmount = raffle ? raffle.retailPrice - raffle.winnerPrice : 0;
            
            return (
              <motion.div 
                key={winner.id} 
                className="bg-gray-50 rounded-xl overflow-hidden shadow-md group hover:shadow-lg transition-shadow"
                variants={itemVariants}
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#FF5350] flex items-center justify-center overflow-hidden mr-4">
                      {user?.username.charAt(0).toUpperCase() || 'W'}
                    </div>
                    <div>
                      <h3 className="font-bold">{user?.username || 'Anonymous'}</h3>
                      <p className="text-sm text-gray-600">{getRelativeTimeString(winner.announcedAt)}</p>
                    </div>
                    <div className="ml-auto">
                      <div className="bg-[#FFDE00] px-3 py-1 rounded-full text-xs font-bold">
                        Winner
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4">
                    "I can't believe I won! I've been trying to get this {raffle?.title} card for my collection for months!"
                  </p>
                  
                  <div className="flex items-center">
                    <div className="w-16 h-24 bg-gray-200 rounded-md overflow-hidden mr-3 shadow">
                      {raffle && (
                        <img 
                          src={raffle.imageUrl} 
                          alt={raffle.title} 
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold">{raffle?.title || 'Pokémon Card'}</h4>
                      <p className="text-sm text-gray-600">Saved {formatPrice(savingsAmount)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default RecentWinners;
