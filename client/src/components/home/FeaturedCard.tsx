import React, { useState } from 'react';
import { useFeaturedRaffle } from '@/hooks/useRaffles';
import { formatPrice, getTimeRemaining } from '@/utils/format';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import CardViewModal from '@/components/raffle/CardViewModal';
import PurchaseTicketModal from '@/components/raffle/PurchaseTicketModal';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import CountdownTimer from '@/components/ui/CountdownTimer';

const FeaturedCard: React.FC = () => {
  const { data: featuredRaffle, isLoading } = useFeaturedRaffle();
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const { requireAuth } = useAuth();

  if (isLoading) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold font-montserrat text-center mb-8">Featured Card of the Week</h2>
          <div className="bg-gradient-to-r from-[#212121] to-[#3B4CCA] rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="px-8 py-12 flex items-center">
                <div className="lg:pl-8 w-full">
                  <Skeleton className="h-6 w-24 mb-4" />
                  <Skeleton className="h-10 w-3/4 mb-4" />
                  <Skeleton className="h-20 w-full mb-6" />
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                  <Skeleton className="h-8 w-full mb-2" />
                  <Skeleton className="h-3 w-full mb-6" />
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                    <Skeleton className="h-12 w-full sm:w-1/2" />
                    <Skeleton className="h-12 w-full sm:w-1/2" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center p-8 md:p-0">
                <Skeleton className="w-64 md:w-72 h-96 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!featuredRaffle) {
    return null;
  }

  const handleViewDetails = () => {
    setIsCardModalOpen(true);
  };

  const handlePurchaseTickets = () => {
    requireAuth(() => {
      setIsPurchaseModalOpen(true);
    });
  };

  const ticketsRemaining = featuredRaffle.totalTickets - featuredRaffle.soldTickets;
  const percentageSold = (featuredRaffle.soldTickets / featuredRaffle.totalTickets) * 100;
  const timeRemaining = getTimeRemaining(featuredRaffle.endDate);

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold font-montserrat text-center mb-8">Featured Card of the Week</h2>
        
        <div className="bg-gradient-to-r from-[#212121] to-[#3B4CCA] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="px-8 py-12 flex items-center">
              <div className="lg:pl-8">
                <div className="inline-block bg-[#FFDE00] text-[#212121] px-4 py-1 rounded-full text-sm font-bold mb-4">
                  {featuredRaffle.rarity}
                </div>
                
                <h3 className="text-2xl md:text-4xl font-bold font-montserrat text-white mb-4">
                  {featuredRaffle.title}
                </h3>
                
                <p className="text-gray-200 mb-6">
                  {featuredRaffle.description}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-sm rounded-lg p-4">
                    <p className="text-gray-300 text-sm">Regular Price</p>
                    <p className="text-white text-xl font-bold">{formatPrice(featuredRaffle.retailPrice)}</p>
                  </div>
                  <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-sm rounded-lg p-4">
                    <p className="text-gray-300 text-sm">Winner Price</p>
                    <p className="text-[#FFDE00] text-xl font-bold">{formatPrice(featuredRaffle.winnerPrice)}</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between text-white text-sm mb-2">
                    <span>{ticketsRemaining} tickets remaining</span>
                    <CountdownTimer endDate={featuredRaffle.endDate} size="sm" className="text-white" />
                  </div>
                  <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
                    <motion.div 
                      className="bg-[#FFDE00] h-3 rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentageSold}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <Button 
                    className="bg-[#FFDE00] hover:bg-yellow-400 text-[#212121] font-poppins font-bold px-8 py-6 flex-1 md:flex-none"
                    onClick={handlePurchaseTickets}
                    disabled={!featuredRaffle.isActive || featuredRaffle.soldTickets >= featuredRaffle.totalTickets}
                  >
                    {!featuredRaffle.isActive 
                      ? "Raffle Ended" 
                      : featuredRaffle.soldTickets >= featuredRaffle.totalTickets 
                        ? "Sold Out" 
                        : "Buy 5 Tickets - $5"}
                  </Button>
                  
                  <Button 
                    className="bg-white/10 backdrop-blur-sm border border-white/40 text-white hover:bg-white/20 transition-colors px-8 py-6 flex-1 md:flex-none"
                    onClick={handleViewDetails}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center p-8 md:p-0">
              <motion.div
                className="relative w-64 md:w-72 h-96 transform rotate-6 group"
                whileHover={{ rotate: 0, scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <img 
                  src={featuredRaffle.imageUrl} 
                  alt={featuredRaffle.title} 
                  className="w-full h-full object-cover rounded-xl shadow-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent rounded-xl"></div>
                <div className="card-shine"></div>
                
                <motion.div 
                  className="absolute -bottom-4 -right-4 bg-white rounded-full p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  whileHover={{ scale: 1.1 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {featuredRaffle && (
        <>
          <CardViewModal 
            raffle={featuredRaffle} 
            isOpen={isCardModalOpen} 
            onClose={() => setIsCardModalOpen(false)} 
          />
          
          <PurchaseTicketModal 
            raffle={featuredRaffle} 
            isOpen={isPurchaseModalOpen} 
            onClose={() => setIsPurchaseModalOpen(false)} 
          />
        </>
      )}
    </section>
  );
};

export default FeaturedCard;
