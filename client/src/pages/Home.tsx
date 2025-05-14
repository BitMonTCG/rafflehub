import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'wouter';
import { useTicketById } from '@/hooks/useTicket';
import { useToast } from '@/hooks/use-toast';
import HeroSection from '@/components/home/HeroSection';
import RaffleStats from '@/components/home/RaffleStats';
import ActiveRaffles from '@/components/home/ActiveRaffles';
import FeaturedCard from '@/components/home/FeaturedCard';
import HowItWorks from '@/components/home/HowItWorks';
import RecentWinners from '@/components/home/RecentWinners';
import Newsletter from '@/components/home/Newsletter';

const Home: React.FC = () => {
  const [location] = useLocation();
  const { toast } = useToast();
  
  const [ticketIdFromUrl, setTicketIdFromUrl] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const ticketIdParam = searchParams.get('ticketId');
      const id = ticketIdParam ? parseInt(ticketIdParam, 10) : null;
      if (id) {
          setTicketIdFromUrl(id);
          
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.delete('ticketId');
          window.history.replaceState({}, '', currentUrl.toString());
      }
    }
  }, []);

  const { data: ticketData, isSuccess, isError, error } = useTicketById(ticketIdFromUrl);

  useEffect(() => {
    if (!ticketIdFromUrl) return;

    if (isSuccess && ticketData) {
      let toastProps = {};
      switch (ticketData.status) {
        case 'paid':
          toastProps = {
            title: "✅ Payment Confirmed",
            description: `Your payment for ticket #${ticketData.id} was successful.`,
            variant: "default",
          };
          break;
        case 'expired':
          toastProps = {
            title: "⚠️ Payment Expired",
            description: `The payment window for ticket #${ticketData.id} expired.`,
            variant: "default",
          };
          break;
        case 'pending':
          toastProps = {
            title: "⏳ Payment Pending",
            description: `Waiting for confirmation for ticket #${ticketData.id}...`,
            variant: "default",
          };
          break;
        default:
          break;
      }
      toast(toastProps);
      
    } else if (isError) {
      toast({
        title: "❌ Error Fetching Ticket Status",
        description: error instanceof Error ? error.message : "Could not verify ticket status.",
        variant: "destructive",
      });
      
    }
  }, [isSuccess, isError, ticketData, error, toast, ticketIdFromUrl]);

  return (
    <>
      <Helmet>
        <title>BitMon - Premium Pokémon Card Raffles</title>
        <meta name="description" content="Win rare Pokémon cards for a fraction of the price with BitMon. Enter our exclusive raffles and get premium cards at 50% off retail." />
      </Helmet>
      
      <HeroSection />
      <RaffleStats />
      <ActiveRaffles />
      <FeaturedCard />
      <HowItWorks />
      <RecentWinners />
      <Newsletter />
    </>
  );
};

export default Home;
