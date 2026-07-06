import React, { useState } from "react";
import { 
  Experience, 
  useCreateExperience, 
  useUpdateExperience, 
  useDeleteExperience,
  getGetCvQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExperienceFormProps {
  cvId: number;
  experiences: Experience[];
}

export function ExperienceForm({ cvId, experiences }: ExperienceFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createExp = useCreateExperience();
  const updateExp = useUpdateExperience();
  const deleteExp = useDeleteExperience();

  const [expandedId, setExpandedId] = useState<number | null>(
    experiences.length > 0 ? experiences[0].id : null
  );

  const invalidateCv = () => {
    queryClient.invalidateQueries({ queryKey: getGetCvQueryKey(cvId) });
  };

  const handleAdd = () => {
    createExp.mutate(
      { 
        id: cvId, 
        data: { 
          jobTitle: "New Position", 
          employer: "Company Name",
          startDate: new Date().toISOString().split('T')[0],
          sortOrder: experiences.length 
        } 
      },
      {
        onSuccess: (newExp) => {
          invalidateCv();
          setExpandedId(newExp.id);
        }
      }
    );
  };

  const handleUpdate = (expId: number, field: string, value: string) => {
    // For immediate local feedback, we could use optimistic updates, 
    // but the debounce logic in the main editor handles the main CV.
    // For related entities, we'll patch the cache directly and fire the mutation debounced.
    
    // We'll dispatch the mutation directly. In a real highly-polished app, 
    // we'd debounce these per-entry too, but let's fire on blur or immediate for simple fields.
  };

  const commitUpdate = (expId: number, data: Partial<Experience>) => {
    const existing = experiences.find(e => e.id === expId);
    if (!existing) return;
    
    updateExp.mutate(
      {
        id: cvId,
        expId,
        data: {
          jobTitle: data.jobTitle ?? existing.jobTitle,
          employer: data.employer ?? existing.employer,
          city: data.city ?? existing.city,
          startDate: data.startDate ?? existing.startDate,
          endDate: data.endDate ?? existing.endDate,
          description: data.description ?? existing.description,
          sortOrder: existing.sortOrder
        }
      },
      {
        onSuccess: () => {
          invalidateCv();
        }
      }
    );
  };

  const handleDelete = (expId: number) => {
    if (confirm("Remove this experience entry?")) {
      deleteExp.mutate(
        { id: cvId, expId },
        {
          onSuccess: () => {
            invalidateCv();
            toast({ title: "Entry removed" });
          }
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
        <div>
          <h3 className="font-medium">Work Experience</h3>
          <p className="text-sm text-muted-foreground">Add your relevant professional experience.</p>
        </div>
        <Button onClick={handleAdd} size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> Add Entry
        </Button>
      </div>

      <div className="space-y-4">
        {experiences.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(exp => (
          <div key={exp.id} className="bg-card border rounded-lg shadow-sm overflow-hidden transition-all duration-200">
            {/* Header / Summary row */}
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 select-none"
              onClick={() => setExpandedId(expandedId === exp.id ? null : exp.id)}
            >
              <div className="flex flex-col">
                <span className="font-semibold">{exp.jobTitle || "Untitled Position"}</span>
                <span className="text-sm text-muted-foreground">{exp.employer || "Company"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive hover:bg-destructive/10"
                  onClick={(e) => { e.stopPropagation(); handleDelete(exp.id); }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                {expandedId === exp.id ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </div>
            </div>

            {/* Expanded Form */}
            {expandedId === exp.id && (
              <div className="p-4 border-t bg-muted/10 grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Job Title *</Label>
                  <Input 
                    defaultValue={exp.jobTitle} 
                    onBlur={(e) => commitUpdate(exp.id, { jobTitle: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label>Employer *</Label>
                  <Input 
                    defaultValue={exp.employer} 
                    onBlur={(e) => commitUpdate(exp.id, { employer: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label>City / Location</Label>
                  <Input 
                    defaultValue={exp.city || ""} 
                    onBlur={(e) => commitUpdate(exp.id, { city: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label>Start Date * (YYYY-MM-DD)</Label>
                  <Input 
                    type="date"
                    defaultValue={exp.startDate ? exp.startDate.split('T')[0] : ""} 
                    onBlur={(e) => commitUpdate(exp.id, { startDate: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label>End Date (Leave empty if ongoing)</Label>
                  <Input 
                    type="date"
                    defaultValue={exp.endDate ? exp.endDate.split('T')[0] : ""} 
                    onBlur={(e) => commitUpdate(exp.id, { endDate: e.target.value || null })}
                  />
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label>Description</Label>
                  <Textarea 
                    className="min-h-[100px]"
                    defaultValue={exp.description || ""} 
                    onBlur={(e) => commitUpdate(exp.id, { description: e.target.value })}
                    placeholder="Describe your responsibilities and achievements..."
                  />
                </div>
              </div>
            )}
          </div>
        ))}
        
        {experiences.length === 0 && (
          <div className="text-center p-8 border-2 border-dashed rounded-lg bg-card/50 text-muted-foreground">
            No work experience added yet.
          </div>
        )}
      </div>
    </div>
  );
}
