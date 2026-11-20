import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout } from "./components/Layout.jsx";
import { Home } from "./pages/Home.jsx";
import { Catalog } from "./pages/Catalog.jsx";
import { Product } from "./pages/Product.jsx";
import { Order } from "./pages/Order.jsx";
import { Cart } from "./pages/Cart.jsx";
import { NotFound } from "./pages/NotFound.jsx";
import { editionBase, editionId } from "./editions.js";
import "./styles.css";
import "./showroom.css";
import "./editions.css";

document.documentElement.dataset.edition = editionId;

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "catalog", element: <Catalog /> },
      { path: "catalog/:productId", element: <Product /> },
      { path: "order", element: <Order /> },
      { path: "cart", element: <Cart /> },
      { path: "*", element: <NotFound /> },
    ],
  },
], { basename: editionBase });

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
