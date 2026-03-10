import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <footer className="border-t border-zinc-800 py-4 text-center text-xs text-zinc-600">
        Made with{" "}
        <span className="text-red-500">♥</span>{" "}
        by{" "}
        <a
          href="https://github.com/francescolaudato"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Francesco Laudato
        </a>
      </footer>
    </div>
  );
}
