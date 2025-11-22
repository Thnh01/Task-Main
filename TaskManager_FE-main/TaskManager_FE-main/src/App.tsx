import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/authentication/login";
import Signup from "./components/authentication/signup";
import ForgotPassword from "./components/authentication/forgotpassword";
import Dashboard from "./page/dashboard";
import Tasks from "./page/task";
import TaskDetail from "./page/taskdetail";
import Team from "./page/team";
import Trash from "./page/trash";
import UserProfile from "./page/userprofile";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/:taskId" element={<TaskDetail />} />
        <Route path="/team" element={<Team />} />
        <Route path="/trash" element={<Trash />} />
        <Route path="/profile" element={<UserProfile />} />
      </Routes>
    </Router>
  );
};

export default App;
