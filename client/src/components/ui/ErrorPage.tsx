import React from "react";
import { Link, useRouteError, isRouteErrorResponse } from "react-router-dom";

const ErrorPage: React.FC = () => {
  const error = useRouteError();
  console.error(error);

  let statusText = "Page Not Found";
  let message = "The page you are looking for doesn't exist or has been moved.";

  if (isRouteErrorResponse(error)) {
    if (error.status !== 404) {
      statusText = `Error ${error.status}`;
      message = error.statusText || message;
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
      <div className="relative mb-8">
        <h1 className="text-9xl font-black tracking-tighter text-white/5 select-none">
          {isRouteErrorResponse(error) ? error.status : "500"}
        </h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-24 w-1 bg-[#DD1D25] blur-sm"></div>
        </div>
      </div>

      <div className="max-w-md space-y-4">
        <h2 className="text-3xl font-bold tracking-tight text-white">
          {statusText}
        </h2>
        <p className="text-zinc-400">{message}</p>
      </div>

      <div className="mt-10">
        <Link
          to="/dashboard"
          className="inline-flex h-11 items-center justify-center rounded-full bg-white px-8 text-sm font-bold text-black transition-transform hover:scale-105 active:scale-95"
        >
          Return to Dashboard
        </Link>
      </div>

      <div className="absolute bottom-8 text-xs text-zinc-600 uppercase tracking-[0.2em]">
        SSRC Sports Portal &copy; 2026
      </div>
    </div>
  );
};

export default ErrorPage;
