/**
 * useProjects.ts — hooks wrapping project.api.ts (cookie auth).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type CreateProjectPayload,
  type Project,
  type UpdateProjectPayload,
  createProject,
  deleteProject,
  fetchAssignedProjects,
  fetchMyProjects,
  fetchProjectById,
  fetchProjects,
  updateProject,
} from "../api/project.api";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useAsyncState<T>(
  initial: T | null = null,
): [AsyncState<T>, (fn: () => Promise<T>) => Promise<void>] {
  const [state, setState] = useState<AsyncState<T>>({
    data: initial,
    loading: false,
    error: null,
  });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (fn: () => Promise<T>) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fn();
      if (mounted.current) setState({ data, loading: false, error: null });
    } catch (err) {
      if (mounted.current)
        setState((s) => ({
          ...s,
          loading: false,
          error: (err as Error).message,
        }));
    }
  }, []);

  return [state, run];
}

function axiosMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message ?? e?.message ?? "Request failed";
}

/** Fetches all OPEN projects (public). */
export function useProjects(params?: { q?: string; serviceType?: string }) {
  const [state, run] = useAsyncState<Project[]>([]);
  const [tick, setTick] = useState(0);
  const q = params?.q;
  const serviceType = params?.serviceType;

  useEffect(() => {
    run(async () => {
      try {
        return await fetchProjects({ q, serviceType });
      } catch (err) {
        throw new Error(axiosMessage(err));
      }
    });
  }, [tick, q, serviceType]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...state, refetch: () => setTick((t) => t + 1) };
}

/** Fetches a single project by id (includes bids). */
export function useProject(id: number | null) {
  const [state, run] = useAsyncState<Project>();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (id == null) return;
    run(async () => {
      try {
        return await fetchProjectById(id);
      } catch (err) {
        throw new Error(axiosMessage(err));
      }
    });
  }, [id, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...state, refetch: () => setTick((t) => t + 1) };
}

/** Fetches projects for the logged-in client. */
export function useMyProjects(enabled = true) {
  const [state, run] = useAsyncState<Project[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    run(async () => {
      try {
        return await fetchMyProjects();
      } catch (err) {
        throw new Error(axiosMessage(err));
      }
    });
  }, [enabled, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...state, refetch: () => setTick((t) => t + 1) };
}

/** Fetches projects where engineer has an accepted bid. */
export function useAssignedProjects(enabled = true) {
  const [state, run] = useAsyncState<Project[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    run(async () => {
      try {
        return await fetchAssignedProjects();
      } catch (err) {
        throw new Error(axiosMessage(err));
      }
    });
  }, [enabled, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...state, refetch: () => setTick((t) => t + 1) };
}

export function useCreateProject(onSuccess?: (p: Project) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (payload: CreateProjectPayload) => {
      setLoading(true);
      setError(null);
      try {
        const project = await createProject(payload);
        onSuccess?.(project);
        return project;
      } catch (err) {
        const msg = axiosMessage(err);
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [onSuccess],
  );

  return { create, loading, error };
}

export function useUpdateProject(onSuccess?: (p: Project) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(
    async (id: number, payload: UpdateProjectPayload) => {
      setLoading(true);
      setError(null);
      try {
        const project = await updateProject(id, payload);
        onSuccess?.(project);
        return project;
      } catch (err) {
        const msg = axiosMessage(err);
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [onSuccess],
  );

  return { update, loading, error };
}

export function useDeleteProject(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);
      try {
        await deleteProject(id);
        onSuccess?.();
      } catch (err) {
        setError(axiosMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [onSuccess],
  );

  return { loading, error, remove };
}
