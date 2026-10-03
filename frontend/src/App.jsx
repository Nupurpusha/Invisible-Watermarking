import React, { useState, useEffect } from "react";
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

// The current decoder model is configured for 128 bits.
const WATERMARK_LENGTH = 128;
const WAVELET_TYPE = "haar";

// Convert the user's text into a deterministic 128-bit watermark.
// Important: this creates a hash-derived watermark, not reversible text.
async function generateWatermarkBits(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim());

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashBytes = new Uint8Array(hashBuffer);

  const bits = Array.from(hashBytes)
    .map((byte) => byte.toString(2).padStart(8, "0"))
    .join("")
    .slice(0, WATERMARK_LENGTH)
    .split("")
    .map(Number);

  return bits;
}

// Convert FastAPI error responses into readable messages.
async function getApiError(response) {
  try {
    const data = await response.json();

    if (typeof data.detail === "string") {
      return data.detail;
    }

    return `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

// Send the image and watermark bits to FastAPI.
async function uploadAndWatermark(imageFile, textToEmbed) {
  if (!imageFile) {
    throw new Error("Please select an image.");
  }

  if (!textToEmbed?.trim()) {
    throw new Error("Please enter text to generate the watermark.");
  }

  const watermarkBits = await generateWatermarkBits(textToEmbed);

  const formData = new FormData();

  // These field names must match backend/main.py.
  formData.append("image", imageFile);
  formData.append("watermark_length", String(WATERMARK_LENGTH));
  formData.append("watermark_bits", JSON.stringify(watermarkBits));
  formData.append("wavelet_type", WAVELET_TYPE);

  const response = await fetch(`${API_BASE_URL}/embed`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  // The /embed endpoint returns an image/png response, not JSON.
  const imageBlob = await response.blob();

  if (!imageBlob.type.startsWith("image/") || imageBlob.size === 0) {
    throw new Error("The backend returned an invalid image.");
  }

  return {
    watermarkedImageData: URL.createObjectURL(imageBlob),
    watermarkBits,
  };
}

function App() {
  const [watermarkedImageData, setWatermarkedImageData] = useState(null);
  const [textToEmbed, setTextToEmbed] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Release the previous generated image URL when it is replaced
  // or when the component unmounts.
  useEffect(() => {
    return () => {
      if (watermarkedImageData) {
        URL.revokeObjectURL(watermarkedImageData);
      }
    };
  }, [watermarkedImageData]);

  // Demo login state; this is not Firebase authentication.
  const handleLoginClick = () => {
    setIsLoggedIn(true);
  };

  const handleUploadAndEmbed = async (imageFile, text) => {
    setIsLoading(true);
    setError(null);
    setTextToEmbed(text);

    try {
      const result = await uploadAndWatermark(imageFile, text);

      setWatermarkedImageData(result.watermarkedImageData);
      toast.success("Watermark embedded successfully!");
    } catch (err) {
      console.error("Upload/Watermark Error:", err);

      const message =
        err instanceof TypeError
          ? "Could not connect to FastAPI. Check that the backend is running."
          : err.message || "Failed to embed the watermark.";

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

        {/* Display the generated image if the UploadSection
            does not already display it. */}
        {watermarkedImageData && (
          <section className="mt-8 rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">
              Watermarked Image
            </h2>

            <img
              src={watermarkedImageData}
              alt="Image with embedded watermark"
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
