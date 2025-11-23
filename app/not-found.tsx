import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-2 sm:space-y-3 md:space-y-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          404 - Page Not Found
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    </div>
  );
}

