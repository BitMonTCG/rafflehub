import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

// Charizard card image
const charizardCardImage = {
  url: 'https://assets.pokemon.com/assets/cms2/img/cards/web/SWSH4/SWSH4_EN_18.png',
  fallbackUrl: 'https://assets.pokemon.com/assets/cms2/img/cards/web/SM10/SM10_EN_1.png'
};

const HeroSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-r from-[#3B4CCA] to-[#FF5350] text-white py-12 md:py-20">
      <div className="container mx-auto px-4">
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
              Enter our exclusive raffles for just $1 per ticket and get the chance to purchase premium cards at 50% off retail price.
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
              {/* Card with shine effect */}
              <div className="h-full w-full relative overflow-hidden rounded-xl">
                <div className="w-full h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center overflow-hidden">
                  <div className="relative w-[90%] h-[90%] rounded-lg border-4 border-yellow-400 overflow-hidden shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-400 to-red-500 flex flex-col">
                      <div className="bg-yellow-400 text-black font-bold text-sm p-1 flex justify-between">
                        <span>Charizard</span>
                        <span>120 HP</span>
                      </div>
                      <div className="flex-grow flex items-center justify-center">
                        <div className="w-24 h-24 bg-orange-300 rounded-full flex items-center justify-center">
                          <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center text-3xl font-bold">🔥</div>
                        </div>
                      </div>
                      <div className="bg-gray-200 p-1 text-xs">
                        <div className="font-bold">Fire Spin</div>
                        <div>Discard 2 Energy cards attached to Charizard in order to use this attack.</div>
                        <div className="text-right font-bold">100</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent rounded-xl"></div>
                
                {/* Card shine effect */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ 
                    repeat: Infinity, 
                    repeatType: "loop", 
                    duration: 3,
                    ease: "linear"
                  }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
