import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
  } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
  import { AddDialogContent } from "@/components/AddDialogContent";
  import { EditDialogContent } from "@/components/EditDialogContent";
  
  interface FormDialogProps {
    mode: "add" | "edit";
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: "language" | "version" | "license";
    title?: string;
    formData: any;
    setFormData: (data: any) => void;
    error?: string;
    onConfirm: () => void;
    isLoading?: boolean;
    onCancel: () => void;
  }
  
  export const FormDialog: React.FC<FormDialogProps> = ({
    mode,
    open,
    onOpenChange,
    type,
    title,
    formData,
    setFormData,
    error,
    onConfirm,
    isLoading = false,
    onCancel,
  }) => {
    const defaultTitle =
      mode === "add"
        ? `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`
        : `Edit ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle>{title || defaultTitle}</DialogTitle>
          </DialogHeader>
  
          {mode === "add" ? (
            <AddDialogContent
              type={type}
              formData={formData}
              setFormData={setFormData}
              error={error}
            />
          ) : (
            <EditDialogContent
              type={type}
              formData={formData}
              setFormData={setFormData}
              error={error}
            />
          )}
  
          <DialogFooter>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={onConfirm} disabled={isLoading}>
              {isLoading ? (mode === "add" ? "Adding..." : "Saving...") : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  