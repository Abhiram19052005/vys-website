import React, { useState } from "react";
import axios from "axios";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
        await axios.post("http://localhost:5000/api/forgot-password", { email });

      setMessage("✅ Reset link sent to email. Check your inbox.");
    } catch (err) {
      setMessage("❌ User not found. Try again.");
    }
  };

  return (
    <div>
      <h2>Forgot Password?</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleForgotPassword}>
        <input type="email" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button type="submit">Send Reset Link</button>
      </form>
    </div>
  );
}

export default ForgotPassword;
