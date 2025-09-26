import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const Home = () => {
  const heroImage = "https://customer-assets.emergentagent.com/job_gulf-float-exclusive/artifacts/n6hv7zg3_Gemini_Generated_Image_tftk0ktftk0ktftk.png";
  
  const features = [
    {
      icon: "🏖️",
      title: "Luxury Floating Cabanas",
      description: "Experience ultimate comfort on our premium floating platforms with plush seating and shade."
    },
    {
      icon: "☀️",
      title: "Sun Bathing Floating Loungers",
      description: "Relax in ultimate comfort on our premium floating loungers with direct access to crystal waters."
    },
    {
      icon: "🛟",
      title: "Fun Floats",
      description: "Enjoy exciting floating adventures with our variety of fun floats perfect for groups and families."
    },
    {
      icon: "🌊",
      title: "Crystal-Clear Kayaks",
      description: "Paddle through emerald waters in our transparent kayaks with magical LED lighting for night adventures."
    },
    {
      icon: "🚣",
      title: "Crystal Clear Canoes",
      description: "Explore the Gulf waters in our transparent canoes offering unique underwater views and stable paddling."
    },
    {
      icon: "🏄",
      title: "Crystal Clear Paddle Boards",
      description: "Stand-up paddle boarding with a twist - see through the crystal clear boards to the emerald waters below."
    }
  ];

  return (
    <div className="main-content">
      {/* Hero Section */}
      <section 
        className="hero-section"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        data-testid="hero-section"
      >
        <div className="hero-content">
          <h1 className="hero-title" data-testid="hero-title">
            Luxury Floating Cabanas
          </h1>
          <p className="hero-subtitle" data-testid="hero-subtitle">
            Escape to luxury on Panama City Beach's crystal-clear emerald waters. 
            Experience our exclusive floating pods with premium amenities and breathtaking Gulf views.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/bookings">
              <Button 
                size="lg" 
                className="btn btn-primary text-lg px-8 py-4"
                data-testid="hero-book-experience-btn"
              >
                Book Your Experience Now
              </Button>
            </Link>
            <Link to="/gallery">
              <Button 
                variant="outline" 
                size="lg" 
                className="btn btn-secondary text-lg px-8 py-4"
                data-testid="hero-view-gallery-btn"
              >
                View Gallery
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section" data-testid="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title" data-testid="features-title">
              Discover Your Perfect Gulf Adventure
            </h2>
            <p className="section-subtitle" data-testid="features-subtitle">
              From luxury floating cabanas to crystal-clear kayaks with LED lights, 
              we offer the most exclusive and memorable experiences on the Gulf Coast.
            </p>
          </div>

          <div className="feature-grid">
            {features.map((feature, index) => (
              <Card key={index} className="card text-center" data-testid={`feature-${index}`}>
                <CardHeader>
                  <div className="feature-icon mx-auto mb-4">
                    <span className="text-4xl">{feature.icon}</span>
                  </div>
                  <CardTitle className="feature-title">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="feature-text">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="section section-alt" data-testid="services-preview-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title" data-testid="services-title">
              Exclusive Gulf Experiences
            </h2>
            <p className="section-subtitle" data-testid="services-subtitle">
              Choose from our carefully curated collection of luxury water activities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Floating Cabanas */}
            <Card className="card overflow-hidden group cursor-pointer" data-testid="cabanas-preview-card">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src="https://customer-assets.emergentagent.com/job_gulf-float-exclusive/artifacts/vdf83j58_Gemini_Generated_Image_34qasw34qasw34qa.png"
                  alt="Luxury Floating Cabanas with dome structures on Panama City Beach Gulf waters"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold mb-1">Floating Cabanas</h3>
                  <p className="text-sm opacity-90">Starting at $50/hour per person</p>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">
                  Relax in luxury on our premium floating platforms featuring plush seating, 
                  shade coverage, and private space for up to 6 guests.
                </p>
                <Link to="/floats-amenities">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    data-testid="view-cabanas-btn"
                  >
                    Explore Cabanas
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Crystal Kayaks */}
            <Card className="card overflow-hidden group cursor-pointer" data-testid="kayaks-preview-card">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1597799119438-cbf326f268b9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwyfHxjbGVhciUyMGtheWFrfGVufDB8fHx8MTc1ODgzNzM1MHww&ixlib=rb-4.1.0&q=85"
                  alt="Crystal Clear Kayaks"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold mb-1">Crystal Kayaks</h3>
                  <p className="text-sm opacity-90">Starting at $60/hour</p>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">
                  Paddle through emerald waters in our transparent kayaks with built-in LED lights 
                  for magical nighttime adventures.
                </p>
                <Link to="/watercraft-rentals">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    data-testid="view-kayaks-btn"
                  >
                    Explore Watercraft
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Panama City Highlight */}
      <section className="section" data-testid="panama-city-section">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="section-title text-left mb-6" data-testid="panama-city-title">
                Panama City, Florida
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed" data-testid="panama-city-description">
                Discover the magic of Panama City, Florida, where pristine white sand beaches meet 
                the most beautiful emerald waters in the Gulf of Mexico. Our location offers the 
                perfect backdrop for luxury water adventures.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3" data-testid="panama-feature-1">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-teal-600">🏖️</span>
                  </div>
                  <span className="text-gray-700 font-medium">Pristine White Sand Beaches</span>
                </div>
                <div className="flex items-center space-x-3" data-testid="panama-feature-2">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-teal-600">💎</span>
                  </div>
                  <span className="text-gray-700 font-medium">Crystal-Clear Emerald Waters</span>
                </div>
                <div className="flex items-center space-x-3" data-testid="panama-feature-3">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-teal-600">🌅</span>
                  </div>
                  <span className="text-gray-700 font-medium">Stunning Gulf Views</span>
                </div>
                <div className="flex items-center space-x-3" data-testid="panama-feature-4">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-teal-600">☀️</span>
                  </div>
                  <span className="text-gray-700 font-medium">Year-Round Perfect Weather</span>
                </div>
              </div>
              
              <Link to="/bookings">
                <Button 
                  size="lg" 
                  className="btn btn-primary"
                  data-testid="panama-book-btn"
                >
                  Experience Our Gulf
                </Button>
              </Link>
            </div>
            
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1531933166154-63dbb479f8d3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwyfHxQYW5hbWElMjBDaXR5JTIwQmVhY2h8ZW58MHx8fHwxNzU4ODM5MTk5fDA&ixlib=rb-4.1.0&q=85"
                alt="Panama City Beach white sand beaches and crystal clear Gulf waters"
                className="rounded-2xl shadow-2xl w-full h-96 object-cover"
                data-testid="panama-city-image"
              />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="text-2xl font-bold">#1</div>
                  <div className="text-xs">Gulf Coast</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section section-alt" data-testid="cta-section">
        <div className="container text-center">
          <h2 className="section-title mb-6" data-testid="cta-title">
            Ready for Your Exclusive Gulf Adventure?
          </h2>
          <p className="section-subtitle mb-8 max-w-2xl mx-auto" data-testid="cta-subtitle">
            Book your luxury floating experience today and create unforgettable memories 
            on Panama City's pristine emerald waters.
          </p>
          <Link to="/bookings">
            <Button 
              size="lg" 
              className="btn btn-primary text-xl px-12 py-6"
              data-testid="cta-book-now-btn"
            >
              Book Your Experience Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;