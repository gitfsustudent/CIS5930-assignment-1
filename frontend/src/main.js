import { renderNetwork } from "./network.js";
import "./style.css";

const svgElement = document.querySelector("#network-svg");

fetch("http://127.0.0.1:5000/api/network")
  .then((res) => res.json())
  .then((data) => {
    console.log("Loaded network:", data.nodes.length, "nodes,", data.links.length, "links");
    renderNetwork(svgElement, data);
  })
  .catch((err) => {
    console.error("Failed to load network data:", err);
  });