import React from "react";

const Banner = () => (
  <div className="relative p-8 rounded-lg shadow-lg mb-8 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg border border-gray-400">
    <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
      Welcome to NutriChefAI!
    </h1>
    <p className="text-xl text-black">
      Generate recipes with the ingredients you have at home !
    </p>
  </div>
);

export default Banner;
