import { useEffect, useRef, useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

// ───────────────────── Floating Petals / Hearts ─────────────────────
function FloatingParticles() {
  const [particles, setParticles] = useState<
    { id: number; x: number; delay: number; duration: number; size: number; emoji: string }[]
  >([]);

  useEffect(() => {
    const emojis = ["❤️", "🌹", "💕", "💖", "🌸", "✨", "💫", "🌺", "💗", "💝"];
    const p = Array.from({ length: 22 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 8 + Math.random() * 10,
      size: 0.8 + Math.random() * 1.2,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));
    setParticles(p);
  }, []);

  return (
    <div className="starfield" aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className="rose-petal select-none"
          style={{
            left: `${p.x}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            fontSize: `${p.size}rem`,
            bottom: "-5%",
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}

// ───────────────────── Stars ─────────────────────
function Stars() {
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 2,
    delay: Math.random() * 5,
    duration: 2 + Math.random() * 4,
  }));

  return (
    <div className="starfield" aria-hidden>
      {stars.map((s) => (
        <div
          key={s.id}
          className="animate-star absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// ───────────────────── Section Reveal Hook ─────────────────────
function useSectionReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".section-reveal");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// ───────────────────── 3D Tilt Card ─────────────────────
function TiltCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `perspective(900px) rotateY(${x * 18}deg) rotateX(${-y * 12}deg) translateZ(16px)`;
  };

  const handleLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg) translateZ(0px)";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`transition-shadow duration-300 ${className}`}
      style={{ transformStyle: "preserve-3d", transition: "transform 0.15s ease, box-shadow 0.3s ease" }}
    >
      {children}
    </div>
  );
}

// ───────────────────── 3D Heart SVG ─────────────────────
function Heart3D({ size = 60, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 90"
      width={size}
      height={size}
      className={className}
      style={{ filter: "drop-shadow(0 0 12px rgba(220,50,100,0.9)) drop-shadow(0 6px 16px rgba(180,20,70,0.6))" }}
    >
      <defs>
        <radialGradient id="hg" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ff8fab" />
          <stop offset="40%" stopColor="#e91e8c" />
          <stop offset="100%" stopColor="#7b0042" />
        </radialGradient>
        <radialGradient id="hg2" cx="70%" cy="20%" r="30%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <path
        d="M50 85 C50 85 5 55 5 28 C5 12 17 2 30 2 C38 2 45 7 50 13 C55 7 62 2 70 2 C83 2 95 12 95 28 C95 55 50 85 50 85Z"
        fill="url(#hg)"
      />
      <path
        d="M50 85 C50 85 5 55 5 28 C5 12 17 2 30 2 C38 2 45 7 50 13 C55 7 62 2 70 2 C83 2 95 12 95 28 C95 55 50 85 50 85Z"
        fill="url(#hg2)"
      />
    </svg>
  );
}

// ───────────────────── Sparkle ─────────────────────
function Sparkle({ style }: { style?: React.CSSProperties }) {
  return (
    <span
      className="absolute text-yellow-300 animate-sparkle select-none pointer-events-none"
      style={{ fontSize: "1.2rem", ...style }}
    >
      ✦
    </span>
  );
}

// ───────────────────── HERO SECTION ─────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* Deep gradient background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(180,30,80,0.35) 0%, rgba(100,10,60,0.2) 50%, transparent 100%), linear-gradient(160deg, #0f0018 0%, #1a0030 40%, #0d001a 100%)",
        }}
      />

      {/* Orbiting hearts */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 pointer-events-none" aria-hidden>
        {[0, 72, 144, 216, 288].map((deg, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              animation: `orbitHeart ${14 + i * 2}s linear infinite`,
              animationDelay: `${i * -2.5}s`,
              transformOrigin: "0 0",
              opacity: 0.4 + i * 0.08,
            }}
          >
            <Heart3D size={16 + i * 4} />
          </div>
        ))}
      </div>

      {/* Sparkles */}
      <Sparkle style={{ top: "20%", left: "15%", animationDelay: "0s" }} />
      <Sparkle style={{ top: "35%", right: "18%", animationDelay: "0.7s" }} />
      <Sparkle style={{ bottom: "30%", left: "22%", animationDelay: "1.4s" }} />
      <Sparkle style={{ top: "15%", right: "30%", animationDelay: "2.1s" }} />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-4xl">
        {/* 3D Main Heart */}
        <div className="animate-heartbeat mb-2">
          <Heart3D size={110} />
        </div>

        {/* Script sub-heading */}
        <p
          className="font-script text-3xl md:text-4xl text-rose-300 animate-fade-in-up"
          style={{ animationDelay: "0.2s", textShadow: "0 0 30px rgba(255,100,150,0.6)" }}
        >
          A message from the heart…
        </p>

        {/* Main title */}
        <h1
          className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold leading-tight animate-fade-in-up"
          style={{ animationDelay: "0.5s" }}
        >
          <span className="text-shimmer">You Are My</span>
          <br />
          <span className="text-gradient-love animate-text-glow">Everything</span>
        </h1>

        <p
          className="font-serif italic text-rose-200/80 text-xl md:text-2xl max-w-2xl leading-relaxed animate-fade-in-up"
          style={{ animationDelay: "0.8s" }}
        >
          "In all the world, there is no heart for me like yours. In all the world, there is no love for you like mine."
        </p>

        <div className="animate-fade-in-up flex gap-4 items-center" style={{ animationDelay: "1.1s" }}>
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-rose-500" />
          <span className="text-rose-400 font-script text-xl">— Maya Angelou</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-rose-500" />
        </div>

        <a
          href="#story"
          className="animate-fade-in-up mt-4 px-10 py-4 rounded-full font-semibold text-white tracking-wider transition-all duration-300 hover:scale-105"
          style={{
            animationDelay: "1.3s",
            background: "linear-gradient(135deg, #e91e8c, #c2185b)",
            boxShadow: "0 0 30px rgba(233,30,140,0.5), 0 8px 20px rgba(0,0,0,0.4)",
          }}
        >
          Explore Our Story ❤️
        </a>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 scroll-indicator text-rose-400 opacity-60">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-light tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-rose-400 to-transparent" />
        </div>
      </div>
    </section>
  );
}

// ───────────────────── LOVE STORY SECTION ─────────────────────
const moments = [
  {
    emoji: "🌟",
    date: "The Beginning",
    title: "First Hello",
    desc: "That magical moment when our eyes first met — a heartbeat that changed everything. The world slowed down, and I knew you were someone extraordinary.",
    color: "from-rose-500/30 to-pink-600/20",
  },
  {
    emoji: "🌹",
    date: "First Date",
    title: "Under the Stars",
    desc: "Our first night together, talking endlessly, laughing at everything and nothing. I looked at you and thought — I could do this forever.",
    color: "from-purple-500/30 to-rose-500/20",
  },
  {
    emoji: "💌",
    date: "Growing Together",
    title: "Every Day Better",
    desc: "Through every sunrise and sunset, every adventure and quiet moment at home — you make ordinary days feel like poetry.",
    color: "from-pink-500/30 to-purple-500/20",
  },
  {
    emoji: "💖",
    date: "Today & Always",
    title: "My Greatest Love",
    desc: "You are my home, my peace, my greatest adventure. Every moment with you is a treasure I hold close to my heart.",
    color: "from-rose-600/30 to-pink-400/20",
  },
];

function LoveStory() {
  useSectionReveal();

  return (
    <section id="story" className="relative py-32 px-6 overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 60% at 50% 50%, rgba(100,0,60,0.25) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Heading */}
        <div className="section-reveal text-center mb-20">
          <p className="font-script text-rose-400 text-2xl mb-3">Our Beautiful Journey</p>
          <h2 className="font-serif text-5xl md:text-6xl font-bold text-gradient-love mb-4">
            Our Love Story
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-rose-500" />
            <Heart3D size={24} />
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-rose-500" />
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Center line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px timeline-line hidden md:block" />

          <div className="flex flex-col gap-16">
            {moments.map((m, i) => (
              <div
                key={i}
                className={`section-reveal flex flex-col md:flex-row items-center gap-8 ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}
                style={{ transitionDelay: `${i * 0.15}s` }}
              >
                {/* Card */}
                <div className="flex-1 perspective-container">
                  <TiltCard>
                    <div
                      className={`glass-card-strong rounded-3xl p-8 relative ribbon overflow-hidden bg-gradient-to-br ${m.color}`}
                    >
                      <Sparkle style={{ top: "12px", right: "16px", animationDelay: `${i * 0.4}s` }} />
                      <span className="text-4xl mb-4 block">{m.emoji}</span>
                      <p className="font-script text-rose-400 text-lg mb-1">{m.date}</p>
                      <h3 className="font-serif text-3xl font-bold text-white mb-3">{m.title}</h3>
                      <p className="text-rose-100/80 leading-relaxed text-base">{m.desc}</p>
                    </div>
                  </TiltCard>
                </div>

                {/* Center node */}
                <div className="hidden md:flex items-center justify-center w-16 h-16 rounded-full glass-card-strong border border-rose-500/50 z-10 shrink-0">
                  <Heart3D size={28} />
                </div>

                {/* Spacer */}
                <div className="flex-1 hidden md:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ───────────────────── REASONS SECTION ─────────────────────
const reasons = [
  { icon: "🌙", text: "Teri hansi se poori duniya roshan ho jaati hai" },
  { icon: "☀️", text: "Tumhe hamesha pata hota hai kya kehna hai" },
  { icon: "🎵", text: "Tere saath naachna bilkul udne jaisa lagta hai" },
  { icon: "🌊", text: "Teri daryaadili kisi bhi samundar se gehri hai" },
  { icon: "🔥", text: "Tum mujhe roz apna best version banne ki inspiration dete ho" },
  { icon: "🌸", text: "Teri har jhappi mein ghar jaisa sukoon milta hai" },
  { icon: "⭐", text: "Tum har cheez mein khubsurti dhundh lete ho" },
  { icon: "🦋", text: "Tum aam lamhon ko bhi jadui bana dete ho" },
  { icon: "🌈", text: "Teri muskaan is poori duniya mein meri sabse pyaari cheez hai" },
];

function ReasonsSection() {
  return (
    <section className="relative py-32 px-6 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 30% 50%, rgba(80,0,120,0.3) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 50%, rgba(180,10,80,0.2) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="section-reveal text-center mb-16">
          <p className="font-script text-rose-400 text-2xl mb-3">The Little Things</p>
          <h2 className="font-serif text-5xl md:text-6xl font-bold text-white mb-2">
            Why I Love <span className="text-gradient-love">You</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((r, i) => (
            <div
              key={i}
              className="section-reveal perspective-container"
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <TiltCard>
                <div
                  className="glass-card rounded-2xl p-6 flex items-start gap-4 hover:border-rose-400/50 transition-colors duration-300"
                  style={{ minHeight: "110px" }}
                >
                  <span className="text-3xl shrink-0 animate-drift" style={{ animationDelay: `${i * 0.3}s` }}>
                    {r.icon}
                  </span>
                  <p className="text-rose-100/90 font-serif italic text-base leading-relaxed pt-1">{r.text}</p>
                </div>
              </TiltCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────────────────── PROMISE SECTION ─────────────────────
function PromiseSection() {
  const promises = [
    "I promise to love you on your hardest days",
    "I promise to be your safe place always",
    "I promise to choose you, every single day",
    "I promise to make you laugh until it hurts",
    "I promise to grow old with you, hand in hand",
  ];

  return (
    <section className="relative py-32 px-6 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% 50%, rgba(140,0,80,0.3) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div className="section-reveal">
          <Heart3D size={80} className="mx-auto mb-8 animate-heartbeat" />
          <p className="font-script text-rose-400 text-2xl mb-3">From My Heart to Yours</p>
          <h2 className="font-serif text-5xl md:text-6xl font-bold text-gradient-gold mb-12">
            My Promises to You
          </h2>
        </div>

        <TiltCard className="section-reveal">
          <div className="glass-card-strong glow-card rounded-3xl p-10 md:p-16 ribbon">
            <div className="flex flex-col gap-8">
              {promises.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-5 text-left section-reveal"
                  style={{ transitionDelay: `${i * 0.12}s` }}
                >
                  <Heart3D size={22} className="shrink-0 animate-heartbeat" />
                  <p className="font-serif italic text-xl md:text-2xl text-rose-100 leading-snug">{p}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-rose-500/20">
              <p className="font-script text-rose-300 text-3xl">With all my love, forever 💕</p>
            </div>
          </div>
        </TiltCard>
      </div>
    </section>
  );
}

// ───────────────────── FINAL MESSAGE ─────────────────────
function FinalMessage() {
  return (
    <section className="relative py-32 px-6 overflow-hidden text-center">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 50% 100%, rgba(180,10,80,0.4) 0%, rgba(100,0,60,0.3) 40%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="section-reveal">
          {/* Large 3D Heart */}
          <div className="flex justify-center mb-10">
            <div className="animate-heartbeat">
              <Heart3D size={130} />
            </div>
          </div>

          <h2 className="font-serif text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            You are my{" "}
            <span className="text-shimmer">universe</span>
          </h2>

          <p className="font-serif italic text-rose-200/80 text-xl md:text-2xl leading-relaxed mb-10">
            No matter where life takes us, know that you are cherished beyond words.
            You are my greatest adventure, my softest landing, and my brightest star.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div
              className="px-10 py-4 rounded-full font-semibold text-white text-lg cursor-default transition-all duration-300 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #e91e8c, #7b0042)",
                boxShadow: "0 0 40px rgba(233,30,140,0.5)",
              }}
            >
              ❤️ I love you to infinity
            </div>
          </div>

          {/* Stars row */}
          <div className="flex justify-center gap-3 mt-14 text-3xl">
            {["💖", "🌹", "✨", "💫", "🌹", "💖"].map((e, i) => (
              <span
                key={i}
                className="animate-sparkle"
                style={{ animationDelay: `${i * 0.25}s` }}
              >
                {e}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ───────────────────── MAIN HOME PAGE ─────────────────────
function Home() {
  useSectionReveal();

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(160deg, #0f0018 0%, #1a0030 40%, #0d001a 100%)" }}
    >
      <Stars />
      <FloatingParticles />
      <Hero />
      <LoveStory />
      <ReasonsSection />
      <PromiseSection />
      <FinalMessage />

      {/* Footer */}
      <footer className="relative z-10 text-center py-10 border-t border-rose-900/30">
        <p className="font-script text-rose-400 text-xl">Made with ❤️ and endless love</p>
      </footer>
    </div>
  );
}

// ───────────────────── ROUTER & APP ─────────────────────
function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
