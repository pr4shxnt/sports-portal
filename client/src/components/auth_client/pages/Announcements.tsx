import { useState, useEffect } from "react";
import api from "../../../services/api";
import { format } from "date-fns";
import { useAppSelector } from "../../../store/hooks";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAppSelector((state) => state.auth);

  const canCreate = user?.role === "admin" || user?.role === "superuser";

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get("/announcements");
      setAnnouncements(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      setSubmitting(true);
      await api.post("/announcements", { title, content });
      setTitle("");
      setContent("");
      setShowCreateModal(false);
      fetchAnnouncements();
    } catch (error) {
      console.error("Error creating announcement:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this announcement?"))
      return;
    try {
      await api.delete(`/announcements/${id}`);
      fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
            Club Announcements
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Stay updated with the latest news and updates.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2.5 bg-[#DD1D25] text-white rounded-xl font-bold shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Post Announcement
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#DD1D25]"></div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-zinc-300 dark:text-zinc-700 mb-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.5 0 4.5 2 4.5 4.5V17z" />
          </svg>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg text-center">
            No announcements at the moment. Check back later!
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {announcements.map((ann) => (
            <div
              key={ann._id}
              className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:shadow-red-500/5 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-[#DD1D25] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>

              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                    {ann.title}
                  </h2>
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                    <span>By {ann.author.name}</span>
                    <span>•</span>
                    <span>
                      {format(new Date(ann.createdAt), "MMMM d, yyyy")}
                    </span>
                  </div>
                </div>
                {user?.role === "admin" && (
                  <button
                    onClick={() => handleDelete(ann._id)}
                    className="p-2 text-zinc-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all opacity-0 group-hover:opacity-100"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {ann.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 pb-4 flex items-center justify-between">
              <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                Post New Update
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-8 pt-4 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-zinc-400 uppercase tracking-widest px-1">
                    Title
                  </label>
                  <input
                    type="text"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#DD1D25] dark:text-zinc-100 transition-all font-semibold"
                    placeholder="Enter announcement title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-zinc-400 uppercase tracking-widest px-1">
                    Content
                  </label>
                  <textarea
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#DD1D25] dark:text-zinc-100 transition-all min-h-[160px] resize-none font-medium"
                    placeholder="Write your announcement message here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3.5 text-zinc-500 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-2xl transition-all"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3.5 bg-[#DD1D25] text-white rounded-2xl font-black shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {submitting ? "Publishing..." : "Publish Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
