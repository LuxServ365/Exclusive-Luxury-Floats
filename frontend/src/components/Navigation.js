import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { ShoppingCart } from 'lucide-react';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Floats & Amenities', href: '/floats-amenities' },
    { name: 'Watercraft Rentals', href: '/watercraft-rentals' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  // Check cart item count
  useEffect(() => {
    const checkCartItems = async () => {
      const cartId = localStorage.getItem('cart_id');
      if (cartId) {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cart/${cartId}`);
          if (response.ok) {
            const data = await response.json();
            const totalItems = data.items.reduce((sum, item) => sum + item.quantity, 0);
            setCartItemCount(totalItems);
          }
        } catch (error) {
          console.error('Error checking cart items:', error);
        }
      }
    };

    checkCartItems();
    
    // Check cart items periodically
    const interval = setInterval(checkCartItems, 5000);
    return () => clearInterval(interval);
  }, [location]);

  const isActive = (href) => location.pathname === href;

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-8">
          {/* Logo - Clickable to home */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity" data-testid="nav-logo">
            <img 
              src="https://customer-assets.emergentagent.com/job_gulf-float-exclusive/artifacts/90n9ndga_Gemini_Generated_Image_bw7zsebw7zsebw7z.png"
              alt="Exclusive Luxury Floats Logo"
              className="h-24 w-auto cursor-pointer"
            />
          </Link>

          {/* Desktop Navigation - Button Style */}
          <div className="hidden lg:flex items-center space-x-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive(item.href)
                    ? 'bg-teal-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-teal-100 hover:text-teal-700 hover:shadow-md'
                }`}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Cart Icon */}
            <Link
              to="/cart"
              className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                isActive('/cart')
                  ? 'bg-teal-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-teal-100 hover:text-teal-700 hover:shadow-md'
              }`}
              data-testid="nav-cart"
            >
              <ShoppingCart className="h-4 w-4 inline-block mr-2" />
              Cart
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link to="/bookings">
              <Button 
                className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-6 py-2 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                data-testid="nav-book-now-btn"
              >
                Book Now
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-md text-gray-700 hover:text-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            onClick={() => setIsOpen(!isOpen)}
            data-testid="mobile-menu-toggle"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4" data-testid="mobile-menu">
            <div className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-base font-medium transition-colors hover:text-teal-600 ${
                    isActive(item.href) ? 'text-teal-600' : 'text-gray-700'
                  }`}
                  onClick={() => setIsOpen(false)}
                  data-testid={`mobile-nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.name}
                </Link>
              ))}
              <Link to="/bookings" onClick={() => setIsOpen(false)}>
                <Button 
                  className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-6 py-3 rounded-full font-semibold w-full mt-4"
                  data-testid="mobile-nav-book-now-btn"
                >
                  Book Now
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;