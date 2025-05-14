import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  Dice6, 
  Trophy, 
  ChevronRight 
} from 'lucide-react';

const HowItWorks: React.FC = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <section id="how-it-works" className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.h2 
          className="text-2xl md:text-3xl font-bold font-montserrat text-center mb-4"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          How BitMon Works
        </motion.h2>
        
        <motion.p 
          className="text-gray-600 text-center max-w-3xl mx-auto mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Our unique raffle system gives you the chance to win rare Pokémon cards at unbeatable prices. 
          Here's how it works in three simple steps.
        </motion.p>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div 
            className="bg-white rounded-xl p-6 shadow-md relative"
            variants={itemVariants}
          >
            <div className="w-12 h-12 bg-[#FF5350] rounded-full flex items-center justify-center text-white font-bold text-xl absolute -top-4 left-6">
              1
            </div>
            <div className="text-center pt-6">
              <div className="w-20 h-20 mx-auto mb-4">
                <ShoppingCart className="h-full w-full text-[#FF5350]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Purchase Tickets</h3>
              <p className="text-gray-600">
                Buy raffle tickets for $1 each. Each raffle has a limited number of 100 tickets available.
              </p>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-white rounded-xl p-6 shadow-md relative"
            variants={itemVariants}
          >
            <div className="w-12 h-12 bg-[#3B4CCA] rounded-full flex items-center justify-center text-white font-bold text-xl absolute -top-4 left-6">
              2
            </div>
            <div className="text-center pt-6">
              <div className="w-20 h-20 mx-auto mb-4">
                <Dice6 className="h-full w-full text-[#3B4CCA]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Random Drawing</h3>
              <p className="text-gray-600">
                When all 100 tickets are sold, our system automatically selects one random winner.
              </p>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-white rounded-xl p-6 shadow-md relative"
            variants={itemVariants}
          >
            <div className="w-12 h-12 bg-[#FFDE00] rounded-full flex items-center justify-center text-[#212121] font-bold text-xl absolute -top-4 left-6">
              3
            </div>
            <div className="text-center pt-6">
              <div className="w-20 h-20 mx-auto mb-4">
                <Trophy className="h-full w-full text-[#FFDE00]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Claim Your Prize</h3>
              <p className="text-gray-600">
                If you win, you'll have the exclusive opportunity to purchase the featured card at 50% off retail price.
              </p>
            </div>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Link href="/faq">
            <a className="inline-flex items-center text-[#3B4CCA] font-medium hover:underline">
              <span>Read our detailed FAQ</span>
              <ChevronRight className="ml-1 h-4 w-4" />
            </a>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
