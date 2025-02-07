import React from "react";
import { Link } from "react-router-dom";

function ProductCard({ product }) {
  return (
    <div style={styles.card}>
      <img src={product.image} alt={product.name} style={styles.image} />
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      <Link to={`/product/${product.id}`} style={styles.button}>View Details</Link>
    </div>
  );
}

const styles = {
  card: {
    border: "1px solid #ddd",
    padding: "10px",
    width: "200px",
    textAlign: "center",
  },
  image: {
    width: "100%",
    height: "150px",
    objectFit: "cover",
  },
  button: {
    display: "block",
    marginTop: "10px",
    padding: "5px",
    backgroundColor: "#007bff",
    color: "#fff",
    textDecoration: "none",
  },
};

export default ProductCard;
