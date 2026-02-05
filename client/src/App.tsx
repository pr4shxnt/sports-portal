import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LoginForm from "./components/no_auth/Login";
import SignupForm from "./components/no_auth/Signup";
import DynamicForm from "./components/no_auth/open_forms/DynamicForm";
import Home from "./pages/Home";
import { store } from "./store/store";
import { Provider } from "react-redux";
import RootComp from "./components/auth_client/root/RootComp";
import UserDashboard from "./components/auth_client/pages/UserDashboard";
import Events from "./components/auth_client/pages/Events";
import RequestEquipments from "./components/auth_client/pages/RequestEquipments";
import Team from "./components/auth_client/pages/Team";
import Profile from "./components/auth_client/pages/Profile";
import ReportBug from "./components/auth_client/pages/ReportBug";
import Feedback from "./components/auth_client/pages/Feedback";
import Settings from "./components/auth_client/pages/Settings";

const router = createBrowserRouter([
  {
    path: "/dashboard",
    element: <RootComp />,
    children: [
      {
        index: true,
        element: <UserDashboard />,
      },
      {
        path: "events",
        element: <Events />,
      },
      {
        path: "equipments",
        element: <RequestEquipments />,
      },
      {
        path: "team",
        element: <Team />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "bug-report",
        element: <ReportBug />,
      },
      {
        path: "feedback",
        element: <Feedback />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
    ],
  },
  {
    path: "/login",
    element: <LoginForm />,
  },
  {
    path: "/signup",
    element: <SignupForm />,
  },
  {
    path: "/",
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/form/:formId",
        element: <DynamicForm />,
      },
    ],
  },
]);

export default function App() {
  return (
    <>
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </>
  );
}
