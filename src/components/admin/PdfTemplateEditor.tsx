import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateCareerPdf, PdfSection } from "@/lib/generatePdf";
import { Plus, Eye, Save, Trash2, GripVertical } from "lucide-react";

const PdfTemplateEditor = () => {
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [title, setTitle] = useState("Career OS — Your Playbook");
  const [sections, setSections] = useState<PdfSection[]>([]);
  const [driveLink, setDriveLink] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      const { data } = await supabase
        .from("pdf_template")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();
      if (data) {
        setTemplateId(data.id);
        setTitle(data.title);
        setSections(data.sections as unknown as PdfSection[]);
        setDriveLink((data as any).drive_link || "");
      }
      setLoading(false);
    };
    fetchTemplate();
  }, []);

  const updateSection = (index: number, field: keyof PdfSection, value: any) => {
    const updated = [...sections];
    (updated[index] as any)[field] = value;
    setSections(updated);
  };

  const addSection = () => {
    setSections([...sections, { heading: "New Section", body: "", visible: true }]);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!templateId) return;
    const { error } = await supabase
      .from("pdf_template")
      .update({ title, sections: sections as any, drive_link: driveLink } as any)
      .eq("id", templateId);
    if (error) toast.error("Failed to save");
    else toast.success("Template saved!");
  };

  const handlePreview = () => {
    const doc = generateCareerPdf("John Doe", title, sections);
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  if (loading) return <p className="text-muted-foreground">Loading template...</p>;

  return (
    <div className="space-y-6">
      {/* Google Drive Link */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
          Google Drive Download Link
        </label>
        <input
          type="url"
          value={driveLink}
          onChange={(e) => setDriveLink(e.target.value)}
          className="pill-input !text-left"
          placeholder="https://drive.google.com/file/d/FILE_ID/view?usp=sharing"
        />
        <p className="text-xs text-muted-foreground mt-1 ml-4">
          Paste a Google Drive sharing link. It will auto-convert to a direct download link for users.
        </p>
      </div>

      {/* Title */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
          PDF Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="pill-input !text-left"
        />
      </div>

      {/* Sections */}
      <div className="space-y-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sections
        </label>
        {sections.map((section, i) => (
          <div key={i} className="bg-card rounded-2xl border p-5 space-y-3">
            <div className="flex items-center gap-3">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={section.heading}
                onChange={(e) => updateSection(i, "heading", e.target.value)}
                className="flex-1 bg-transparent font-semibold text-lg focus:outline-none border-b border-transparent focus:border-foreground"
                placeholder="Section heading"
              />
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={section.visible}
                  onChange={(e) => updateSection(i, "visible", e.target.checked)}
                  className="accent-accent w-4 h-4"
                />
                Visible
              </label>
              <button onClick={() => removeSection(i)} className="text-destructive hover:text-destructive/80">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={section.body}
              onChange={(e) => updateSection(i, "body", e.target.value)}
              rows={4}
              className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-foreground"
              placeholder="Section content..."
            />
          </div>
        ))}
      </div>

      <button onClick={addSection} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
        <Plus className="w-4 h-4" /> Add Section
      </button>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={handlePreview} className="rounded-full border border-foreground px-6 py-3 font-semibold flex items-center gap-2 hover:bg-foreground hover:text-background transition-colors">
          <Eye className="w-4 h-4" /> Preview PDF
        </button>
        <button onClick={handleSave} className="btn-accent-sm flex items-center gap-2 !py-3 !px-6 !text-base">
          <Save className="w-4 h-4" /> Save Template
        </button>
      </div>
    </div>
  );
};

export default PdfTemplateEditor;
