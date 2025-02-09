import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (err) {
      setError("Failed to fetch users");
      console.error("Fetch Users Error:", err);
    }
  };

  const handleDelete = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter((user) => user.id !== userId));
    } catch (err) {
      setError("Failed to delete user");
      console.error("Delete User Error:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isAdmin");
    navigate("/admin/login");
  };

  return (
    <div style={styles.container}>
      <h2>Admin Dashboard</h2>
      <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      <p>Manage your products, orders, and customers here.</p>

      <h3>Users Management</h3>
      {error && <p style={styles.error}>{error}</p>}
      <table style={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                {user.role !== "admin" && (
                  <button style={styles.deleteBtn} onClick={() => handleDelete(user.id)}>
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: { maxWidth: "800px", margin: "auto", textAlign: "center", padding: "20px" },
  error: { color: "red" },
  logoutBtn: { backgroundColor: "black", color: "#fff", padding: "8px 12px", cursor: "pointer", marginBottom: "20px" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: "20px", border: "1px solid #ddd" },
  deleteBtn: { backgroundColor: "red", color: "#fff", border: "none", cursor: "pointer", padding: "5px 10px" },
};

export default AdminDashboard;
