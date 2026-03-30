import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save } from "lucide-react";

const PdfTemplateEditor = () => {
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [driveLink, setDriveLink] = useState("");
  const [uploadingPdf, setUploadingPdf] = useState(false);
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
        setDriveLink((data as any).drive_link || "");
      }
      setLoading(false);
    };
    fetchTemplate();
  }, []);

  const handleSave = async () => {
    if (!templateId) return;
    const { error } = await supabase
      .from("pdf_template")
      .update({ drive_link: driveLink } as any)
      .eq("id", templateId);
    if (error) toast.error("Failed to save");
    else toast.success("File saved! Users will now download this file.");
  };

  if (loading) return <p className="text-muted-foreground">Loading settings...</p>;

  return (
    <div className="space-y-6">
      {/* PDF Upload */}
      <div>
        <label className="text-3xl font-bold text-foreground mb-4 block">
          Playbook PDF File
        </label>
        <div className="flex flex-col gap-2">
          {driveLink ? (
            <div className="flex items-center gap-2">
              <input type="url" value={driveLink} readOnly className="pill-input !text-left bg-muted flex-1" />
              <button 
                onClick={() => setDriveLink("")} 
                className="rounded-full border border-destructive text-destructive px-4 py-2 text-sm font-semibold hover:bg-destructive hover:text-white transition-colors"
                type="button"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 cursor-pointer btn-accent-sm w-max !py-2 !px-4 hover:opacity-90">
              {uploadingPdf ? "Uploading..." : "Select PDF File"}
              <input 
                type="file" 
                accept="application/pdf" 
                className="hidden" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingPdf(true);
                  try {
                    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
                    const { data, error } = await supabase.storage.from("pdfs").upload(fileName, file);
                    if (error) throw error;
                    
                    const { data: publicUrlData } = supabase.storage.from("pdfs").getPublicUrl(fileName);
                    setDriveLink(publicUrlData.publicUrl);
                    toast.success("PDF uploaded successfully! Click Save below to apply.");
                  } catch (err: any) {
                    toast.error("Upload failed: " + err.message);
                  } finally {
                    setUploadingPdf(false);
                    e.target.value = "";
                  }
                }}
                disabled={uploadingPdf}
              />
            </label>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Upload the PDF file directly to Supabase. This exact file will be downloaded by the users when they register.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-6 border-t mt-6">
        <button onClick={handleSave} className="btn-accent-sm flex items-center gap-2 !py-3 !px-6 !text-base">
          <Save className="w-4 h-4" /> Save Playbook File
        </button>
      </div>
    </div>
  );
};

export default PdfTemplateEditor;
