// "$12,500" for listing prices, which are whole dollars.
export function formatPrice(price) {
  return `$${Number(price).toLocaleString("en-US")}`;
}

// "$13,250.00" for cart totals, which include tax.
export function formatPriceWithCents(price) {
  return `$${Number(price).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
