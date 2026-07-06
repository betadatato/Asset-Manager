import React from "react";
import { 
  Language, 
  useCreateLanguage, 
  useUpdateLanguage, 
  useDeleteLanguage,
  getGetCvQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export function LanguageForm({ cvId, languages }: { cvId: number, languages: Language[] }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createLang = useCreateLanguage();
  const updateLang = useUpdateLanguage();
  const deleteLang = useDeleteLanguage();

  const invalidateCv = () => {
    queryClient.invalidateQueries({ queryKey: getGetCvQueryKey(cvId) });
  };

  const handleAdd = () => {
    createLang.mutate(
      { 
        id: cvId, 
        data: { 
          languageName: "New Language", 
          listening: "B1", reading: "B1", spokenInteraction: "B1", spokenProduction: "B1", writing: "B1",
          sortOrder: languages.length 
        } 
      },
      { onSuccess: invalidateCv }
    );
  };

  const commitUpdate = (langId: number, data: Partial<Language>) => {
    const existing = languages.find(l => l.id === langId);
    if (!existing) return;
    
    updateLang.mutate(
      {
        id: cvId,
        langId,
        data: {
          languageName: data.languageName ?? existing.languageName,
          listening: data.listening ?? existing.listening,
          reading: data.reading ?? existing.reading,
          spokenInteraction: data.spokenInteraction ?? existing.spokenInteraction,
          spokenProduction: data.spokenProduction ?? existing.spokenProduction,
          writing: data.writing ?? existing.writing,
          sortOrder: existing.sortOrder
        }
      },
      { onSuccess: invalidateCv }
    );
  };

  const handleDelete = (langId: number) => {
    if (confirm("Remove this language?")) {
      deleteLang.mutate({ id: cvId, langId }, {
        onSuccess: () => {
          invalidateCv();
          toast({ title: "Language removed" });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
        <div>
          <h3 className="font-medium">Language Skills</h3>
          <p className="text-sm text-muted-foreground">Evaluate your skills using CEFR levels.</p>
        </div>
        <Button onClick={handleAdd} size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> Add Language
        </Button>
      </div>

      <div className="space-y-6">
        {languages.sort((a, b) => a.sortOrder - b.sortOrder).map((lang, index) => (
          <div key={lang.id} className="bg-card border rounded-lg shadow-sm p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="w-1/2">
                <Label>Language Name</Label>
                <Input 
                  className="mt-1 font-semibold"
                  defaultValue={lang.languageName} 
                  onBlur={(e) => commitUpdate(lang.id, { languageName: e.target.value })}
                />
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-destructive hover:bg-destructive/10 -mr-2 mt-4"
                onClick={() => handleDelete(lang.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-5 gap-3 border rounded-lg p-3 bg-muted/20">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground block text-center">Listening</Label>
                <select 
                  className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={lang.listening || ""}
                  onChange={(e) => commitUpdate(lang.id, { listening: e.target.value })}
                >
                  {CEFR_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground block text-center">Reading</Label>
                <select 
                  className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={lang.reading || ""}
                  onChange={(e) => commitUpdate(lang.id, { reading: e.target.value })}
                >
                  {CEFR_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground block text-center">Interaction</Label>
                <select 
                  className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={lang.spokenInteraction || ""}
                  onChange={(e) => commitUpdate(lang.id, { spokenInteraction: e.target.value })}
                >
                  {CEFR_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground block text-center">Production</Label>
                <select 
                  className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={lang.spokenProduction || ""}
                  onChange={(e) => commitUpdate(lang.id, { spokenProduction: e.target.value })}
                >
                  {CEFR_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground block text-center">Writing</Label>
                <select 
                  className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={lang.writing || ""}
                  onChange={(e) => commitUpdate(lang.id, { writing: e.target.value })}
                >
                  {CEFR_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}

        {languages.length === 0 && (
          <div className="text-center p-8 border-2 border-dashed rounded-lg bg-card/50 text-muted-foreground">
            No languages added yet.
          </div>
        )}
      </div>
    </div>
  );
}
