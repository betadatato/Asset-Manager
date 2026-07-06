import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetCv, 
  useUpdateCv, 
  getGetCvQueryKey,
  Cv
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { EuropassPreview } from "@/components/EuropassPreview";
import { Save, ExternalLink, Image as ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Sub-components will go here in actual implementation, imported from separate files.
import { ExperienceForm } from "@/components/forms/ExperienceForm";
import { EducationForm } from "@/components/forms/EducationForm";
import { LanguageForm } from "@/components/forms/LanguageForm";
import { AttachmentsForm } from "@/components/forms/AttachmentsForm";

export default function Editor() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: cv, isLoading } = useGetCv(id, { query: { enabled: !!id, queryKey: getGetCvQueryKey(id) } });
  const updateCv = useUpdateCv();

  // Local state for debounced saves
  const [localData, setLocalData] = useState<Partial<Cv>>({});
  const initializedForId = useRef<number | null>(null);
  const lastSavedData = useRef<Partial<Cv>>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize local data when fetched
  useEffect(() => {
    if (cv && initializedForId.current !== id) {
      initializedForId.current = id;
      const initial = {
        fullName: cv.fullName,
        email: cv.email || "",
        phone: cv.phone || "",
        address: cv.address || "",
        dateOfBirth: cv.dateOfBirth || "",
        nationality: cv.nationality || "",
        gender: cv.gender || "",
        linkedin: cv.linkedin || "",
        summary: cv.summary || "",
        digitalSkills: cv.digitalSkills || "",
        hobbies: cv.hobbies || "",
        drivingLicense: cv.drivingLicense || "",
        mainColor: cv.mainColor,
        useGraphics: cv.useGraphics,
      };
      setLocalData(initial);
      lastSavedData.current = initial;
    }
  }, [cv, id]);

  const handleInputChange = (field: keyof Cv, value: string | boolean) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
  };

  // Perform save
  const doSave = useCallback((dataToSave: Partial<Cv>) => {
    if (!cv) return;
    setIsSaving(true);
    
    // We update the core CV data. Relationships (exp, edu, lang) use their own mutation hooks.
    updateCv.mutate(
      { 
        id, 
        data: {
          fullName: dataToSave.fullName || cv.fullName,
          email: dataToSave.email,
          phone: dataToSave.phone,
          address: dataToSave.address,
          dateOfBirth: dataToSave.dateOfBirth,
          nationality: dataToSave.nationality,
          gender: dataToSave.gender,
          linkedin: dataToSave.linkedin,
          summary: dataToSave.summary,
          digitalSkills: dataToSave.digitalSkills,
          hobbies: dataToSave.hobbies,
          drivingLicense: dataToSave.drivingLicense,
          mainColor: dataToSave.mainColor,
          useGraphics: dataToSave.useGraphics,
        }
      },
      {
        onSuccess: (updated) => {
          setIsSaving(false);
          lastSavedData.current = dataToSave;
          queryClient.setQueryData(getGetCvQueryKey(id), updated);
          
          toast({
            title: "Saved",
            description: "Your changes have been saved.",
            duration: 2000,
          });
        },
        onError: () => {
          setIsSaving(false);
          toast({
            title: "Error saving",
            description: "Please check your connection.",
            variant: "destructive"
          });
        }
      }
    );
  }, [id, cv, updateCv, queryClient, toast]);

  // Debounced auto-save
  useEffect(() => {
    if (initializedForId.current !== id) return;
    
    const hasChanges = Object.keys(localData).some(
      key => localData[key as keyof Cv] !== lastSavedData.current[key as keyof Cv]
    );

    if (hasChanges) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        doSave(localData);
      }, 2000);
    }

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [localData, id, doSave]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append("photo", file);

    try {
      const res = await fetch(`/api/cvs/${id}/photo`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      
      const data = await res.json();
      
      // Update cache
      if (cv) {
        queryClient.setQueryData(getGetCvQueryKey(id), {
          ...cv,
          photoUrl: data.photoUrl
        });
      }
      
      toast({ title: "Photo updated successfully" });
    } catch (err) {
      toast({ title: "Failed to upload photo", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (isLoading || !cv) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  // Create a merged version of the CV for the live preview
  // It combines the real CV data (relationships) with the un-saved local field data
  const previewCv: Cv = {
    ...cv,
    ...localData as Cv
  };

  return (
    <Layout>
      <div className="flex-1 flex overflow-hidden h-[calc(100vh-56px)]">
        {/* Left Panel: Editor Forms */}
        <div className="w-1/2 flex flex-col border-r bg-muted/20 z-10 relative">
          <div className="h-14 border-b flex items-center px-4 justify-between bg-background shrink-0">
            <div className="font-medium flex items-center gap-2">
              <span>Editing:</span>
              <span className="text-muted-foreground">{localData.fullName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                {isSaving ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-3 h-3" /> Saved</>
                )}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid grid-cols-4 mb-4 h-auto p-1 sticky top-0 z-20 backdrop-blur bg-muted/80">
                <TabsTrigger value="personal" className="py-2">Personal</TabsTrigger>
                <TabsTrigger value="experience" className="py-2">Experience</TabsTrigger>
                <TabsTrigger value="education" className="py-2">Education</TabsTrigger>
                <TabsTrigger value="skills" className="py-2">Skills</TabsTrigger>
                <TabsTrigger value="languages" className="py-2">Languages</TabsTrigger>
                <TabsTrigger value="attachments" className="py-2">Attachments</TabsTrigger>
                <TabsTrigger value="theme" className="py-2">Theme</TabsTrigger>
              </TabsList>

              <div className="max-w-2xl mx-auto space-y-6 pb-24">
                <TabsContent value="personal" className="space-y-6 mt-0">
                  <div className="bg-card border rounded-lg p-5 shadow-sm space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Photo</h3>
                      <p className="text-sm text-muted-foreground mb-4">Upload a professional portrait photo.</p>
                      
                      <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center bg-muted relative overflow-hidden">
                          {uploadingPhoto ? (
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                          ) : previewCv.photoUrl ? (
                            <img src={previewCv.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-muted-foreground opacity-50" />
                          )}
                        </div>
                        <div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handlePhotoUpload}
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingPhoto}
                          >
                            Upload Photo
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input 
                          id="fullName" 
                          value={localData.fullName || ""} 
                          onChange={(e) => handleInputChange("fullName", e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email"
                          value={localData.email || ""} 
                          onChange={(e) => handleInputChange("email", e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input 
                          id="phone" 
                          value={localData.phone || ""} 
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="address">Address</Label>
                        <Input 
                          id="address" 
                          value={localData.address || ""} 
                          onChange={(e) => handleInputChange("address", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input 
                          id="dateOfBirth" 
                          placeholder="e.g. 15/08/1990"
                          value={localData.dateOfBirth || ""} 
                          onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nationality">Nationality</Label>
                        <Input 
                          id="nationality" 
                          value={localData.nationality || ""} 
                          onChange={(e) => handleInputChange("nationality", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Input 
                          id="gender" 
                          value={localData.gender || ""} 
                          onChange={(e) => handleInputChange("gender", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn URL</Label>
                        <Input 
                          id="linkedin" 
                          value={localData.linkedin || ""} 
                          onChange={(e) => handleInputChange("linkedin", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border rounded-lg p-5 shadow-sm space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="summary">Professional Summary</Label>
                      <Textarea 
                        id="summary" 
                        className="min-h-[150px]"
                        value={localData.summary || ""} 
                        onChange={(e) => handleInputChange("summary", e.target.value)}
                        placeholder="Write a brief summary of your professional background..."
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="experience" className="mt-0">
                  <ExperienceForm cvId={id} experiences={cv.experiences} />
                </TabsContent>

                <TabsContent value="education" className="mt-0">
                  <EducationForm cvId={id} educations={cv.educations} />
                </TabsContent>

                <TabsContent value="skills" className="space-y-6 mt-0">
                  <div className="bg-card border rounded-lg p-5 shadow-sm space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="digitalSkills">Digital Skills</Label>
                      <Textarea 
                        id="digitalSkills" 
                        className="min-h-[150px]"
                        value={localData.digitalSkills || ""} 
                        onChange={(e) => handleInputChange("digitalSkills", e.target.value)}
                        placeholder="List your digital skills, software proficiency, programming languages..."
                      />
                    </div>
                  </div>

                  <div className="bg-card border rounded-lg p-5 shadow-sm space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="drivingLicense">Driving Licence</Label>
                      <Input 
                        id="drivingLicense" 
                        value={localData.drivingLicense || ""} 
                        onChange={(e) => handleInputChange("drivingLicense", e.target.value)}
                        placeholder="e.g. B, B1"
                      />
                    </div>
                  </div>

                  <div className="bg-card border rounded-lg p-5 shadow-sm space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="hobbies">Hobbies & Interests</Label>
                      <Textarea 
                        id="hobbies" 
                        className="min-h-[100px]"
                        value={localData.hobbies || ""} 
                        onChange={(e) => handleInputChange("hobbies", e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="languages" className="mt-0">
                  <LanguageForm cvId={id} languages={cv.languages} />
                </TabsContent>

                <TabsContent value="attachments" className="mt-0">
                  <AttachmentsForm cvId={id} />
                </TabsContent>

                <TabsContent value="theme" className="space-y-6 mt-0">
                  <div className="bg-card border rounded-lg p-5 shadow-sm space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Color Theme</h3>
                      <p className="text-sm text-muted-foreground mb-4">Choose a primary color for your document.</p>
                      
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <input 
                            type="color" 
                            className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                            value={localData.mainColor || "#003399"}
                            onChange={(e) => handleInputChange("mainColor", e.target.value)}
                          />
                        </div>
                        <div className="font-mono text-sm uppercase text-muted-foreground bg-muted px-2 py-1 rounded">
                          {localData.mainColor || "#003399"}
                        </div>
                      </div>
                      
                      <div className="mt-6 flex flex-wrap gap-2">
                        {["#003399", "#2563EB", "#059669", "#DC2626", "#4F46E5", "#334155", "#0F172A"].map(color => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${localData.mainColor === color ? 'border-primary scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: color }}
                            onClick={() => handleInputChange("mainColor", color)}
                            aria-label={`Select color ${color}`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4">Style Elements</h3>
                      <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded border-input text-primary focus:ring-primary"
                          checked={localData.useGraphics !== false}
                          onChange={(e) => handleInputChange("useGraphics", e.target.checked)}
                        />
                        <div>
                          <div className="font-medium">Use Europass graphics</div>
                          <div className="text-sm text-muted-foreground">Includes the colored header line</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        {/* Right Panel: Live Preview */}
        <div className="w-1/2 bg-slate-100 flex flex-col relative">
          <div className="h-14 border-b flex items-center px-4 justify-end gap-2 bg-background/80 backdrop-blur shrink-0 absolute top-0 left-0 right-0 z-20 shadow-sm">
            <Button variant="outline" size="sm" asChild className="gap-2 bg-white">
              <Link href={`/cv/${id}/preview`}>
                <ExternalLink className="w-4 h-4" />
                Full Preview & Export
              </Link>
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 pt-20 custom-scrollbar flex justify-center">
            <div className="max-w-[794px] w-full transform origin-top transition-all">
              <EuropassPreview cv={previewCv} live={true} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
