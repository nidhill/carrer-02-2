import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import RegistrationsTable from "@/components/admin/RegistrationsTable";
import PdfTemplateEditor from "@/components/admin/PdfTemplateEditor";

const Admin = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"registrations" | "template">("registrations");
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      if (!session) navigate("/admin/login");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) navigate("/admin/login");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!session) return null;

  return (
    <div className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-light tracking-widest text-foreground/60 uppercase">RizMango</p>
          <h1 className="text-3xl font-black">Career OS Admin</h1>
        </div>
        <button onClick={handleLogout} className="text-sm underline text-foreground/60 hover:text-foreground">
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("registrations")}
          className={`px-6 py-2 rounded-full font-semibold text-sm transition-colors ${
            tab === "registrations" ? "bg-foreground text-background" : "bg-muted text-foreground"
          }`}
        >
          Registrations
        </button>
        <button
          onClick={() => setTab("template")}
          className={`px-6 py-2 rounded-full font-semibold text-sm transition-colors ${
            tab === "template" ? "bg-foreground text-background" : "bg-muted text-foreground"
          }`}
        >
          Upload PDF
        </button>
      </div>

      {tab === "registrations" ? <RegistrationsTable /> : <PdfTemplateEditor />}
    </div>
  );
};

export default Admin;
