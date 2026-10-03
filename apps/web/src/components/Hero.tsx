import React from 'react';

export function Hero() {
  return (
    <div className="relative bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
          <svg
            className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2"
            fill="currentColor"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polygon points="50,0 100,0 50,100 0,100" />
          </svg>

          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block xl:inline">Welcome to</span>{' '}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 animate-gradient">
                  ShopVibe
                </span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                Discover a world of amazing products curated just for you. Experience seamless shopping with the best deals and premium quality items.
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <a
                    href="#products"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Shop Now
                  </a>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <a
                    href="#features"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg transition-all shadow-sm hover:shadow-md"
                  >
                    Learn More
                  </a>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 bg-gray-50">
        <div className="relative w-full h-full overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-80"></div>
            
            {/* Animated Blobs */}
            <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 -left-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            
            {/* Abstract Shapes */}
            <svg className="absolute inset-0 w-full h-full text-gray-100" fill="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 0 L50 0 L50 100 L0 100 Z" fill="none" />
            </svg>
            
            {/* Image Placeholder or Product Showcase */}
            <div className="absolute inset-0 flex items-center justify-center">
                 <div className="relative w-3/4 h-3/4">
                    {/* Abstract Composition */}
                    <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-blue-400 to-purple-500 rounded-2xl transform rotate-6 shadow-2xl z-10 animate-float"></div>
                    <div className="absolute top-1/3 left-1/3 w-1/2 h-1/2 bg-white rounded-2xl shadow-xl z-20 flex items-center justify-center p-4 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                        <div className="text-center">
                            <span className="text-4xl">🛍️</span>
                            <p className="mt-2 font-bold text-gray-800">New Arrivals</p>
                            <p className="text-xs text-gray-500">Check out latest trends</p>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
}
