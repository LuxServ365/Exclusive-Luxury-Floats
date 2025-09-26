import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold">Exclusive</h3>
                <p className="text-gray-400 text-sm">Luxury Floats</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6 max-w-md leading-relaxed">
              Experience the ultimate luxury on Panama City's crystal-clear emerald waters. 
              From floating cabanas to LED-lit kayaks, we provide unforgettable adventures 
              on the beautiful Gulf of Mexico.
            </p>
            <div className="flex space-x-4">
              <a 
                href="tel:(850)555-GULF" 
                className="text-teal-400 hover:text-teal-300 font-semibold"
                data-testid="footer-phone"
              >
                (850) 555-GULF
              </a>
              <span className="text-gray-500">|</span>
              <a 
                href="mailto:exclusivefloat850@gmail.com" 
                className="text-teal-400 hover:text-teal-300 font-semibold"
                data-testid="footer-email"
              >
                exclusivefloat850@gmail.com
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/floats-amenities" 
                  className="text-gray-300 hover:text-teal-400 transition-colors"
                  data-testid="footer-floats-link"
                >
                  Floating Cabanas
                </Link>
              </li>
              <li>
                <Link 
                  to="/watercraft-rentals" 
                  className="text-gray-300 hover:text-teal-400 transition-colors"
                  data-testid="footer-watercraft-link"
                >
                  Crystal Kayaks
                </Link>
              </li>
              <li>
                <Link 
                  to="/bookings" 
                  className="text-gray-300 hover:text-teal-400 transition-colors"
                  data-testid="footer-bookings-link"
                >
                  Book Experience
                </Link>
              </li>
              <li>
                <Link 
                  to="/gallery" 
                  className="text-gray-300 hover:text-teal-400 transition-colors"
                  data-testid="footer-gallery-link"
                >
                  Gallery
                </Link>
              </li>
            </ul>
          </div>

          {/* Experience Panama City */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Panama City, FL</h4>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start space-x-2">
                <span className="text-teal-400 mt-1">🏖️</span>
                <span>Pristine White Sand Beaches</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-teal-400 mt-1">🌊</span>
                <span>Crystal-Clear Emerald Waters</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-teal-400 mt-1">🌅</span>
                <span>Stunning Gulf Views</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-teal-400 mt-1">✨</span>
                <span>Year-Round Perfect Weather</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2025 Exclusive. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link 
              to="/contact" 
              className="text-gray-400 hover:text-teal-400 text-sm transition-colors"
              data-testid="footer-contact-link"
            >
              Contact Us
            </Link>
            <Link 
              to="/about" 
              className="text-gray-400 hover:text-teal-400 text-sm transition-colors"
              data-testid="footer-about-link"
            >
              About Us
            </Link>
            <a 
              href="#" 
              className="text-gray-400 hover:text-teal-400 text-sm transition-colors"
              data-testid="footer-privacy-link"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;