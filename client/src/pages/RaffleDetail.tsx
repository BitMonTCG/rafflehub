import React, { useState, useEffect, useRef } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useRaffle } from '@/hooks/useRaffles';
import { Helmet } from 'react-helmet';
import { formatPrice, getTimeRemaining } from '@/utils/format';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, Users, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import PurchaseTicketModal from '@/components/raffle/PurchaseTicketModal';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { useWinnerByRaffle, useWinnersByUser } from '@/hooks/useWinners';
import WinnerCelebration from '@/components/raffle/WinnerCelebration';
import CountdownTimer from '@/components/ui/CountdownTimer';

const RaffleDetail: React.FC = () => {
  const [, params] = useRoute('/raffle/:id');
  const raffleId = params?.id ? parseInt(params.id) : undefined;
  const { data: raffle, isLoading } = useRaffle(raffleId);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);
  const { requireAuth, user, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const { data: winnerData } = useWinnerByRaffle(raffleId);
  const { data: userWins } = useWinnersByUser(user?.id);
  const [showCelebration, setShowCelebration] = useState(false);

  // Check if current user is the winner of this raffle
  const isCurrentUserWinner = userWins?.some(win => win.raffleId === raffleId);

  useEffect(() => {
    // Show celebration if user is the winner and raffle is complete
    if (isCurrentUserWinner && raffle && !raffle.isActive) {
      const hasSeenCelebration = localStorage.getItem(`celebration-seen-${raffleId}`);
      if (!hasSeenCelebration) {
        setShowCelebration(true);
      }
    }
  }, [isCurrentUserWinner, raffle, raffleId]);

  const handleCloseCelebration = () => {
    setShowCelebration(false);
    // Remember that user has seen this celebration
    localStorage.setItem(`celebration-seen-${raffleId}`, 'true');
  };

  useEffect(() => {
    if (raffle?.endDate) {
      setTimeRemaining(getTimeRemaining(raffle.endDate));
      
      // Update time remaining every minute
      const interval = setInterval(() => {
        setTimeRemaining(getTimeRemaining(raffle.endDate));
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [raffle?.endDate]);

  useEffect(() => {
    const setupCardEffect = () => {
      if (!cardRef.current) return;
      
      const card = cardRef.current;
      
      const handleMouseMove = (e: MouseEvent) => {
        const { offsetWidth: width, offsetHeight: height } = card;
        const { clientX, clientY } = e;
        const { left, top } = card.getBoundingClientRect();
        
        const x = clientX - left;
        const y = clientY - top;
        
        const xRotation = 25 * ((y - height / 2) / height);
        const yRotation = -25 * ((x - width / 2) / width);
        
        card.style.transform = `
          perspective(1000px)
          rotateX(${xRotation}deg)
          rotateY(${yRotation}deg)
          scale3d(1.1, 1.1, 1.1)
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
      card.addEventListener('mouseleave', handleMouseOut);
      
      return () => {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseleave', handleMouseOut);
      };
    };
    
    setupCardEffect();
  }, [cardRef.current]);

  const handlePurchaseTickets = () => {
    requireAuth(() => {
      setIsPurchaseModalOpen(true);
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex justify-center items-center">
            <Skeleton className="w-80 h-[450px] rounded-xl" />
          </div>
          <div>
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/4 mb-6" />
            <Skeleton className="h-24 w-full mb-6" />
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-3 w-full mb-6" />
            
            <Skeleton className="h-40 w-full mb-6" />
            
            <div className="flex space-x-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Raffle Not Found</h1>
        <p className="mb-6">The raffle you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link href="/raffles">Back to Raffles</Link>
        </Button>
      </div>
    );
  }

  const percentageSold = (raffle.soldTickets / raffle.totalTickets) * 100;
  const ticketsRemaining = raffle.totalTickets - raffle.soldTickets;

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
    <>
      <Helmet>
        <title>{raffle.title} | BitMon</title>
        <meta name="description" content={raffle.description} />
      </Helmet>
      
      {/* Winner Celebration */}
      <WinnerCelebration 
        isVisible={showCelebration}
        message={`Congratulations! You won the ${raffle.title} raffle!`}
        onClose={handleCloseCelebration}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button asChild variant="ghost" className="flex items-center gap-1">
            <Link href="/raffles">
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Raffles</span>
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 3D Card View */}
          <div className="flex justify-center items-center">
            <div
              ref={cardRef}
              className="relative w-80 h-[450px] transition-transform duration-300"
              style={{
                transformStyle: 'preserve-3d',
                willChange: 'transform'
              }}
            >
              <img
                src={raffle.imageUrl}
                alt={raffle.title}
                className="w-full h-full object-cover rounded-xl shadow-2xl"
              />
              <div 
                className="absolute inset-0 rounded-xl"
                style={{
                  background: 'linear-gradient(125deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 30%, rgba(255,255,255,0) 70%)',
                  transform: 'translateZ(20px)'
                }}
              />
              
              {/* Badge overlay */}
              <div 
                className="absolute top-4 right-4"
                style={{ transform: 'translateZ(30px)' }}
              >
                <Badge className={getRarityColor(raffle.rarity)}>
                  {raffle.rarity}
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Raffle Details */}
          <div>
            <h1 className="text-3xl font-bold font-montserrat mb-2">{raffle.title}</h1>
            {raffle.series && (
              <p className="text-gray-500 mb-6">{raffle.series}</p>
            )}
            
            <p className="text-gray-700 mb-6">{raffle.description}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-500 text-sm">Regular Price</p>
                <p className="text-[#212121] text-xl font-bold">{formatPrice(raffle.retailPrice)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-500 text-sm">Winner Price</p>
                <p className="text-[#FF5350] text-xl font-bold">{formatPrice(raffle.winnerPrice)}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span>Tickets Sold</span>
                <span className="font-medium">{raffle.soldTickets}/{raffle.totalTickets}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <motion.div
                  className="bg-[#3B4CCA] h-2.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentageSold}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              
              <div className="flex justify-between mt-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <CountdownTimer endDate={raffle.endDate} size="sm" />
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-3.5 w-3.5" />
                  <span>{raffle.soldTickets} participants</span>
                </div>
              </div>
            </div>
            
            <Tabs defaultValue="details" className="mb-6">
              <TabsList>
                <TabsTrigger value="details">Card Details</TabsTrigger>
                <TabsTrigger value="rules">Raffle Rules</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="pt-4">
                <ul className="text-gray-600 space-y-2">
                  {raffle.cardDetails.map((detail, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="text-[#3B4CCA] mr-2 h-5 w-5 shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>
              <TabsContent value="rules" className="pt-4">
                <ul className="text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <Check className="text-[#3B4CCA] mr-2 h-5 w-5 shrink-0" />
                    <span>Each ticket costs $1</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="text-[#3B4CCA] mr-2 h-5 w-5 shrink-0" />
                    <span>A total of {raffle.totalTickets} tickets are available</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="text-[#3B4CCA] mr-2 h-5 w-5 shrink-0" />
                    <span>Winner will be selected randomly once all tickets are sold</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="text-[#3B4CCA] mr-2 h-5 w-5 shrink-0" />
                    <span>Winner gets to purchase the card at 50% off retail price</span>
                  </li>
                </ul>
              </TabsContent>
            </Tabs>
            
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <Button
                className="bg-[#FF5350] hover:bg-red-600 text-white font-poppins font-bold py-6 flex-1"
                onClick={handlePurchaseTickets}
                disabled={!raffle.isActive || raffle.soldTickets >= raffle.totalTickets}
              >
                {!raffle.isActive 
                  ? "Raffle Ended" 
                  : raffle.soldTickets >= raffle.totalTickets 
                    ? "Sold Out" 
                    : "Buy Ticket - $1"}
              </Button>
              <Button
                className="bg-[#FFDE00] hover:bg-yellow-500 text-[#212121] font-poppins font-bold py-6 flex-1"
                onClick={handlePurchaseTickets}
                disabled={!raffle.isActive || raffle.soldTickets >= raffle.totalTickets}
              >
                {!raffle.isActive 
                  ? "Raffle Ended" 
                  : raffle.soldTickets >= raffle.totalTickets 
                    ? "Sold Out" 
                    : "Buy 5 Tickets - $5"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Purchase Modal */}
      {raffle && (
        <PurchaseTicketModal
          raffle={raffle}
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
        />
      )}
    </>
  );
};

export default RaffleDetail;
