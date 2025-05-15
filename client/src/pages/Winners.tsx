import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useWinners } from '@/hooks/useWinners';
import { useRaffles } from '@/hooks/useRaffles';
import { formatPrice, getRelativeTimeString } from '@/utils/format';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Confetti } from '@/components/ui/confetti';
import { useAuth } from '@/hooks/useAuth';

const Winners: React.FC = () => {
  const { data: winners, isLoading: isLoadingWinners } = useWinners();
  const { data: raffles, isLoading: isLoadingRaffles } = useRaffles(false);
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const { user } = useAuth();
  const [showConfetti, setShowConfetti] = useState(false);
  const [hoveredWinnerCard, setHoveredWinnerCard] = useState<number | null>(null);
  
  // Filter winners by time period
  const filteredWinners = winners?.filter(winner => {
    if (timeFilter === 'all') return true;
    
    const announcedDate = new Date(winner.announcedAt);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - announcedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (timeFilter) {
      case 'week':
        return daysDiff <= 7;
      case 'month':
        return daysDiff <= 30;
      case 'year':
        return daysDiff <= 365;
      default:
        return true;
    }
  });
  
  // Find raffle details for a winner
  const getRaffleDetails = (raffleId: number) => {
    return raffles?.find(raffle => raffle.id === raffleId);
  };
  
  // Show confetti on page load
  useEffect(() => {
    if (!isLoadingWinners && !isLoadingRaffles && winners && winners.length > 0) {
      setShowConfetti(true);
      
      // Hide confetti after 5 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isLoadingWinners, isLoadingRaffles, winners]);
  
  // Animation variants
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
  
  if (isLoadingWinners || isLoadingRaffles) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Helmet>
          <title>Recent Winners | BitMon</title>
        </Helmet>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">Recent Winners</h1>
          <p className="text-gray-500 text-center">Congratulations to all our lucky winners!</p>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-48 bg-gray-200"></div>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Skeleton className="w-12 h-12 rounded-full mr-4" />
                  <div>
                    <Skeleton className="h-5 w-20 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="ml-auto">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full mb-4" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (!winners || winners.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Helmet>
          <title>Winners | BitMon</title>
        </Helmet>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">No Winners Yet</h1>
          <p className="text-gray-500 mb-8">Be the first to win a raffle by participating in our active raffles.</p>
          <div className="inline-block bg-[#FF5350] text-white px-6 py-3 rounded-lg font-medium">
            <a href="/raffles">Browse Active Raffles</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Recent Winners | BitMon</title>
        <meta name="description" content="See the recent winners of our Pokemon card raffles and their amazing prizes!" />
      </Helmet>
      
      {/* Show confetti on initial page load */}
      {showConfetti && <Confetti active={true} pieces={100} />}
      
      {/* Show mini confetti when hovering over user's own winner cards */}
      {hoveredWinnerCard === user?.id && <Confetti active={true} pieces={50} />}
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Recent Winners</h1>
        <p className="text-gray-500 text-center">Congratulations to all our lucky winners!</p>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <Tabs defaultValue="all" onValueChange={setTimeFilter}>
          <TabsList>
            <TabsTrigger value="all">All Time</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="year">This Year</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by latest" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="highValue">Highest Value</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {filteredWinners?.length === 0 ? (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-500">No winners found for the selected time period.</p>
          </div>
        ) : (
          filteredWinners?.map(winner => {
            const raffle = getRaffleDetails(winner.raffleId);
            if (!raffle) return null;
            
            const savingsAmount = raffle.retailPrice - raffle.winnerPrice;
            const isUsersWin = user?.id === winner.userId;
            
            return (
              <motion.div 
                key={winner.id} 
                variants={item}
                onMouseEnter={() => isUsersWin && setHoveredWinnerCard(user.id)}
                onMouseLeave={() => setHoveredWinnerCard(null)}
              >
                <Card className={`overflow-hidden h-full hover:shadow-lg transition-shadow ${isUsersWin ? 'ring-2 ring-[#FFDE00]' : ''}`}>
                  <div className="relative h-48">
                    <img 
                      src={raffle.imageUrl} 
                      alt={raffle.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-bold text-xl">{raffle.title}</h3>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="bg-white/20 text-white backdrop-blur-sm">
                          {raffle.rarity}
                        </Badge>
                        <span className="text-white font-semibold">Saved {formatPrice(savingsAmount)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-[#FF5350] flex items-center justify-center text-white font-bold text-xl mr-4">
                        W
                      </div>
                      <div>
                        <h4 className="font-bold">Winner #{winner.userId}</h4>
                        <p className="text-sm text-gray-500">{getRelativeTimeString(winner.announcedAt)}</p>
                      </div>
                      <div className="ml-auto">
                        <Badge className="bg-[#FFDE00] text-[#212121]">
                          {winner.claimed ? 'Claimed' : 'Unclaimed'}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4">
                      "I'm so excited to add this {raffle.title} to my collection! Thank you BitMon for making it possible to own such an amazing card at half price!"
                    </p>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>Ticket #{winner.ticketId}</span>
                      <span>Raffle #{winner.raffleId}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
};

export default Winners;
