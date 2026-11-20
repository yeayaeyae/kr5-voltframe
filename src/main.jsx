import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout.jsx";
import { Home } from "./pages/Home.jsx";
import { Catalog } from "./pages/Catalog.jsx";
import { Product } from "./pages/Product.jsx";
import { Order } from "./pages/Order.jsx";
import { Cart } from "./pages/Cart.jsx";
import { NotFound } from "./pages/NotFound.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="catalog/:productId" element={<Product />} />
          <Route path="order" element={<Order />} />
          <Route path="cart" element={<Cart />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
