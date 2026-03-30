import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateCareerPdf, PdfSection } from "@/lib/generatePdf";
import { toast } from "sonner";

const Index = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email");
      return;
    }

    setLoading(true);
    try {
      // Save registration
      const { error } = await supabase
        .from("registrations")
        .insert({ name: name.trim(), phone: phone.trim(), email: email.trim() });

      if (error) throw error;

      // Fetch latest PDF template
      const { data: template } = await supabase
        .from("pdf_template")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      const title = template?.title || "Career OS — Your Playbook";
      const sections: PdfSection[] = (template?.sections as PdfSection[]) || [
        { heading: "Introduction", body: "Welcome to Career OS.", visible: true },
      ];

      const doc = generateCareerPdf(name.trim(), title, sections);
      doc.save("Career-OS-Playbook.pdf");

      toast.success("You're in! Your playbook is downloading.");
      setName("");
      setPhone("");
      setEmail("");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl flex flex-col items-center gap-10">
        {/* Logo */}
        <p className="self-start text-xs font-light tracking-widest text-foreground/60 uppercase">
          RizMango
        </p>

        {/* Title */}
        <h1 className="text-6xl sm:text-8xl font-black text-center leading-none tracking-tight">
          Career OS
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 mt-4">
          <input
            type="text"
            placeholder="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pill-input"
          />
          <input
            type="tel"
            placeholder="phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="pill-input"
          />
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pill-input"
          />
          <button type="submit" disabled={loading} className="btn-accent mt-2">
            {loading ? "SENDING..." : "GET MY CAREER PLAYBOOK"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Index;
