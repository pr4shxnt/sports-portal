const Team = () => {
  const members = [
    {
      id: 1,
      name: "Alex Johnson",
      role: "Team Captain",
      sport: "Football",
      status: "Online",
    },
    {
      id: 2,
      name: "Sarah Williams",
      role: "Member",
      sport: "Tennis",
      status: "Offline",
    },
    {
      id: 3,
      name: "Mike Brown",
      role: "Vice Captain",
      sport: "Basketball",
      status: "Online",
    },
    {
      id: 4,
      name: "Emily Davis",
      role: "Member",
      sport: "Volleyball",
      status: "Away",
    },
    {
      id: 5,
      name: "Chris Wilson",
      role: "Member",
      sport: "Cricket",
      status: "Online",
    },
    {
      id: 6,
      name: "Jessica Taylor",
      role: "Member",
      sport: "Badminton",
      status: "Offline",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          My Team
        </h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-md text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            Manage Roles
          </button>
          <button className="px-4 py-2 bg-[#DD1D25] hover:bg-[#C41920] text-white rounded-md text-sm font-medium">
            Invite Member
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg font-bold text-zinc-600 dark:text-zinc-400">
              {member.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                {member.name}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {member.role} • {member.sport}
              </p>
            </div>
            <div
              className={`w-2.5 h-2.5 rounded-full 
              ${
                member.status === "Online"
                  ? "bg-emerald-500"
                  : member.status === "Away"
                  ? "bg-amber-500"
                  : "bg-zinc-300 dark:bg-zinc-600"
              }`}
              title={member.status}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Team;
