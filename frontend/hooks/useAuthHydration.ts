"use client";

import { useEffect, useState } from "react";
import useAuthStore from "@/store/authStore";

/** True once persisted auth state has rehydrated from localStorage. */
export function useAuthHydration() {
  const [hydrated, setHydrated] = useState(
    () => useAuthStore.persist?.hasHydrated?.() ?? false,
  );

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  const user = useAuthStore((s) => s.user);
  const sessionReady = useAuthStore((s) => s.sessionReady);

  return {
    hydrated,
    sessionReady,
    user,
    /** Wait for persist + session bootstrap before showing signed-out chrome. */
    authResolved: hydrated && sessionReady,
  };
}
