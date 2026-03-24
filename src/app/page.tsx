"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setCookie } from "cookies-next";
import { Poppins } from "next/font/google";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const img = new Image();
    img.src = "/CECIL.gif";
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Login failed");
      }

      setCookie("auth_token", data.token, { path: "/", maxAge: 1440 });

      let deptName = "Unknown Department";
      if (data.roleflag === "DP004") deptName = "Documentation";
      if (data.roleflag === "DP001") deptName = "Membership";

      localStorage.setItem("username", username);
      localStorage.setItem("userRole", data.roleflag); 
      localStorage.setItem("department", deptName);    

      router.push("/home");
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`login-page-wrapper ${poppins.className}`}>
      <div
        className={`absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-700 ${
          isInitialized ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        style={{ backgroundImage: "url('/LEGO.gif')" }}
      />

      <div
        className={`absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-1000 ${
          isInitialized ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundImage: "url('/CECIL.gif')" }}
      />

      <div
        className={`content-sidebar w-full md:w-[55%] transition-all duration-1000 transform ${
          isInitialized
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8 pointer-events-none"
        }`}
      >
        <div className="flex-grow flex">
          <div className="hidden md:block md:w-[35%]" />
          <div className="w-full md:w-1/2 flex items-center justify-center p-4">
            <div className="w-full max-w-[330px]">
              <form
                onSubmit={handleLogin}
                className="flex flex-col space-y-5 px-3"
              >
                <div className="title-container text-center">
                  <h1 className="h1-main">
                    PROJECT <span className="text-[#ce5703]">CECIL</span>
                  </h1>
                  <p className="p-credentials">Please enter your credentials</p>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="USERNAME"
                  className="form"
                  disabled={loading}
                  required
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="PASSWORD"
                  className="form"
                  disabled={loading}
                  required
                />

                {error && (
                  <p className="text-red-500 text-[10px] text-center uppercase animate-bounce">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="submit"
                  disabled={loading || !username || !password}
                >
                  {loading ? "AUTHENTICATING..." : "SIGN IN"}
                </button>
              </form>
            </div>
          </div>
        </div>
        <footer className="footer-copyright flex w-full">
          <div className="hidden md:block md:w-[35%]" />

          <div className="w-full md:w-1/2 flex justify-center pb-8">
            <p className="flex flex-col items-center gap-2 text-center">
              © 2026 Membership Master List
              <span className="text-black font-semibold">Project Cecil</span>
              <button
                type="button"
                onClick={() => setShowPrivacy(true)}
                className="text-[10px] uppercase tracking-widest text-gray-500 hover:text-[#f0bb0e] transition-colors"
              >
                View Privacy Notice
              </button>
            </p>
          </div>
        </footer>
      </div>

      {showPrivacy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-[#f8f9fa] rounded-2xl shadow-2xl overflow-hidden border border-white/20">
            <div className="bg-[#75b84f] p-4 flex justify-between items-center">
              <h2
                className={`${poppins.className} text-white font-bold uppercase tracking-widest text-sm`}
              >
                Privacy Notice
              </h2>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto text-[11px] leading-relaxed text-gray-700">
              <p className="mb-4 font-bold">
                Project Cecil : Membership Information Master List
              </p>
              <p className="mb-4">
                respects your privacy and is committed to protecting your
                personal information. This notice explains how information is
                collected and used in connection with the Program.
              </p>

              <h3 className="font-bold text-[#004aad] mb-1">
                Information Collected
              </h3>
              <ul className="list-disc ml-4 mb-4">
                <li>Assigned Username and Password of the developer</li>
                <li>Numbers input by the user</li>
              </ul>

              <h3 className="font-bold text-[#004aad] mb-1">
                Purpose of Collection
              </h3>
              <p className="mb-4">
                The collected information is used solely to authenticate and
                manage access to the Program. Ensure proper functionality and
                security of the system.
              </p>

              <h3 className="font-bold text-[#004aad] mb-1">Data Security</h3>
              <p className="mb-4">
                All collected information is handled securely. Access is
                restricted to authorized personnel only. The Program implements
                reasonable technical and organizational measures to protect your
                information.
              </p>

              <h3 className="font-bold text-[#004aad] mb-1">Data Sharing</h3>
              <p className="mb-4">
                The Program does not share any collected information with third
                parties.
              </p>

              <h3 className="font-bold text-[#004aad] mb-1">Retention</h3>
              <p className="mb-4">
                Collected information is retained only for as long as necessary
                to fulfill the purposes outlined above.
              </p>

              <h3 className="font-bold text-[#004aad] mb-1">Your Rights</h3>
              <p className="mb-4">
                You have the right to request access to, correction, or deletion
                of your information. For any inquiries regarding your data,
                please email projectsandanalytics@filscap.com.ph.
              </p>

              <h3 className="font-bold text-[#004aad] mb-1">
                Updates to this Notice
              </h3>
              <p>
                This Privacy Notice may be updated from time to time. The latest
                version will always be accessible within the Program.
              </p>
            </div>

            <div className="bg-gray-100 p-3 text-center border-t">
              <button
                onClick={() => setShowPrivacy(false)}
                className="bg-[#75b84f] text-white text-[10px] px-8 py-2 rounded-full hover:bg-blue-700 transition-all font-bold uppercase"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="scanline-overlay pointer-events-none" />
    </div>
  );
}
