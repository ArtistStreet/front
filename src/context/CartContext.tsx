import React, { createContext, useEffect, useState, useContext } from "react";
import type { Product } from "../types";
import { useAuth } from "./AuthContext";
import { productApi } from "../utils/api";

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string | number) => void;
  updateQuantity: (productId: string | number, quantity: number) => void;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextType>(
  {} as CartContextType,
);

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { token } = useAuth();
  type ServerCartItem = {
    product: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
  };

  const mapServerCartToClient = (
    items: (ServerCartItem & { stock?: number })[],
  ) =>
    items.map((i) => ({
      id: String(i.product),
      _id: String(i.product),
      name: i.name,
      price: i.price,
      originalPrice: i.price,
      discount: 0,
      image: i.image,
      rating: 0,
      sold: 0,
      category: "",
      isMall: false,
      stock: i.stock || 0,
      quantity: i.quantity,
    }));

  const syncCartFromServer = async (authToken: string) => {
    const res = await productApi.getCart(authToken);
    const serverItems = (res.data?.items || []) as (ServerCartItem & {
      stock?: number;
    })[];
    setCart(mapServerCartToClient(serverItems));
  };

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setCart([]);
        return;
      }
      try {
        await syncCartFromServer(token);
      } catch {
        setCart([]);
      }
    };
    load();
  }, [token]);

  const addToCart = (product: Product, quantity: number) => {
    const normalizedProductId = String(product.id ?? product._id ?? "");
    if (!normalizedProductId) return;
    setCart((prev) => {
      const existingItem = prev.find(
        (item) => String(item.id) === normalizedProductId,
      );
      const stock = product.stock ?? 0;
      if (existingItem) {
        const newQty = Math.min(existingItem.quantity + quantity, stock);
        return prev.map((item) =>
          String(item.id) === normalizedProductId
            ? { ...item, quantity: newQty }
            : item,
        );
      }
      return [
        ...prev,
        {
          ...product,
          id: normalizedProductId,
          _id: normalizedProductId,
          quantity: Math.min(quantity, stock),
        },
      ];
    });
    if (token) {
      productApi
        .addToCart({ productId: normalizedProductId, quantity }, token)
        .then(() => syncCartFromServer(token))
        .catch(() => syncCartFromServer(token));
    }
  };

  const removeFromCart = (productId: string | number) => {
    const normalizedProductId = String(productId);
    const previousCart = cart;
    setCart((prev) =>
      prev.filter((item) => String(item.id) !== normalizedProductId),
    );
    if (token) {
      productApi
        .removeCartItem(normalizedProductId, token)
        .then(() => syncCartFromServer(token))
        .catch((err) => {
          setCart(previousCart);
          const errMsg = err?.response?.data?.message;
          if (errMsg) alert(errMsg);
          return syncCartFromServer(token).catch(() => undefined);
        });
    }
  };

  const updateQuantity = (productId: string | number, quantity: number) => {
    const normalizedProductId = String(productId);
    if (quantity <= 0) {
      removeFromCart(normalizedProductId);
      return;
    }
    const item = cart.find((i) => String(i.id) === normalizedProductId);
    const stock = item?.stock ?? 0;
    const finalQty = Math.min(quantity, stock);

    setCart((prev) =>
      prev.map((item) =>
        String(item.id) === normalizedProductId
          ? { ...item, quantity: finalQty }
          : item,
      ),
    );
    if (token) {
      productApi
        .updateCartItem(normalizedProductId, { quantity: finalQty }, token)
        .then(() => syncCartFromServer(token))
        .catch((err) => {
          const errMsg = err.response?.data?.message;
          if (errMsg) alert(errMsg);
          return syncCartFromServer(token);
        });
    }
  };

  const clearCart = () => {
    const previousCart = cart;
    setCart([]);
    if (token) {
      productApi
        .clearCart(token)
        .then(() => syncCartFromServer(token))
        .catch((err) => {
          setCart(previousCart);
          const errMsg = err?.response?.data?.message;
          if (errMsg) alert(errMsg);
          return syncCartFromServer(token).catch(() => undefined);
        });
    }
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
