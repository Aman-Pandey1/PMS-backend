import React, { createContext, useContext, useMemo, useReducer } from 'react';

const CartContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const { product } = action;
      const existing = state.items[product.id] || { product, quantity: 0 };
      const quantity = existing.quantity + 1;
      const items = { ...state.items, [product.id]: { product, quantity } };
      return { ...state, items };
    }
    case 'REMOVE': {
      const items = { ...state.items };
      delete items[action.productId];
      return { ...state, items };
    }
    case 'SET_QTY': {
      const { productId, quantity } = action;
      if (quantity <= 0) {
        const items = { ...state.items };
        delete items[productId];
        return { ...state, items };
      }
      const current = state.items[productId];
      if (!current) return state;
      const items = { ...state.items, [productId]: { ...current, quantity } };
      return { ...state, items };
    }
    case 'CLEAR':
      return { items: {} };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: {} });

  const api = useMemo(() => {
    const entries = Object.values(state.items);
    const totalQuantity = entries.reduce((s, it) => s + it.quantity, 0);
    const totalPrice = entries.reduce((s, it) => s + it.quantity * (it.product.price || 0), 0);
    return {
      items: entries,
      totalQuantity,
      totalPrice,
      add(product) { dispatch({ type: 'ADD', product }); },
      remove(productId) { dispatch({ type: 'REMOVE', productId }); },
      setQuantity(productId, quantity) { dispatch({ type: 'SET_QTY', productId, quantity }); },
      clear() { dispatch({ type: 'CLEAR' }); }
    };
  }, [state]);

  return (
    <CartContext.Provider value={api}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

