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

          {/* Login Button */}
          <LoginButton />
        </div>
      </nav>

      {/* Main Content with padding for fixed nav */}
      <main className="pt-16">
        <AuthenticatedContent />
      </main>
    </div>
  );
}
