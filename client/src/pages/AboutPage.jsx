import React from 'react';

export default function AboutPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-amber-900">About Us</h1>
      <p className="mt-3 text-amber-800">We are passionate about great beverages and snacks. Our mission is to bring café-quality products to your home or office with delightful service.</p>
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="p-5 rounded-lg border border-amber-200 bg-white">
          <div className="font-semibold text-amber-900">Our Story</div>
          <p className="text-amber-800 mt-2">Started by enthusiasts, we handpick suppliers and roast in small batches.</p>
        </div>
        <div className="p-5 rounded-lg border border-amber-200 bg-white">
          <div className="font-semibold text-amber-900">Sustainability</div>
          <p className="text-amber-800 mt-2">We prioritize ethical sourcing and eco-friendly packaging.</p>
        </div>
      </div>
    </div>
  );
}

