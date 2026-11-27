export const categories = ["Смартфоны", "Ноутбуки", "Наушники", "Флешки", "Смарт-часы", "Пауэрбанки"];

export function productColor(product, colorId) {
  return product.colors?.find(color => color.id === colorId) ?? product.colors?.[0];
}

export function cartSku(product, color) {
  // Existing cart entries and quick-add buttons use the unqualified ID for the default color.
  return color && color.id !== product.colors?.[0]?.id ? `${product.id}:${color.id}` : product.id;
}

export function productPath(product, color) {
  const path = `/catalog/${product.id}`;
  return cartSku(product, color) === product.id ? path : `${path}?color=${encodeURIComponent(color.id)}`;
}
