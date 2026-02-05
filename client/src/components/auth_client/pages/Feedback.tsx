import { useState } from "react";

const Feedback = () => {
  const [rating, setRating] = useState(0);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          We Value Your Feedback
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Help us improve your experience.
        </p>
      </div>

      <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="text-center">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">
              How would you rate your experience?
            </label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-2 rounded-full transition-colors ${
                    rating >= star
                      ? "text-yellow-400"
                      : "text-zinc-300 dark:text-zinc-600"
                  }`}
                >
                  <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Category
            </label>
            <select className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#DD1D25]">
              <option>General Feedback</option>
              <option>Feature Request</option>
              <option>User Interface</option>
              <option>Performance</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Comments
            </label>
            <textarea
              rows={5}
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#DD1D25]"
              placeholder="Tell us what you think..."
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-[#DD1D25] hover:bg-[#C41920] text-white rounded-md text-sm font-medium transition-colors"
          >
            Send Feedback
          </button>
        </form>
      </div>
    </div>
  );
};

export default Feedback;
