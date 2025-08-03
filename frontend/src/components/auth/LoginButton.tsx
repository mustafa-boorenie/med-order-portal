import { useUser } from '../../app/providers';
import Link from 'next/link';

export function LoginButton() {
  const { user, isLoading } = useUser();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {!user ? (
        <Link
          href="/api/auth/login"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Log In
        </Link>
      ) : (
        <div className="flex items-center gap-4">
          <span>Welcome, {user.name}!</span>
          <Link
            href="/api/auth/logout"
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Log Out
          </Link>
        </div>
      )}
    </div>
  );
}