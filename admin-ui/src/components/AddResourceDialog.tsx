import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguageSearch, useLicenses, useVersions } from "@/hooks/useAPI";
import { extractErrorMessage } from "@/utils/errorUtils";
import type {
  AddResourceDialogProps,
  SelectOption,
  ResourceFormData,
} from "@/utils/types";
import { CONTENT_TYPES } from "@/utils/types";
import CustomSearchableSelect from "@/components/CustomSearchableSelect";

const AddResourceDialog: React.FC<AddResourceDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode = "add",
  initialData = {},
}: AddResourceDialogProps) => {
  const [formData, setFormData] = useState<ResourceFormData>({
    version_id: 0,
    revision: "",
    content_type: "",
    language_id: 0,
    license_id: 0,
    metadata: "",
    ...initialData,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [metadataError, setMetadataError] = useState<string>("");

  const [languageSearch, setLanguageSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isFetchingLanguages, setIsFetchingLanguages] = useState(false);

  useEffect(() => {
    if (languageSearch) setIsFetchingLanguages(true);
    const handler = setTimeout(() => setDebouncedSearch(languageSearch), 500);
    return () => clearTimeout(handler);
  }, [languageSearch]);

  // API hooks
  const { data: licenses, isLoading: licensesLoading } = useLicenses();
  const { data: versions, isLoading: versionsLoading } = useVersions();

  const {
    data: languages,
    isLoading: languagesLoading,
    isFetching,
  } = useLanguageSearch(debouncedSearch);

  useEffect(() => {
    if (!isFetching && !languagesLoading) setIsFetchingLanguages(false);
  }, [isFetching, languagesLoading]);

  const [selectedLanguageOption, setSelectedLanguageOption] =
    useState<SelectOption | null>(
      initialData?.language_id
        ? {
          label: initialData.language_name || "",
          value: initialData.language_id,
        }
        : null
    );

  useEffect(() => {
    if (!isOpen || mode !== "edit") return;

    if (initialData?.language_id && initialData?.language_name) {
      setSelectedLanguageOption({
        label: initialData.language_name,
        value: initialData.language_id,
      });
    }
  }, [isOpen, mode, initialData]);

  const isContentTypeLocked =
    mode === "edit" &&
    [
      "bible",
      "isl_bible",
      "video",
      "dictionary",
    ].includes((initialData?.content_type || "").toLowerCase());

  const handleSelectChange = (
    field: keyof ResourceFormData,
    option: SelectOption | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: option ? option.value : field === "content_type" ? "" : 0,
    }));
  };

  const handleInputChange = (
    field: keyof ResourceFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError("");
      setMetadataError("");
      await onSubmit(formData);
      // Reset form after successful submission
      setFormData({
        version_id: 0,
        revision: "",
        content_type: "",
        language_id: 0,
        license_id: 0,
        metadata: "",
      });
      setSelectedLanguageOption(null);
      setLanguageSearch("");
      setDebouncedSearch("");
    } catch (error: any) {
      const errorMessage =
        extractErrorMessage(error) || "Failed to add resource.";
      setSubmitError(
        error?.response?.status === 409
          ? "Resource already exists."
          : errorMessage
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
    setSubmitError("");
    setMetadataError("");
    // Reset form
    setFormData({
      version_id: 0,
      revision: "",
      content_type: "",
      language_id: 0,
      license_id: 0,
      metadata: "",
      ...initialData,
    });
    setSelectedLanguageOption(null);
    setLanguageSearch("");
    setDebouncedSearch("");
  };

  const isFormValid = () => {
    return (
      formData.version_id > 0 &&
      formData.content_type !== "" &&
      formData.language_id > 0 &&
      formData.license_id > 0 &&
      formData.revision.trim() !== ""
    );
  };

  const mapToSelectOptions = (
    items: any[],
    labelKey: string,
    valueKey: string
  ): SelectOption[] =>
    items.map((item) => ({ label: item[labelKey], value: item[valueKey] }));

  const normalizedMetadata =
    formData.metadata === null ||
      formData.metadata === "" ||
      (typeof formData.metadata === "object" &&
        Object.keys(formData.metadata).length === 0)
      ? ""
      : typeof formData.metadata === "object"
        ? JSON.stringify(formData.metadata, null, 2)
        : formData.metadata;


  const detectDuplicateKeys = (text: string) => {
    const keyRegex = /"([^"]+)"\s*:/g;
    const keys: string[] = [];
    let match;
    while ((match = keyRegex.exec(text)) !== null) {
      if (keys.includes(match[1])) return true;
      keys.push(match[1]);
    }
    return false;
  };

  const validateMetadata = (raw: string) => {
    if (!raw.trim()) return "";

    // Validate JSON
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return "Invalid JSON format";
    }

    if (typeof parsed !== "object" || Array.isArray(parsed)) {
      return "Metadata must be a simple flat JSON object";
    }

    for (const [, v] of Object.entries(parsed)) {
      if (v !== null && (typeof v === "object" || Array.isArray(v))) {
        return "Nested objects/arrays are not allowed";
      }
    }

    if (detectDuplicateKeys(raw)) {
      return "Duplicate keys are not allowed";
    }

    return "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto custom-scrollbar"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-semibold text-black">
            {mode === "add" ? "Add Resource" : "Edit Resource"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Content Type Dropdown */}
            <CustomSearchableSelect
              label="Content Type"
              required
              placeholder="Select Content Type"
              value={
                formData.content_type
                  ? {
                    label:
                      CONTENT_TYPES.find(
                        (ct) => ct.value === formData.content_type
                      )?.label || "",
                    value: formData.content_type,
                  }
                  : null
              }
              onChange={(option: SelectOption | null) =>
                handleSelectChange("content_type", option)
              }
              options={CONTENT_TYPES}
              isLoading={false}
              disabled={isContentTypeLocked}
            />

            {/* Language Dropdown */}
            <CustomSearchableSelect
              label="Language"
              required
              placeholder="Select Language"
              value={selectedLanguageOption}
              onChange={(option: SelectOption | null) => {
                setSelectedLanguageOption(option);
                setFormData((prev: ResourceFormData) => ({
                  ...prev,
                  language_id: option ? (option.value as number) : 0,
                }));
                if (!option) {
                  setLanguageSearch("");
                  setDebouncedSearch("");
                }
              }}
              onInputChange={(inputValue: string) =>
                setLanguageSearch(inputValue)
              }
              options={
                isFetchingLanguages || languagesLoading
                  ? []
                  : mapToSelectOptions(
                    languages?.items || [],
                    "language_name",
                    "language_id"
                  )
              }
              isLoading={isFetchingLanguages || languagesLoading}
            />

            {/* Version Dropdown */}
            <CustomSearchableSelect
              label="Version"
              required
              placeholder="Select Version"
              value={
                formData.version_id
                  ? {
                    label:
                      versions?.find(
                        (v: any) => v.version_id === formData.version_id
                      )?.name || "",
                    value: formData.version_id,
                  }
                  : null
              }
              onChange={(option: SelectOption | null) =>
                handleSelectChange("version_id", option)
              }
              options={mapToSelectOptions(versions || [], "name", "version_id")}
              isLoading={versionsLoading}
            />

            {/* License Dropdown */}
            <CustomSearchableSelect
              label="License"
              required
              placeholder="Select License"
              value={
                formData.license_id
                  ? {
                    label:
                      licenses?.find(
                        (l: any) => l.license_id === formData.license_id
                      )?.license_name || "",
                    value: formData.license_id,
                  }
                  : null
              }
              onChange={(option: SelectOption | null) =>
                handleSelectChange("license_id", option)
              }
              options={mapToSelectOptions(
                licenses || [],
                "license_name",
                "license_id"
              )}
              isLoading={licensesLoading}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Revision Input */}
            <div>
              <label
                htmlFor="revision-input"
                className="block text-sm font-medium mb-2"
              >
                Revision
                <span aria-hidden="true" className="text-red-500 ml-1">*</span>
              </label>

              <Input
                id="revision-input"
                value={formData.revision}
                onChange={(e) => handleInputChange("revision", e.target.value)}
                placeholder="Enter revision"
                className={`border-purple-300 focus:border-purple-500 ${(formData.revision?.trim().length || 0) > 50
                  ? "border-red-500"
                  : ""
                  }`}
                maxLength={50}
              />
            </div>

            {/* Metadata Textarea */}
            <div>
              <label
                htmlFor="metadata-textarea"
                className="block text-sm font-medium mb-2"
              >
                Metadata
              </label>
              {/* <Textarea
                id="metadata-textarea"
                value={normalizedMetadata}
                onChange={(e) => handleInputChange("metadata", e.target.value)}
                placeholder={`Enter metadata as JSON
e.g. {"key": "value"}`}
                rows={8}
                className="border-purple-300 focus:border-purple-500 resize-none overflow-auto max-h-[200px] custom-scrollbar"
              /> */}
              <Textarea
                id="metadata-textarea"
                value={normalizedMetadata}
                onChange={(e) => {
                  const raw = e.target.value;
                  setFormData((prev) => ({ ...prev, metadata: raw }));
                  const err = validateMetadata(raw);
                  setMetadataError(err);
                }}
                placeholder={`Enter metadata as JSON
e.g. {"key": "value"}`}
                rows={8}
                className={`border-purple-300 focus:border-purple-500 resize-none overflow-auto max-h-[200px] custom-scrollbar ${metadataError ? "border-red-500" : ""
                  }`}
              />
              {metadataError && (
                <p className="text-xs text-red-500 mt-1">{metadataError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-800">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end pt-4 border-t mt-4">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={!isFormValid() || isSubmitting || !!metadataError}
            >
              {isSubmitting ? "Saving..." : mode === "add" ? "Add" : "Save"}
            </Button>
          </div>
        </div>


      </DialogContent>
    </Dialog>
  );
};

export default AddResourceDialog;
