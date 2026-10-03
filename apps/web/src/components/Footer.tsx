'use client';

import React, { useState } from 'react';

export function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalizedEmail = email.trim();
    const isValidEmail = /\S+@\S+\.\S+/.test(normalizedEmail);

    if (!isValidEmail) {
      setStatus({ type: 'error', message: 'Enter a valid email address to subscribe.' });
      return;
    }

    const subject = encodeURIComponent('ShopVibe newsletter subscription');
    const body = encodeURIComponent(`Please add ${normalizedEmail} to the ShopVibe newsletter.`);

    setStatus({
      type: 'success',
      message: 'Your email app should open so you can complete the subscription request.'
    });
    setEmail('');
    window.location.href = `mailto:newsletter@shopvibe.com?subject=${subject}&body=${body}`;
  };

  return (
    <footer id="footer" className="bg-gray-900 text-white pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <h2 className="text-2xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 bg-clip-text text-transparent">
                ShopVibe
              </span>
            </h2>
            <p className="text-gray-400 text-sm">
              Your one-stop destination for amazing products and seamless shopping experiences.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#top" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#products" className="hover:text-white transition-colors">Products</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#order-history" className="hover:text-white transition-colors">Orders</a></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="mailto:support@shopvibe.com" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="mailto:support@shopvibe.com?subject=Shipping%20Policy" className="hover:text-white transition-colors">Shipping Policy</a></li>
              <li><a href="mailto:support@shopvibe.com?subject=Returns%20and%20Exchanges" className="hover:text-white transition-colors">Returns &amp; Exchanges</a></li>
              <li><a href="mailto:support@shopvibe.com?subject=FAQ" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Stay Updated</h3>
            <p className="text-gray-400 text-sm mb-4">Subscribe to our newsletter for the latest updates and offers.</p>
            <form onSubmit={handleSubscribe}>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status) {
                      setStatus(null);
                    }
                  }}
                  className="flex-1 bg-gray-800 text-white rounded-l-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Subscribe
                </button>
              </div>
            </form>
            <p className="mt-2 text-xs text-gray-500">We&apos;ll open your email app to finish the request.</p>
            {status && (
              <p
                className={`mt-2 text-sm ${
                  status.type === 'success' ? 'text-green-400' : 'text-red-300'
                }`}
              >
                {status.message}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} ShopVibe. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}











