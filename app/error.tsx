'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-2 sm:space-y-3 md:space-y-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Something went wrong!
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

