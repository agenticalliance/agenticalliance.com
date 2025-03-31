import { AILOGO } from "@/components/AILOGO";
import { EmailSignupForm } from "@/components/EmailSignupForm";
import { Header } from "@/components/Header";
import skillsData from "@/data/skills.json";

/**
 * Represents the main index/home page of the website.
 * Features a hero section with the AILOGO visualization,
 * an email signup form, and a standard footer.
 */
const Index = () => {
  // Load skills from JSON file
  const skills = skillsData.scope;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <Header />
      
      {/* Hero section with AILOGO */}
      <section className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center">
        {/* AILOGO container */}
        <div className="absolute inset-0 z-0">
          <AILOGO skills={skills} />
        </div>
        
        {/* Content overlay */}
        <div className="container relative z-10 mt-16 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in bg-gradient-to-r from-[#00e6ff] to-[#008b99] inline-block text-transparent bg-clip-text animate-text-shimmer bg-300% max-w-3xl">
            AGENTIC ALLIANCE
          </h1>
          <p className="text-lg md:text-xl text-[#e1e1e1] max-w-2xl mb-12 animate-fade-in">
            Creating the Future of Agentic AI
          </p>
        </div>
      </section>
      
      {/* Removed Email signup section */}

      {/* Added Features Section from old site */}
      <section className="features container mx-auto py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="feature-card bg-gray-800/50 p-6 rounded-lg border border-cyan-400/20 hover:shadow-cyan-400/20 hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-cyan-400 text-xl font-semibold mb-3">Research Hub</h3>
            <p className="text-gray-300">
              Dive into groundbreaking research on Agentic Systems and AI
              frameworks. Get early access to emerging technologies and contribute
              to defining industry standards.
            </p>
          </div>
          <div className="feature-card bg-gray-800/50 p-6 rounded-lg border border-cyan-400/20 hover:shadow-cyan-400/20 hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-cyan-400 text-xl font-semibold mb-3">Community</h3>
            <p className="text-gray-300">
              Join a thriving ecosystem of AI innovators. Collaborate on
              cutting-edge projects, share breakthroughs, and accelerate your
              growth with state-of-the-art learning.
            </p>
          </div>
          <div className="feature-card bg-gray-800/50 p-6 rounded-lg border border-cyan-400/20 hover:shadow-cyan-400/20 hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-cyan-400 text-xl font-semibold mb-3">Documentation</h3>
            <p className="text-gray-300">
              Access battle-tested implementation guides and reference
              architectures. Learn from real-world case studies and industry best
              practices to build robust Agentic Systems.
            </p>
          </div>
        </div>
      </section>

      {/* Added CTA Section from old site */}
      <section className="cta text-center py-20 bg-gradient-to-b from-black/5 to-cyan-400/10">
        <div className="container mx-auto">
          <h2 className="text-3xl font-semibold mb-4">Start Building Today</h2>
          <p className="text-lg text-gray-300 mb-8">Join the pioneers defining the future of Agentic AI</p>
          <a
            href="https://github.com/agenticalliance/agenticalliance.com"
            target="_blank" 
            rel="noopener noreferrer"
            className="button inline-block px-10 py-3 bg-cyan-400 text-black rounded-full font-bold hover:opacity-90 transition-opacity"
          >
            Get Started
          </a>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 bg-[#0a1419]">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center border-t border-[#00e6ff]/20 pt-8">
            <p className="text-sm text-[#e1e1e1]">
              &copy; 2024 Agentic Alliance. Advancing the future of Agentic Systems.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
