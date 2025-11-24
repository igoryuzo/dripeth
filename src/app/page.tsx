import LoginButton from '@/components/login-button';
import AuthenticatedContent from '@/components/authenticated-content';

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Floating Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-[var(--glass-border)]">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 sm:px-6 py-3">
          {/* Logo with subtle gradient */}
          <div className="text-xl sm:text-2xl font-semibold tracking-tight bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            ethdca
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* GitHub Link - Secondary CTA */}
            <a
              href="https://github.com/igoryuzo/ethdca"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-[0.98]"
            >
              <img 
                src="/github.svg" 
                alt="GitHub" 
                className="w-4 h-4 opacity-70 dark:invert"
              />
              <span>Contribute</span>
            </a>
            
            {/* Login Button - Primary CTA */}
            <LoginButton />
          </div>
        </div>
      </nav>

      {/* Main Content with padding for fixed nav */}
      <main className="pt-16">
        <AuthenticatedContent />
      </main>
    </div>
  );
}
