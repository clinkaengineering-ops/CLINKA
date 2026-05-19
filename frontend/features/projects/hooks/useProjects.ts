/**
 * useProjects.ts
 * React hooks that wrap projectApi.ts.
 * No external query library required — uses plain useEffect + useState.
 * Drop-in replaceable with React Query if you add it later.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type CreateProjectPayload,
  type Project,
  type UpdateProjectPayload,
  createProject,
  deleteProject,
  fetchMyProjects,
  fetchProjectById,
  fetchProjects,
  updateProject,
} from "../api/project.api";

// ─── Shared state shape ───────────────────────────────────────────────────────

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useAsyncState<T>(initial: T | null = null): [AsyncState<T>, (fn: () => Promise<T>) => Promise<void>] {
  const [state, setState] = useState<AsyncState<T>>({ data: initial, loading: false, error: null });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const run = useCallback(async (fn: () => Promise<T>) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const data = await fn();
      if (mounted.current) setState({ data, loading: false, error: null });
    } catch (err) {
      if (mounted.current)
        setState(s => ({ ...s, loading: false, error: (err as Error).message }));
    }
  }, []);

  return [state, run];
}

// ─── useProjects ──────────────────────────────────────────────────────────────

/**
 * Fetches all OPEN projects from the public endpoint.
 * Re-fetches whenever `refresh` changes (call `refetch()` to trigger).
 */
export function useProjects() {
  const [state, run] = useAsyncState<Project[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => { run(fetchProjects); }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...state, refetch: () => setTick(t => t + 1) };
}

// ─── useProject ───────────────────────────────────────────────────────────────

/**
 * Fetches a single project by id (includes bids).
 * Re-fetches when `id` changes.
 */
export function useProject(id: number | null) {
  const [state, run] = useAsyncState<Project>();

  useEffect(() => {
    if (id == null) return;
    run(() => fetchProjectById(id));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}

// ─── useMyProjects ────────────────────────────────────────────────────────────

/**
 * Fetches projects belonging to the authenticated client.
 * Pass `token` from your auth context / session.
 */
export function useMyProjects(token: string | null) {
  const [state, run] = useAsyncState<Project[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!token) return;
    run(() => fetchMyProjects(token));
  }, [token, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...state, refetch: () => setTick(t => t + 1) };
}

// ─── useCreateProject ─────────────────────────────────────────────────────────

/**
 * Returns a `create` function plus loading/error state.
 * On success calls optional `onSuccess` callback (e.g. to invalidate list).
 */
export function useCreateProject(token: string | null, onSuccess?: (p: Project) => void) {
  const [state, run] = useAsyncState<Project>();

  const create = useCallback(
    (payload: CreateProjectPayload) => {
      if (!token) return Promise.reject(new Error("Not authenticated"));
      return run(async () => {
        const project = await createProject(payload, token);
        onSuccess?.(project);
        return project;
      });
    },
    [token, onSuccess, run],
  );

  return { ...state, create };
}

// ─── useUpdateProject ─────────────────────────────────────────────────────────

/**
 * Returns an `update` function plus loading/error state.
 */
export function useUpdateProject(token: string | null, onSuccess?: (p: Project) => void) {
  const [state, run] = useAsyncState<Project>();

  const update = useCallback(
    (id: number, payload: UpdateProjectPayload) => {
      if (!token) return Promise.reject(new Error("Not authenticated"));
      return run(async () => {
        const project = await updateProject(id, payload, token);
        onSuccess?.(project);
        return project;
      });
    },
    [token, onSuccess, run],
  );

  return { ...state, update };
}

// ─── useDeleteProject ─────────────────────────────────────────────────────────

/**
 * Returns a `remove` function plus loading/error state.
 */
export function useDeleteProject(token: string | null, onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(
    async (id: number) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        await deleteProject(id, token);
        onSuccess?.();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [token, onSuccess],
  );

  return { loading, error, remove };
}
