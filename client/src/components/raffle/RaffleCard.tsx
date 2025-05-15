import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Users, Maximize2, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Raffle } from '@/types';
import { formatPrice, getTimeRemaining } from '@/utils/format';
import { motion } from 'framer-motion';
import { useBuyTicket } from '@/hooks/useTicket';
import { useAuth } from '@/hooks/useAuth';
import CardViewModal from './CardViewModal';
import { toast } from '@/hooks/use-toast';
import CountdownTimer from '@/components/ui/CountdownTimer';
import { POKEMON_CARD_BACK } from '@/utils/cardConstants';
import { SocialShare } from '@/components/ui/social-share';

interface RaffleCardProps {
  raffle: Raffle;
}

const RaffleCard: React.FC<RaffleCardProps> = ({ raffle }) => {
  const [location, navigate] = useLocation();
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [startInZoomMode, setStartInZoomMode] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(raffle.endDate));
  const [isFlipped, setIsFlipped] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { isAuthenticated, requireAuth } = useAuth();
  const buyTicket = useBuyTicket();

  // Update time remaining every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(raffle.endDate));
    }, 60000);
    
    return () => clearInterval(interval);
  }, [raffle.endDate]);

  const handleBuyTicket = () => {
    requireAuth(() => {
      if (raffle.soldTickets >= raffle.totalTickets) {
        toast({
          title: "Sold Out",
          description: "This raffle is already sold out.",
          variant: "destructive"
        });
        return;
      }
      
      buyTicket.mutate(raffle.id);
    });
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStartInZoomMode(false);
    setIsCardModalOpen(true);
  };

  const handleZoomView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStartInZoomMode(true);
    setIsCardModalOpen(true);
  };

  const handleFlipCard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  const handleModalClose = () => {
    setIsCardModalOpen(false);
    setStartInZoomMode(false);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'rare':
        return 'bg-[#FF5350]';
      case 'ultra rare':
        return 'bg-purple-600';
      case 'holo':
        return 'bg-blue-600';
      case 'reverse holo':
        return 'bg-blue-400';
      case 'secret rare':
        return 'bg-green-600';
      case 'ultra premium':
        return 'bg-amber-500';
      case 'illustration rare':
        return 'bg-indigo-500';
      case 'special illustration rare':
        return 'bg-pink-500';
      case 'rainbow rare':
        return 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500';
      case 'hyper rare':
        return 'bg-gradient-to-r from-yellow-500 to-red-500';
      case 'full art':
        return 'bg-teal-500';
      case 'common':
        return 'bg-gray-400';
      case 'uncommon':
        return 'bg-emerald-400';
      default:
        return 'bg-gray-600';
    }
  };

  // Get the current URL for sharing
  const getShareUrl = () => {
    return `${window.location.origin}/raffle/${raffle.id}`;
  };

  return (
    <>
      <motion.div
        whileHover={{ translateY: -8, scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 h-full">
          <div className="relative group">
            <div 
              className="aspect-w-3 aspect-h-4 bg-gray-200 perspective-1000"
              style={{ perspective: '1000px' }}
            >
              <div 
                className={`relative w-full h-full card-flip-container transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
                style={{ 
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
              >
                {/* Front of card */}
                <div 
                  className="absolute w-full h-full backface-hidden card-flip-shadow"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <img 
                    src={imageError ? 'https://via.placeholder.com/500x700?text=Pokemon+Card' : raffle.imageUrl} 
                    alt={raffle.title} 
                    className="object-cover w-full h-full"
                    onError={() => setImageError(true)}
                  />
                  
                  {/* PSA Grading Badge */}
                  {raffle.psaGrade && (
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-md border border-gray-200">
                      <div className="flex items-center">
                        <span className="text-xs font-bold text-gray-800">PSA</span>
                        <span className="ml-1 text-sm font-bold text-red-600">{raffle.psaGrade}</span>
                      </div>
                    </div>
                  )}
                </div>
                {/* Back of card */}
                <div 
                  className="absolute w-full h-full backface-hidden card-flip-shadow"
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <img 
                    src={raffle.backImageUrl || POKEMON_CARD_BACK} 
                    alt="Pokémon Card Back" 
                    className="object-cover w-full h-full"
                    onError={() => setImageError(true)}
                  />
                </div>
              </div>
            </div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Badge variant="outline" className="bg-white/90 backdrop-blur-sm text-black">
                {raffle.title}
              </Badge>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="bg-white/90 backdrop-blur-sm text-black border-0"
                  onClick={handleFlipCard}
                  title="Flip card"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="bg-white/90 backdrop-blur-sm text-black border-0"
                  onClick={handleZoomView}
                  title="Zoom view"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  size="sm" 
                  className="bg-[#FFDE00] hover:bg-yellow-500 text-[#212121] font-bold"
                  onClick={handleQuickView}
                >
                  Quick View
                </Button>
              </div>
            </div>
            <Badge className={`absolute top-3 right-3 ${getRarityColor(raffle.rarity)}`}>
              {raffle.rarity}
            </Badge>
          </div>
          
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-bold">{raffle.title}</h3>
              <div className="flex flex-col items-end">
                <span className="text-gray-500 text-sm line-through">
                  {formatPrice(raffle.retailPrice)}
                </span>
                <span className="text-[#FF5350] font-poppins font-bold">
                  {formatPrice(raffle.winnerPrice)}
                </span>
                {raffle.psaCertNumber && (
                  <span className="text-xs text-gray-500 mt-1">
                    Cert #{raffle.psaCertNumber}
                  </span>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Tickets Sold</span>
                <span className="font-medium">{raffle.soldTickets}/{raffle.totalTickets}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#3B4CCA] h-2 rounded-full" 
                  style={{
                    width: `${(raffle.soldTickets / raffle.totalTickets) * 100}%`,
                    transition: 'width 0.5s ease-in-out'
                  }}
                ></div>
              </div>
            </div>
            
            <div className="flex justify-between mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <CountdownTimer endDate={raffle.endDate} size="sm" />
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Users className="h-3.5 w-3.5" />
                <span>{raffle.soldTickets} participants</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button 
                className="w-full bg-[#FF5350] hover:bg-red-600 font-poppins font-bold py-3"
                onClick={handleBuyTicket}
                disabled={buyTicket.isPending || raffle.soldTickets >= raffle.totalTickets || !raffle.isActive}
              >
                {buyTicket.isPending
                  ? "Processing..."
                  : raffle.soldTickets >= raffle.totalTickets
                    ? "Sold Out"
                    : !raffle.isActive
                      ? "Raffle Ended"
                      : "Buy Ticket - $1"}
              </Button>
              
              <SocialShare
                url={getShareUrl()}
                title={`Check out this ${raffle.title} Pokemon card raffle!`}
                description={`Win this ${raffle.rarity} card for only ${formatPrice(raffle.winnerPrice)}!`}
                imageUrl={raffle.imageUrl}
                size={24}
                compact={true}
                className="justify-center"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <CardViewModal
        raffle={raffle}
        isOpen={isCardModalOpen}
        onClose={handleModalClose}
        startInZoomMode={startInZoomMode}
      />
    </>
  );
};

export default RaffleCard;
