import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    // const storagedCart = Buscar dados do localStorage
    const storagedCart = localStorage.getItem("@RocketShoes:cart");
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const productInCart = cart.find((product) => product.id === productId);
      if (!productInCart) {
        const { data: product } = await api.get<Product>(
          `products/${productId}`
        );
        const { data: stock } = await api.get<Stock>(`stock/${productId}`);

        if (stock.amount > 0) {
          setCart([...cart, { ...product, amount: 1 }]);
          localStorage.setItem( "@RocketShoes:cart", JSON.stringify([...cart, { ...product, amount: 1 }])
          );
          toast("Adicionando Produto Ao Carrinho");
          return;
        }
      }

      if (productInCart) {
        const { data: stock } = await api.get(`stock/${productId}`);

        if (stock.amount > productInCart.amount) {
          const updatedCart = cart.map((cartItem) =>
            cartItem.id === productId
              ? {
                  ...cartItem,
                  amount: Number(cartItem.amount) + 1,
                }
              : cartItem
          );

          setCart(updatedCart);
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart)
          );
          return;
        } else {
          toast.error("Produto Não Adicionado! Quantidade acima do permitido");
        }
      }
    } catch {
      // TODO
      toast.error("Erro Ao Adicionar Produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const product = cart.some((cartProduct) => cartProduct.id === productId);
      if (!product) {
        toast.error("Erro Ao Romover o Produto");
        return;
      }
      const updatedCart = cart.filter((cartItem) => cartItem.id !== productId);
      setCart(updatedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      // TODO
      toast.error("Erro Ao Romover o Produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      if (amount <= 0) {
        toast.error("Não Foi Possível Atualizar a QTDE do Produto");
      }

      const response = await api.get(`/stock/${productId}`);
      const productAmount = response.data.amount;
      const stockIsFree = amount > productAmount;

      if (stockIsFree) {
        toast.error("Quantidade Fora do Estoque");
        return;
      }

      const product = cart.some((cartProduct) => cartProduct.id === productId);
      if (!product) {
        toast.error("Não Foi Possível Atualizar a QTDE do Produto");
        return;
      }

      const updatedCart = cart.map((cartItem) =>
        cartItem.id === productId
          ? {
              ...cartItem,
              amount: amount,
            }
          : cartItem
      );
      setCart(updatedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      // TODO
      toast.error("Não Foi Possível Atualizar a QTDE do Produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);
  return context;
}
