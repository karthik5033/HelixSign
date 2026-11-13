import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#131316] text-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-6xl font-bold text-[#FF5500]">404</h1>
      <p className="mt-4 text-zinc-400 text-lg">Page not found</p>
      <Link
        href="/"
        className="mt-6 px-4 py-2 bg-[#FF5500] hover:bg-[#E54B00] text-white font-semibold rounded-lg text-sm"
      >
        Return Home
      </Link>
    </div>
  );
}

