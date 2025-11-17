export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      {/* Navigation Bar */}
      <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">
            Skipp
          </div>

          {/* Login Button */}
          <button className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
            Login
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
          <h1 className="text-5xl font-bold text-zinc-900 dark:text-white sm:text-6xl">
            Welcome to Skipp
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Your journey starts here. Discover something amazing.
          </p>
        </div>
      </main>
    </div>
  );
}
