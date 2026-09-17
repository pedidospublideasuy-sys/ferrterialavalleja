import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency?: 'USD' | 'UYU';
  image: string;
  sku: string;
  stock: number;
  variantId?: string;
}

export interface CartItemType {
  product: CartProduct;
  quantity: number;
}

interface CartState {
  items: CartItemType[];
  addItem: (product: CartProduct, qty?: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  updateProduct: (product: CartProduct) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, qty = 1) => {
        const items = get().items;
        const existing = items.find((i) => i.product.id === product.id && i.product.variantId === product.variantId);
        if (existing) {
          set({
            items: items.map((i) =>
              i.product.id === product.id && i.product.variantId === product.variantId
                ? { ...i, product, quantity: Math.min(i.quantity + qty, product.stock) }
                : i
            ),
          });
        } else {
          set({ items: [...items, { product, quantity: qty }] });
        }
      },
      removeItem: (productId, variantId) => {
        set({ items: get().items.filter((i) => !(i.product.id === productId && i.product.variantId === variantId)) });
      },
      updateQuantity: (productId, variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.product.id === productId && i.product.variantId === variantId ? { ...i, quantity } : i
          ),
        });
      },
      updateProduct: (product) => {
        set({
          items: get().items.map((item) =>
            item.product.id === product.id && item.product.variantId === product.variantId ? { ...item, product } : item
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    }),
    { name: 'cart-storage' }
  )
);
