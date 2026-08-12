"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { googleSignIn } from "@/lib/api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default function GoogleSignInButton({ onError }: { onError?: (msg: string) => void }) {
  const router = useRouter();
  const divRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;

    function init() {
      if (!window.google || !divRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId as string,
        callback: async (response) => {
          try {
            const result = await googleSignIn(response.credential);
            localStorage.setItem("credence_token", result.access_token);
            localStorage.setItem("credence_user", JSON.stringify(result.user));
            router.push("/dashboard");
          } catch (err) {
            onError?.(err instanceof Error ? err.message : "Google sign-in failed");
          }
        },
      });
      window.google.accounts.id.renderButton(divRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
      });
    }

    if (window.google) {
      init();
      return;
    }
    const interval = setInterval(() => {
      if (window.google) {
        clearInterval(interval);
        init();
      }
    }, 100);
    return () => clearInterval(interval);
  }, [clientId, router, onError]);

  if (!clientId) return null;

  return <div ref={divRef} />;
}
