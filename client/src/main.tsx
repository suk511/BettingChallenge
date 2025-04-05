import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add custom styles for the game
const customStyles = document.createElement('style');
customStyles.textContent = `
  body {
    font-family: 'Roboto', sans-serif;
    background-color: #f0f2f5;
  }
  .countdown-animation {
    stroke-dasharray: 283;
    transition: stroke-dashoffset 1s linear;
  }
  .material-icons {
    font-family: 'Material Icons';
    font-weight: normal;
    font-style: normal;
    font-size: 24px;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -webkit-font-feature-settings: 'liga';
    -webkit-font-smoothing: antialiased;
  }
  .font-montserrat {
    font-family: 'Montserrat', sans-serif;
  }
  :root {
    --primary: 231 48% 48%;
    --secondary: 0 79% 58%;
    --accent: 122 39% 49%;
    --violet: 291 76% 42%;
  }
`;
document.head.appendChild(customStyles);

createRoot(document.getElementById("root")!).render(<App />);
