// src/chartSetup.js
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
} from "chart.js";

if (!ChartJS.getChart) {
  ChartJS.register(ArcElement, Tooltip, Legend, Title, CategoryScale, LinearScale);
}

export default ChartJS;
