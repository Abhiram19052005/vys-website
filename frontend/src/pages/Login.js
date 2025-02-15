import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Login({ setIsAdmin, setIsAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/api/login", { email, password });

      if (response.status === 200) {
        const { token, role } = response.data;
        localStorage.setItem("token", token);
        setIsAuthenticated(true);

        if (role === "admin") {
          localStorage.setItem("isAdmin", "true");
          setIsAdmin(true);
          navigate("/admin");
        } else {
          localStorage.removeItem("isAdmin");
          setIsAdmin(false);
          navigate("/products");
        }
      }
    } catch (err) {
      console.error("❌ Login Error:", err);
      if (err.response?.status === 403) {
        setError("❌ You do not have permission to access this resource.");
      } else if (err.response?.status === 401) {
        setError("❌ Invalid email or password.");
      } else {
        setError("⚠️ An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>🔐 Login</h2>
      {error && <p style={styles.error}>{error}</p>}
      <form onSubmit={handleLogin}>
        <input 
          type="email" 
          placeholder="Enter your email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        
        <div style={styles.passwordContainer}>
          <input 
            type={showPassword ? "text" : "password"} 
            placeholder="Enter your password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={styles.passwordInput}
          />
          <span 
            onClick={() => setShowPassword(!showPassword)} 
            style={styles.eyeIcon}
          >
            {showPassword ? "👁️" : "🔒"}
          </span>
        </div>

        {/* Forgot Password Link */}
        <p style={styles.forgotPassword}>
          <Link to="/forgot-password">Forgot Password?</Link>
        </p>

        <button type="submit" style={styles.loginButton} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <p>
        Don't have an account? <Link to="/register" style={styles.registerLink}>Register Here</Link>
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "400px",
    margin: "auto",
    padding: "20px",
    textAlign: "center",
    border: "1px solid #ddd",
    borderRadius: "5px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    backgroundColor: "#fff",
  },
  error: {
    color: "red",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  registerLink: {
    color: "blue",
    textDecoration: "underline",
    fontWeight: "bold",
  },
  forgotPassword: {
    textAlign: "right",
    marginTop: "5px",
    marginBottom: "10px",
  },
  passwordContainer: {
    display: "flex",
    alignItems: "center",
    position: "relative",
    width: "100%",
  },
  passwordInput: {
    width: "100%",
    padding: "10px",
    paddingRight: "40px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  eyeIcon: {
    position: "absolute",
    right: "10px",
    cursor: "pointer",
    fontSize: "18px",
  },
  loginButton: {
    width: "100%",
    padding: "10px",
    marginTop: "10px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
  },
};

export default Login;
