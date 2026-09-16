import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

const RADIUS = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function BackToTop() {
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setShow(scrollTop > 300);

      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const p = scrollHeight > 0 ? Math.min(scrollTop / scrollHeight, 1) : 0;
      setProgress(p);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!show) return null;

  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-card/95 text-foreground shadow-lg backdrop-blur transition hover:bg-card"
      aria-label="Back to top"
    >
      <svg
        className="absolute inset-0 h-full w-full -rotate-90"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="text-primary transition-none"
        />
      </svg>
      <ChevronUp size={20} className="relative" />
    </button>
  );
}
