import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Users, Clock, Umbrella, Waves, Star } from 'lucide-react';

const FloatsAmenities = () => {
  const cabanaFeatures = [
    {
      icon: <Umbrella className="w-6 h-6" />,
      title: "Premium Shade Coverage",
      description: "Stay cool and comfortable with our luxury canopy system"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Up to 6 Guests",
      description: "Spacious platform perfect for families and groups"
    },
    {
      icon: <Waves className="w-6 h-6" />,
      title: "Stable Platform",
      description: "Engineered for safety and comfort on Gulf waters"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Luxury Amenities",
      description: "Premium seating, storage, and refreshment areas"
    }
  ];

  const packages = [
    {
      id: "luxury_cabana_hourly",
      name: "Hourly Experience",
      price: 35,
      duration: "per hour per person",
      description: "Perfect for a quick luxury escape on the emerald waters",
      features: ["Premium floating platform", "Plush seating", "Shade coverage", "Safety equipment", "Flexible timing"],
      popular: false
    },
    {
      id: "luxury_cabana_3hr",
      name: "Half-Day Adventure",
      price: 100,
      duration: "3 hours total",
      description: "Extended relaxation experience with plenty of time to unwind",
      features: ["3-hour exclusive use", "All hourly amenities", "Refreshment storage", "Photo opportunities", "Best value for couples"],
      popular: true
    },
    {
      id: "luxury_cabana_4hr",
      name: "Premium Group Package",
      price: 299,
      duration: "4 hours (up to 6 people)",
      description: "Ultimate luxury experience for groups and special occasions",
      features: ["4-hour exclusive access", "Maximum 6 guests", "Premium positioning", "Dedicated service", "Perfect for celebrations"],
      popular: false
    }
  ];

  return (
    <div className="main-content">
      {/* Hero Section */}
      <section 
        className="hero-section relative"
        data-testid="floats-hero"
      >
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover"
          style={{ zIndex: 1 }}
        >
          <source src="https://customer-assets.emergentagent.com/job_gulf-float-exclusive/artifacts/aazpki8o_Exclusive.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay" style={{ zIndex: 2 }}></div>
        <div className="hero-content" style={{ zIndex: 3 }}>
          <h1 className="hero-title" data-testid="floats-hero-title">
            Luxury Floating Cabanas
          </h1>
          <p className="hero-subtitle" data-testid="floats-hero-subtitle">
            Experience ultimate relaxation on our premium floating platforms with plush seating, 
            shade coverage, and breathtaking Gulf views
          </p>
          <Link to="/bookings">
            <Button 
              size="lg" 
              className="btn btn-primary text-lg px-8 py-4"
              data-testid="floats-hero-book-btn"
            >
              Book Your Cabana Experience
            </Button>
          </Link>
        </div>
      </section>

      {/* What Makes Our Cabanas Special */}
      <section className="section" data-testid="experience-details">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="section-title text-left mb-6" data-testid="details-title">
                What Makes Our Cabanas Special
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4" data-testid="detail-comfort">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Umbrella className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-teal-700">Ultimate Comfort</h3>
                    <p className="text-gray-600">
                      Plush cushioned seating with premium materials designed to withstand Gulf conditions 
                      while providing luxury hotel-level comfort. Choose to relax in our shaded areas or enjoy 
                      our sun loungers for the perfect tanning experience.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4" data-testid="detail-safety">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Waves className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-teal-700">Safety First</h3>
                    <p className="text-gray-600">
                      Our floating platforms are engineered with stability in mind, featuring safety 
                      railings, non-slip surfaces, and all required safety equipment.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4" data-testid="detail-location">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Star className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-teal-700">Prime Location</h3>
                    <p className="text-gray-600">
                      Positioned in the most beautiful spots of Panama City's emerald waters, 
                      offering stunning views and perfect photo opportunities.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="https://customer-assets.emergentagent.com/job_gulf-float-exclusive/artifacts/vdf83j58_Gemini_Generated_Image_34qasw34qasw34qa.png"
                alt="Luxury floating cabana pods with white domes on Panama City Beach Gulf waters"
                className="rounded-2xl shadow-2xl w-full h-96 object-cover"
                data-testid="details-image"
              />
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="text-lg font-bold">4.9</div>
                  <div className="text-xs">★★★★★</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sun-Bathing Loungers Section */}
      <section className="section section-alt" data-testid="loungers-section">
        <div className="container">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="section-title mb-6" data-testid="loungers-title">
              Sun-Bathing Loungers
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed" data-testid="loungers-description">
              For those seeking pure relaxation, our sun-bathing loungers offer the perfect 
              way to soak up the Florida sunshine while floating on crystal-clear waters.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="flex flex-col items-center space-y-3" data-testid="lounger-feature-1">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-amber-600 text-2xl">☀️</span>
                </div>
                <span className="text-gray-700 font-medium text-center">Premium cushioned loungers</span>
              </div>
              <div className="flex flex-col items-center space-y-3" data-testid="lounger-feature-2">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-amber-600 text-2xl">🌊</span>
                </div>
                <span className="text-gray-700 font-medium text-center">Direct water access</span>
              </div>
              <div className="flex flex-col items-center space-y-3" data-testid="lounger-feature-3">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-amber-600 text-2xl">📸</span>
                </div>
                <span className="text-gray-700 font-medium text-center">Instagram-perfect positioning</span>
              </div>
            </div>
            
            <Link to="/bookings">
              <Button 
                size="lg" 
                className="btn btn-primary"
                data-testid="loungers-book-btn"
              >
                Add Loungers to Experience
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Packages */}
      <section className="section" data-testid="pricing-packages">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title" data-testid="pricing-title">
              Choose Your Experience
            </h2>
            <p className="section-subtitle" data-testid="pricing-subtitle">
              Select the perfect floating cabana package for your Gulf adventure
            </p>
          </div>

          <div className="pricing-grid">
            {packages.map((pkg, index) => (
              <Card 
                key={pkg.id} 
                className={`pricing-card ${pkg.popular ? 'featured border-teal-500' : ''}`}
                data-testid={`package-${pkg.id}`}
              >
                {pkg.popular && (
                  <Badge className="absolute top-4 right-4 bg-teal-600" data-testid="popular-badge">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="pricing-title">{pkg.name}</CardTitle>
                  <div className="pricing-price">${pkg.price}</div>
                  <div className="pricing-duration">{pkg.duration}</div>
                  <p className="text-gray-600 mt-4">{pkg.description}</p>
                </CardHeader>
                
                <CardContent>
                  <ul className="pricing-features space-y-3 mb-6">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-3">
                        <span className="text-teal-600 mt-1">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link to="/bookings">
                    <Button 
                      className={`w-full ${pkg.popular ? 'bg-teal-600 hover:bg-teal-700' : ''}`}
                      data-testid={`book-${pkg.id}-btn`}
                    >
                      Book This Experience
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Floating Experience Features */}
      <section className="section section-alt" data-testid="cabana-features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title" data-testid="features-title">
              Premium Floating Experience
            </h2>
            <p className="section-subtitle" data-testid="features-subtitle">
              Our luxury floating cabanas are designed for comfort, safety, and unforgettable experiences
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cabanaFeatures.map((feature, index) => (
              <Card key={index} className="card text-center" data-testid={`feature-${index}`}>
                <CardHeader>
                  <div className="mx-auto mb-4 w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center text-teal-600">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section" data-testid="cta-section">
        <div className="container text-center">
          <h2 className="section-title mb-6" data-testid="cta-title">
            Ready to Float in Luxury?
          </h2>
          <p className="section-subtitle mb-8 max-w-2xl mx-auto" data-testid="cta-subtitle">
            Book your exclusive floating cabana experience today and discover why Panama City 
            is the Gulf Coast's premier luxury water destination.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/bookings">
              <Button 
                size="lg" 
                className="btn btn-primary text-lg px-8 py-4"
                data-testid="cta-book-btn"
              >
                Book Your Cabana Now
              </Button>
            </Link>
            <Link to="/gallery">
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-4"
                data-testid="cta-gallery-btn"
              >
                View More Photos
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FloatsAmenities;