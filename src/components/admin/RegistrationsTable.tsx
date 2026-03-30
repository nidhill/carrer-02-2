import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateCareerPdf, PdfSection } from "@/lib/generatePdf";
import { Search, Trash2, Download, Copy, FileText } from "lucide-react";

interface Registration {
  id: string;
  name: string;
  phone: string;
  email: string;
  created_at: string;
}

const RegistrationsTable = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchRegistrations = async () => {
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setRegistrations(data);
  };

  useEffect(() => {
    fetchRegistrations();
    const channel = supabase
      .channel("registrations-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "registrations" }, () => {
        fetchRegistrations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = registrations.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this registration?")) return;
    const { error } = await supabase.from("registrations").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Deleted");
      fetchRegistrations();
    }
  };

  const handleSendPdf = async (reg: Registration) => {
    const { data: template } = await supabase
      .from("pdf_template")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();
    const title = template?.title || "Career OS — Your Playbook";
    const sections: PdfSection[] = (template?.sections as PdfSection[]) || [];
    const doc = generateCareerPdf(reg.name, title, sections);
    doc.save(`Career-OS-${reg.name.replace(/\s+/g, "-")}.pdf`);
    toast.success(`PDF generated for ${reg.name}`);
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success("Email copied!");
  };

  const exportCsv = () => {
    const header = "Name,Phone,Email,Date Registered\n";
    const rows = registrations
      .map((r) => `"${r.name}","${r.phone}","${r.email}","${new Date(r.created_at).toLocaleDateString()}"`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "registrations.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <p className="text-sm text-muted-foreground font-medium">
          {filtered.length} registered
        </p>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pill-input !text-left !pl-10 !py-2 text-sm"
            />
          </div>
          <button onClick={exportCsv} className="btn-accent-sm flex items-center gap-2 whitespace-nowrap">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Full Name</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Phone</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Date</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <>
                  <tr
                    key={r.id}
                    className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  >
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{r.phone}</td>
                    <td className="px-4 py-3">{r.email}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                        className="text-destructive hover:text-destructive/80 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  {expandedId === r.id && (
                    <tr key={`${r.id}-expanded`} className="bg-muted/30">
                      <td colSpan={6} className="px-4 py-4">
                        <div className="flex flex-col sm:flex-row gap-3 text-sm">
                          <div className="flex-1">
                            <p><strong>Name:</strong> {r.name}</p>
                            <p><strong>Phone:</strong> {r.phone}</p>
                            <p><strong>Email:</strong> {r.email}</p>
                            <p><strong>Registered:</strong> {new Date(r.created_at).toLocaleString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleSendPdf(r)} className="btn-accent-sm flex items-center gap-2">
                              <FileText className="w-4 h-4" /> Send PDF
                            </button>
                            <button
                              onClick={() => handleCopyEmail(r.email)}
                              className="rounded-full border border-foreground px-4 py-2 text-sm font-semibold hover:bg-foreground hover:text-background transition-colors flex items-center gap-2"
                            >
                              <Copy className="w-4 h-4" /> Copy Email
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No registrations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RegistrationsTable;
