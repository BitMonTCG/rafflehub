import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }
    
    // Simulate API call
    setIsSubmitting(true);
    
    setTimeout(() => {
      toast({
        title: 'Subscription Successful',
        description: 'Thank you for subscribing to our newsletter!',
      });
      setEmail('');
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <section className="py-12 bg-gradient-to-r from-[#3B4CCA] to-[#FF5350] text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2 
            className="text-2xl md:text-3xl font-bold font-montserrat mb-4"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Never Miss a Rare Pokémon Card Raffle
          </motion.h2>
          
          <motion.p 
            className="mb-8 opacity-90"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Sign up for our newsletter to get notified about new raffles, upcoming cards, and exclusive promotions.
          </motion.p>
          
          <motion.form 
            className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-2"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Input
              type="email"
              placeholder="Your email address"
              className="flex-1 px-4 py-3 h-12 rounded-lg text-[#212121] focus:outline-none focus:ring-2 focus:ring-[#FFDE00]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button 
              type="submit" 
              className="bg-[#FFDE00] hover:bg-yellow-400 text-[#212121] font-poppins font-bold px-6 py-3 h-12 rounded-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </motion.form>
          
          <motion.p 
            className="text-sm opacity-80 mt-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            We'll never share your email with anyone else. You can unsubscribe at any time.
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
