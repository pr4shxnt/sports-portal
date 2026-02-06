import { useState } from "react";
import Modal from "../../ui/Modal";
import { useAppSelector } from "../../../store/hooks";
import { Link } from "react-router-dom";

const Team = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [selectedMember, setSelectedMember] = useState<
    (typeof members)[0] | null
  >(null);
  const members = [
    {
      id: "6984de20dddfc136777d2a00",
      name: "Alex Johnson",
      role: "Team Captain",
      sport: "Football",
      status: "Online",
      email: "alex.johnson@example.com",
      phone: "+1 (555) 123-4567",
    },
    {
      id: 2,
      name: "Sarah Williams",
      role: "Member",
      sport: "Football",
      status: "Offline",
      email: "sarah.williams@example.com",
      phone: "+1 (555) 234-5678",
    },
    {
      id: 3,
      name: "Mike Brown",
      role: "Vice Captain",
      sport: "Football",
      status: "Online",
      email: "mike.brown@example.com",
      phone: "+1 (555) 345-6789",
    },
    {
      id: 4,
      name: "Emily Davis",
      role: "Member",
      sport: "Football",
      status: "Away",
      email: "emily.davis@example.com",
      phone: "+1 (555) 456-7890",
    },
    {
      id: 5,
      name: "Chris Wilson",
      role: "Member",
      sport: "Football",
      status: "Online",
      email: "chris.wilson@example.com",
      phone: "+1 (555) 567-8901",
    },
    {
      id: 6,
      name: "Jessica Taylor",
      role: "Member",
      sport: "Football",
      status: "Offline",
      email: "jessica.taylor@example.com",
      phone: "+1 (555) 678-9012",
    },
  ];

  // Group members by sport
  const membersBySport = members.reduce(
    (acc, member) => {
      if (!acc[member.sport]) {
        acc[member.sport] = [];
      }
      acc[member.sport].push(member);
      return acc;
    },
    {} as Record<string, typeof members>,
  );

  return (
    <div className="p-6 space-y-8">
      {Object.entries(membersBySport).map(([sport, teamMembers]) => (
        <div key={sport} className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 pb-2">
            {sport}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
              >
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg font-bold text-zinc-600 dark:text-zinc-400">
                  {member.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 truncate flex items-center gap-2">
                    {member.name}
                    {user?._id === member.id && (
                      <span className="text-xs font-bold text-white bg-[#DD1D25] px-2 py-0.5 rounded-full">
                        (You)
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {member.role}
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
      ))}

      <Modal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        title="Member Details"
      >
        {selectedMember && (
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-3xl font-bold text-zinc-600 dark:text-zinc-400 mb-4">
                {selectedMember.name.charAt(0)}
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {selectedMember.name}
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                {selectedMember.role}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-6">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Sport
                </p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {selectedMember.sport}
                </p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Status
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full 
                    ${
                      selectedMember.status === "Online"
                        ? "bg-emerald-500"
                        : selectedMember.status === "Away"
                          ? "bg-amber-500"
                          : "bg-zinc-300 dark:bg-zinc-600"
                    }`}
                  />
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {selectedMember.status}
                  </p>
                </div>
              </div>
            </div>

            {user?._id !== selectedMember.id ? (
              <div className="space-y-2">
                <a
                  href={`mailto:${selectedMember.email}`}
                  className="flex items-center justify-center w-full py-2 px-4 bg-[#DD1D25] hover:bg-[#b9181f] text-white rounded-lg font-medium transition-colors"
                >
                  Send Email
                </a>
                <a
                  href={`tel:${selectedMember.phone}`}
                  className="flex items-center justify-center w-full py-2 px-4 border border-[#DD1D25] text-[#DD1D25] hover:bg-[#DD1D25]/10 rounded-lg font-medium transition-colors"
                >
                  Call {selectedMember.phone}
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/dashboard/profile"
                  className="flex items-center justify-center w-full py-2 px-4 bg-[#DD1D25] hover:bg-[#b9181f] text-white rounded-lg font-medium transition-colors"
                >
                  View Profile
                </Link>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Team;
