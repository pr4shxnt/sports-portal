import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../UI/Sidebar";

const RootComp = () => {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 p-8 transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
};

export default RootComp;
