import { Toaster } from "sonner";
import "./App.css";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { AppRouter } from "./routes/AppRouter";

function App() {
  return (
    <AuthProvider>
      <AppRouter />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}

export default App;
