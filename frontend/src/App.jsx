import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import Footer from "./components/Footer";
import HowItWorks from "./components/HowItWorks";
import AboutMarkProof from "./components/AboutMarkProof";
import UploadSection from "./components/UploadSection";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Dummy API function
const dummyUploadAndWatermark = async (imageFile, textToEmbed) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          watermarked_image_data: reader.result,
          embedded_text_confirmation: `"${textToEmbed}" was embedded.`,
        });
      };
      reader.readAsDataURL(imageFile);
    }, 1500);
  });
};

function App() {
  const [watermarkedImageData, setWatermarkedImageData] = useState(null);
  const [textToEmbed, setTextToEmbed] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Simple login state for demo
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Dummy login handler
  const handleLoginClick = () => {
    // You can show a modal or redirect to /auth here
    setIsLoggedIn(true);
  };

  const handleUploadAndEmbed = async (imageFile, text) => {
    setIsLoading(true);
    setError(null);
    setTextToEmbed(text);
    try {
      const result = await dummyUploadAndWatermark(imageFile, text);
      setWatermarkedImageData(result.watermarked_image_data);
    } catch (err) {
      console.error("Upload/Watermark Error:", err);
      setError("Failed to upload and embed watermark. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Routes>
          <Route path="/" element={<HeroSection />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/about-markproof" element={<AboutMarkProof />} />
          {/* <Route path="/auth" element={<AuthWindow />} /> */}

          {/* Upload Section: Pass login state and handler */}
          <Route
            path="/upload-section"
            element={
              <UploadSection
                onUploadAndEmbed={handleUploadAndEmbed}
                isLoading={isLoading}
                error={error}
                isLoggedIn={isLoggedIn}
                onLoginClick={handleLoginClick}
              />
            }
          />

          <Route
            path="/contact"
            element={
              <div className="mt-20 py-16 text-center text-gray-700">
                <h1>Contact Us Page</h1>
                <p>Content coming soon!</p>
              </div>
            }
          />
          <Route
            path="/privacy-policy"
            element={
              <div className="mt-20 py-16 text-center text-gray-700">
                <h1>Privacy Policy</h1>
                <p>Content coming soon!</p>
              </div>
            }
          />
          <Route
            path="/terms-of-service"
            element={
              <div className="mt-20 py-16 text-center text-gray-700">
                <h1>Terms of Service</h1>
                <p>Content coming soon!</p>
              </div>
            }
          />
        </Routes>
      </main>

      <Footer />

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default App;
