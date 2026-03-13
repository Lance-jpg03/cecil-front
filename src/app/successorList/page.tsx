// src/app/successorList/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

const prefixOptions = ["MR.", "MS.", "MRS."];
const suffixOptions = ["JR.", "SR.", "II", "III", "IV", "V"];
const sexOptions = ["MALE", "FEMALE"];
const statusOptions = [
  "ACTIVE",
  "NOT ACTIVE",
  "DECEASED",
  "EXPELLED & RESIGNED",
  "TERMINATED",
  "TRANSFERRED",
  "NON MEMBER",
];
const categoryOptions = [
  "FULL COMPOSER",
  "ASSOCIATE COMPOSER",
  "PUBLISHER",
  "COPYRIGHT OWNER",
  "NON-MEMBER",
];

interface successorData {
  Member_No: string;
  Member_Category: string;
  Member_Status?: string | null;
  Remarks: string;
  Predecessor_Membership_ID: string;
  Successor_Surname: string | null;
  Successor_First_Name: string | null;
  Successor_Middle_Name?: string | null;
  Successor_Suffix?: string | null;
  Successor_Full_Name?: string | null;
  Successor_Sex?: string | null;
  Successor_Prefix?: string | null;
  Successor_CAE_No?: string | null;
  Successor_Membership_ID: string;
  Successor_IPI_Name_Number?: string | null;
  Successor_IPI_Base_Number?: string | null;
  Successor_Band_Name?: string | null;
  Successor_Pseudonym?: string | null;
  Successor_Address?: string | null;
  Successor_Contact_Number?: string | null;
  Successor_Email_Address?: string | null;
  Successor_Tin_Number?: string | null;
  Successor_Primary_Contact_Number?: string | null;
  Successor_Secondary_Contact_Number?: string | null;
  Successor_Landline?: string | null;
  Successor_Bank_Account_Info?: string | null;
  Successor_Bank_Name?: string | null;
  Successor_Contact_Person?: string | null;
  Successor_Date_of_Membership?: string | null;
  Successor_Date_of_Birth?: string | null;
  Successor_Date_of_Death?: string | null;
  Successor_Date_of_Termination?: string | null;
  Successor_Related_Files?: string | null;
  Successor_Date_Registred_National_Library?: string | null;
}

interface Log {
  Log_ID: number;
  Membership_ID: string;
  Action: string;
  Changed_By: string;
  Changed_At: string;
  Details?: string;
}

export default function SuccessorListPage() {
  const router = useRouter();

  const [successors, setSuccessors] = useState<successorData[]>([]);
  const [filteredSuccessors, setFilteredSuccessors] = useState<successorData[]>(
    [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSuccessor, setSelectedSuccessor] =
    useState<successorData | null>(null);
  const [formData, setFormData] = useState<Partial<successorData>>({});
  const [saving, setSaving] = useState(false);

  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [allLogs, setAllLogs] = useState<Log[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchSuccessors = async () => {
    try {
      const res = await fetch(`${API_BASE}/successor`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSuccessors(data || []);
      setFilteredSuccessors(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      router.replace("/");
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/logs`);
      const data: Log[] = await res.json();
      setAllLogs(data);
      const today = new Date().toISOString().split("T")[0];
      const filtered = data.filter(
        (log) => log.Changed_At && log.Changed_At.split("T")[0] === today,
      );
      setLogs(filtered);
    } catch (err) {
      console.error("Fetch Logs Error:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      const full =
        `${formData.Successor_First_Name || ""} ${formData.Successor_Middle_Name || ""} ${formData.Successor_Surname || ""}${formData.Successor_Suffix ? ` ${formData.Successor_Suffix}` : ""}`
          .trim()
          .replace(/\s+/g, " ");

      if (formData.Successor_Full_Name !== full) {
        setFormData((prev) => ({ ...prev, Successor_Full_Name: full }));
      }
    }
  }, [
    formData.Successor_First_Name,
    formData.Successor_Middle_Name,
    formData.Successor_Surname,
    formData.Successor_Suffix,
    isModalOpen,
  ]);

  function calculateAge(
    dob: string | undefined | null,
    dod?: string | null,
  ): string {
    if (!dob) return "0";
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return "0";
    const endDate = dod ? new Date(dod) : new Date();
    if (isNaN(endDate.getTime())) return "0";
    let age = endDate.getFullYear() - birthDate.getFullYear();
    const m = endDate.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && endDate.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? String(age) : "0";
  }

  function calculateYearsOfMembership(
    joinDate: string | undefined | null,
    termDate?: string | null,
  ): string {
    if (!joinDate) return "0";
    const membershipDate = new Date(joinDate);
    if (isNaN(membershipDate.getTime())) return "0";
    const endDate = termDate ? new Date(termDate) : new Date();
    if (isNaN(endDate.getTime())) return "0";
    let years = endDate.getFullYear() - membershipDate.getFullYear();
    const m = endDate.getMonth() - membershipDate.getMonth();
    if (m < 0 || (m === 0 && endDate.getDate() < membershipDate.getDate())) {
      years--;
    }
    return years >= 0 ? String(years) : "0";
  }

  const clearLogsDisplay = () => setLogs([]);
  const showAllLogs = () => setLogs(allLogs);

  useEffect(() => {
    fetchSuccessors();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    if (!query.trim()) {
      setFilteredSuccessors(successors);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const filtered = successors.filter(
      (s) =>
        String(s.Successor_Full_Name || "")
          .toLowerCase()
          .includes(lowerQuery) ||
        String(s.Successor_Membership_ID || "")
          .toLowerCase()
          .includes(lowerQuery) ||
        String(s.Member_No || "")
          .toLowerCase()
          .includes(lowerQuery),
    );
    setFilteredSuccessors(filtered);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (saving) return;
    setSaving(true);
    const currentUser = localStorage.getItem("username");

    try {
      const res = await fetch(`${API_BASE}/successor/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          isEdit: isEditMode,
          Changed_By: currentUser,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      setIsModalOpen(false);
      await fetchSuccessors();
      alert("Action completed successfully.");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong.";
      console.error("Save Error:", errorMessage);
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (successor: successorData) => {
    setFormData(successor);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      alert("No data available to export.");
      return;
    }
    const allKeys = Array.from(
      new Set(data.flatMap((obj) => Object.keys(obj))),
    );
    const headers = allKeys.join(",");
    const rows = data.map((obj) =>
      allKeys
        .map((key) => `"${String(obj[key] || "").replace(/"/g, '""')}"`)
        .join(","),
    );
    const csvContent = "\uFEFF" + headers + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openAddModal = () => {
    setFormData({});
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const openLogsModal = () => {
    fetchLogs();
    setIsLogsModalOpen(true);
  };

  const totalPages = Math.ceil(filteredSuccessors.length / itemsPerPage);
  const currentData = filteredSuccessors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const formatDateOnly = (dateString: string) => {
    if (!dateString) return "-";
    return String(dateString).split("T")[0];
  };

  return (
    <main className="min-h-screen w-full bg-[url('/BG.png')] bg-fixed bg-no-repeat bg-[length:100%_100%] bg-center flex flex-col font-sans text-black">
      <div className="relative w-full bg-[#b7df69] p-3 sticky top-0 z-50 shadow-lg">
        <div className="w-full px-1 flex justify-between items-center mx-auto gap-8">
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={openLogsModal}
              className="hover:opacity-80 cursor-pointer"
            >
              <Image
                src="/lego.png"
                alt="LOGO"
                width={100}
                height={50}
                priority
              />
            </button>
            <div className="text-white text-xl hidden lg:block font-bold whitespace-nowrap">
              PROJECT CECIL: SUCCESSOR MASTERLIST
            </div>
          </div>

          <div className="flex-1 flex items-center gap-4">
            <input
              type="text"
              placeholder="Search Successors..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="p-2 border rounded w-full max-w-xs bg-white/90 outline-none"
            />
            <button
              onClick={() =>
                exportToCSV(filteredSuccessors, "Successor_List_Export")
              }
              className="bg-green-700 text-white px-3 py-2 rounded font-bold text-[10px] uppercase"
            >
              Export List
            </button>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={openAddModal}
              className="bg-[#ce5703] text-white px-3 py-2 rounded font-bold text-[10px] uppercase"
            >
              Add Successor
            </button>
            <button
              onClick={() => router.push("/home")}
              className="bg-gray-800 text-white px-3 py-2 rounded font-bold text-[10px] uppercase"
            >
              Back to Members
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-3 py-2 rounded font-bold text-[10px] uppercase"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      {/* Main Table */}
      <div className="flex-grow p-4 relative z-10">
        <div className="text-black text-3xl hidden lg:block font-bold mb-2">
          Sucessors
        </div>
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border">
          <table className="w-full text-left">
            <thead className="bg-[#b7df69] text-white uppercase text-[10px]">
              <tr>
                <th className="px-4 py-2">SUCCESSOR ID</th>
                <th className="px-4 py-2">PREDECESSOR ID</th>
                <th className="px-4 py-2">DATE OF BIRTH</th>
                <th className="px-4 py-2">SEX</th>
                <th className="px-4 py-2">CATEGORY</th>
                <th className="px-4 py-2">FULL NAME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentData.map((s, idx) => (
                <tr key={idx} className="hover:bg-green-50 transition-colors">
                  <td className="px-4 py-1.5 text-[10px]">
                    {s.Successor_Membership_ID}
                  </td>
                  <td className="px-4 py-1.5 text-[10px]">
                    {s.Predecessor_Membership_ID}
                  </td>
                  <td className="px-4 py-1.5 text-[10px]">
                    {s.Successor_Date_of_Birth?.substring(0, 10) || "-"}
                  </td>
                  <td className="px-4 py-1.5 text-[10px]">{s.Successor_Sex}</td>
                  <td className="px-4 py-1.5 text-[10px]">
                    {s.Member_Category}
                  </td>
                  <td className="px-4 py-1.5">
                    <button
                      onClick={() => setSelectedSuccessor(s)}
                      className="text-blue-600 font-bold hover:underline text-[10px] uppercase"
                    >
                      {s.Successor_Full_Name}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-2 flex justify-between items-center border-t text-xs">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 border rounded font-bold"
              >
                Prev
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 border rounded font-bold"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Details Modal */}
      {selectedSuccessor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-[#b7df69]">
              <h2 className="text-xl font-black uppercase">
                Successor Details
              </h2>
              <button
                onClick={() => setSelectedSuccessor(null)}
                className="text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(selectedSuccessor).map(([key, val]) => (
                <div key={key} className="border-b pb-2">
                  <p className="text-[9px] uppercase text-gray-400 font-bold">
                    {key.replace(/_/g, " ")}
                  </p>
                  <p className="text-gray-800 font-medium text-sm">
                    {key.toLowerCase().includes("date") &&
                    typeof val === "string"
                      ? val.substring(0, 10)
                      : String(val || "N/A")}
                  </p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  openEditModal(selectedSuccessor);
                  setSelectedSuccessor(null);
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold text-xs uppercase"
              >
                Edit Information
              </button>
              <button
                onClick={() => setSelectedSuccessor(null)}
                className="flex-1 bg-gray-200 py-2 rounded-lg font-bold text-xs uppercase"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* SYSTEM ACTIVITY LOGS MODAL */}
      //{" "}
      {isLogsModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b bg-[#b7df69] text-white flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase">
                System Activity Logs
              </h2>
              <button
                onClick={() => setIsLogsModalOpen(false)}
                className="text-3xl"
              >
                &times;
              </button>
            </div>
            <div className="p-4 bg-gray-100 flex gap-4 border-b">
              <button
                onClick={clearLogsDisplay}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold text-xs uppercase transition-all"
              >
                Clear Today's Logs
              </button>
              <button
                onClick={showAllLogs}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold text-xs uppercase transition-all"
              >
                Show All Logs
              </button>
              <button
                onClick={() => exportToCSV(logs, "System_Logs_Export")}
                className="bg-green-700 hover:bg-green-800 text-white px-3 py-1 rounded font-bold text-[10px] uppercase ml-auto"
              >
                Export Logs
              </button>
            </div>
            <div className="flex-grow overflow-auto p-6">
              {logsLoading ? (
                <p className="text-center py-10 font-bold animate-pulse text-gray-500">
                  Retrieving system logs...
                </p>
              ) : (
                <table className="w-full text-left  text-sm">
                  <thead className="top-0 bg-gray-200 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-3 border">Log ID</th>
                      <th className="p-3 border">Membership ID</th>
                      <th className="p-3 border">Action</th>
                      <th className="p-3 border">Updated By</th>
                      <th className="p-3 border">Updated At</th>
                      <th className="p-3 border">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length > 0 ? (
                      logs.map((log: any) => {
                        const updatedBy =
                          log.Changed_By || log.UpdatedBy || log.Updated_By;
                        return (
                          <tr
                            key={log.Log_ID || log.LogID}
                            className="hover:bg-gray-50 border-b transition"
                          >
                            <td className="p-3 border text-center">
                              {log.Log_ID || log.LogID || "-"}
                            </td>
                            <td className="p-3 border font-mono">
                              {log.Membership_ID || log.Member_No || "-"}
                            </td>
                            <td className="p-3 border">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-[10px] font-bold uppercase">
                                {log.Action || log.ActionType || "-"}
                              </span>
                            </td>
                            <td className="p-3 border font-bold text-gray-800">
                              {updatedBy}
                            </td>
                            <td className="p-3 border whitespace-nowrap">
                              {formatDateOnly(log.Changed_At || log.UpdatedAt)}
                            </td>
                            <td className="p-3 border italic text-gray-500">
                              {log.Details || log.ActionDetails || "-"}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-10 text-center text-gray-400 font-semibold"
                        >
                          No logs found for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setIsLogsModalOpen(false)}
                className="bg-gray-800 text-white px-8 py-2 rounded font-bold uppercase hover:bg-black transition-all"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-[#b7df69] flex justify-between items-center">
              <h2 className="text-2xl font-black">
                {isEditMode ? "EDIT SUCCESSOR" : "ADD NEW SUCCESSOR"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-3xl"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label="Predecessor ID"
                name="Predecessor_Membership_ID"
                value={formData.Predecessor_Membership_ID}
                onChange={handleInputChange}
                disabled={isEditMode}
              />

              <Select
                label="Member Status"
                name="Member_Status"
                value={formData.Member_Status}
                options={statusOptions}
                onChange={handleInputChange}
              />
              <Select
                label="Category"
                name="Member_Category"
                value={formData.Member_Category}
                options={categoryOptions}
                onChange={handleInputChange}
              />

              <Select
                label="Prefix"
                name="Successor_Prefix"
                value={formData.Successor_Prefix}
                options={prefixOptions}
                onChange={handleInputChange}
              />
              <Input
                label="First Name"
                name="Successor_First_Name"
                value={formData.Successor_First_Name}
                onChange={handleInputChange}
              />
              <Input
                label="Middle Name"
                name="Successor_Middle_Name"
                value={formData.Successor_Middle_Name}
                onChange={handleInputChange}
              />
              <Input
                label="Surname"
                name="Successor_Surname"
                value={formData.Successor_Surname}
                onChange={handleInputChange}
              />
              <DatalistInput
                label="Suffix "
                name="Successor_Suffix"
                value={formData.Successor_Suffix}
                options={suffixOptions}
                onChange={handleInputChange}
                listId="suffix-list"
              />
              <Input
                label="Full Name"
                name="Successor_Full_Name"
                value={`${formData.Successor_First_Name || ""} ${formData.Successor_Middle_Name || ""} ${formData.Successor_Surname || ""}${formData.Successor_Suffix ? ` ${formData.Successor_Suffix}` : ""}`.trim()}
                disabled
              />

              <Select
                label="Sex"
                name="Successor_Sex"
                value={formData.Successor_Sex}
                options={sexOptions}
                onChange={handleInputChange}
              />
              <div className="flex flex-col gap-1">
                <DateInput
                  label={`Date of Birth`}
                  name="Successor_Date_of_Birth"
                  value={formData.Successor_Date_of_Birth}
                  onChange={handleDateChange}
                />
                <div className="px-2 py-1 rounded border border-blue-200">
                  <span className="text-[10px] font-bold  uppercase">
                    {formData.Successor_Date_of_Death
                      ? "Age at Death: "
                      : "Age:"}
                  </span>
                  <span className="text-xs font-black text-blue-800">
                    {calculateAge(
                      formData.Successor_Date_of_Birth,
                      formData.Successor_Date_of_Death,
                    )}{" "}
                    yrs
                  </span>
                </div>
              </div>
              <DateInput
                label="Date of Death"
                name="Successor_Date_of_Death"
                value={formData.Successor_Date_of_Death}
                onChange={handleDateChange}
              />

              <Input
                label="CAE No"
                name="Successor_CAE_No"
                value={formData.Successor_CAE_No}
                onChange={handleInputChange}
              />
              <Input
                label="IPI Name Number"
                name="Successor_IPI_Name_Number"
                value={formData.Successor_IPI_Name_Number}
                disabled
              />
              <Input
                label="IPI Base Number"
                name="Successor_IPI_Base_Number"
                value={formData.Successor_IPI_Base_Number}
                disabled
              />
              <Input
                label="Band Name"
                name="Successor_Band_Name"
                value={formData.Successor_Band_Name}
                onChange={handleInputChange}
              />
              <Input
                label="Pseudonym"
                name="Successor_Pseudonym"
                value={formData.Successor_Pseudonym}
                onChange={handleInputChange}
              />
              <Input
                label="Address"
                name="Successor_Address"
                value={formData.Successor_Address}
                onChange={handleInputChange}
              />
              <Input
                label="Email"
                name="Successor_Email_Address"
                value={formData.Successor_Email_Address}
                onChange={handleInputChange}
              />
              <Input
                label="Primary Contact Number"
                name="Successor_Primary_Contact_Number"
                value={formData.Successor_Primary_Contact_Number}
                onChange={handleInputChange}
              />
              <Input
                label="Secondary Contact Number"
                name="Successor_Secondary_Contact_Number"
                value={formData.Successor_Secondary_Contact_Number}
                onChange={handleInputChange}
              />
              <Input
                label="Landline"
                name="Successor_Landline"
                value={formData.Successor_Landline}
                onChange={handleInputChange}
              />
              <Input
                label="Contact Number"
                name="Successor_Contact_Number"
                value={formData.Successor_Contact_Number}
                onChange={handleInputChange}
              />
              <Input
                label="Contact Person"
                name="Successor_Contact_Person"
                value={formData.Successor_Contact_Person}
                onChange={handleInputChange}
              />

              {/* FINANCIAL INFO */}
              <Input
                label="TIN Number"
                name="Successor_Tin_Number"
                value={formData.Successor_Tin_Number}
                onChange={handleInputChange}
              />
              <Input
                label="Bank Name"
                name="Successor_Bank_Name"
                value={formData.Successor_Bank_Name}
                onChange={handleInputChange}
              />
              <Input
                label="Bank Account Info"
                name="Successor_Bank_Account_Info"
                value={formData.Successor_Bank_Account_Info}
                onChange={handleInputChange}
              />
              <div className="flex flex-col gap-1">
                <DateInput
                  label="Date of Membership"
                  name="Successor_Date_of_Membership"
                  value={formData.Successor_Date_of_Membership}
                  onChange={handleDateChange}
                />
                <div className="px-2 py-1  rounded border border-green-200">
                  <span className="text-[10px] font-bold text-black uppercase">
                    {formData.Successor_Date_of_Termination
                      ? "Length of Membership: "
                      : "Computed Tenure: "}
                  </span>
                  <span className="text-xs font-black text-green-800">
                    {calculateYearsOfMembership(
                      formData.Successor_Date_of_Membership,
                      formData.Successor_Date_of_Termination,
                    )}{" "}
                    years
                  </span>
                </div>
              </div>
              <DateInput
                label="Membership Termination"
                name="Successor_Date_of_Termination"
                value={formData.Successor_Date_of_Termination}
                onChange={handleDateChange}
              />
              <DateInput
                label="Date Registered"
                name="Successor_Date_Registred_National_Library"
                value={formData.Successor_Date_Registred_National_Library}
                onChange={handleDateChange}
              />
              <Input
                label="Remarks"
                name="Remarks"
                value={formData.Remarks}
                onChange={handleInputChange}
              />
              <Input
                label="Related Files"
                name="Successor_Related_Files"
                value={formData.Successor_Related_Files}
                onChange={handleInputChange}
              />
            </div>
            <div className="p-6 border-t bg-gray-50 flex gap-4">
              <button
                onClick={handleSubmit}
                className={`flex-1 py-3 rounded-lg font-bold text-white ${saving ? "bg-gray-400" : "bg-green-600"}`}
              >
                {saving ? "SAVING..." : "SAVE CHANGES"}
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-bold"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Input({ label, name, value, onChange, disabled = false }: any) {
  return (
    <div className="flex flex-col">
      <label className="text-[9px] font-bold uppercase text-gray-500">
        {label}
      </label>
      <input
        type="text"
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        className="p-1.5 border rounded text-[10px] bg-white disabled:bg-gray-100 uppercase"
      />
    </div>
  );
}

function DatalistInput({ label, name, value, options, onChange, listId }: any) {
  return (
    <div className="flex flex-col">
      <label className="text-[9px] font-bold uppercase text-gray-500">
        {label}
      </label>
      <input
        list={listId}
        name={name}
        value={value || ""}
        onChange={onChange}
        className="p-1.5 border rounded text-[10px] bg-white uppercase"
      />
      <datalist id={listId}>
        {options.map((o: string) => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </div>
  );
}

function Select({ label, name, value, options, onChange }: any) {
  return (
    <div className="flex flex-col">
      <label className="text-[9px] font-bold uppercase text-gray-500">
        {label}
      </label>
      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        className="p-1.5 border rounded text-[10px] bg-white uppercase"
      >
        <option value="">-- SELECT --</option>
        {options.map((o: string) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function DateInput({ label, name, value, onChange }: any) {
  return (
    <div className="flex flex-col">
      <label className="text-[9px] font-bold uppercase text-gray-500">
        {label}
      </label>
      <input
        type="date"
        name={name}
        value={value?.substring(0, 10) || ""}
        onChange={onChange}
        className="p-1.5 border rounded text-[10px] bg-white"
      />
    </div>
  );
}
