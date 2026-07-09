import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

// Beta supabase.auth.oauth namespace — minimal typed wrapper.
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};
const oauth = (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("Missing authorization_id");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      return setError(error.message);
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      return setError("No redirect returned by the authorization server.");
    }
    window.location.href = target;
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-background text-foreground">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm text-center">
        {error ? (
          <>
            <h1 className="text-xl font-bold mb-2">Authorization error</h1>
            <p className="text-muted-foreground">{error}</p>
          </>
        ) : !details ? (
          <p className="text-muted-foreground">Loading authorization request…</p>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2">
              Connect {details.client?.name ?? "an app"} to CuizIN
            </h1>
            <p className="text-muted-foreground mb-6">
              This lets {details.client?.name ?? "the app"} access CuizIN as you — your profile,
              quiz stats, and quiz content.
            </p>
            <div className="flex gap-3 justify-center">
              <Button disabled={busy} onClick={() => decide(true)}>
                Approve
              </Button>
              <Button variant="outline" disabled={busy} onClick={() => decide(false)}>
                Deny
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}