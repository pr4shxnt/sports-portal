const ReportBug = () => {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Report a Bug
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Found an issue? Let us know so we can fix it.
        </p>
      </div>

      <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Issue Title
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#DD1D25]"
              placeholder="e.g., Login button not working"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Severity
            </label>
            <select className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#DD1D25]">
              <option>Low - Cosmetic issue</option>
              <option>Medium - Feature not working as expected</option>
              <option>High - System crash or data loss</option>
              <option>Critical - Security vulnerability</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Description
            </label>
            <textarea
              rows={5}
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#DD1D25]"
              placeholder="Please describe the steps to reproduce the issue..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Attachments (Optional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-zinc-300 dark:border-zinc-700 border-dashed rounded-md hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-zinc-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="relative cursor-pointer bg-transparent rounded-md font-medium text-[#DD1D25] hover:text-[#C41920] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#DD1D25]">
                    Upload a file
                  </span>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-zinc-500">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-[#DD1D25] hover:bg-[#C41920] text-white rounded-md text-sm font-medium transition-colors"
          >
            Submit Report
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportBug;
