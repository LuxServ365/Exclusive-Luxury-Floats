import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Users, Clock, Zap, Shield, Star, Moon } from 'lucide-react';

const WatercraftRentals = () => {
  const watercraftFeatures = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "LED Light System",
      description: "Built-in LED lights for magical nighttime adventures"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Crystal Clear Design",
      description: "Transparent kayaks and watercraft for underwater viewing"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Various Capacities",
      description: "From solo adventures to family group experiences"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Premium Equipment",
      description: "Top-quality watercraft with all safety gear included"
    }
  ];

  const watercraft = [
    {
      id: "crystal_kayak",
      name: "Crystal-Clear Kayak Rental",
      price: 60,
      duration: "per hour (2 person capacity)",
      image: "https://images.unsplash.com/photo-1597799119438-cbf326f268b9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwyfHxjbGVhciUyMGtheWFrfGVufDB8fHx8MTc1ODgzNzM1MHww&ixlib=rb-4.1.0&q=85",
      description: "Experience the Gulf like never before in our transparent kayaks with LED lighting",
      features: ["Crystal-clear transparent hull", "Built-in LED lighting system", "2-person capacity", "Paddles included", "Life jackets provided", "Perfect for night tours"],
      popular: true,
      category: "Adventure"
    },
    {
      id: "canoe",
      name: "Canoe Rental",
      price: 75,
      duration: "per hour (2+ people)",
      image: "https://images.unsplash.com/photo-1657373725182-6bb195badcbc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwxfHxuaWdodCUyMGtheWFraW5nfGVufDB8fHx8MTc1ODgzNzM4NHww&ixlib=rb-4.1.0&q=85",
      description: "Stable and comfortable canoes perfect for families and beginners",
      features: ["Stable family-friendly design", "2+ person capacity", "Perfect for beginners", "All paddles included", "Safety equipment provided", "Great for wildlife viewing"],
      popular: false,
      category: "Family"
    },
    {
      id: "paddle_board",
      name: "Paddle Board Rental",
      price: 75,
      duration: "per hour (individual)",
      image: "https://images.unsplash.com/photo-1625872508255-13cb821b9417?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwzfHxuaWdodCUyMGtheWFraW5nfGVufDB8fHx8MTc1ODgzNzM4NHww&ixlib=rb-4.1.0&q=85",
      description: "Stand-up paddle boards for fitness enthusiasts and adventure seekers",
      features: ["Premium SUP boards", "Individual experience", "Adjustable paddle included", "Safety leash provided", "Perfect for fitness", "Yoga-friendly platform"],
      popular: false,
      category: "Fitness"
    }
  ];

  return (
    <div className="main-content">
      {/* Hero Section */}
      <section 
        className="hero-section"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(https://images.unsplash.com/photo-1622581768977-9bb782bfabb5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwzfHxQYW5hbWElMjBDaXR5JTIwQmVhY2glMjBrYXlha2luZ3xlbnwwfHx8fDE3NTg4Mzg5OTZ8MA&ixlib=rb-4.1.0&q=85)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        data-testid="watercraft-hero"
      >
        <div className="hero-content">
          <h1 className="hero-title" data-testid="watercraft-hero-title">
            Crystal-Clear Watercraft Rentals
          </h1>
          <p className="hero-subtitle" data-testid="watercraft-hero-subtitle">
            Paddle through emerald waters in our transparent kayaks, canoes, and paddle boards 
            with magical LED lighting for unforgettable adventures
          </p>
          <Link to="/bookings">
            <Button 
              size="lg" 
              className="btn btn-primary text-lg px-8 py-4"
              data-testid="watercraft-hero-book-btn"
            >
              Rent Your Watercraft
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="section" data-testid="watercraft-features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title" data-testid="features-title">
              Premium Watercraft Features
            </h2>
            <p className="section-subtitle" data-testid="features-subtitle">
              Our crystal-clear watercraft offer unique features that set us apart from ordinary rentals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {watercraftFeatures.map((feature, index) => (
              <Card key={index} className="card text-center" data-testid={`watercraft-feature-${index}`}>
                <CardHeader>
                  <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
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

      {/* Watercraft Selection */}
      <section className="section section-alt" data-testid="watercraft-selection">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title" data-testid="selection-title">
              Choose Your Adventure
            </h2>
            <p className="section-subtitle" data-testid="selection-subtitle">
              Select from our premium collection of crystal-clear watercraft
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {watercraft.map((craft, index) => (
              <Card 
                key={craft.id} 
                className={`card overflow-hidden ${craft.popular ? 'ring-2 ring-blue-500' : ''}`}
                data-testid={`watercraft-${craft.id}`}
              >
                {craft.popular && (
                  <Badge className="absolute top-4 left-4 bg-blue-600 z-10" data-testid="popular-badge">
                    Most Popular
                  </Badge>
                )}
                
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={craft.image}
                    alt={craft.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-white/90 text-gray-700">
                      {craft.category}
                    </Badge>
                  </div>
                </div>
                
                <CardHeader>
                  <CardTitle className="text-xl text-blue-700">{craft.name}</CardTitle>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-blue-600">${craft.price}</span>
                    <span className="text-gray-600">{craft.duration}</span>
                  </div>
                  <p className="text-gray-600">{craft.description}</p>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {craft.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-3 text-sm">
                        <span className="text-blue-600 mt-1">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link to="/bookings">
                    <Button 
                      className={`w-full ${craft.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      data-testid={`book-${craft.id}-btn`}
                    >
                      Rent This Watercraft
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* LED Night Adventures */}
      <section className="section" data-testid="night-adventures">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="section-title text-left mb-6" data-testid="night-title">
                Magical LED Night Adventures
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed" data-testid="night-description">
                Experience the Gulf like never before with our LED-equipped crystal kayaks. 
                Watch as your transparent vessel glows beneath the stars, creating magical 
                paths on the water and a completely new way to see the emerald coast.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-4" data-testid="night-feature-1">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Moon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-purple-700">Starlight Paddling</h3>
                    <p className="text-gray-600">Paddle under the stars with our illuminated watercraft</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4" data-testid="night-feature-2">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-purple-700">Glowing Paths</h3>
                    <p className="text-gray-600">Create luminous trails as you glide through the water</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4" data-testid="night-feature-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-purple-700">Unforgettable Memories</h3>
                    <p className="text-gray-600">Capture Instagram-worthy moments in a magical setting</p>
                  </div>
                </div>
              </div>
              
              <Link to="/bookings">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  data-testid="night-adventures-book-btn"
                >
                  Book Night Adventure
                </Button>
              </Link>
            </div>
            
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1741274236526-62166e39bcc4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxrYXlhayUyMExFRCUyMGxpZ2h0c3xlbnwwfHx8fDE3NTg4MzczNDN8MA&ixlib=rb-4.1.0&q=85"
                alt="Night water adventures with LED lights"
                className="rounded-2xl shadow-2xl w-full h-96 object-cover"
                data-testid="night-adventures-image"
              />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-purple-400 to-blue-600 rounded-2xl flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="text-xl font-bold">LED</div>
                  <div className="text-xs">Lighting</div>
                  <div className="text-xs">System</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Equipment */}
      <section className="section section-alt" data-testid="safety-equipment">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title" data-testid="safety-title">
              Safety & Equipment
            </h2>
            <p className="section-subtitle" data-testid="safety-subtitle">
              Your safety is our priority. All rentals include premium safety equipment and instruction
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="card text-center" data-testid="safety-equipment-card">
              <CardHeader>
                <Shield className="w-16 h-16 mx-auto mb-4 text-green-600" />
                <CardTitle>Safety First</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-left space-y-2 text-gray-600">
                  <li>• Coast Guard approved life jackets</li>
                  <li>• Safety whistles and signaling devices</li>
                  <li>• Emergency contact information</li>
                  <li>• Weather monitoring and guidance</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card text-center" data-testid="equipment-included-card">
              <CardHeader>
                <Star className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                <CardTitle>Equipment Included</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-left space-y-2 text-gray-600">
                  <li>• Premium paddles for all watercraft</li>
                  <li>• Waterproof storage containers</li>
                  <li>• Comfort seat cushions</li>
                  <li>• LED lighting systems (kayaks)</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card text-center" data-testid="instruction-support-card">
              <CardHeader>
                <Users className="w-16 h-16 mx-auto mb-4 text-teal-600" />
                <CardTitle>Expert Support</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-left space-y-2 text-gray-600">
                  <li>• Pre-rental safety briefing</li>
                  <li>• Basic paddling instruction</li>
                  <li>• Route recommendations</li>
                  <li>• 24/7 emergency support</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section" data-testid="cta-section">
        <div className="container text-center">
          <h2 className="section-title mb-6" data-testid="cta-title">
            Ready for Your Crystal Adventure?
          </h2>
          <p className="section-subtitle mb-8 max-w-2xl mx-auto" data-testid="cta-subtitle">
            Book your crystal-clear watercraft rental today and discover the magic of 
            Panama City's emerald waters like never before.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/bookings">
              <Button 
                size="lg" 
                className="btn btn-primary text-lg px-8 py-4"
                data-testid="cta-book-btn"
              >
                Book Your Watercraft Now
              </Button>
            </Link>
            <Link to="/gallery">
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-4"
                data-testid="cta-gallery-btn"
              >
                See More Adventures
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WatercraftRentals;