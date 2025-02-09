import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Login({ setIsAdmin, setIsAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/api/login", { email, password });

      if (response.status === 200) {
        const { token, role } = response.data;
        localStorage.setItem("token", token);

        if (role === "admin") {
          localStorage.setItem("isAdmin", "true");
          setIsAdmin(true);
          setIsAuthenticated(true);
          navigate("/admin");
        } else {
          localStorage.removeItem("isAdmin");
          setIsAdmin(false);
          setIsAuthenticated(true);
          navigate("/products");
        }
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Invalid email or password");
      } else {
        setError("An error occurred. Please try again.");
      }
      console.error("Login Error:", err);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Login</h2>
      {error && <p style={styles.error}>{error}</p>}
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Login</button>
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
  },
  error: {
    color: "red",
  },
  registerLink: {
    color: "blue",
    textDecoration: "underline",
  },
};

export default Login;
