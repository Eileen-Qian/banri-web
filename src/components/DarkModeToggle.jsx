import { useTheme } from "../context/ThemeContext";

function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      className="btn btn-link nav-link px-2 py-1 dark-mode-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? "切換至白天模式" : "切換至深色模式"}
      title={isDark ? "Light mode" : "Dark mode"}
      type="button"
    >
      <i className={isDark ? "bi bi-sun-fill" : "bi bi-moon-fill"} />
    </button>
  );
}

export default DarkModeToggle;
