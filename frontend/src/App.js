import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Admin Pages
import AdminDashboard from "./admin/AdminDashboard";
import ProtectedRoute from "./admin/ProtectedRoute";

function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const adminStatus = localStorage.getItem("isAdmin") === "true";
    setIsAdmin(adminStatus);
  }, []);

  return (
    <Router>
      <Navbar isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/login" element={<Login setIsAdmin={setIsAdmin} />} />
        <Route path="/register" element={<Register />} />

        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={<ProtectedRoute element={<AdminDashboard />} isAuthenticated={isAdmin} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
