import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");

    if (newPassword !== confirmPassword) {
      setMessage("❌ Passwords do not match.");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/reset-password", { token, newPassword });
      setMessage("✅ Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      if (err.response?.status === 400) {
        setMessage("❌ Invalid or expired reset link.");
      } else {
        setMessage("⚠️ Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div style={styles.container}>
      <h2>🔑 Reset Password</h2>
      {message && <p style={styles.message}>{message}</p>}
      <form onSubmit={handleResetPassword}>
        {/* New Password Field */}
        <div style={styles.passwordContainer}>
          <input 
            type={showPassword ? "text" : "password"} 
            placeholder="Enter new password" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            required 
            style={styles.passwordInput}
          />
          <span onClick={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            {showPassword ? "👁️" : "🔒"}
          </span>
        </div>

        {/* Confirm Password Field */}
        <div style={styles.passwordContainer}>
          <input 
            type={showConfirmPassword ? "text" : "password"} 
            placeholder="Confirm new password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
            style={styles.passwordInput}
          />
          <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
            {showConfirmPassword ? "👁️" : "🔒"}
          </span>
        </div>

        <button type="submit" style={styles.submitButton}>Reset Password</button>
      </form>
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
  message: {
    fontWeight: "bold",
    marginBottom: "10px",
  },
  passwordContainer: {
    display: "flex",
    alignItems: "center",
    position: "relative",
    marginBottom: "10px",
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
  submitButton: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
  },
};

export default ResetPassword;
