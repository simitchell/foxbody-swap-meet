import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { ConditionDot, NoDataDiv } from "./GlobalStyles/StyleCard";
import conditionColor from "../utils/conditionColor";
import apiErrorMessage from "../utils/apiErrorMessage";
import apiFetch from "../utils/apiFetch";
import { formatPrice, formatPriceWithCents } from "../utils/formatPrice";
import Toast from "./Toast";
import {
  CartDiv,
  CartHeader,
  CartImg,
  CartItem,
  CartItemInfo,
  CartItemPrice,
  CartItemTitle,
  CartMain,
  CartOuterContainer,
  CartPanel,
  CartSummary,
  ConditionPill,
  ProgressDiv,
  RemoveButton,
  RowItems,
  RowTaxes,
  RowShipping,
  RowTotal,
} from "./GlobalStyles/StyleCart";

export default function CartDetail() {
  const [isLoading, setIsLoading] = useState(true);
  const [cartData, setCartData] = useState(null);
  const [taxes, setTaxes] = useState(0);
  const [cartTotal, setCartTotal] = useState(0); // New state for the total
  const location = useLocation();
  const [toast, setToast] = useState({ open: false, message: "", severity: "error" });

  const getCart = async () => {
    try {
      const response = await apiFetch("/cart/");

      if (response.ok) {
        const data = await response.json();
        const filteredCart = data.filter(
          (cart) => cart.user_id == localStorage.getItem("userId")
        );
        setCartData(filteredCart);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await apiFetch(`/cart/item/${id}/`, { method: "DELETE" });

      if (response.ok) {
        getCart();
        return;
      }
      const body = await response.json().catch(() => null);
      setToast({
        open: true,
        message: apiErrorMessage(body, "Couldn't remove that item."),
        severity: "error",
      });
    } catch (error) {
      console.error("Error removing cart item:", error);
      setToast({
        open: true,
        message: "Couldn't reach the server. Please try again.",
        severity: "error",
      });
    }
  };

  const calculateTotal = () => {
    if (cartData) {
      const totalBeforeTaxes = cartData.reduce(
        (total, item) => total + item.price,
        0
      );
      const calculatedTaxes = totalBeforeTaxes * 0.06; // 6% tax
      setTaxes(calculatedTaxes);
      return totalBeforeTaxes + calculatedTaxes;
    }
    return 0;
  };

  useEffect(() => {
    getCart();
  }, []);

  useEffect(() => {
    setCartTotal(calculateTotal());
  }, [cartData]);

  const itemCount = cartData?.length ?? 0;

  return (
    <CartDiv>
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />
      {isLoading ? (
        <ProgressDiv>
          <CircularProgress />
        </ProgressDiv>
      ) : (
        <CartOuterContainer>
          <CartMain>
            <CartHeader>
              <h1>My Cart</h1>
              <span className="itemCount">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            </CartHeader>

            <CartPanel>
              {itemCount > 0 ? (
                cartData.map((item) => (
                  <CartItem key={item.id}>
                    <CartImg>
                      <img src={item.image_url} alt={item.cart_item} />
                    </CartImg>
                    <CartItemInfo>
                      <CartItemTitle>{item.cart_item}</CartItemTitle>
                      <ConditionPill>
                        <ConditionDot color={conditionColor(item.condition)} />
                        {item.condition}
                      </ConditionPill>
                    </CartItemInfo>
                    <CartItemPrice>{formatPrice(item.price)}</CartItemPrice>
                    <RemoveButton
                      type="button"
                      onClick={() => handleDelete(item.id)}
                    >
                      Remove
                    </RemoveButton>
                  </CartItem>
                ))
              ) : (
                <NoDataDiv>Your cart is empty</NoDataDiv>
              )}
            </CartPanel>
          </CartMain>

          <CartSummary>
            <h2>Checkout</h2>
            <RowItems>
              <p>Items</p>
              <p>{formatPriceWithCents(cartTotal)}</p>
            </RowItems>
            <RowTaxes>
              <p>Taxes (6%)</p>
              <p>${taxes.toFixed(2)}</p>
            </RowTaxes>
            <RowShipping>
              <p>Shipping</p>
              <p>$0.00</p>
            </RowShipping>
            <RowTotal>
              <p>Total</p>
              <p>{formatPriceWithCents(cartTotal)}</p>
            </RowTotal>
            <Button variant="contained">Proceed to Checkout</Button>
          </CartSummary>
        </CartOuterContainer>
      )}
    </CartDiv>
  );
}
