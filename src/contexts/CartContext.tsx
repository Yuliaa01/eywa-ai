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

export interface CartVitamin {
  type: 'vitamin';
  id: string;
  name: string;
  description: string;
  category: string;
  form: string;
  price: number;
  dosage: string;
  brand?: string;
}

export interface CartVitaminBundle {
  type: 'vitamin_bundle';
  id: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  vitamin_count: number;
  vitamin_ids: string[];
}

export type CartItem = CartTestSet | CartIndividualTest | CartVitamin | CartVitaminBundle;

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalSavings: () => number;
  getItemCount: () => number;
  isInCart: (itemId: string) => boolean;
  getTestItems: () => (CartTestSet | CartIndividualTest)[];
  getVitaminItems: () => (CartVitamin | CartVitaminBundle)[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getItemId = (item: CartItem): string => {
  switch (item.type) {
    case 'bundle':
      return `bundle-${item.id}`;
    case 'individual':
      return `test-${item.code}`;
    case 'vitamin':
      return `vitamin-${item.id}`;
    case 'vitamin_bundle':
      return `vitbundle-${item.id}`;
  }
};

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
      const newItemId = getItemId(item);
      const exists = prev.some(i => getItemId(i) === newItemId);
      if (exists) return prev;
      return [...prev, item];
    });
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(i => {
      const id = getItemId(i);
      // Support both prefixed and unprefixed IDs for backwards compatibility
      return id !== itemId && 
        id !== `bundle-${itemId}` && 
        id !== `test-${itemId}` && 
        id !== `vitamin-${itemId}` && 
        id !== `vitbundle-${itemId}` &&
        // Also check raw IDs
        !(i.type === 'bundle' && i.id === itemId) &&
        !(i.type === 'individual' && i.code === itemId) &&
        !(i.type === 'vitamin' && i.id === itemId) &&
        !(i.type === 'vitamin_bundle' && i.id === itemId);
    }));
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalPrice = () => {
    return items.reduce((sum, item) => {
      switch (item.type) {
        case 'bundle':
          return sum + item.base_price;
        case 'individual':
          return sum + item.estimated_price;
        case 'vitamin':
          return sum + item.price;
        case 'vitamin_bundle':
          return sum + item.base_price;
      }
    }, 0);
  };

  const getTotalSavings = () => {
    let savings = 0;
    items.forEach(item => {
      if (item.type === 'bundle') {
        // Estimate individual test cost at $45 per test average
        const estimatedIndividualCost = item.test_count * 45;
        savings += estimatedIndividualCost - item.base_price;
      } else if (item.type === 'vitamin_bundle') {
        // Estimate individual vitamin cost at $30 per vitamin average
        const estimatedIndividualCost = item.vitamin_count * 30;
        savings += estimatedIndividualCost - item.base_price;
      }
    });
    return Math.max(0, savings);
  };

  const getItemCount = () => items.length;

  const isInCart = (itemId: string) => {
    return items.some(i => {
      const id = getItemId(i);
      return id === itemId || 
        id === `bundle-${itemId}` || 
        id === `test-${itemId}` || 
        id === `vitamin-${itemId}` || 
        id === `vitbundle-${itemId}` ||
        (i.type === 'bundle' && i.id === itemId) ||
        (i.type === 'individual' && i.code === itemId) ||
        (i.type === 'vitamin' && i.id === itemId) ||
        (i.type === 'vitamin_bundle' && i.id === itemId);
    });
  };

  const getTestItems = () => {
    return items.filter(i => i.type === 'bundle' || i.type === 'individual') as (CartTestSet | CartIndividualTest)[];
  };

  const getVitaminItems = () => {
    return items.filter(i => i.type === 'vitamin' || i.type === 'vitamin_bundle') as (CartVitamin | CartVitaminBundle)[];
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
      isInCart,
      getTestItems,
      getVitaminItems
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
