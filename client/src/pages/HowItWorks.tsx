import React from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Dice6, Trophy, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';

const HowItWorks: React.FC = () => {
  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>How It Works | BitMon</title>
        <meta name="description" content="Learn how BitMon works - our unique raffle system for winning rare Pokémon cards at 50% off retail prices." />
      </Helmet>
      
      <div className="max-w-3xl mx-auto mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">How BitMon Works</h1>
        <p className="text-gray-600 text-center mb-8">
          Our unique raffle system gives collectors the opportunity to win rare and valuable Pokémon cards at unbeatable prices. Here's how it works.
        </p>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item}>
            <Card className="h-full">
              <CardContent className="pt-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-[#FF5350] rounded-full flex items-center justify-center text-white mb-4">
                    <ShoppingCart className="h-8 w-8" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-center mb-2">1. Purchase Tickets</h2>
                <p className="text-gray-600 text-center">
                  Buy raffle tickets for $1 each. Each raffle has a maximum of 100 tickets available for purchase.
                </p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={item}>
            <Card className="h-full">
              <CardContent className="pt-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-[#3B4CCA] rounded-full flex items-center justify-center text-white mb-4">
                    <Dice6 className="h-8 w-8" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-center mb-2">2. Random Drawing</h2>
                <p className="text-gray-600 text-center">
                  When all 100 tickets are sold, our secure algorithm automatically selects one random winner from all participants.
                </p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={item}>
            <Card className="h-full">
              <CardContent className="pt-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-[#FFDE00] rounded-full flex items-center justify-center text-[#212121] mb-4">
                    <Trophy className="h-8 w-8" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-center mb-2">3. Claim Your Prize</h2>
                <p className="text-gray-600 text-center">
                  If you win, you'll have the exclusive opportunity to purchase the featured Pokémon card at 50% off the retail price.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
        
        <div className="bg-gray-50 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-4">The BitMon Advantage</h2>
          <ul className="space-y-3">
            <li className="flex items-center">
              <div className="bg-[#FF5350] rounded-full p-1 mr-3">
                <ChevronRight className="h-4 w-4 text-white" />
              </div>
              <span><strong>Fair Chance</strong>: Every participant has an equal opportunity to win.</span>
            </li>
            <li className="flex items-center">
              <div className="bg-[#FF5350] rounded-full p-1 mr-3">
                <ChevronRight className="h-4 w-4 text-white" />
              </div>
              <span><strong>Affordable Entry</strong>: Tickets cost just $1 each, making participation accessible.</span>
            </li>
            <li className="flex items-center">
              <div className="bg-[#FF5350] rounded-full p-1 mr-3">
                <ChevronRight className="h-4 w-4 text-white" />
              </div>
              <span><strong>Premium Cards</strong>: We feature only authentic, high-quality Pokémon cards.</span>
            </li>
            <li className="flex items-center">
              <div className="bg-[#FF5350] rounded-full p-1 mr-3">
                <ChevronRight className="h-4 w-4 text-white" />
              </div>
              <span><strong>Significant Savings</strong>: Winners save 50% off retail prices on valuable cards.</span>
            </li>
            <li className="flex items-center">
              <div className="bg-[#FF5350] rounded-full p-1 mr-3">
                <ChevronRight className="h-4 w-4 text-white" />
              </div>
              <span><strong>Transparent Process</strong>: Winner selection is automated and verifiable.</span>
            </li>
          </ul>
        </div>
        
        <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="mb-8">
          <AccordionItem value="item-1">
            <AccordionTrigger>How are winners selected?</AccordionTrigger>
            <AccordionContent>
              Winners are selected using a secure random number generator that chooses from the purchased ticket numbers. The selection process is automated and occurs immediately when all 100 tickets are sold.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2">
            <AccordionTrigger>What happens if I win?</AccordionTrigger>
            <AccordionContent>
              If you win, you'll receive an immediate notification via email and within your account dashboard. You'll then have 7 days to claim your prize by purchasing the card at the discounted price (50% of retail).
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-3">
            <AccordionTrigger>Can I buy multiple tickets?</AccordionTrigger>
            <AccordionContent>
              Yes! You can purchase as many tickets as you'd like until all 100 tickets are sold. Each ticket increases your chance of winning.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-4">
            <AccordionTrigger>What if all tickets don't sell?</AccordionTrigger>
            <AccordionContent>
              Raffles remain open until all tickets are sold. If a raffle has been open for an extended period, we may occasionally end it early and select a winner from the existing pool of participants.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-5">
            <AccordionTrigger>How do you verify card authenticity?</AccordionTrigger>
            <AccordionContent>
              All cards are sourced from reputable dealers and verified for authenticity before being offered. Many of our cards are already PSA or Beckett graded for additional assurance.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-6">
            <AccordionTrigger>What if I don't claim my prize?</AccordionTrigger>
            <AccordionContent>
              If you don't claim your prize within 7 days, we may select another winner or offer the card in a future raffle. We recommend setting up notifications to ensure you don't miss out if you win!
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <div className="text-center">
          <Button asChild className="bg-[#FF5350] hover:bg-red-600 text-white px-8 py-6">
            <Link href="/raffles">Browse Active Raffles</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
