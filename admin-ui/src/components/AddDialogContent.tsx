import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

interface AddDialogContentProps {
  type: string; // "language" | "version" | "license"
  formData: any;
  setFormData: (data: any) => void;
  error?: string;
}
function RequiredMark() {
  return (
    <>
      <span aria-hidden="true" className="text-red-500">*</span>
      <span className="sr-only">(required)</span>
    </>
  );
}

export const AddDialogContent = ({
  type,
  formData,
  setFormData,
  error,
}: AddDialogContentProps) => {
  switch (type) {
    case "language":
      return (
        <div className="space-y-4 py-4">
          <div className="font-medium mb-2">Language Code<RequiredMark /></div>
          <Input
            placeholder="Enter Language code"
            value={formData.language_code}
            onChange={(e) =>
              setFormData({ ...formData, language_code: e.target.value })
            }
          />
          <div className="font-medium mb-2">Language Name<RequiredMark /></div>
          <Input
            placeholder="Enter Language name"
            value={formData.language_name}
            onChange={(e) =>
              setFormData({ ...formData, language_name: e.target.value })
            }
          />
          <div className="font-medium mb-2">Metadata (optional)</div>
          <Textarea
            className="overflow-auto max-h-[200px] custom-scrollbar"
            placeholder='Enter metadata as JSON (e.g. {"key": "value"})'
            value={formData.metadata || ""}
            onChange={(e) =>
              setFormData({ ...formData, metadata: e.target.value })
            }
            rows={4}
          />
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    case "version":
      return (
        <div className="space-y-4 py-4">
          <div className="font-medium mb-2">Version Name<RequiredMark /></div>
          <Input
            placeholder="Enter Version name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <div className="font-medium mb-2">Abbreviation<RequiredMark /></div>
          <Input
            placeholder="Enter Version code"
            value={formData.abbreviation}
            onChange={(e) =>
              setFormData({ ...formData, abbreviation: e.target.value })
            }
          />

          <div className="font-medium mb-2">Metadata (optional)</div>
          <Textarea
            className="overflow-auto max-h-[200px] custom-scrollbar"
            placeholder='Enter metadata as JSON (e.g. {"key": "value"})'
            value={formData.metadata || ""}
            onChange={(e) =>
              setFormData({ ...formData, metadata: e.target.value })
            }
            rows={4}
          />
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    case "license":
      return (
        <div className="space-y-4 py-4">
          <div className="font-medium mb-2">License Name<RequiredMark /></div>
          <Input
            placeholder="Enter License Name"
            value={formData.license_name}
            onChange={(e) =>
              setFormData({ ...formData, license_name: e.target.value })
            }
            required
            aria-required="true"

          />
          <div className="font-medium mb-2">Details<RequiredMark /></div>
          <Textarea
            className="overflow-auto max-h-[200px] custom-scrollbar"
            placeholder='Enter License Details'
            value={formData.details || ""}
            onChange={(e) =>
              setFormData({ ...formData, details: e.target.value })
            }
            rows={2}
          />
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    default:
      return <p>Form not available</p>;
  }
};
