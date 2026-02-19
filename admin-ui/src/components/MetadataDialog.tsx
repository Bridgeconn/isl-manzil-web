import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import type { Resource, EditResourceInput } from "@/utils/types";
import { useUserRole } from "@/hooks/useUserRole";

export type KeyValue = {
  key: string;
  value: string | Record<string, any> | any[];
};

interface MetadataDialogProps {
  resource: Resource;
  mutate: (data: EditResourceInput) => Promise<any>;
  onUpdate?: (metadata: Record<string, any>) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MetadataDialog: React.FC<MetadataDialogProps> = ({
  resource,
  mutate,
  onUpdate,
  open,
  onOpenChange,
}) => {
  const { isAdmin } = useUserRole();
  const canEdit = isAdmin;

  const [activeTab, setActiveTab] = useState<"kv" | "json">("kv");
  const [jsonText, setJsonText] = useState("{}");
  const [kvRows, setKvRows] = useState<KeyValue[]>([{ key: "", value: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset on open/close
  useEffect(() => {
    if (!open) {
      setActiveTab("kv");
      setKvRows([{ key: "", value: "" }]);
      setJsonText("{}");
      setError(null);
      return;
    }

    const metadata =
      typeof resource?.metadata === "object" && resource.metadata
        ? resource.metadata
        : {};

    const rows =
      Object.keys(metadata).length > 0
        ? Object.entries(metadata).map(([k, v]) => ({
            key: k,
            value: v == null ? "" : typeof v === "object" ? v : String(v),
          }))
        : [{ key: "", value: "" }];

    setKvRows(rows);
    setJsonText(JSON.stringify(metadata, null, 2));
  }, [open, resource?.metadata]);

  const containsNested = (val: string) => {
    const trimmed = val.trim();
    return trimmed.startsWith("{") || trimmed.startsWith("[");
  };

  const detectDuplicateKeys = (text: string) => {
    const keyRegex = /"([^"]+)"\s*:/g;
    const keys: string[] = [];
    let match;
    let hasDuplicate = false;

    while ((match = keyRegex.exec(text)) !== null) {
      const key = match[1];
      if (keys.includes(key)) hasDuplicate = true;
      keys.push(key);
    }

    return hasDuplicate;
  };

  // Sync KV → JSON
  useEffect(() => {
    if (activeTab !== "kv") return;

    let hasDuplicate = false;
    let hasMissingKey = false;
    let hasNested = false;

    const seenKeys = new Set<string>();
    const kvJson: Record<string, any>[] = [];

    for (const { key, value } of kvRows) {
      const k = key.trim();
      const v = typeof value === "string" ? value.trim() : value;

      if (!k && v) {
        hasMissingKey = true;
      }
      if (k) {
        if (seenKeys.has(k)) hasDuplicate = true;
        seenKeys.add(k);
        if (
          (typeof v === "string" && containsNested(v)) ||
          (v !== null && typeof v === "object")
        ) {
          hasNested = true;
        }
      }

      kvJson.push({ key: k, value: v });
    }

    if (!hasDuplicate && !hasMissingKey && !hasNested) {
      const obj: Record<string, any> = {};
      kvRows.forEach(({ key, value }) => {
        const k = key.trim();
        if (!k) return;
        obj[k] = typeof value === "string" ? value.trim() : value;
      });
      setJsonText(JSON.stringify(obj, null, 2));
    } else {
      const text = kvRows
        .map(
          ({ key, value }) =>
            `  "${key}": ${
              typeof value === "string" ? `"${value}"` : JSON.stringify(value)
            }`,
        )
        .join(",\n");

      setJsonText(`{\n${text}\n}`);
    }

    if (hasMissingKey) setError("Key is required when value is present");
    else if (hasDuplicate) setError("Duplicate keys are not allowed");
    else if (hasNested) setError("Nested objects/arrays are not allowed");
    else setError(null);
  }, [kvRows, activeTab]);

  // Sync JSON → KV
  const handleJsonChange = (text: string) => {
    setJsonText(text);

    // Detect duplicates manually
    const hasDuplicate = detectDuplicateKeys(text);
    let hasMissingKey = false;

    if (hasDuplicate) {
      const pairRegex = /"([^"]+)"\s*:\s*"([^"]*)"/g;
      const rows: KeyValue[] = [];
      let match;
      while ((match = pairRegex.exec(text)) !== null) {
        rows.push({ key: match[1], value: match[2] });
      }
      setKvRows(rows.length ? rows : [{ key: "", value: "" }]);
      return setError("Duplicate keys are not allowed");
    }

    try {
      const parsed = JSON.parse(text);

      if (typeof parsed !== "object" || Array.isArray(parsed))
        return setError("Metadata must be a simple JSON object");

      const rows: KeyValue[] = [];
      let hasNested = false;

      Object.entries(parsed).forEach(([k, v]) => {
        if (!k && v) hasMissingKey = true;
        if (v !== null && typeof v === "object") hasNested = true;
        rows.push({ key: k, value: v ?? "" });
      });

      setKvRows(rows.length ? rows : [{ key: "", value: "" }]);

      if (hasDuplicate) setError("Duplicate keys are not allowed");
      else if (hasMissingKey) setError("Key is required when value is present");
      else if (hasNested) setError("Nested objects/arrays are not allowed");
      else setError(null);
    } catch {
      setError("Invalid JSON");
    }
  };

  const handleAddRow = () =>
    setKvRows((rows) => [...rows, { key: "", value: "" }]);

  const handleRemoveRow = (i: number) =>
    setKvRows((rows) => rows.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (error) return toast.error(error);

    try {
      const parsed = JSON.parse(jsonText);
      setSaving(true);

      await mutate({
        resourceId: resource.resourceId,
        versionId: resource.version?.id,
        contentType: resource.content?.contentType,
        languageId: resource.language?.id,
        licenseId: resource.license?.id,
        revision: resource.revision,
        published: resource.published,
        metadata: parsed,
      });

      onOpenChange(false);
      onUpdate?.(parsed);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update metadata");
    } finally {
      setSaving(false);
    }
  };

  function getResourceDialogTitle(resource: any) {
    const contentType =
      resource.content?.contentType?.replaceAll("_", " ") ?? "";
    const language = resource.language?.name ?? "";
    const version = resource.version?.code?.toUpperCase() ?? "";
    const revision = resource.revision ?? "";

    return `${language} ${version} ${revision} ${contentType} Metadata`;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl flex flex-col gap-4"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{getResourceDialogTitle(resource)}</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "kv" | "json")}
        >
          <TabsList>
            <TabsTrigger value="kv">Key Value View</TabsTrigger>
            <TabsTrigger value="json">JSON View</TabsTrigger>
          </TabsList>

          {/* KV TAB */}
          <TabsContent value="kv">
            <div
              className={`${canEdit ? "h-[180px]" : "h-[220px]"} overflow-y-auto custom-scrollbar p-1 space-y-2`}
            >
              {kvRows.map((r, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 items-center">
                  <Input
                    className="col-span-5"
                    placeholder="Key"
                    value={r.key}
                    onChange={(e) =>
                      setKvRows((rows) =>
                        rows.map((x, idx) =>
                          idx === i ? { ...x, key: e.target.value } : x,
                        ),
                      )
                    }
                    readOnly={!canEdit}
                  />
                  <Input
                    className="col-span-6"
                    placeholder="Value"
                    value={
                      typeof r.value === "object"
                        ? JSON.stringify(r.value)
                        : r.value
                    }
                    onChange={(e) =>
                      setKvRows((rows) =>
                        rows.map((x, idx) =>
                          idx === i ? { ...x, value: e.target.value } : x,
                        ),
                      )
                    }
                    readOnly={!canEdit}
                  />
                  {canEdit && (
                    <button onClick={() => handleRemoveRow(i)}>
                      <Minus className="h-4 w-4 text-red-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {canEdit && (
              <div className="w-full flex justify-end mt-2">
                <Button variant="ghost" size="sm" onClick={handleAddRow}>
                  <Plus className="mr-2 h-4 w-4" /> Add property
                </Button>
              </div>
            )}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </TabsContent>

          {/* JSON TAB */}
          <TabsContent value="json">
            <Textarea
              value={jsonText}
              onChange={(e) => handleJsonChange(e.target.value)}
              readOnly={!canEdit}
              className={`h-[220px] custom-scrollbar resize-none ${
                error ? "border-red-500" : ""
              }`}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="cursor-pointer"
          >
            {canEdit ? "Cancel" : "Close"}
          </Button>
          {canEdit && (
            <Button
              onClick={handleSave}
              disabled={saving || !!error}
              className="bg-black cursor-pointer text-white"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MetadataDialog;
