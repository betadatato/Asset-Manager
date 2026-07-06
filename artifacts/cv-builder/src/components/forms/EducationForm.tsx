import React, { useState } from "react";
import { 
  Education, 
  useCreateEducation, 
  useUpdateEducation, 
  useDeleteEducation,
  getGetCvQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function EducationForm({ cvId, educations }: { cvId: number, educations: Education[] }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createEdu = useCreateEducation();
  const updateEdu = useUpdateEducation();
  const deleteEdu = useDeleteEducation();

  const [expandedId, setExpandedId] = useState<number | null>(
    educations.length > 0 ? educations[0].id : null
  );

  const invalidateCv = () => {
    queryClient.invalidateQueries({ queryKey: getGetCvQueryKey(cvId) });
  };

  const handleAdd = () => {
    createEdu.mutate(
      { 
        id: cvId, 
        data: { 
          degree: "Degree / Diploma", 
          institution: "Institution Name",
          startDate: new Date().toISOString().split('T')[0],
          sortOrder: educations.length 
        } 
      },
      {
        onSuccess: (newEdu) => {
          invalidateCv();
          setExpandedId(newEdu.id);
        }
      }
    );
  };

  const commitUpdate = (eduId: number, data: Partial<Education>) => {
    const existing = educations.find(e => e.id === eduId);
    if (!existing) return;
    
    updateEdu.mutate(
      {
        id: cvId,
        eduId,
        data: {
          degree: data.degree ?? existing.degree,
          institution: data.institution ?? existing.institution,
          city: data.city ?? existing.city,
          startDate: data.startDate ?? existing.startDate,
          endDate: data.endDate ?? existing.endDate,
          grade: data.grade ?? existing.grade,
          sortOrder: existing.sortOrder
        }
      },
      { onSuccess: invalidateCv }
    );
  };

  const handleDelete = (eduId: number) => {
    if (confirm("Remove this education entry?")) {
      deleteEdu.mutate({ id: cvId, eduId }, {
        onSuccess: () => {
          invalidateCv();
          toast({ title: "Entry removed" });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
        <div>
          <h3 className="font-medium">Education and Training</h3>
          <p className="text-sm text-muted-foreground">Add your educational background.</p>
        </div>
        <Button onClick={handleAdd} size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> Add Entry
        </Button>
      </div>

      <div className="space-y-4">
        {educations.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(edu => (
          <div key={edu.id} className="bg-card border rounded-lg shadow-sm overflow-hidden transition-all">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 select-none"
              onClick={() => setExpandedId(expandedId === edu.id ? null : edu.id)}
            >
              <div className="flex flex-col">
                <span className="font-semibold">{edu.degree || "Untitled Degree"}</span>
                <span className="text-sm text-muted-foreground">{edu.institution}</span>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive hover:bg-destructive/10"
                  onClick={(e) => { e.stopPropagation(); handleDelete(edu.id); }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                {expandedId === edu.id ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </div>
            </div>

            {expandedId === edu.id && (
              <div className="p-4 border-t bg-muted/10 grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Qualification / Degree *</Label>
                  <Input 
                    defaultValue={edu.degree} 
                    onBlur={(e) => commitUpdate(edu.id, { degree: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label>Institution *</Label>
                  <Input 
                    defaultValue={edu.institution} 
                    onBlur={(e) => commitUpdate(edu.id, { institution: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label>City</Label>
                  <Input 
                    defaultValue={edu.city || ""} 
                    onBlur={(e) => commitUpdate(edu.id, { city: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label>Start Date *</Label>
                  <Input 
                    type="date"
                    defaultValue={edu.startDate ? edu.startDate.split('T')[0] : ""} 
                    onBlur={(e) => commitUpdate(edu.id, { startDate: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label>End Date</Label>
                  <Input 
                    type="date"
                    defaultValue={edu.endDate ? edu.endDate.split('T')[0] : ""} 
                    onBlur={(e) => commitUpdate(edu.id, { endDate: e.target.value || null })}
                  />
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label>Final Grade (Optional)</Label>
                  <Input 
                    defaultValue={edu.grade || ""} 
                    onBlur={(e) => commitUpdate(edu.id, { grade: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
