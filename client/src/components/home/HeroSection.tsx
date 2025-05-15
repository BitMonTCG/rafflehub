import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeaturedRaffle } from '@/hooks/useRaffles';
import { formatPrice, getTimeRemaining } from '@/utils/format';
import PurchaseTicketModal from '@/components/raffle/PurchaseTicketModal';
import CardViewModal from '@/components/raffle/CardViewModal';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CountdownTimer from '@/components/ui/CountdownTimer';

const HeroSection: React.FC = () => {
  const { data: featuredRaffle, isLoading } = useFeaturedRaffle();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const { requireAuth } = useAuth();
  
  // For demo purposes, create an array of featured raffles including the main featured one
  // In production, you would fetch multiple featured raffles from the API
  const featuredCards = featuredRaffle ? [featuredRaffle] : [];
  
  // Auto-advance the slideshow every 6 seconds
  useEffect(() => {
    if (featuredCards.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredCards.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [featuredCards.length]);
  
  const handleNextSlide = () => {
    if (featuredCards.length <= 1) return;
    setCurrentSlide((prev) => (prev + 1) % featuredCards.length);
  };
  
  const handlePrevSlide = () => {
    if (featuredCards.length <= 1) return;
    setCurrentSlide((prev) => (prev - 1 + featuredCards.length) % featuredCards.length);
  };
  
  const handleViewDetails = () => {
    setIsCardModalOpen(true);
  };

  const handlePurchaseTickets = () => {
    requireAuth(() => {
      setIsPurchaseModalOpen(true);
    });
  };
  
  return (
    <section className="bg-gradient-to-r from-[#3B4CCA] to-[#FF5350] text-white py-12 md:py-20 relative overflow-hidden">
      <div className="container mx-auto px-4">
        {isLoading ? (
          // Loading state
          <div className="flex flex-col md:flex-row items-center">  
            <div className="md:w-1/2 mb-8 md:mb-0 animate-pulse">
              <div className="h-10 bg-white/20 rounded mb-4 w-3/4"></div>
              <div className="h-6 bg-white/20 rounded mb-2 w-full"></div>
              <div className="h-6 bg-white/20 rounded mb-6 w-4/5"></div>
              <div className="flex space-x-4">
                <div className="h-12 bg-white/20 rounded w-1/2"></div>
                <div className="h-12 bg-white/20 rounded w-1/2"></div>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center md:justify-end">
              <div className="w-64 h-96 bg-white/20 rounded-xl animate-pulse"></div>
            </div>
          </div>
        ) : featuredCards.length > 0 ? (
          // Featured card slideshow
          <div className="relative">
            {/* Slideshow navigation arrows */}
            {featuredCards.length > 1 && (
              <>
                <button 
                  onClick={handlePrevSlide}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/10 p-2 rounded-full backdrop-blur-sm hover:bg-white/20 transition"
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </button>
                <button 
                  onClick={handleNextSlide}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/10 p-2 rounded-full backdrop-blur-sm hover:bg-white/20 transition"
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </button>
              </>
            )}
            
            {/* Slideshow indicators */}
            {featuredCards.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
                {featuredCards.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full ${index === currentSlide ? 'bg-white' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            )}
            
            {/* Slides */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col md:flex-row items-center"
              >
                <div className="md:w-1/2 mb-8 md:mb-0">
                  {/* Card of the week label */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-block bg-[#FFDE00] text-[#212121] px-4 py-1 rounded-full text-sm font-bold mb-4"
                  >
                    Card of the Week
                  </motion.div>
                  
                  {/* Featured card title */}
                  <motion.h1 
                    className="text-3xl md:text-5xl font-bold font-montserrat leading-tight mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    {featuredCards[currentSlide].title}
                  </motion.h1>
                  
                  {/* Description and rarity */}
                  <motion.div 
                    className="flex items-center space-x-2 mb-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Badge className="bg-white/20 text-white">
                      {featuredCards[currentSlide].rarity}
                    </Badge>
                    {featuredCards[currentSlide].psaGrade && (
                      <Badge className="bg-red-600 text-white">
                        PSA {featuredCards[currentSlide].psaGrade}
                      </Badge>
                    )}
                  </motion.div>
                  
                  <motion.p 
                    className="text-base md:text-lg mb-6 opacity-90"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    {featuredCards[currentSlide].description}
                  </motion.p>
                  
                  {/* Pricing info */}
                  <motion.div 
                    className="grid grid-cols-2 gap-4 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <p className="text-gray-300 text-sm">Regular Price</p>
                      <p className="text-white text-xl font-bold">{formatPrice(featuredCards[currentSlide].retailPrice)}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <p className="text-gray-300 text-sm">Winner Price</p>
                      <p className="text-[#FFDE00] text-xl font-bold">{formatPrice(featuredCards[currentSlide].winnerPrice)}</p>
                    </div>
                  </motion.div>
                  
                  {/* Progress bar */}
                  <motion.div 
                    className="mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <div className="flex justify-between text-white text-sm mb-2">
                      <span>{featuredCards[currentSlide].totalTickets - featuredCards[currentSlide].soldTickets} tickets remaining</span>
                      <CountdownTimer endDate={featuredCards[currentSlide].endDate} size="sm" className="text-white" />
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2.5">
                      <motion.div 
                        className="bg-[#FFDE00] h-2.5 rounded-full" 
                        initial={{ width: 0 }}
                        animate={{ width: `${(featuredCards[currentSlide].soldTickets / featuredCards[currentSlide].totalTickets) * 100}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </motion.div>
                  
                  {/* Action buttons */}
                  <motion.div 
                    className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <Button 
                      className="bg-[#FFDE00] hover:bg-yellow-400 text-[#212121] font-bold px-8 py-6 rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
                      onClick={handlePurchaseTickets}
                      disabled={!featuredCards[currentSlide].isActive || featuredCards[currentSlide].soldTickets >= featuredCards[currentSlide].totalTickets}
                    >
                      {!featuredCards[currentSlide].isActive 
                        ? "Raffle Ended" 
                        : featuredCards[currentSlide].soldTickets >= featuredCards[currentSlide].totalTickets 
                          ? "Sold Out" 
                          : "Buy Tickets"}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30 transition px-8 py-6 rounded-lg"
                      onClick={handleViewDetails}
                    >
                      View Details
                    </Button>
                  </motion.div>
                </div>
                
                {/* Card Display */}
                <div className="md:w-1/2 flex justify-center md:justify-end">
                  <motion.div
                    className="relative w-64 md:w-72 h-96 transform rotate-6 group cursor-pointer"
                    whileHover={{ rotate: 0, scale: 1.05 }}
                    onClick={handleViewDetails}
                    initial={{ opacity: 0, x: 20, rotate: -5 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0, 
                      rotate: 6,
                      transition: { 
                        type: "spring",
                        stiffness: 100,
                        damping: 15
                      }
                    }}
                  >
                    <img 
                      src={featuredCards[currentSlide].imageUrl} 
                      alt={featuredCards[currentSlide].title} 
                      className="w-full h-full object-cover rounded-xl shadow-2xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent rounded-xl"></div>
                    
                    {/* Card shine effect */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent rounded-xl"
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ 
                        repeat: Infinity, 
                        repeatType: "loop", 
                        duration: 3,
                        ease: "linear"
                      }}
                    />
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          // Fallback if no featured card is available
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <motion.h1 
                className="text-3xl md:text-5xl font-bold font-montserrat leading-tight mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Win Rare Pokémon Cards for a Fraction of the Price
              </motion.h1>
              <motion.p 
                className="text-lg md:text-xl mb-6 opacity-90"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Enter our exclusive raffles and get the chance to purchase premium cards at 40% off retail price.
              </motion.p>
              <motion.div 
                className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Button asChild className="bg-[#FFDE00] hover:bg-yellow-400 text-[#212121] font-bold px-8 py-6 rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
                  <Link href="#active-raffles">Browse Raffles</Link>
                </Button>
                <Button asChild variant="outline" className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30 transition px-8 py-6 rounded-lg">
                  <Link href="#how-it-works">How It Works</Link>
                </Button>
              </motion.div>
            </div>
            <div className="md:w-1/2 flex justify-center md:justify-end">
              <motion.div 
                className="w-64 h-96 relative transform rotate-3 drop-shadow-2xl"
                initial={{ opacity: 0, x: 20, rotate: -5 }}
                animate={{ 
                  opacity: 1, 
                  x: 0, 
                  rotate: 3,
                  transition: { 
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }
                }}
              >
                {/* Generic card shape */}
                <div className="h-full w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-red-600"></div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
      
      {/* Modals */}
      {featuredCards.length > 0 && (
        <>
          <CardViewModal 
            raffle={featuredCards[currentSlide]} 
            isOpen={isCardModalOpen} 
            onClose={() => setIsCardModalOpen(false)} 
          />
          
          <PurchaseTicketModal 
            raffle={featuredCards[currentSlide]} 
            isOpen={isPurchaseModalOpen} 
            onClose={() => setIsPurchaseModalOpen(false)} 
          />
        </>
      )}
    </section>
  );
};

export default HeroSection;
