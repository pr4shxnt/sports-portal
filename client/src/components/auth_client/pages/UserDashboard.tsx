const UserDashboard = () => {
  const stats = [
    { label: "Total Events", value: "12", change: "+2 this week" },
    { label: "Equipment Requests", value: "5", change: "1 pending" },
    { label: "Team Members", value: "8", change: "Active" },
  ];

  const activities = [
    {
      id: 1,
      action: "Joined Football Team",
      date: "2 hours ago",
      status: "Completed",
    },
    {
      id: 2,
      action: "Requested Tennis Racket",
      date: "Yesterday",
      status: "Pending",
    },
    { id: 3, action: "Reported a Bug", date: "2 days ago", status: "Resolved" },
    {
      id: 4,
      action: "Updated Profile",
      date: "3 days ago",
      status: "Completed",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        Dashboard
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
          >
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {stat.label}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {stat.value}
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Recent Activity
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-950/50">
              <tr>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {activities.map((activity) => (
                <tr
                  key={activity.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-50">
                    {activity.action}
                  </td>
                  <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                    {activity.date}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${
                        activity.status === "Completed"
                          ? "bg-[#DD1D25]/10 text-[#DD1D25] dark:bg-[#DD1D25]/20 dark:text-[#DD1D25]"
                          : activity.status === "Pending"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}
                    >
                      {activity.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
