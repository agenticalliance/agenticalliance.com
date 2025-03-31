import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Renders the fixed website header.
 * Features a logo/title and a contact button.
 * Changes appearance on scroll for better visibility.
 */
export const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/90 backdrop-blur-md py-3 shadow-md" : "bg-transparent py-5"
      }`}
    >
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
          <span className="font-bold text-xl tracking-tight">Agentic Alliance</span>
        </div>
        
        <Button variant="ghost" asChild>
          <a href="mailto:info@agenticalliance.com">Contact</a>
        </Button>
      </div>
    </header>
  );
};
