import LoginButton from '@/components/login-button';
import AuthenticatedContent from '@/components/authenticated-content';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      {/* Navigation Bar */}
      <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">
            ethdca
          </div>

          {/* Login Button */}
          <LoginButton />
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-16">
        <AuthenticatedContent />
      </main>
    </div>
  );
}
