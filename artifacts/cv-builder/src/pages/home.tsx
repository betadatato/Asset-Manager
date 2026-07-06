import { useListCvs, useCreateCv, useDeleteCv, getListCvsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Calendar, Trash2, Edit2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { data: cvs, isLoading } = useListCvs();
  const createCv = useCreateCv();
  const deleteCv = useDeleteCv();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleCreate = () => {
    createCv.mutate(
      { data: { fullName: "New Resume", mainColor: "#003399", useGraphics: true } },
      {
        onSuccess: (newCv) => {
          queryClient.invalidateQueries({ queryKey: getListCvsQueryKey() });
          setLocation(`/cv/${newCv.id}/edit`);
        },
        onError: () => {
          toast({ title: "Failed to create CV", variant: "destructive" });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this CV?")) {
      deleteCv.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCvsQueryKey() });
          toast({ title: "CV deleted successfully" });
        }
      });
    }
  };

  return (
    <Layout>
      <div className="container max-w-5xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Documents</h1>
            <p className="text-muted-foreground mt-1">Manage and edit your Europass CVs.</p>
          </div>
          <Button onClick={handleCreate} size="lg" className="gap-2 shadow-sm shrink-0">
            <Plus className="w-4 h-4" />
            Create New CV
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-xl bg-muted animate-pulse border" />
            ))}
          </div>
        ) : cvs?.length === 0 ? (
          <div className="text-center py-24 px-4 rounded-xl border-2 border-dashed bg-card/50">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">No CVs found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              You haven't created any CVs yet. Start by creating a new document tailored to the Europass standard.
            </p>
            <Button onClick={handleCreate}>Create your first CV</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cvs?.map(cv => (
              <div 
                key={cv.id} 
                className="group relative bg-card rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all hover:border-primary/30 flex flex-col"
              >
                <div className="h-32 bg-muted/50 p-4 border-b relative">
                  <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="h-8 w-8 bg-background/80 backdrop-blur"
                      onClick={() => setLocation(`/cv/${cv.id}/edit`)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleDelete(cv.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="w-16 h-20 bg-background shadow-sm mx-auto flex flex-col border overflow-hidden relative">
                    <div 
                      className="w-[30%] h-full absolute left-0" 
                      style={{ backgroundColor: cv.mainColor, opacity: 0.15 }}
                    />
                    <div 
                      className="w-full h-1 mt-3" 
                      style={{ backgroundColor: cv.mainColor }}
                    />
                    <div className="px-2 mt-2 space-y-1">
                      <div className="h-1 bg-muted rounded w-3/4" />
                      <div className="h-1 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-3 h-3 rounded-full shadow-sm border border-black/10" 
                      style={{ backgroundColor: cv.mainColor }}
                    />
                    <h3 className="font-semibold text-lg line-clamp-1 flex-1">{cv.fullName}</h3>
                  </div>
                  
                  {cv.email && (
                    <p className="text-sm text-muted-foreground truncate mb-4">{cv.email}</p>
                  )}
                  
                  <div className="mt-auto pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Updated {new Date(cv.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <Link 
                  href={`/cv/${cv.id}/edit`}
                  className="absolute inset-0 z-0"
                  aria-label={`Edit ${cv.fullName}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
