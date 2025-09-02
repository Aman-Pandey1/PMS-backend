import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 50); return () => clearTimeout(t); }, []);

  return (
    <div className="min-h-[calc(100vh-80px)]">
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-100 to-amber-300 p-10 mb-10">
        <div className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <h1 className="text-4xl md:text-5xl font-extrabold text-amber-900">Welcome to Our Store</h1>
          <p className="mt-3 text-amber-800 max-w-2xl">Discover curated coffee, teas and snacks. Crafted with care, delivered with speed.</p>
          <div className="mt-6 flex gap-3">
            <Link to="/shop" className="bg-amber-700 hover:bg-amber-800 text-white px-5 py-3 rounded-lg">Shop Now</Link>
            <Link to="/about" className="bg-white/70 hover:bg-white text-amber-900 px-5 py-3 rounded-lg border border-amber-300">About Us</Link>
          </div>
        </div>
        <FloatingBeans />
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        <FeatureCard title="Quality First" body="We source ethically and roast to perfection." delay={0} />
        <FeatureCard title="Fast Delivery" body="From our roastery to your door in days." delay={100} />
        <FeatureCard title="Secure Checkout" body="Trusted payments and safe packaging." delay={200} />
      </section>
    </div>
  );
}

function FeatureCard({ title, body, delay = 0 }) {
  const [inView, setInView] = useState(false);
  useEffect(() => { const t = setTimeout(() => setInView(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={`p-6 rounded-xl border border-amber-200 bg-white shadow-sm transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="text-xl font-semibold text-amber-900">{title}</div>
      <div className="text-amber-800 mt-2">{body}</div>
    </div>
  );
}

function FloatingBeans() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-200 rounded-full blur-2xl animate-pulse" />
      <div className="absolute right-20 top-8 w-24 h-24 bg-amber-400/60 rounded-full blur-xl animate-[pulse_3s_ease-in-out_infinite]" />
      <div className="absolute left-10 bottom-0 w-28 h-28 bg-amber-300/80 rounded-full blur-xl animate-[pulse_4s_ease-in-out_infinite]" />
    </div>
  );
}

