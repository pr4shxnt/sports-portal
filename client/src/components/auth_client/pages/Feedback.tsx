import { useState } from "react";
import api from "../../../services/api";
import { toast } from "react-hot-toast";

const Feedback = () => {
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState("General Feedback");
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please provide a rating.");
      return;
    }
    if (!comments.trim()) {
      toast.error("Please provide your comments.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/reports", {
        type: "feedback",
        subject: category,
        description: `Rating: ${rating}/5\n\nComments: ${comments}`,
      });
      toast.success("Thank you for your feedback!");
      setRating(0);
      setCategory("General Feedback");
      setComments("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          We Value Your Feedback
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Help us improve your experience.
        </p>
      </div>

      <div className="max-w-2xl mx-auto p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl">
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="text-center">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-6">
              How would you rate your experience?
            </label>
            <div className="flex justify-center gap-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-1 rounded-full transition-all transform hover:scale-110 ${
                    rating >= star
                      ? "text-yellow-400"
                      : "text-zinc-200 dark:text-zinc-700"
                  }`}
                >
                  <svg
                    className={`w-10 h-10 ${rating >= star ? "fill-current" : "fill-none stroke-current"}`}
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="mt-4 text-sm font-medium text-yellow-600 dark:text-yellow-500">
                {["Poor", "Fair", "Good", "Very Good", "Excellent"][rating - 1]}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Feedback Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#DD1D25] transition-all"
              >
                <option>General Feedback</option>
                <option>Feature Request</option>
                <option>User Interface</option>
                <option>Performance</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Detailed Comments
              </label>
              <textarea
                rows={5}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#DD1D25] transition-all"
                placeholder="What can we do to make your experience better?"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-[#DD1D25] hover:bg-[#C41920] text-white rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-red-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending...
              </>
            ) : (
              "Send Feedback"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Feedback;
