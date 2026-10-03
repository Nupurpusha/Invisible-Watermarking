
import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import Footer from "./components/Footer";
import HowItWorks from "./components/HowItWorks";
import AboutMarkProof from "./components/AboutMarkProof";
import UploadSection from "./components/UploadSection";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// FastAPI backend URL
const API_BASE_URL = "http://127.0.0.1:8000";

const WATERMARK_LENGTH = 128;
const WAVELET_TYPE = "haar";

// Convert entered text to a fixed 128-bit SHA-256-derived watermark.
async function generateWatermarkBits(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim());

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashBytes = new Uint8Array(hashBuffer);

  return Array.from(hashBytes)
    .map((byte) => byte.toString(2).padStart(8, "0"))
    .join("")
    .slice(0, WATERMARK_LENGTH)
    .split("")
    .map(Number);
}

async function getErrorMessage(response) {
  try {
    const data = await response.json();
    return data.detail || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

// Connect frontend to FastAPI /embed endpoint.
async function uploadAndWatermark(imageFile, text) {
  if (!imageFile) {
    throw new Error("Please select an image.");
  }

  if (!text?.trim()) {
    throw new Error("Please enter text for the watermark.");
  }

  const watermarkBits = await generateWatermarkBits(text);

  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("watermark_length", String(WATERMARK_LENGTH));
  formData.append("watermark_bits", JSON.stringify(watermarkBits));
  formData.append("wavelet_type", WAVELET_TYPE);

  const response = await fetch(`${API_BASE_URL}/embed`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const imageBlob = await response.blob();

  if (!imageBlob.size) {
    throw new Error("The backend returned an empty image.");
  }

  return URL.createObjectURL(imageBlob);
}

function App() {
  const [watermarkedImageData, setWatermarkedImageData] = useState(null);
  const [textToEmbed, setTextToEmbed] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginClick = () => {
    // Demo-only login state; not Firebase authentication.
    setIsLoggedIn(true);
  };

  const handleUploadAndEmbed = async (imageFile, text) => {
    setIsLoading(true);
    setError(null);
    setTextToEmbed(text);

    try {
      const imageUrl = await uploadAndWatermark(imageFile, text);

      setWatermarkedImageData((previousUrl) => {
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        return imageUrl;
      });

      toast.success("Watermark embedded successfully!");
    } catch (err) {
      console.error("FastAPI embedding error:", err);

      const message =
        err instanceof TypeError
          ? "Cannot connect to FastAPI. Check the backend URL and ensure the server is running."
          : err.message || "Failed to embed watermark.";

      setError(message);
      toast.error(message);
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

          <Route
            path="/about-markproof"
            element={<AboutMarkProof />}
          />

          <Route
            path="/upload-section"
            element={
              <UploadSection
                onUploadAndEmbed={handleUploadAndEmbed}
                isLoading={isLoading}
                error={error}
                isLoggedIn={isLoggedIn}
                onLoginClick={handleLoginClick}
                watermarkedImageData={watermarkedImageData}
                textToEmbed={textToEmbed}
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

        {watermarkedImageData && (
          <section className="mt-8 rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">
              Watermarked Image
            </h2>

            <img
              src={watermarkedImageData}
              alt="Watermarked result"
              className="max-h-[500px] max-w-full rounded-lg object-contain"
            />

            <a
              href={watermarkedImageData}
              download="watermarked_image.png"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Download Watermarked Image
            </a>
          </section>
        )}
      </main>

      <Footer />

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default App;
