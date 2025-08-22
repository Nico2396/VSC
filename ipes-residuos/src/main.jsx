import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./styles.css";

import RootLayout from "./layouts/RootLayout.jsx";
import Protected from "./ui/Protected.jsx";

// Páginas
import Home from "./pages/Home.jsx";
import Precarga from "./pages/Precarga.jsx";
import Campanas from "./pages/Campanas.jsx";
import Confirmar from "./pages/Confirmar.jsx";
import Recolectados from "./pages/Recolectados.jsx";
import Admin from "./pages/Admin.jsx";
import Login from "./pages/Login.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "precarga", element: <Precarga /> },
      { path: "campanas", element: <Campanas /> },
      { path: "login", element: <Login /> },

      // Bloque protegido: voluntario o admin
      {
        element: <Protected role="voluntario" />,
        children: [
          { path: "confirmar", element: <Confirmar /> },
          { path: "recolectados", element: <Recolectados /> },
        ],
      },

      // Bloque protegido: solo admin
      {
        element: <Protected role="admin" />,
        children: [
          { path: "admin", element: <Admin /> },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
