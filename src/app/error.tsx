"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card p-6 text-center max-w-md">
        <div className="text-2xl mb-4 text-red-400">!! ERROR</div>
        <h2 className="text-red-400 text-[11px] mb-3">SOMETHING WENT WRONG</h2>
        <p className="text-[9px] text-gray-400 mb-4">
          {error.message || "An unexpected error occurred while loading the dashboard."}
        </p>
        <button onClick={reset} className="retro-btn">
          TRY AGAIN
        </button>
      </div>
    </div>
  );
}
