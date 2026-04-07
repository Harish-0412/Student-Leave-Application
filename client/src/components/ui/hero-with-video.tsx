import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../next/next-themes';
import {
  Play,
  Pause,
  Mail,
  ArrowRight,
  Menu,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';

interface NavbarHeroProps {
  brandName?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroDescription?: string;
  backgroundImage?: string;
  videoUrl?: string;
  emailPlaceholder?: string;
  ctaLabel?: string;
  onEmailSubmit?: (email: string) => void;
  onLoginClick?: () => void;
  greetingEmail?: string;
}

const NavbarHero: React.FC<NavbarHeroProps> = ({
  brandName = 'nexus',
  heroTitle = 'Innovation Meets Simplicity',
  heroSubtitle = 'Join the community',
  heroDescription = 'Discover cutting-edge solutions designed for the modern digital landscape.',
  backgroundImage = 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2072&q=80',
  videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  emailPlaceholder = 'enter@email.com',
  ctaLabel = 'Enter the Scheduler',
  onEmailSubmit,
  onLoginClick,
  greetingEmail,
}) => {
  const [email, setEmail] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [emailError, setEmailError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      void videoRef.current.play().catch(() => {
        setIsVideoPlaying(true);
      });
    }
  }, []);

  const handleEmailSubmit = () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setEmailError('');

    if (onEmailSubmit) {
      onEmailSubmit(trimmedEmail);
      return;
    }

    console.log('Email submitted:', trimmedEmail);
  };

  const toggleDropdown = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  const handlePlayVideo = () => {
    if (videoRef.current) {
      void videoRef.current.play();
      setIsVideoPlaying(true);
      setIsVideoPaused(false);
    }
  };

  const handlePauseVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsVideoPaused(true);
    }
  };

  const handleResumeVideo = () => {
    if (videoRef.current) {
      void videoRef.current.play();
      setIsVideoPaused(false);
    }
  };

  const handleVideoEnded = () => {
    if (videoRef.current) {
      void videoRef.current.play();
      setIsVideoPlaying(true);
      setIsVideoPaused(false);
    }
  };

  const ThemeToggleButton = () => {
    if (!mounted) return <div className="h-10 w-10" />;

    return (
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="bg-muted hover:bg-border flex-shrink-0 rounded-full p-2.5 transition-colors"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? (
          <Moon className="h-5 w-5 text-foreground" />
        ) : (
          <Sun className="h-5 w-5 text-foreground" />
        )}
      </button>
    );
  };

  return (
    <main className="absolute inset-0 bg-background overflow-y-auto">
      <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="py-2 relative z-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="cursor-pointer flex-shrink-0 pb-1 text-2xl font-bold text-foreground"
            >
              {brandName}
            </a>
            <nav className="hidden font-medium text-muted-foreground lg:flex">
              <ul className="flex items-center space-x-2">
                <li>
                  <a
                    href="#"
                    className="rounded-lg px-3 py-2 text-sm transition-colors hover:text-foreground"
                  >
                    About
                  </a>
                </li>
                <li className="relative">
                  <button
                    onClick={() => toggleDropdown('desktop-resources')}
                    className="flex items-center rounded-lg px-3 py-2 text-sm transition-colors hover:text-foreground"
                  >
                    Resources
                    <ChevronDown
                      className={`ml-1 h-4 w-4 transition-transform ${
                        openDropdown === 'desktop-resources' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openDropdown === 'desktop-resources' && (
                    <ul className="absolute left-0 top-full z-20 mt-2 w-48 rounded-xl border border-border bg-card p-2 shadow-lg">
                      <li>
                        <a
                          href="#"
                          className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          Submenu 1
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          Submenu 2
                        </a>
                      </li>
                    </ul>
                  )}
                </li>
                <li>
                  <a
                    href="#"
                    className="rounded-lg px-3 py-2 text-sm transition-colors hover:text-foreground"
                  >
                    Blog
                  </a>
                </li>
                <li className="relative">
                  <button
                    onClick={() => toggleDropdown('desktop-pricing')}
                    className="flex items-center rounded-lg px-3 py-2 text-sm transition-colors hover:text-foreground"
                  >
                    Plans & Pricing
                    <ChevronDown
                      className={`ml-1 h-4 w-4 transition-transform ${
                        openDropdown === 'desktop-pricing' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openDropdown === 'desktop-pricing' && (
                    <ul className="absolute left-0 top-full z-20 mt-2 w-48 rounded-xl border border-border bg-card p-2 shadow-lg">
                      <li>
                        <a
                          href="#"
                          className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          Plan A
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          Plan B
                        </a>
                      </li>
                    </ul>
                  )}
                </li>
              </ul>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 lg:flex">
              {greetingEmail ? (
                <div className="py-2 px-4 text-sm capitalize font-medium text-foreground rounded-xl">
                  Hello, {greetingEmail}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="text-foreground hover:text-muted-foreground cursor-pointer py-2 px-4 text-sm capitalize font-medium transition-colors rounded-xl"
                >
                  Login
                </button>
              )}
              <button
                onClick={handleEmailSubmit}
                className="bg-foreground hover:bg-muted-foreground text-background py-2.5 px-5 text-sm rounded-xl capitalize font-medium transition-colors flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <ThemeToggleButton />
            <div className="relative lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="bg-transparent hover:bg-muted border-none p-2 rounded-xl transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>
              {isMobileMenuOpen && (
                <ul className="absolute top-full right-0 mt-2 p-2 shadow-lg bg-card border border-border rounded-xl w-56 z-30">
                  <li>
                    <a
                      href="#"
                      className="block rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      About
                    </a>
                  </li>
                  <li>
                    <button
                      onClick={() => toggleDropdown('mobile-resources')}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      Resources
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          openDropdown === 'mobile-resources' ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openDropdown === 'mobile-resources' && (
                      <ul className="ml-4 mt-1 border-l border-border pl-3">
                        <li>
                          <a
                            href="#"
                            className="block rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            Submenu 1
                          </a>
                        </li>
                        <li>
                          <a
                            href="#"
                            className="block rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            Submenu 2
                          </a>
                        </li>
                      </ul>
                    )}
                  </li>
                  <li>
                    <a
                      href="#"
                      className="block rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      Blog
                    </a>
                  </li>
                  <li>
                    <button
                      onClick={() => toggleDropdown('mobile-pricing')}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      Plans & Pricing
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          openDropdown === 'mobile-pricing' ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openDropdown === 'mobile-pricing' && (
                      <ul className="ml-4 mt-1 border-l border-border pl-3">
                        <li>
                          <a
                            href="#"
                            className="block rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            Plan A
                          </a>
                        </li>
                        <li>
                          <a
                            href="#"
                            className="block rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            Plan B
                          </a>
                        </li>
                      </ul>
                    )}
                  </li>
                  <li className="mt-2 space-y-2 border-t border-border pt-2">
                    {greetingEmail ? (
                      <div className="block w-full rounded-lg px-3 py-2 text-center text-sm text-foreground">
                        Hello, {greetingEmail}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={onLoginClick}
                        className="block w-full text-center px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg"
                      >
                        Login
                      </button>
                    )}
                    <button
                      onClick={handleEmailSubmit}
                      className="w-full bg-foreground text-background hover:bg-muted-foreground px-3 py-2.5 text-sm rounded-lg flex items-center justify-center gap-2 font-medium"
                    >
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 pb-10 sm:pt-6 sm:pb-12 text-center">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl sm:text-5xl md:text-5xl text-foreground font-bold tracking-tight">
              {heroTitle}
            </h1>
            {heroSubtitle ? (
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                {heroSubtitle}
              </p>
            ) : null}
            <p className="mt-6 text-lg text-muted-foreground">{heroDescription}</p>
            <div className="mt-8 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <input
                  type="email"
                  placeholder={emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full max-w-xs bg-muted border-border text-foreground placeholder-muted-foreground font-medium pl-10 pr-4 py-2 text-sm sm:pl-11 sm:py-3 sm:text-base rounded-full focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                onClick={handleEmailSubmit}
                className="bg-foreground hover:bg-muted-foreground text-background px-5 py-2 text-sm sm:px-6 sm:py-3 sm:text-base rounded-full normal-case font-medium transition-colors flex items-center gap-2"
              >
                {ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            {emailError ? (
              <p className="mt-3 text-sm text-red-500">{emailError}</p>
            ) : null}
          </div>
        </div>

        <header className="relative w-full aspect-video rounded-3xl overflow-hidden">
          <img
            src={backgroundImage}
            alt="Earth from space at night"
            className={`w-full h-full absolute inset-0 object-cover transition-opacity duration-500 ${
              isVideoPlaying ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <video
            ref={videoRef}
            src={videoUrl}
            className={`w-full h-full absolute inset-0 object-cover transition-opacity duration-500 ${
              isVideoPlaying ? 'opacity-100' : 'opacity-0'
            }`}
            onEnded={handleVideoEnded}
            playsInline
            muted
            autoPlay
            loop
          />
          <div className="absolute bottom-5 right-5 z-10">
            {!isVideoPlaying ? (
              <button
                onClick={handlePlayVideo}
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all duration-200 shadow-lg"
              >
                <Play className="ml-1 h-7 w-7 fill-white text-white" />
              </button>
            ) : (
              <button
                onClick={isVideoPaused ? handleResumeVideo : handlePauseVideo}
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all duration-200 shadow-lg"
              >
                {isVideoPaused ? (
                  <Play className="ml-1 h-7 w-7 fill-white text-white" />
                ) : (
                  <Pause className="h-7 w-7 fill-white text-white" />
                )}
              </button>
            )}
          </div>
        </header>
      </div>
    </main>
  );
};

export { NavbarHero };
