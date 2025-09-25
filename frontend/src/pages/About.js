import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const About = () => {
  return (
    <div className="main-content">
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h1 className="section-title" data-testid="about-title">About Exclusive Gulf Float</h1>
            <p className="section-subtitle" data-testid="about-subtitle">
              Your premier destination for luxury floating experiences on the Gulf Coast
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-3xl font-bold text-teal-700 mb-6">Our Story</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed" data-testid="our-story">
                Exclusive Gulf Float was born from a passion for Panama City's incredible emerald waters 
                and a vision to provide truly premium water experiences. Founded by local water enthusiasts, 
                we recognized the need for luxury floating adventures that showcase the natural beauty 
                of the Gulf Coast.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Our commitment to excellence drives everything we do – from our crystal-clear kayaks 
                with LED lighting to our luxury floating cabanas with premium amenities.
              </p>
            </div>
            
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1708952483586-bc3d393a5ea0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwyfHxlbWVyYWxkJTIwd2F0ZXJzfGVufDB8fHx8MTc1ODgzNzMxMnww&ixlib=rb-4.1.0&q=85"
                alt="Panama City emerald waters"
                className="rounded-2xl shadow-2xl w-full h-80 object-cover"
                data-testid="about-story-image"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="card text-center" data-testid="mission-card">
              <CardHeader>
                <CardTitle>Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  To provide the ultimate floating experience for entertainment and relaxation, 
                  creating unforgettable memories on Panama City's pristine waters.
                </p>
              </CardContent>
            </Card>

            <Card className="card text-center" data-testid="vision-card">
              <CardHeader>
                <CardTitle>Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  To be the Gulf Coast's premier luxury water experience provider, 
                  setting the standard for premium floating adventures.
                </p>
              </CardContent>
            </Card>

            <Card className="card text-center" data-testid="values-card">
              <CardHeader>
                <CardTitle>Our Values</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Safety, luxury, and environmental stewardship guide our commitment 
                  to exceptional Gulf Coast experiences.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;