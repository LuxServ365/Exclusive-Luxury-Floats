import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import Home from "./pages/Home";
import FloatsAmenities from "./pages/FloatsAmenities";
import WatercraftRentals from "./pages/WatercraftRentals";
import Bookings from "./pages/Bookings";
import Cart from "./pages/Cart";
import AdminDashboard from "./pages/AdminDashboard";
import Gallery from "./pages/Gallery";
import About from "./pages/About";
import Contact from "./pages/Contact";
import BookingSuccess from "./pages/BookingSuccess";
import BusinessHours from "./pages/BusinessHours";
import PaymentInstructions from "./pages/PaymentInstructions";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/floats-amenities" element={<FloatsAmenities />} />
          <Route path="/watercraft-rentals" element={<WatercraftRentals />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/business-hours" element={<BusinessHours />} />
          <Route path="/payment-instructions" element={<PaymentInstructions />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/booking-success" element={<BookingSuccess />} />
        </Routes>
        <Footer />
        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;