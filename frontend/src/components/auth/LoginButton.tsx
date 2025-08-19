import { useUser } from '../../app/providers';
import Link from 'next/link';

export function LoginButton() {
  const { user, isLoading } = useUser();

  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {!user ? (
        <Link
          href="/api/auth/login"
          className="bg-black hover:bg-neutral-900 text-white font-bold py-2 px-4 rounded"
        >
          Log In
        </Link>
      ) : (
        <div className="flex items-center gap-4">
          <Link href="/admin" className="hover:underline">
            Admin Portal
          </Link>
          <button
            onClick={handleLogout}
            className="bg-neutral-800 hover:bg-black text-white font-bold py-2 px-4 rounded"
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}