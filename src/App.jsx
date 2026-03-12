import { RouterProvider } from "react-router";
import { router } from "./routes/index";
import "./assets/scss/all.scss";
import MessageToast from "./components/MessageToast";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <MessageToast />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
