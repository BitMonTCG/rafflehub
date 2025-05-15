import React from 'react';
import { Link } from 'wouter';
import { Facebook, Twitter, Instagram, MessageCircle, Phone, Mail, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#212121] text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-[#FF5350] rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white h-6 w-6">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v8" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <span className="text-2xl font-bold font-montserrat">BitMonTCG</span>
            </div>
            
            <p className="text-gray-400 mb-6">
              The premium destination for Pokémon card collectors to win rare cards at unbeatable prices.
            </p>
            
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <a className="text-gray-400 hover:text-white transition-colors">Home</a>
                </Link>
              </li>
              <li>
                <Link href="/raffles">
                  <a className="text-gray-400 hover:text-white transition-colors">Active Raffles</a>
                </Link>
              </li>
              <li>
                <Link href="/winners">
                  <a className="text-gray-400 hover:text-white transition-colors">Winners</a>
                </Link>
              </li>
              <li>
                <Link href="/how-it-works">
                  <a className="text-gray-400 hover:text-white transition-colors">How It Works</a>
                </Link>
              </li>
              <li>
                <Link href="/faq">
                  <a className="text-gray-400 hover:text-white transition-colors">FAQ</a>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h3 className="text-lg font-bold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact">
                  <a className="text-gray-400 hover:text-white transition-colors">Contact Us</a>
                </Link>
              </li>
              <li>
                <Link href="/help">
                  <a className="text-gray-400 hover:text-white transition-colors">Help Center</a>
                </Link>
              </li>
              <li>
                <Link href="/shipping">
                  <a className="text-gray-400 hover:text-white transition-colors">Shipping Info</a>
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service">
                  <a className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy">
                  <a className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-start space-x-3">
                <Mail className="text-gray-400 h-5 w-5 mt-1" />
                <span className="text-gray-400">BitMonTCG@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} BitMonTCG. All rights reserved. Pokémon and its trademarks are property of Nintendo.
          </p>
          
          <div className="flex space-x-4">
            <Link href="/terms-of-service">
              <a className="text-gray-500 hover:text-white text-sm transition-colors">Terms</a>
            </Link>
            <Link href="/privacy-policy">
              <a className="text-gray-500 hover:text-white text-sm transition-colors">Privacy</a>
            </Link>
            <Link href="/cookies">
              <a className="text-gray-500 hover:text-white text-sm transition-colors">Cookies</a>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
