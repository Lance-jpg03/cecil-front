// src/app/home/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

const prefixOptions = ["MR.", "MS.", "MRS."];
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

interface Member {
  Member_No: string;
  Old_Member_No?: string | null; // Added
  Membership_ID: string;
  Member_Status?: string | null;
  Member_Category?: string | null;
  Prefix?: string | null;
  First_Name?: string | null;
  Middle_Name?: string | null;
  Last_Name?: string | null;
  Suffix?: string | null;
  Name?: string | null; // Full Name
  Sex?: string | null;
  Date_of_Birth?: string | null;
  Date_of_Death?: string | null;
  CAE_No?: string | null;
  IPI_Name_Number?: string | null;
  IPI_Base_Number?: string | null;
  Band_Name?: string | null;
  Pseudonym?: string | null;
  Address?: string | null;
  CITY?: string | null; // Added
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
  Date_of_Membership_Termination_Resignation?: string | null;
  Date_Registred_National_Library?: string | null;
  Deed_Of_Assignment?: string | null;
  Certification?: string | null;
  Membership_Application?: string | null;
  Declaration_Of_Works?: string | null;
  Remarks?: string | null;
  Remarks2?: string | null;
  Related_files?: string | null;
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 11;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState<Partial<Member>>({});

  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [allLogs, setAllLogs] = useState<Log[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [saving, setSaving] = useState(false);

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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);

    if (!query.trim()) {
      setFilteredMembers(members);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = members.filter((m) => {
      const fullName = String(m.Name || "").toLowerCase();
      const firstName = String(m.First_Name || "").toLowerCase();
      const lastName = String(m.Last_Name || "").toLowerCase();
      const memberNo = String(m.Member_No || "").toLowerCase();

      return (
        fullName.includes(lowerQuery) ||
        firstName.includes(lowerQuery) ||
        lastName.includes(lowerQuery) ||
        memberNo.includes(lowerQuery)
      );
    });

    setFilteredMembers(filtered);
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

  function formatDatePH(dateString: string): string {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";

    // Returns only YYYY-MM-DD
    return date.toISOString().split("T")[0];
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
      setSaving(false); // UNLOCK
    }
  };

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const currentData = filteredMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <main className="min-h-screen w-full bg-[url('/BG.png')] lg:bg-[url('/BG.png')] bg-fixed bg-no-repeat bg-[length:100%_100%] bg-center flex flex-col font-sans">
      <div className="relative w-full bg-[#b7df69] p-3 sticky top-0 z-50 shadow-lg">
        <div className="w-full px-1 relative z-10 flex justify-between items-center mx-auto">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={openLogsModal}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Image
                src="/lego.png"
                alt="LOGO"
                width={100}
                height={50}
                priority
              />
            </button>
            <div className="text-white text-xl hidden lg:block font-bold">
              Project Cecil Masterlist
            </div>
          </div>

          <div className="flex-1 flex justify-center">
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="p-2 border rounded w-full md:w-3/4 bg-white/90 outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end">
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

      <div className="flex-grow p-6 relative z-10">
        <div className="text-black text-4xl hidden lg:block font-bold mb-2">
          Members
        </div>
        <div className="bg-transparent rounded-xl shadow-2xl overflow-hidden border border-gray-200 lg[25%]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#b7df69] text-white uppercase text-xs">
              <tr>
                <th className="p-4">Prefix</th>
                <th className="p-4">First Name</th>
                <th className="p-4">Middle Name</th>
                <th className="p-4">Last Name</th>
                <th className="p-4">Suffix</th>
                <th className="p-4">Sex</th>
                <th className="p-4">Date Of Birth</th>
                <th className="p-4">Full Name </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentData.map((m) => (
                <tr
                  key={m.Member_No}
                  className="hover:bg-green-50 transition-colors"
                >
                  <td className="p-4 text-xs">{m.Prefix}</td>
                  <td className="p-4 text-xs">{m.First_Name}</td>
                  <td className="p-4 text-xs">{m.Middle_Name}</td>
                  <td className="p-4 text-xs">{m.Last_Name}</td>
                  <td className="p-4 text-xs">{m.Suffix || "-"}</td>
                  <td className="p-4 text-xs">{m.Sex}</td>
                  <td className="p-4 text-xs">
                    {m.Date_of_Birth?.substring(0, 10)}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setSelectedMember(m)}
                      className="text-blue-600 font-bold hover:underline text-left text-xs"
                    >
                      {m.Name}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-2 bg-transparent flex justify-between items-center border-t">
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-4 py-1 bg-white border rounded disabled:opacity-50 text-xs font-bold"
              >
                Prev
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-4 py-1 bg-white border rounded disabled:opacity-50 text-xs font-bold"
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
            <div className="p-6 border-b flex justify-between items-center rounded-t-xl bg-[#b7df69]">
              <h2 className="text-2xl font-black text-gray-800 uppercase">
                Member Details
              </h2>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-gray-500 hover:text-black text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(selectedMember).map(([key, val]) => (
                <div key={key} className="border-b border-gray-100 pb-2">
                  <p className="text-[10px] uppercase text-gray-400 font-bold">
                    {key.replace(/_/g, " ")}
                  </p>
                  <p className="text-gray-800 font-medium">
                    {key.toLowerCase().includes("date") &&
                    typeof val === "string"
                      ? val.substring(0, 10)
                      : String(val || "N/A")}
                  </p>
                </div>
              ))}
            </div>
            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  openEditModal(selectedMember);
                  setSelectedMember(null);
                }}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all"
              >
                Edit Information
              </button>
              <button
                onClick={() => setSelectedMember(null)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-300 transition-all"
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
                      logs.map((log) => (
                        <tr
                          key={log.Log_ID}
                          className="hover:bg-gray-50 border-b"
                        >
                          <td className="p-3 border">{log.Log_ID}</td>
                          <td className="p-3 border font-mono">
                            {log.Membership_ID}
                          </td>
                          <td className="p-3 border">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-[10px] font-bold">
                              {log.Action}
                            </span>
                          </td>
                          <td className="p-3 border font-bold">
                            {log.Changed_By}
                          </td>
                          <td className="p-3 border whitespace-nowrap">
                            {formatDatePH(log.Changed_At)}
                          </td>
                          <td className="p-3 border italic text-gray-500">
                            {log.Details || "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-10 text-center text-gray-400"
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
            <div className="p-6 border-b bg-[#b7df69] flex justify-between items-center">
              <h2 className="text-2xl font-black">
                {isEditMode ? "EDIT MEMBER" : "ADD NEW MEMBER"}
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
                label="Old Member No"
                name="Old_Member_No"
                value={formData.Old_Member_No}
                onChange={handleInputChange}
                disabled
              />
              <Input
                label="Membership ID"
                name="Membership_ID"
                value={formData.Membership_ID}
                onChange={handleInputChange}
                disabled
              />
              {/* PERSONAL INFORMATION */}
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
              <Input
                label="Suffix"
                name="Suffix"
                value={formData.Suffix}
                onChange={handleInputChange}
              />
              <Input
                label="Full Name"
                name="Name"
                value={`${formData.First_Name || ""} ${formData.Middle_Name || ""} ${formData.Last_Name || ""}${formData.Suffix ? ` ${formData.Suffix}` : ""}`.trim()}
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
              <DateInput
                label="Date of Birth"
                name="Date_of_Birth"
                value={formData.Date_of_Birth}
                onChange={handleInputChange}
              />
              <DateInput
                label="Date of Death"
                name="Date_of_Death"
                value={formData.Date_of_Death}
                onChange={handleInputChange}
              />
              {/* STATUS & CATEGORY */}
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
              {/* INDUSTRY IDENTIFIERS */}
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
              {/* CONTACT & LOCATION */}
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
              {/* OFFICE & BUSINESS ENTITY */}
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
              {/* FINANCIAL INFO */}
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
              {/* MEMBERSHIP DATES & LEGAL RECORDS */}
              <DateInput
                label="Date of Membership"
                name="Date_of_Membership"
                value={formData.Date_of_Membership}
                onChange={handleInputChange}
              />
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
              {/* DOCUMENTATION STATUS */}
              <Input
                label="Deed of Assignment"
                name="Deed_Of_Assignment"
                value={formData.Deed_Of_Assignment}
                onChange={handleInputChange}
              />
              <Input
                label="Certification"
                name="Certification"
                value={formData.Certification}
                onChange={handleInputChange}
              />
              <Input
                label="Membership Application"
                name="Membership_Application"
                value={formData.Membership_Application}
                onChange={handleInputChange}
              />
              <Input
                label="Declaration of Works"
                name="Declaration_Of_Works"
                value={formData.Declaration_Of_Works}
                onChange={handleInputChange}
              />
              {/* REMARKS & FILES */}
              <Input
                label="Remarks"
                name="Remarks"
                value={formData.Remarks}
                onChange={handleInputChange}
              />
              <Input
                label="Remarks 2"
                name="Remarks2"
                value={formData.Remarks2}
                onChange={handleInputChange}
              />
              <Input
                label="Related Files"
                name="Related_files"
                value={formData.Related_files}
                onChange={handleInputChange}
              />
            </div>
            <div className="p-6 border-t bg-gray-50 flex gap-4">
              <button
                onClick={handleSubmit}
                className={`flex-1 py-3 rounded-lg font-bold uppercase
    ${
      saving
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-green-600 hover:bg-green-700 text-white"
    }`}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-bold uppercase hover:bg-gray-600"
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

function Input({ label, name, value, onChange, disabled = false }: any) {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-bold uppercase text-gray-500">
        {label}
      </label>
      <input
        type="text"
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        className="p-2 border rounded text-xs bg-white disabled:bg-gray-100"
      />
    </div>
  );
}

function Select({ label, name, value, options, onChange }: any) {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-bold uppercase text-gray-500">
        {label}
      </label>
      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        className="p-2 border rounded text-xs bg-white"
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
      <label className="text-[10px] font-bold uppercase text-gray-500">
        {label}
      </label>
      <input
        type="date"
        name={name}
        value={value?.substring(0, 10) || ""}
        onChange={onChange}
        className="p-2 border rounded text-xs bg-white"
      />
    </div>
  );
}
