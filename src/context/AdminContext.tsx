import { createContext, useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  ADMIN_TOKEN_KEY,
  LEGACY_ADMIN_TOKEN_KEY,
} from "../constants/storageKeys";
import type {
  AdminContextValue,
  AllCompanionsResponse,
  Companion,
  MessageResponse,
} from "../types/admin";
import { getErrorMessage } from "../utils/getErrorMessage";

// There is no meaningful default: consumers must be rendered inside
// AdminContextProvider, which always supplies a full value.
export const AdminContext = createContext<AdminContextValue>(
  undefined as unknown as AdminContextValue,
);

interface AdminContextProviderProps {
  children: ReactNode;
}

const AdminContextProvider = (props: AdminContextProviderProps) => {
  const [adminToken, setAdminToken] = useState<string>(
    localStorage.getItem(ADMIN_TOKEN_KEY) ?? "",
  );

  // Remove the token left behind under the old, misspelt key.
  useEffect(() => {
    localStorage.removeItem(LEGACY_ADMIN_TOKEN_KEY);
  }, []);

  const [companions, setCompanions] = useState<Companion[]>([]);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const getAllCompanions = async () => {
    try {
      const { data } = await axios.post<AllCompanionsResponse>(
        backendUrl + "/api/admin/all-companions",
        {},
        { headers: { adminToken } },
      );

      if (data.success) {
        setCompanions(data.companions);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const changeAvailability = async (compId: string) => {
    try {
      const { data } = await axios.post<MessageResponse>(
        backendUrl + "/api/admin/change-availability",
        { compId },
        { headers: { adminToken } },
      );

      if (data.success) {
        toast.success(data.message);
        getAllCompanions();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const value: AdminContextValue = {
    adminToken,
    companions,
    changeAvailability,
    setAdminToken,
    backendUrl,
    getAllCompanions,
  };

  return (
    <AdminContext.Provider value={value}>
      {props.children}
    </AdminContext.Provider>
  );
};

export default AdminContextProvider;
