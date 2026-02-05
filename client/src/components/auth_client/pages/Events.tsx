const Events = () => {
  const events = [
    {
      id: 1,
      title: "Inter-Department Football",
      date: "Oct 15, 2023",
      time: "4:00 PM",
      location: "Main Ground",
      category: "Sports",
      participants: 24,
    },
    {
      id: 2,
      title: "Chess Tournament",
      date: "Oct 20, 2023",
      time: "10:00 AM",
      location: "Indoor Hall",
      category: "Indoor",
      participants: 16,
    },
    {
      id: 3,
      title: "Annual Marathon",
      date: "Nov 01, 2023",
      time: "6:00 AM",
      location: "City Center",
      category: "Fitness",
      participants: 150,
    },
    {
      id: 4,
      title: "Basketball League",
      date: "Nov 05, 2023",
      time: "5:30 PM",
      location: "Basketball Court",
      category: "Sports",
      participants: 40,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Upcoming Events
        </h1>
        <button className="px-4 py-2 bg-[#DD1D25] text-white rounded-md text-sm font-medium hover:bg-[#C41920] transition-colors">
          Create Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div
            key={event.id}
            className="group relative flex flex-col p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                {event.category}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {event.participants} joined
              </span>
            </div>

            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2 group-hover:text-[#DD1D25] transition-colors">
              {event.title}
            </h3>

            <div className="mt-auto space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  ></path>
                </svg>
                <span>
                  {event.date} at {event.time}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  ></path>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  ></path>
                </svg>
                <span>{event.location}</span>
              </div>
            </div>

            <button className="mt-6 w-full py-2 px-4 border border-zinc-200 dark:border-zinc-700 rounded-md text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Events;
