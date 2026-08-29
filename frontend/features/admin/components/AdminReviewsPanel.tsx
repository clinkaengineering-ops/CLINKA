"use client";

import { useEffect, useState } from "react";
import { Card, Button } from "@/components/UI";
import { fetchAdminReviews, deleteAdminReview, type AdminReview } from "../api/admin.api";

function axiosMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message ?? e?.message ?? "Request failed";
}

export function AdminReviewsPanel() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminReviews(1, 50);
      setReviews(res.reviews);
    } catch (err) {
      setError(axiosMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      await deleteAdminReview(id);
      load();
    } catch (err) {
      alert(axiosMessage(err));
    }
  };

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center gap-3">
        <div>
          <h2 className="font-bold">Review Moderation</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor and remove abusive or unfair reviews.
          </p>
        </div>
        <Button size="sm" onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {error && <p className="p-4 text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/10 border-b border-rose-100 dark:border-rose-900/20">{error}</p>}

      {loading && reviews.length === 0 ? (
        <p className="p-8 text-center text-slate-500 text-sm">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="p-8 text-center text-slate-500 text-sm">No reviews found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs uppercase">
                <th className="text-start p-3 font-semibold">Project</th>
                <th className="text-start p-3 font-semibold">Client (Reviewer)</th>
                <th className="text-start p-3 font-semibold">Engineer</th>
                <th className="text-start p-3 font-semibold">Rating & Comment</th>
                <th className="text-start p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800/80 align-top">
                  <td className="p-3">
                    <p className="font-medium max-w-[150px] truncate" title={r.project.title}>{r.project.title}</p>
                    <p className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="p-3">{r.client.name}</td>
                  <td className="p-3">{r.engineer.user.name}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-sm ${i < r.rating ? "text-amber-500" : "text-slate-300"}`}>★</span>
                      ))}
                    </div>
                    {r.comment ? (
                      <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm whitespace-pre-wrap">{r.comment}</p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No comment</p>
                    )}
                  </td>
                  <td className="p-3">
                    <Button 
                      size="sm" 
                      variant="danger" 
                      onClick={() => handleDelete(r.id)}
                    >
                      Delete
                    </Button>
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
