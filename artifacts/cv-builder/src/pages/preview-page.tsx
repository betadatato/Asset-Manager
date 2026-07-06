import { useGetCv, getGetCvQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { EuropassPreview } from "@/components/EuropassPreview";
import { Download, ChevronLeft } from "lucide-react";

export default function PreviewPage() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { data: cv, isLoading } = useGetCv(id, { query: { enabled: !!id, queryKey: getGetCvQueryKey(id) } });

  const handleExportPdf = () => {
    window.open(`/api/cvs/${id}/export/pdf`, '_blank');
  };

  const handleExportWord = () => {
    window.open(`/api/cvs/${id}/export/word`, '_blank');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse space-y-4 flex flex-col items-center">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-muted-foreground">Generating preview...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!cv) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          CV not found.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-muted min-h-screen">
        <div className="bg-background border-b sticky top-14 z-40 shadow-sm">
          <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <Button variant="ghost" asChild className="gap-2">
              <Link href={`/cv/${id}/edit`}>
                <ChevronLeft className="w-4 h-4" />
                Back to Editor
              </Link>
            </Button>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleExportWord} className="gap-2 bg-white">
                <Download className="w-4 h-4 text-blue-600" />
                Download Word
              </Button>
              <Button onClick={handleExportPdf} className="gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
        
        <div className="container max-w-5xl mx-auto px-4 py-12">
          <div className="max-w-[794px] mx-auto transition-all">
            <EuropassPreview cv={cv} live={true} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
