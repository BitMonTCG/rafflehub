import React, { useEffect, useRef, useState } from 'react';
import { X, Check, Maximize2, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Raffle } from '@/types';
import { formatPrice, getTimeRemaining } from '@/utils/format';
import { useBuyTicket } from '@/hooks/useTicket';
import { useAuth } from '@/hooks/useAuth';
import ZoomableImage from './ZoomableImage';
import { POKEMON_CARD_BACK } from '@/utils/cardConstants';
import { SocialShare } from '@/components/ui/social-share';
import CountdownTimer from '@/components/ui/CountdownTimer';

interface CardViewModalProps {
  raffle: Raffle;
  isOpen: boolean;
  onClose: () => void;
  startInZoomMode?: boolean;
}

const CardViewModal: React.FC<CardViewModalProps> = ({ 
  raffle, 
  isOpen, 
  onClose, 
  startInZoomMode = false 
}) => {
  const { requireAuth } = useAuth();
  const buyTicket = useBuyTicket();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isZoomMode, setIsZoomMode] = useState(startInZoomMode);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Update zoom mode when prop changes
  useEffect(() => {
    if (isOpen) {
      setIsZoomMode(startInZoomMode);
      setIsFlipped(false); // Reset flip state when modal opens
    }
  }, [isOpen, startInZoomMode]);
  
  const handleBuyTicket = () => {
    requireAuth(() => {
      buyTicket.mutate(raffle.id);
    });
  };
  
  // Toggle between 3D card view and zoom view
  const toggleZoomMode = () => {
    setIsZoomMode(prev => !prev);
  };

  // Toggle card flip
  const toggleCardFlip = () => {
    setIsFlipped(prev => !prev);
  };
  
  // Get the share URL
  const getShareUrl = () => {
    return `${window.location.origin}/raffle/${raffle.id}`;
  };
  
  // 3D card effect on mouse move
  useEffect(() => {
    if (!cardRef.current || !isOpen || isZoomMode || isFlipped) return;
    
    const card = cardRef.current;
    
    const handleMouseMove = (e: MouseEvent) => {
      const { offsetWidth: width, offsetHeight: height } = card;
      const { clientX, clientY } = e;
      const { left, top } = card.getBoundingClientRect();
      
      const x = clientX - left;
      const y = clientY - top;
      
      const xRotation = 20 * ((y - height / 2) / height);
      const yRotation = -20 * ((x - width / 2) / width);
      
      card.style.transform = `
        perspective(1000px)
        rotateX(${xRotation}deg)
        rotateY(${yRotation}deg)
        scale3d(1.05, 1.05, 1.05)
      `;
    };
    
    const handleMouseOut = () => {
      card.style.transform = `
        perspective(1000px)
        rotateX(0)
        rotateY(0)
        scale3d(1, 1, 1)
      `;
    };
    
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseout', handleMouseOut);
    
    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseout', handleMouseOut);
    };
  }, [isOpen, isZoomMode, isFlipped]);
  
  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'rare':
        return 'bg-[#FF5350] text-white';
      case 'ultra rare':
        return 'bg-purple-600 text-white';
      case 'holo':
        return 'bg-blue-600 text-white';
      case 'secret rare':
        return 'bg-green-600 text-white';
      case 'ultra premium':
        return 'bg-amber-500 text-black';
      default:
        return 'bg-gray-600 text-white';
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-4xl w-full p-0 max-h-[90vh] overflow-auto">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors z-10"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-8 flex flex-col items-center justify-center bg-gray-100 relative">
            {!isZoomMode ? (
              <>
                <div
                  ref={cardRef}
                  className="relative w-72 h-96 transition-transform duration-200 perspective-1000"
                  style={{
                    transformStyle: 'preserve-3d',
                    willChange: 'transform',
                    perspective: '1000px'
                  }}
                >
                  <div
                    className="w-full h-full card-flip-container transform-style-3d"
                    style={{
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                    }}
                  >
                    {/* Front of card */}
                    <div
                      className="absolute w-full h-full backface-hidden rounded-xl shadow-xl card-flip-shadow"
                      style={{
                        backfaceVisibility: 'hidden'
                      }}
                    >
                      <img
                        src={raffle.imageUrl}
                        alt={raffle.title}
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <div 
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: 'linear-gradient(125deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 30%, rgba(255,255,255,0) 70%)',
                          transform: 'translateZ(10px)'
                        }}
                      />
                    </div>
                    {/* Back of card */}
                    <div
                      className="absolute w-full h-full backface-hidden rounded-xl shadow-xl card-flip-shadow"
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                      }}
                    >
                      <img
                        src={POKEMON_CARD_BACK}
                        alt="Pokémon Card Back"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white/80 backdrop-blur-sm"
                    onClick={toggleCardFlip}
                  >
                    <RotateCw className="h-4 w-4 mr-2" />
                    Flip Card
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white/80 backdrop-blur-sm"
                    onClick={toggleZoomMode}
                  >
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Zoom View
                  </Button>
                </div>
              </>
            ) : (
              <>
                <ZoomableImage 
                  imageUrl={isFlipped ? POKEMON_CARD_BACK : raffle.imageUrl} 
                  alt={isFlipped ? "Pokémon Card Back" : raffle.title} 
                />
                <div className="flex space-x-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white/80 backdrop-blur-sm"
                    onClick={toggleCardFlip}
                  >
                    <RotateCw className="h-4 w-4 mr-2" />
                    Flip Card
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white/80 backdrop-blur-sm"
                    onClick={toggleZoomMode}
                  >
                    Back to 3D View
                  </Button>
                </div>
              </>
            )}
          </div>
          
          <div className="p-8">
            <h3 className="text-2xl font-bold font-montserrat mb-2">{raffle.title}</h3>
            <div className="flex items-center space-x-2 mb-4">
              <Badge className={getRarityColor(raffle.rarity)}>{raffle.rarity}</Badge>
              {raffle.series && (
                <div className="text-gray-500 text-sm">{raffle.series}</div>
              )}
            </div>
            
            <p className="text-gray-600 mb-6">{raffle.description}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-gray-500 text-sm">Regular Price</p>
                <p className="text-[#212121] text-xl font-bold">{formatPrice(raffle.retailPrice)}</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-gray-500 text-sm">Winner Price</p>
                <p className="text-[#FF5350] text-xl font-bold">{formatPrice(raffle.winnerPrice)}</p>
              </div>
            </div>
            
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Tickets Sold</span>
                <span className="font-medium">{raffle.soldTickets} of {raffle.totalTickets}</span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-[#3B4CCA] h-2.5 rounded-full" 
                  style={{
                    width: `${(raffle.soldTickets / raffle.totalTickets) * 100}%`
                  }}
                ></div>
              </div>
              
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Raffle Ends</p>
                  <CountdownTimer endDate={raffle.endDate} size="lg" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Participants</p>
                  <p className="font-medium">{raffle.soldTickets}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <Button 
                className="w-full bg-[#FF5350] hover:bg-red-600 text-white font-medium py-3"
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
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-600 mb-3">Share this raffle</h4>
                <SocialShare
                  url={getShareUrl()}
                  title={`Check out this ${raffle.title} Pokemon card raffle!`}
                  description={`Win this ${raffle.rarity} card for only ${formatPrice(raffle.winnerPrice)}!`}
                  imageUrl={raffle.imageUrl}
                  size={36}
                  className="justify-center"
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CardViewModal;
