import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState(null);

  const galleryImages = [
    {
      id: 1,
      url: "https://customer-assets.emergentagent.com/job_gulf-float-exclusive/artifacts/vdf83j58_Gemini_Generated_Image_34qasw34qasw34qa.png",
      title: "Luxury Floating Cabana Pods",
      category: "Floating Cabanas"
    },
    {
      id: 2,
      url: "https://images.unsplash.com/photo-1562678845-e8af0857435d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwxfHxQYW5hbWElMjBDaXR5JTIwQmVhY2h8ZW58MHx8fHwxNzU4ODM5MTk5fDA&ixlib=rb-4.1.0&q=85",
      title: "Panama City Beach Skyline",
      category: "Panama City Beach"
    },
    {
      id: 3,
      url: "https://images.unsplash.com/photo-1531933166154-63dbb479f8d3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwyfHxQYW5hbWElMjBDaXR5JTIwQmVhY2h8ZW58MHx8fHwxNzU4ODM5MTk5fDA&ixlib=rb-4.1.0&q=85",
      title: "White Sand Beach Paradise",
      category: "Panama City Beach"
    },
    {
      id: 4,
      url: "https://images.unsplash.com/photo-1531854703027-ccdc628b796e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwzfHxQYW5hbWElMjBDaXR5JTIwQmVhY2h8ZW58MHx8fHwxNzU4ODM5MTk5fDA&ixlib=rb-4.1.0&q=85",
      title: "Panama City Beach Sunset",
      category: "Panama City Beach"
    },
    {
      id: 5,
      url: "https://images.unsplash.com/photo-1644578843995-b2cc1acbdf33?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMHNhbmQlMjBiZWFjaCUyMEd1bGZ8ZW58MHx8fHwxNzU4ODM5MjA0fDA&ixlib=rb-4.1.0&q=85",
      title: "Gulf Coast Sunset Views",
      category: "Panama City Beach"
    },
    {
      id: 6,
      url: "https://images.unsplash.com/photo-1529707003676-f799c1097a72?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwyfHx3aGl0ZSUyMHNhbmQlMjBiZWFjaCUyMEd1bGZ8ZW58MHx8fHwxNzU4ODM5MjA0fDA&ixlib=rb-4.1.0&q=85",
      title: "White Sand Gulf Beach",
      category: "Panama City Beach"
    },
    {
      id: 7,
      url: "https://images.unsplash.com/photo-1661090921594-4aea7a8fb41d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwzfHx3aGl0ZSUyMHNhbmQlMjBiZWFjaCUyMEd1bGZ8ZW58MHx8fHwxNzU4ODM5MjA0fDA&ixlib=rb-4.1.0&q=85",
      title: "Gulf Waters Beach Walk",
      category: "Panama City Beach"
    },
    {
      id: 8,
      url: "https://images.pexels.com/photos/1598324/pexels-photo-1598324.jpeg",
      title: "Crystal Clear Waters",
      category: "Panama City Beach"
    }
  ];

  const categories = ["All", "Panama City Beach", "Watercraft", "Floating Cabanas"];
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
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(https://customer-assets.emergentagent.com/job_gulf-float-exclusive/artifacts/1w1nz1xd_Gemini_Generated_Image_ej759rej759rej75.png)`,
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