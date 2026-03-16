// src/app/home/page.tsx

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
const ynOptions = ["Y", "N"];

interface Member {
  Member_No: string;
  Membership_ID: string;
  Member_Status?: string | null;
  Member_Category?: string | null;
  Prefix?: string | null;
  First_Name?: string | null;
  Middle_Name?: string | null;
  Last_Name?: string | null;
  Suffix?: string | null;
  Name?: string | null;
  Sex?: string | null;
  Date_of_Birth?: string | null;
  Date_of_Death?: string | null;
  CAE_No?: string | null;
  IPI_Name_Number?: string | null;
  IPI_Base_Number?: string | null;
  Band_Name?: string | null;
  Pseudonym?: string | null;
  Address?: string | null;
  CITY?: string | null;
  Email_Address?: string | null;
  Contact_Number?: string | null;
  Primary_Contact_Number?: string | null;
  Secondary_Contact_Number?: string | null;
  Landline?: string | null;
  Type_of_Business_Entity?: string | null;
  Official_Representative?: string | null;
  Office_Number?: string | null;
  Office_Address?: string | null;
  Signatory?: string | null;
  Contact_Person?: string | null;
  Tin_Number?: string | null;
  Bank_Name?: string | null;
  Bank_Account_Info?: string | null;
  Date_of_Membership?: string | null;
  // Updated to match standardized DB column name
  Date_of_Membership_Termination_Resignation?: string | null;
  Date_Registred_National_Library?: string | null;
  Deed_Of_Assignment?: string | null;
  Certification?: string | null;
  Membership_Application?: string | null;
  Declaration_Of_Works?: string | null;
  Remarks?: string | null;
  Related_files?: string | null;
  Successor_Full_Name?: string | null;
}

interface Log {
  Log_ID: number;
  Membership_ID: string;
  Action: string;
  Changed_By: string;
  Changed_At: string;
  Details?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState<Partial<Member>>({});
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [allLogs, setAllLogs] = useState<Log[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Auto-generate Full Name
  useEffect(() => {
    if (isModalOpen) {
      const full =
        `${formData.First_Name || ""} ${formData.Middle_Name || ""} ${formData.Last_Name || ""}${formData.Suffix ? ` ${formData.Suffix}` : ""}`
          .trim()
          .replace(/\s+/g, " ");

      if (formData.Name !== full) {
        setFormData((prev) => ({ ...prev, Name: full }));
      }
    }
  }, [
    formData.First_Name,
    formData.Middle_Name,
    formData.Last_Name,
    formData.Suffix,
    isModalOpen,
  ]);

  const fetchMembers = async () => {
    try {
      const res = await fetch(`${API_BASE}/members`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setMembers(data || []);
      setFilteredMembers(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/logs`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data: Log[] = await res.json();
      setAllLogs(data);
      const today = new Date().toISOString().split("T")[0];
      const todaysLogs = data.filter(
        (log) => log.Changed_At.split("T")[0] === today,
      );
      setLogs(todaysLogs);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleSearchAndFilter = (query: string, category: string) => {
    setSearchQuery(query);
    setSelectedCategory(category);
    setCurrentPage(1);

    let filtered = members;

    if (category !== "ALL") {
      filtered = filtered.filter((m) => {
        const cat = String(m.Member_Category || "").toUpperCase();
        if (category === "MEMBER") return cat.includes("COMPOSER");
        if (category === "PUBLISHERS") return cat.includes("PUBLISHER");
        if (category === "COPYRIGHT OWNER")
          return cat.includes("COPYRIGHT OWNER");
        return true;
      });
    }

    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter((m) => {
        return (
          String(m.Name || "")
            .toLowerCase()
            .includes(lowerQuery) ||
          String(m.First_Name || "")
            .toLowerCase()
            .includes(lowerQuery) ||
          String(m.Last_Name || "")
            .toLowerCase()
            .includes(lowerQuery) ||
          String(m.Member_No || "")
            .toLowerCase()
            .includes(lowerQuery) ||
          String(m.Membership_ID || "")
            .toLowerCase()
            .includes(lowerQuery)
        );
      });
    }
    setFilteredMembers(filtered);
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

  const openEditModal = (member: Member) => {
    setFormData(member);
    setIsEditMode(true);
    setIsModalOpen(true);
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

  const clearLogsDisplay = () => setLogs([]);
  const showAllLogs = () => setLogs(allLogs);

  function formatDatePH(dateString: string | null | undefined): string {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toISOString().split("T")[0];
  }

  function calculateAge(
    dob: string | undefined | null,
    dod?: string | null,
  ): string {
    if (!dob) return "0";
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return "0";
    const endDate = dod ? new Date(dod) : new Date();
    let age = endDate.getFullYear() - birthDate.getFullYear();
    const m = endDate.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && endDate.getDate() < birthDate.getDate())) age--;
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
    let years = endDate.getFullYear() - membershipDate.getFullYear();
    const m = endDate.getMonth() - membershipDate.getMonth();
    if (m < 0 || (m === 0 && endDate.getDate() < membershipDate.getDate()))
      years--;
    return years >= 0 ? String(years) : "0";
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (saving) return;
    setSaving(true);
    const currentUser = localStorage.getItem("username");
    try {
      const res = await fetch(`${API_BASE}/membership/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          isEdit: isEditMode,
          Changed_By: currentUser,
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        await fetchMembers();
        alert("Action completed successfully.");
      } else {
        alert("Failed to save.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const currentData = filteredMembers.slice(
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
          <div className="flex items-center gap-4 flex-initial shrink-0">
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
              PROJECT CECIL: MEMBERS INFORMATION MASTERLIST
            </div>
          </div>

          <div className="flex-1 flex items-center gap-4">
            <input
              type="text"
              placeholder="Search Members..."
              value={searchQuery}
              onChange={(e) =>
                handleSearchAndFilter(e.target.value, selectedCategory)
              }
              className="p-2 border rounded w-full max-w-xs bg-white/90 outline-none focus:ring-2 focus:ring-orange-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) =>
                handleSearchAndFilter(searchQuery, e.target.value)
              }
              className="p-2 border rounded bg-white text-xs font-bold uppercase"
            >
              <option value="ALL">ALL CATEGORIES</option>
              <option value="MEMBER">MEMBERS</option>
              <option value="PUBLISHERS">PUBLISHERS</option>
              <option value="COPYRIGHT OWNER">COPYRIGHT OWNERS</option>
            </select>
            <button
              onClick={() => exportToCSV(filteredMembers, "Member_List_Export")}
              className="bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded font-bold text-[10px] uppercase"
            >
              Export List
            </button>
          </div>

          <div className="flex items-center gap-2 flex-initial justify-end">
            <button
              onClick={openAddModal}
              className="bg-[#ce5703] hover:bg-orange-700 text-white px-3 py-2 rounded font-bold text-[10px] uppercase transition-all"
            >
              Add Member
            </button>
            <button
              onClick={() => router.push("/successorList")}
              className="bg-gray-800 hover:bg-black text-white px-3 py-2 rounded font-bold text-[10px] uppercase transition-all"
            >
              Successors
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded font-bold text-[10px] uppercase transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="flex-grow p-4 relative z-10">
        <div className="text-black text-3xl hidden lg:block font-bold mb-2">
          Members
        </div>
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#b7df69] text-white uppercase text-[10px]">
              <tr>
                <th className="px-4 py-2"> MEMBERSHIP ID </th>
                <th className="px-4 py-2">DATE OF MEMBERSHIP</th>
                <th className="px-4 py-2">DATE OF BIRTH</th>
                <th className="px-4 py-2"> IPI NAME NUMBER </th>
                <th className="px-4 py-2"> IPI BASE NUMBER</th>
                <th className="px-4 py-2">MEMBERSHIP TYPE</th>
                <th className="px-4 py-2">FULL NAME </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentData.map((m) => (
                <tr
                  key={m.Member_No}
                  className="hover:bg-green-50 transition-colors"
                >
                  <td className="px-4 py-1.5 text-[10px]">{m.Membership_ID}</td>
                  <td className="px-4 py-1.5 text-[10px]">
                    {formatDatePH(m.Date_of_Membership)}
                  </td>
                  <td className="px-4 py-1.5 text-[10px]">
                    {formatDatePH(m.Date_of_Birth)}
                  </td>
                  <td className="px-4 py-1.5 text-[10px]">
                    {m.IPI_Name_Number}
                  </td>
                  <td className="px-4 py-1.5 text-[10px]">
                    {m.IPI_Base_Number}
                  </td>
                  <td className="px-4 py-1.5 text-[10px]">
                    {m.Member_Category}
                  </td>
                  <td className="px-4 py-1.5">
                    <button
                      onClick={() => setSelectedMember(m)}
                      className="text-blue-600 font-bold hover:underline text-left text-[10px]"
                    >
                      {m.Name}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-2 bg-white flex justify-between items-center border-t">
            <span className="text-xs text-gray-600">
              Page {currentPage} of {totalPages} ({filteredMembers.length} total
              items)
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 bg-white border rounded disabled:opacity-50 text-[10px] font-bold"
              >
                Prev
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 bg-white border rounded disabled:opacity-50 text-[10px] font-bold"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-[#b7df69]">
              <h2 className="text-xl font-black uppercase">Member Details</h2>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="border-b pb-2">
                <p className="text-[9px] uppercase text-gray-400 font-bold">
                  Successor Name
                </p>
                {selectedMember.Successor_Full_Name ? (
                  <button
                    onClick={() =>
                      router.push(
                        `/successorList?search=${selectedMember.Membership_ID}`,
                      )
                    }
                    className="text-blue-600 font-bold hover:underline text-sm uppercase"
                  >
                    {selectedMember.Successor_Full_Name}
                  </button>
                ) : (
                  <p className="text-gray-400 text-sm italic">None</p>
                )}
              </div>
              {Object.entries(selectedMember)
                .filter(
                  ([key]) =>
                    !["CAE_No", "Successor_Full_Name", "Name"].includes(key),
                )
                .map(([key, val]) => (
                  <div key={key} className="border-b pb-2">
                    <p className="text-[9px] uppercase text-gray-400 font-bold">
                      {key.replace(/_/g, " ")}
                    </p>
                    <p className="text-gray-800 font-medium text-sm">
                      {key.toLowerCase().includes("date")
                        ? formatDatePH(String(val))
                        : String(val || "N/A")}
                    </p>
                  </div>
                ))}
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  openEditModal(selectedMember);
                  setSelectedMember(null);
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold text-xs uppercase"
              >
                Edit Information
              </button>
              <button
                onClick={() => setSelectedMember(null)}
                className="flex-1 bg-gray-200 py-2 rounded-lg font-bold text-xs uppercase"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-[#b7df69] flex justify-between items-center">
              <h2 className="text-xl font-black uppercase text-gray-800">
                {isEditMode ? "EDIT MEMBER" : "ADD NEW MEMBER"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-3xl"
              >
                &times;
              </button>
            </div>
            <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                label="Membership ID"
                name="Membership_ID"
                value={formData.Membership_ID}
                onChange={handleInputChange}
                disabled
              />
              <Select
                label="Prefix"
                name="Prefix"
                value={formData.Prefix}
                options={prefixOptions}
                onChange={handleInputChange}
              />
              <Input
                label="First Name"
                name="First_Name"
                value={formData.First_Name}
                onChange={handleInputChange}
              />
              <Input
                label="Middle Name"
                name="Middle_Name"
                value={formData.Middle_Name}
                onChange={handleInputChange}
              />
              <Input
                label="Last Name"
                name="Last_Name"
                value={formData.Last_Name}
                onChange={handleInputChange}
              />
              <DatalistInput
                label="Suffix "
                name="Suffix"
                value={formData.Suffix}
                options={suffixOptions}
                onChange={handleInputChange}
                listId="suffix-list"
              />
              <Input
                label="Full Name"
                name="Name"
                value={formData.Name}
                onChange={handleInputChange}
                disabled
              />
              <Select
                label="Sex"
                name="Sex"
                value={formData.Sex}
                options={sexOptions}
                onChange={handleInputChange}
              />
              <div className="flex flex-col gap-1">
                <DateInput
                  label="Date of Birth"
                  name="Date_of_Birth"
                  value={formData.Date_of_Birth}
                  onChange={handleInputChange}
                />
                <div className="px-2 py-0.5 rounded border border-blue-200">
                  <span className="text-[9px] font-bold uppercase">
                    {formData.Date_of_Death ? "Age at Death: " : "Age:"}
                  </span>
                  <span className="text-[10px] font-black text-blue-800">
                    {calculateAge(
                      formData.Date_of_Birth,
                      formData.Date_of_Death,
                    )}{" "}
                    yrs
                  </span>
                </div>
              </div>
              <DateInput
                label="Date of Death"
                name="Date_of_Death"
                value={formData.Date_of_Death}
                onChange={handleInputChange}
              />
              <Select
                label="Status"
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
              <Input
                label="CAE No"
                name="CAE_No"
                value={formData.CAE_No}
                onChange={handleInputChange}
              />
              <Input
                label="IPI Name No"
                name="IPI_Name_Number"
                value={formData.IPI_Name_Number}
                onChange={handleInputChange}
                disabled
              />
              <Input
                label="IPI Base No"
                name="IPI_Base_Number"
                value={formData.IPI_Base_Number}
                onChange={handleInputChange}
                disabled
              />
              <Input
                label="Band Name"
                name="Band_Name"
                value={formData.Band_Name}
                onChange={handleInputChange}
              />
              <Input
                label="Pseudonym"
                name="Pseudonym"
                value={formData.Pseudonym}
                onChange={handleInputChange}
              />
              <Input
                label="Email Address"
                name="Email_Address"
                value={formData.Email_Address}
                onChange={handleInputChange}
              />
              <Input
                label="Address"
                name="Address"
                value={formData.Address}
                onChange={handleInputChange}
              />
              <Input
                label="City"
                name="CITY"
                value={formData.CITY}
                onChange={handleInputChange}
              />
              <Input
                label="Contact Number"
                name="Contact_Number"
                value={formData.Contact_Number}
                onChange={handleInputChange}
              />
              <Input
                label="Primary Contact"
                name="Primary_Contact_Number"
                value={formData.Primary_Contact_Number}
                onChange={handleInputChange}
              />
              <Input
                label="Secondary Contact"
                name="Secondary_Contact_Number"
                value={formData.Secondary_Contact_Number}
                onChange={handleInputChange}
              />
              <Input
                label="Landline"
                name="Landline"
                value={formData.Landline}
                onChange={handleInputChange}
              />
              <Input
                label="Business Entity"
                name="Type_of_Business_Entity"
                value={formData.Type_of_Business_Entity}
                onChange={handleInputChange}
              />
              <Input
                label="Official Rep"
                name="Official_Representative"
                value={formData.Official_Representative}
                onChange={handleInputChange}
              />
              <Input
                label="Office Number"
                name="Office_Number"
                value={formData.Office_Number}
                onChange={handleInputChange}
              />
              <Input
                label="Office Address"
                name="Office_Address"
                value={formData.Office_Address}
                onChange={handleInputChange}
              />
              <Input
                label="Signatory"
                name="Signatory"
                value={formData.Signatory}
                onChange={handleInputChange}
              />
              <Input
                label="Contact Person"
                name="Contact_Person"
                value={formData.Contact_Person}
                onChange={handleInputChange}
              />
              <Input
                label="TIN"
                name="Tin_Number"
                value={formData.Tin_Number}
                onChange={handleInputChange}
              />
              <Input
                label="Bank Name"
                name="Bank_Name"
                value={formData.Bank_Name}
                onChange={handleInputChange}
              />
              <Input
                label="Bank Account Info"
                name="Bank_Account_Info"
                value={formData.Bank_Account_Info}
                onChange={handleInputChange}
              />
              <div className="flex flex-col gap-1">
                <DateInput
                  label="Date of Membership"
                  name="Date_of_Membership"
                  value={formData.Date_of_Membership}
                  onChange={handleInputChange}
                />
                <div className="px-2 py-0.5 rounded border border-green-200">
                  <span className="text-[9px] font-bold text-black uppercase">
                    {formData.Date_of_Membership_Termination_Resignation
                      ? "Length of Membership: "
                      : "Computed Tenure: "}
                  </span>
                  <span className="text-[10px] font-black text-green-800">
                    {calculateYearsOfMembership(
                      formData.Date_of_Membership,
                      formData.Date_of_Membership_Termination_Resignation,
                    )}{" "}
                    years
                  </span>
                </div>
              </div>
              <DateInput
                label="Termination Date"
                name="Date_of_Membership_Termination_Resignation"
                value={formData.Date_of_Membership_Termination_Resignation}
                onChange={handleInputChange}
              />
              <DateInput
                label="National Library Reg Date"
                name="Date_Registred_National_Library"
                value={formData.Date_Registred_National_Library}
                onChange={handleInputChange}
              />
              <Select
                label="Deed of Assignment"
                name="Deed_Of_Assignment"
                value={formData.Deed_Of_Assignment}
                options={ynOptions}
                onChange={handleInputChange}
              />
              <Select
                label="Certification"
                name="Certification"
                value={formData.Certification}
                options={ynOptions}
                onChange={handleInputChange}
              />
              <Select
                label="Membership Application"
                name="Membership_Application"
                value={formData.Membership_Application}
                options={ynOptions}
                onChange={handleInputChange}
              />
              <Select
                label="Declaration of Works"
                name="Declaration_Of_Works"
                value={formData.Declaration_Of_Works}
                options={ynOptions}
                onChange={handleInputChange}
              />
              <Input
                label="Remarks"
                name="Remarks"
                value={formData.Remarks}
                onChange={handleInputChange}
              />
              <Input
                label="Related Files"
                name="Related_files"
                value={formData.Related_files}
                onChange={handleInputChange}
              />
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-4">
              <button
                onClick={handleSubmit}
                className={`flex-1 py-3 rounded-lg font-bold uppercase text-xs ${saving ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"}`}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-bold uppercase hover:bg-gray-600 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// Sub-components
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
    <div className="flex flex-col w-full">
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
