import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar({ isAdmin, isAuthenticated, setIsAdmin, setIsAuthenticated }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isAdmin");
    setIsAuthenticated(false);
    setIsAdmin(false);
    navigate("/login");
  };

  return (
    <nav style={styles.navbar}>
      <h2>Computer Shop</h2>
      <ul style={styles.navLinks}>
        {isAdmin ? (
          <>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/admin">Admin Dashboard</Link></li>
            <li><button onClick={handleLogout} style={styles.logoutButton}>Logout</button></li>
          </>
        ) : isAuthenticated ? (
          <>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/cart">Cart</Link></li>
            <li><Link to="/checkout">Checkout</Link></li>
            <li><button onClick={handleLogout} style={styles.logoutButton}>Logout</button></li>
          </>
        ) : (
          <>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/cart">Cart</Link></li>
            <li><Link to="/login">Login</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
}

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 20px",
    backgroundColor: "#333",
    color: "#fff",
  },
  navLinks: {
    display: "flex",
    listStyle: "none",
    gap: "20px",
  },
  logoutButton: {
    backgroundColor: "red",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
};

export default Navbar;
