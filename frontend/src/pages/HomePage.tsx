import React from "react";
import Footer from "./Footer";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api";

interface HomePageProps {
  onLogin: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onLogin }) => {
  const navigate = useNavigate();

  const handleDemoLogin = async () => {
    const demoUsername = "demo";
    const demoPassword = "Demo123";

    const response = await loginUser(demoUsername, demoPassword);

    if (response.success) {
      onLogin(); // Update authentication state in App
      navigate("/portfolio"); // Redirect to dashboard
    } else {
      console.error("Demo login failed:", response.error);
    }
  };

  return (
    <div className="w-full overflow-hidden">
      {/* Hero Section */}
      <section className="hero-section text-center py-16 md:py-24 bg-gradient-to-b from-primary to-gray-900 text-textPrimary min-h-screen flex flex-col items-center justify-center w-full mx-auto top-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Manage Your Portfolio Effortlessly
        </h1>
        <p className="text-lg md:text-xl mb-6 max-w-2xl mx-auto text-textSecondary">
          Stay on top of your investments and make informed decisions with
          real-time insights.
        </p>
        <button
          className="button-primary bg-green-500 hover:bg-green-600 text-lg font-semibold"
          onClick={handleDemoLogin}
        >
          Demo
        </button>
      </section>

      {/* Feedback Section */}
      <div className="bg-gray-800 text-white py-12 px-4 mt-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">
          I Value Your Feedback
        </h2>
        <p className="text-center text-lg mb-6">
          Please take a moment to leave your feedback. Your insights are greatly appreciated!
        </p>
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSdGooAfQiup9n1mT6-ayLiN31sWNWMCn9PVjeCtpABgfZNUNg/viewform"
          target="_blank"
          rel="noopener noreferrer"
          className="button-primary bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg text-lg font-semibold"
        >
          Leave Feedback
        </a>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;
