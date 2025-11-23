import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartTestSet {
  type: 'bundle';
  id: string;
  name: string;
  description: string;
  base_price: number;
  test_count: number;
  category: string;
  test_codes: string[];
}

export interface CartIndividualTest {
  type: 'individual';
  code: string;
  name: string;
  domain: string;
  estimated_price: number;
}

export type CartItem = CartTestSet | CartIndividualTest;

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalSavings: () => number;
  getItemCount: () => number;
  isInCart: (itemId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem('healthCartItems');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('healthCartItems', JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems(prev => {
      const itemId = item.type === 'bundle' ? item.id : item.code;
      const exists = prev.some(i => 
        (i.type === 'bundle' ? i.id : i.code) === itemId
      );
      if (exists) return prev;
      return [...prev, item];
    });
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(i => 
      (i.type === 'bundle' ? i.id : i.code) !== itemId
    ));
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalPrice = () => {
    return items.reduce((sum, item) => 
      sum + (item.type === 'bundle' ? item.base_price : item.estimated_price), 0
    );
  };

  const getTotalSavings = () => {
    // Calculate potential savings from bundles vs individual tests
    let savings = 0;
    items.forEach(item => {
      if (item.type === 'bundle') {
        // Estimate individual test cost at $45 per test average
        const estimatedIndividualCost = item.test_count * 45;
        savings += estimatedIndividualCost - item.base_price;
      }
    });
    return savings;
  };

  const getItemCount = () => items.length;

  const isInCart = (itemId: string) => {
    return items.some(i => (i.type === 'bundle' ? i.id : i.code) === itemId);
  };

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      clearCart,
      getTotalPrice,
      getTotalSavings,
      getItemCount,
      isInCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
