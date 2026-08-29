"use client";

import { useState } from "react";
import { Card, Button, Badge } from "@/components/UI";
import { IconSearch } from "@/components/Icons";
import { lookupAdminUser, impersonateUserAdmin, updateProfileAdmin } from "../api/admin.api";

function axiosMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message ?? e?.message ?? "Request failed";
}

export function AdminUserDirectory() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  
  const [bio, setBio] = useState("");
  const [specialty, setSpecialty] = useState<"CIVIL" | "ARCHITECTURAL">("CIVIL");
  const [updating, setUpdating] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) return;
    
    setLoading(true);
    setError(null);
    setUser(null);
    
    try {
      const foundUser = await lookupAdminUser(identifier);
      setUser(foundUser);
      // In a real app, we'd also fetch their EngineerProfile here if they have one.
      // For now, we'll just allow basic impersonation.
    } catch (err) {
      setError(axiosMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async () => {
    if (!user) return;
    try {
      await impersonateUserAdmin(user.id);
      window.location.href = "/dashboard"; // Reload app with new token
    } catch (err) {
      setError(axiosMessage(err));
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setUpdating(true);
    try {
      await updateProfileAdmin(user.id, { bio, specialty });
      alert("Profile updated successfully!");
    } catch (err) {
      setError(axiosMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="font-bold">User Directory & Impersonation</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Lookup users to view details, update profiles, or log in as them.
        </p>
      </div>

      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <IconSearch
              width={14}
              height={14}
              className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter User ID or Email"
              className="w-full h-10 ps-9 pe-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
          <Button type="submit" disabled={loading || !identifier.trim()}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}
      </div>

      {user && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold border-b border-slate-200 dark:border-slate-800 pb-2">
              User Details
            </h3>
            <div className="text-sm space-y-2">
              <p><span className="font-semibold">ID:</span> {user.id}</p>
              <p><span className="font-semibold">Name:</span> {user.name}</p>
              <p><span className="font-semibold">Email:</span> {user.email}</p>
              <p><span className="font-semibold">Role:</span> <Badge>{user.role}</Badge></p>
            </div>
            
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button onClick={handleImpersonate} variant="secondary" className="w-full">
                Login as {user.name}
              </Button>
              <p className="text-xs text-slate-500 mt-2 text-center">
                Warning: This will end your current admin session.
              </p>
            </div>
          </div>

          {user.role === "ENGINEER" && (
            <div className="space-y-4 border-s border-slate-200 dark:border-slate-800 ps-6">
              <h3 className="font-semibold border-b border-slate-200 dark:border-slate-800 pb-2">
                Update Engineer Profile
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Specialty
                  </label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                  >
                    <option value="CIVIL">CIVIL</option>
                    <option value="ARCHITECTURAL">ARCHITECTURAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm resize-none"
                    rows={3}
                  />
                </div>
                <Button onClick={handleUpdateProfile} disabled={updating}>
                  {updating ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
