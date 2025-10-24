// src/components/chartSetup.js
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
} from "chart.js";

// 🔹 Registra todos os componentes que usamos (sem isso o chart não aparece)
ChartJS.register(ArcElement, Tooltip, Legend, Title, CategoryScale, LinearScale);

export default ChartJS;
