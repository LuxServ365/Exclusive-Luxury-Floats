import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState(null);

  const galleryImages = [
    {
      id: 1,
      url: "https://images.unsplash.com/photo-1571927688370-68ba84685dec?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwxfHxlbWVyYWxkJTIwd2F0ZXJzfGVufDB8fHx8MTc1ODgzNzMxMnww&ixlib=rb-4.1.0&q=85",
      title: "Emerald Waters Paradise",
      category: "Waters"
    },
    {
      id: 2,
      url: "https://images.unsplash.com/photo-1705039379347-8ec747e29749?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwyfHxmbG9hdGluZyUyMGNhYmFuYXxlbnwwfHx8fDE3NTg4MzczMDZ8MA&ixlib=rb-4.1.0&q=85",
      title: "Luxury Floating Platform",
      category: "Floating Cabanas"
    },
    {
      id: 3,
      url: "https://images.unsplash.com/photo-1597799119438-cbf326f268b9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwyfHxjbGVhciUyMGtheWFrfGVufDB8fHx8MTc1ODgzNzM1MHww&ixlib=rb-4.1.0&q=85",
      title: "Crystal Clear Kayaks",
      category: "Watercraft"
    },
    {
      id: 4,
      url: "https://images.unsplash.com/photo-1708952483586-bc3d393a5ea0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwyfHxlbWVyYWxkJTIwd2F0ZXJzfGVufDB8fHx8MTc1ODgzNzMxMnww&ixlib=rb-4.1.0&q=85",
      title: "Pristine Gulf Coast",
      category: "Waters"
    },
    {
      id: 5,
      url: "https://images.unsplash.com/photo-1708515905649-477068d77781?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwzfHxmbG9hdGluZyUyMGNhYmFuYXxlbnwwfHx8fDE3NTg4MzczMDZ8MA&ixlib=rb-4.1.0&q=85",
      title: "Floating Houses Experience",
      category: "Floating Cabanas"
    },
    {
      id: 6,
      url: "https://images.unsplash.com/photo-1741274236526-62166e39bcc4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxrYXlhayUyMExFRCUyMGxpZ2h0c3xlbnwwfHx8fDE3NTg4MzczNDN8MA&ixlib=rb-4.1.0&q=85",
      title: "Night Water Adventures",
      category: "Watercraft"
    },
    {
      id: 7,
      url: "https://images.unsplash.com/photo-1697445089382-13a6e84e5d54?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwzfHxlbWVyYWxkJTIwd2F0ZXJzfGVufDB8fHx8MTc1ODgzNzMxMnww&ixlib=rb-4.1.0&q=85",
      title: "Aerial Paradise View",
      category: "Waters"
    },
    {
      id: 8,
      url: "https://images.unsplash.com/photo-1625872508255-13cb821b9417?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwzfHxuaWdodCUyMGtheWFraW5nfGVufDB8fHx8MTc1ODgzNzM4NHww&ixlib=rb-4.1.0&q=85",
      title: "Magical Lake Experience",
      category: "Watercraft"
    }
  ];

  const categories = ["All", "Waters", "Floating Cabanas", "Watercraft"];
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredImages = selectedCategory === "All" 
    ? galleryImages 
    : galleryImages.filter(img => img.category === selectedCategory);

  return (
    <div className="main-content">
      {/* Hero Section */}
      <section 
        className="hero-section min-h-[60vh]"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${galleryImages[0].url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        data-testid="gallery-hero"
      >
        <div className="hero-content">
          <h1 className="hero-title" data-testid="gallery-hero-title">
            Experience Gallery
          </h1>
          <p className="hero-subtitle" data-testid="gallery-hero-subtitle">
            Discover the beauty and luxury of our Gulf Float experiences through stunning visuals
          </p>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="section" data-testid="gallery-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title" data-testid="gallery-title">
              Luxury Gulf Adventures
            </h2>
            <p className="section-subtitle" data-testid="gallery-subtitle">
              From crystal-clear emerald waters to luxury floating cabanas, 
              see what makes Panama City the perfect destination for premium water experiences
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-8" data-testid="category-filter">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-teal-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-teal-300 hover:bg-teal-50'
                }`}
                data-testid={`category-${category.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className="gallery-grid" data-testid="gallery-grid">
            {filteredImages.map((image, index) => (
              <Card 
                key={image.id} 
                className="gallery-item overflow-hidden cursor-pointer group"
                onClick={() => setSelectedImage(image)}
                data-testid={`gallery-item-${image.id}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.title}
                    className="gallery-image w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="gallery-overlay absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="text-center text-white">
                      <h3 className="text-xl font-bold mb-2">{image.title}</h3>
                      <p className="text-sm opacity-90">{image.category}</p>
                      <div className="mt-4 text-xs bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                        Click to view
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredImages.length === 0 && (
            <div className="text-center py-12" data-testid="no-images">
              <p className="text-gray-500">No images found for this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Experience Section */}
      <section className="section section-alt" data-testid="featured-experience">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="section-title text-left mb-6">
                Capture Your Own Memories
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Every moment with Exclusive Gulf Float is picture-perfect. From the 
                crystal-clear emerald waters to our luxury floating cabanas, you'll 
                create memories that last a lifetime.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-teal-600">📸</span>
                  </div>
                  <span className="text-gray-700 font-medium">Instagram-worthy moments guaranteed</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-teal-600">🌅</span>
                  </div>
                  <span className="text-gray-700 font-medium">Stunning sunset and sunrise experiences</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-teal-600">✨</span>
                  </div>
                  <span className="text-gray-700 font-medium">LED-lit nighttime adventures</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-teal-600">🏆</span>
                  </div>
                  <span className="text-gray-700 font-medium">Award-winning Gulf Coast location</span>
                </div>
              </div>
              
              <button 
                onClick={() => window.open('/bookings', '_blank')}
                className="btn btn-primary"
                data-testid="book-experience-btn"
              >
                Book Your Photo-Perfect Experience
              </button>
            </div>
            
            <div className="relative">
              <img 
                src="https://images.pexels.com/photos/34021479/pexels-photo-34021479.jpeg"
                alt="Premium floating experience"
                className="rounded-2xl shadow-2xl w-full h-96 object-cover"
              />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="text-xl font-bold">100+</div>
                  <div className="text-xs">Happy Guests</div>
                  <div className="text-xs">Daily</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
          data-testid="lightbox-modal"
        >
          <div className="max-w-4xl max-h-full relative">
            <img
              src={selectedImage.url}
              alt={selectedImage.title}
              className="max-w-full max-h-full object-contain rounded-lg"
              data-testid="lightbox-image"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
              <h3 className="text-white text-2xl font-bold mb-2" data-testid="lightbox-title">
                {selectedImage.title}
              </h3>
              <p className="text-white/80" data-testid="lightbox-category">
                {selectedImage.category}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
              className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 transition-colors"
              data-testid="close-lightbox-btn"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;