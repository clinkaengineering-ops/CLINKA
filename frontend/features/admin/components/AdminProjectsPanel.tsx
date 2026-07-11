"use client";

import { useEffect, useState } from "react";
import { Card, Button, Badge } from "@/components/UI";
import { formatMoney } from "@/features/escrow/utils/formatMoney";
import { fetchAdminProjects, updateAdminProject, type AdminProject } from "../api/admin.api";

function axiosMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message ?? e?.message ?? "Request failed";
}

export function AdminProjectsPanel() {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminProjects(1, 50);
      setProjects(res.projects);
    } catch (err) {
      setError(axiosMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggleFlag = async (id: number, currentFlag: boolean) => {
    try {
      await updateAdminProject(id, { isFlagged: !currentFlag });
      load();
    } catch (err) {
      alert(axiosMessage(err));
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Are you sure you want to force-cancel this project?")) return;
    try {
      await updateAdminProject(id, { status: "CANCELLED" });
      load();
    } catch (err) {
      alert(axiosMessage(err));
    }
  };

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center gap-3">
        <div>
          <h2 className="font-bold">Project Moderation</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor all marketplace projects, flag spam, and cancel inappropriate ones.
          </p>
        </div>
        <Button size="sm" onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {error && <p className="p-4 text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/10 border-b border-rose-100 dark:border-rose-900/20">{error}</p>}

      {loading && projects.length === 0 ? (
        <p className="p-8 text-center text-slate-500 text-sm">Loading projects...</p>
      ) : projects.length === 0 ? (
        <p className="p-8 text-center text-slate-500 text-sm">No projects found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs uppercase">
                <th className="text-start p-3 font-semibold">Project Title</th>
                <th className="text-start p-3 font-semibold">Client</th>
                <th className="text-start p-3 font-semibold">Budget & Type</th>
                <th className="text-start p-3 font-semibold">Status</th>
                <th className="text-start p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800/80">
                  <td className="p-3">
                    <p className="font-medium max-w-[200px] truncate" title={p.title}>{p.title}</p>
                    <p className="text-xs text-slate-500 max-w-[200px] truncate">{p.description}</p>
                  </td>
                  <td className="p-3">
                    <p className="font-medium">{p.client.name}</p>
                    <p className="text-xs text-slate-500">{p.client.email}</p>
                  </td>
                  <td className="p-3">
                    <p className="font-medium">{formatMoney(p.budget)}</p>
                    <Badge color="slate">{p.serviceType}</Badge>
                  </td>
                  <td className="p-3">
                    <div className="space-y-1">
                      <Badge color={p.status === "OPEN" ? "green" : p.status === "CANCELLED" ? "rose" : "amber"}>
                        {p.status}
                      </Badge>
                      {p.isFlagged && <Badge color="rose">FLAGGED</Badge>}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant={p.isFlagged ? "secondary" : "danger"} 
                        onClick={() => handleToggleFlag(p.id, p.isFlagged)}
                      >
                        {p.isFlagged ? "Unflag" : "Flag as Spam"}
                      </Button>
                      {p.status !== "CANCELLED" && p.status !== "COMPLETED" && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleCancel(p.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
