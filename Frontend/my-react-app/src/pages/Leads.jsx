import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const LEADS_PER_PAGE = 10;
const STATUSES = ["New", "Ongoing", "Closed"];

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("All");

  const { user } = useAuth();

  const fetchLeads = async (status = "All") => {
    try {
      const token = localStorage.getItem("token");

      const url =
        status === "All"
          ? `${import.meta.env.VITE_API_URL}/leads`
          : `${import.meta.env.VITE_API_URL}/leads?status=${status}`;

      const { data } = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLeads(data);
      setCurrentPage(1);
    } catch {
      console.error("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(statusFilter);
  }, [statusFilter]);

  const deleteLead = async (id) => {
    if (!window.confirm("Delete this lead permanently?")) return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(`${import.meta.env.VITE_API_URL}/leads/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLeads((prev) => prev.filter((lead) => lead._id !== id));

      if ((leads.length - 1) % LEADS_PER_PAGE === 0 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      }
    } catch {
      alert("Failed to delete lead");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");

      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/leads/${id}/status`,{status},
        {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
      );
      console.log("Status updated:", data);

      setLeads((prev) =>
        prev.map((lead) =>
          lead._id === id ? data : lead
        )
      );
    } catch {
      console.log("Failed to update status");
      alert("Failed to update status");
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-500">Loading leads...</div>;
  }

  // Pagination
  const totalPages = Math.ceil(leads.length / LEADS_PER_PAGE);
  const startIndex = (currentPage - 1) * LEADS_PER_PAGE;
  const paginatedLeads = leads.slice(
    startIndex,
    startIndex + LEADS_PER_PAGE
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Leads
        </h1>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="All">All</option>
          <option value="New">New</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100 text-sm uppercase text-gray-600">
            <tr>
              {["Name", "Phone", "Email", "Source", "Status", "Date"].map((h) => (
                <th key={h} className="px-5 py-3 text-left">
                  {h}
                </th>
              ))}
              {user?.role === "Admin" && (
                <th className="px-5 py-3 text-center">Action</th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y">
            {paginatedLeads.map((lead) => (
              <tr
                key={lead._id}
                className="hover:bg-gray-50 transition"
              >
                <td className="px-5 py-3 font-medium">{lead.name}</td>
                <td className="px-5 py-3">{lead.phone}</td>
                <td className="px-5 py-3">{lead.email}</td>

                <td className="px-5 py-3">
                  <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700 capitalize">
                    {lead.source}
                  </span>
                </td>

                <td className="px-5 py-3">
  {user?.email === "admin@gmail.com" ? (
    <select
      value={lead.status}
      onChange={(e) =>{
        updateStatus(lead._id, e.target.value)
        console.log(e.target.value)
      }
      }
      className="border rounded px-2 py-1 text-sm bg-white"
    >
      <option value="New">New</option>
      <option value="Ongoing">Ongoing</option>
      <option value="Closed">Closed</option>
    </select>
  ) : (
    <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">
      {lead.status}
    </span>
  )}
</td>


                <td className="px-5 py-3 text-sm text-gray-500">
                  {new Date(lead.createdAt).toLocaleDateString()}
                </td>

                {user?.role === "Admin" && (
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => deleteLead(lead._id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded transition"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {leads.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            No leads available
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-5 px-6 py-4 border-t">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className={`px-4 py-2 rounded text-sm ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-800 text-white hover:bg-gray-700"
              }`}
            >
              Previous
            </button>

            <span className="text-sm text-gray-600">
              Page <strong>{currentPage}</strong> of{" "}
              <strong>{totalPages}</strong>
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className={`px-4 py-2 rounded text-sm ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-800 text-white hover:bg-gray-700"
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leads;
