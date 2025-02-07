import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login({ setIsAdmin }) {
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
          navigate("/admin");
        } else {
          localStorage.removeItem("isAdmin");
          setIsAdmin(false);
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
    <div>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
