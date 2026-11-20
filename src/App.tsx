import { useContext } from "react";
import { AdminContext } from "./context/AdminContext";
import Login from "./pages/Login";
import { ToastContainer, toast } from "react-toastify";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Admin/Dashboard";
import AllAppointments from "./pages/Admin/AllAppointments";
import AddCompanion from "./pages/Admin/AddCompanion";
import CompanionsList from "./pages/Admin/CompanionsList";

const App = () => {
  const { adminToken } = useContext(AdminContext);

  return adminToken ? (
    <div className="bg-[#F8F9FD]">
      <ToastContainer />
      <Navbar />
      <div className="flex items-start">
        <Sidebar />
        <Routes>
          <Route path="/" element={<></>} />
          <Route path="/admin-dashboard" element={<Dashboard />} />
          <Route path="/all-appointments" element={<AllAppointments />} />
          <Route path="/add-companion" element={<AddCompanion />} />
          <Route path="/companion-list" element={<CompanionsList />} />
        </Routes>
      </div>
    </div>
  ) : (
    <>
      <Login />
      <ToastContainer />
    </>
  );
};

export default App;
