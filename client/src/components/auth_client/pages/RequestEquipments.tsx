import { useState } from "react";

const RequestEquipments = () => {
  const [selectedItem, setSelectedItem] = useState("");
  const [transferTarget, setTransferTarget] = useState<Record<number, string>>(
    {}
  );

  const items = [
    { id: 1, name: "Football", available: 12, total: 20 },
    { id: 2, name: "Tennis Racket", available: 5, total: 15 },
    { id: 3, name: "Basketball", available: 8, total: 12 },
    { id: 4, name: "Cricket Bat", available: 0, total: 10 },
    { id: 5, name: "Volleyball", available: 15, total: 15 },
  ];

  const responsibilities = [
    { id: 101, name: "Football", quantity: 5, assignedDate: "2023-10-01" },
    { id: 102, name: "Cricket Kit", quantity: 1, assignedDate: "2023-09-15" },
  ];

  const teamMembers = [
    { id: "u1", name: "Alex Johnson" },
    { id: "u2", name: "Sarah Williams" },
    { id: "u3", name: "Mike Brown" },
    { id: "u4", name: "Emily Davis" },
  ];

  const hasResponsibility = responsibilities.length > 0;

  const handleTransfer = (itemId: number) => {
    const target = transferTarget[itemId];
    if (target) {
      alert(`Transferring item ${itemId} to ${target}`);
      // In a real app, this would make an API call
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Request Form */}
        <div className="lg:col-span-1">
          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm sticky top-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
              Request Equipment
            </h2>

            {hasResponsibility && (
              <div className="mb-4 p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200">
                You currently have an active responsibility. Please transfer or
                return it before requesting new equipment.
              </div>
            )}

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Select Item
                </label>
                <select
                  className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DD1D25] dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  disabled={hasResponsibility}
                >
                  <option value="">Choose an item...</option>
                  {items.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                      disabled={item.available === 0}
                    >
                      {item.name} {item.available === 0 ? "(Out of Stock)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Duration (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DD1D25] dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="2"
                  disabled={hasResponsibility}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Purpose
                </label>
                <textarea
                  className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DD1D25] dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  rows={3}
                  placeholder="Training session..."
                  disabled={hasResponsibility}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-[#DD1D25] hover:bg-[#C41920] text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={hasResponsibility}
              >
                Submit Request
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Available Items */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Inventory Status
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              >
                <div>
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                    {item.name}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Total Stock: {item.total}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-1 rounded-md text-xs font-semibold
                    ${
                      item.available > 0
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {item.available} Available
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Section: My Responsibilities */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          My Responsibilities
        </h2>
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-950/50">
                <tr>
                  <th className="px-6 py-3">Item Name</th>
                  <th className="px-6 py-3">Quantity</th>
                  <th className="px-6 py-3">Assigned Date</th>
                  <th className="px-6 py-3">Transfer Responsibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {responsibilities.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-50">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                      {item.assignedDate}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <select
                          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DD1D25] dark:text-zinc-100"
                          value={transferTarget[item.id] || ""}
                          onChange={(e) =>
                            setTransferTarget({
                              ...transferTarget,
                              [item.id]: e.target.value,
                            })
                          }
                        >
                          <option value="">Select Member...</option>
                          {teamMembers.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleTransfer(item.id)}
                          disabled={!transferTarget[item.id]}
                          className="px-3 py-1.5 bg-[#DD1D25] text-white rounded-md text-sm font-medium hover:bg-[#C41920] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Transfer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestEquipments;
