import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Trash2,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Pencil,
  Check,
  X,
  Loader2,
} from "lucide-react";

interface Attachment {
  id: number;
  cvId: number;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  label: string | null;
  sortOrder: number;
  createdAt: string;
}

interface AttachmentsFormProps {
  cvId: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === "application/pdf")
    return <FileText className="w-5 h-5 text-red-500 shrink-0" />;
  return <ImageIcon className="w-5 h-5 text-blue-500 shrink-0" />;
}

export function AttachmentsForm({ cvId }: AttachmentsFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const fetchAttachments = useCallback(async () => {
    try {
      const res = await fetch(`/api/cvs/${cvId}/attachments`);
      if (!res.ok) throw new Error("Failed to load");
      setAttachments(await res.json());
    } catch {
      toast({ title: "Could not load attachments", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [cvId, toast]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch(`/api/cvs/${cvId}/attachments`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Upload failed");
        }
        const row: Attachment = await res.json();
        setAttachments((prev) => [...prev, row]);
        successCount++;
      } catch (err: unknown) {
        failCount++;
        const msg = err instanceof Error ? err.message : "Upload failed";
        toast({ title: `Failed: ${file.name}`, description: msg, variant: "destructive" });
      }
    }

    if (successCount > 0) {
      toast({
        title: successCount === 1 ? "File uploaded" : `${successCount} files uploaded`,
      });
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (att: Attachment) => {
    if (!confirm(`Remove "${att.label || att.originalName}"?`)) return;
    try {
      const res = await fetch(`/api/cvs/${cvId}/attachments/${att.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setAttachments((prev) => prev.filter((a) => a.id !== att.id));
      toast({ title: "Attachment removed" });
    } catch {
      toast({ title: "Failed to remove attachment", variant: "destructive" });
    }
  };

  const startEdit = (att: Attachment) => {
    setEditingId(att.id);
    setEditLabel(att.label || att.originalName);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditLabel("");
  };

  const commitEdit = async (att: Attachment) => {
    const label = editLabel.trim() || null;
    try {
      const res = await fetch(`/api/cvs/${cvId}/attachments/${att.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      if (!res.ok) throw new Error();
      const updated: Attachment = await res.json();
      setAttachments((prev) => prev.map((a) => (a.id === att.id ? updated : a)));
      toast({ title: "Label updated" });
    } catch {
      toast({ title: "Failed to update label", variant: "destructive" });
    } finally {
      cancelEdit();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-card border rounded-lg p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-base">Supporting Documents</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Attach school certificates, diplomas, reference letters, or any
              other supporting documents. PDF and image files up to 20 MB each.
            </p>
          </div>
          <div className="shrink-0">
            <input
              type="file"
              accept="application/pdf,image/*"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={handleUpload}
            />
            <Button
              size="sm"
              className="gap-2"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? "Uploading…" : "Upload Files"}
            </Button>
          </div>
        </div>
      </div>

      {/* File list */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : attachments.length === 0 ? (
        /* Drop-zone style empty state */
        <button
          type="button"
          className="w-full border-2 border-dashed rounded-lg p-10 flex flex-col items-center gap-3 text-muted-foreground hover:border-primary/40 hover:text-primary/70 transition-colors cursor-pointer bg-card/50"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="w-8 h-8 opacity-40" />
          <span className="text-sm font-medium">
            Click to upload a certificate or document
          </span>
          <span className="text-xs">PDF · JPEG · PNG · WebP — max 20 MB</span>
        </button>
      ) : (
        <div className="space-y-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="bg-card border rounded-lg p-3 flex items-center gap-3 shadow-sm"
            >
              <FileIcon mimeType={att.mimeType} />

              {/* Label / name */}
              <div className="flex-1 min-w-0">
                {editingId === att.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      className="h-7 text-sm py-1"
                      value={editLabel}
                      autoFocus
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit(att);
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-green-600"
                      onClick={() => commitEdit(att)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={cancelEdit}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {att.label || att.originalName}
                    </span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground shrink-0"
                      onClick={() => startEdit(att)}
                      title="Rename"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {att.mimeType === "application/pdf" ? "PDF" : "Image"} ·{" "}
                  {formatBytes(att.fileSize)}
                  {att.label && (
                    <span className="ml-1 opacity-60">· {att.originalName}</span>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={`/api/uploads/attachments/${att.filename}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Open"
                >
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(att)}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
