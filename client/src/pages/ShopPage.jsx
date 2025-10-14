import React, { useMemo, useState } from 'react';
import { categories, products } from '../lib/products.js';
import { useCart } from '../contexts/CartContext.jsx';
import Footer from '../components/Footer.jsx';

export default function ShopPage() {
  const [active, setActive] = useState(categories[0]?.id || '');
  const filtered = useMemo(() => products.filter(p => !active || p.categoryId === active), [active]);
  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-6">
      <div>
        <div className="flex gap-2 flex-wrap mb-4">
          {categories.map(c => (
            <button key={c.id} onClick={() => setActive(c.id)} className={`px-4 py-2 rounded-full border ${active === c.id ? 'bg-amber-700 text-white border-amber-700' : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-50'}`}>{c.name}</button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
      <aside>
        <CartPanel />
      </aside>
    </div>
    <Footer />
  );
}

function ProductCard({ product }) {
  const { add } = useCart();
  return (
    <div className="border border-amber-200 rounded-lg overflow-hidden bg-white flex flex-col">
      {product.image && <img src={product.image} alt="" className="h-40 object-cover w-full" />}
      <div className="p-3 flex-1 flex flex-col">
        <div className="font-semibold text-amber-900">{product.name}</div>
        <div className="text-amber-800 mt-1">${product.price.toFixed(2)}</div>
        <button onClick={() => add(product)} className="mt-auto bg-amber-700 hover:bg-amber-800 text-white rounded px-3 py-2">Add to cart</button>
      </div>
    </div>
  );
}

function CartPanel() {
  const { items, totalPrice, setQuantity, remove, clear } = useCart();
  return (
    <div className="sticky top-4 border border-amber-200 bg-white rounded-lg p-4">
      <div className="text-lg font-semibold text-amber-900">Cart</div>
      <div className="mt-3 space-y-3 max-h-[60vh] overflow-auto pr-1">
        {items.length === 0 && <div className="text-amber-800">Your cart is empty.</div>}
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="flex gap-3 items-center">
            {product.image && <img src={product.image} alt="" className="w-12 h-12 object-cover rounded" />}
            <div className="flex-1">
              <div className="text-amber-900 font-medium">{product.name}</div>
              <div className="text-sm text-amber-800">${product.price.toFixed(2)}</div>
            </div>
            <input type="number" min={0} className="w-16 border rounded px-2 py-1" value={quantity} onChange={e => setQuantity(product.id, Number(e.target.value))} />
            <button onClick={() => remove(product.id)} className="text-amber-900/80 hover:text-amber-900">✕</button>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-amber-200 pt-3 flex items-center justify-between">
        <div className="text-amber-900 font-semibold">Total</div>
        <div className="text-amber-900 font-semibold">${totalPrice.toFixed(2)}</div>
      </div>
      <div className="mt-3 flex gap-2">
        <button disabled className="flex-1 bg-amber-700/50 text-white rounded px-3 py-2 cursor-not-allowed">Checkout</button>
        <button onClick={clear} className="px-3 py-2 rounded border border-amber-300 text-amber-900">Clear</button>
      </div>
    </div>
  );
}

