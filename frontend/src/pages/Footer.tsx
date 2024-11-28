// Footer.tsx
import React from "react";
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-primary text-textSecondary py-10 mt-16 w-full">
      <div className="container mx-auto px-4 text-center md:text-left">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start space-y-4 md:space-y-0">
          {/* Quick Links */}
          <div>
            <h5 className="text-lg font-semibold text-textPrimary mb-4">Quick Links</h5>
            <ul className="space-y-2">
              <li><a href="/dashboard" className="hover:text-white">Dashboard</a></li>
              <li><a href="/portfolio" className="hover:text-white">Portfolio</a></li>
              <li><a href="/transactions" className="hover:text-white">Transactions</a></li>
              <li><a href="/budget" className="hover:text-white">Budget</a></li>
              <li><a href="/search" className="hover:text-white">Search</a></li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h5 className="text-lg font-semibold text-textPrimary mb-4">Contact</h5>
            <a href="mailto:your-email@example.com" className="flex items-center space-x-2 hover:text-white">
              <FaEnvelope />
              <span>sarunas.karp@gmail.com</span>
            </a>
          </div>

          {/* Social Media Links */}
          <div className="flex space-x-4">
            <a href="https://github.com/oksarunas" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              <FaGithub className="text-2xl" />
            </a>
            <a href="https://linkedin.com/in/šarūnas-karpovičius-681032140" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              <FaLinkedin className="text-2xl" />
            </a>
          </div>
        </div>
        <p className="text-sm mt-6 text-center md:text-left text-textSecondary">
          &copy; {new Date().getFullYear()} Stock Manager. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
