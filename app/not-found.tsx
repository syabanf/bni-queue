import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-wit-black text-wit-white px-6 text-center">
      <p className="text-6xl font-extrabold text-gradient">404</p>
      <h1 className="mt-2 text-xl font-bold">Page not found</h1>
      <p className="mt-2 text-sm text-wit-muted">
        That route doesn&apos;t exist in the BNI NatCon passport.
      </p>
      <Link
        href="/leaderboard"
        className="mt-6 rounded-md bg-wit-red text-wit-white font-bold px-5 py-2.5 hover:bg-wit-red-bright transition-colors"
      >
        Go to leaderboard
      </Link>
    </div>
  );
}
