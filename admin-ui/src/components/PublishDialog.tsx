import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CircleAlert, CheckCircle2 } from "lucide-react";
import { Spinner } from "./ui/spinner";

interface PublishDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;

    step: "confirm" | "loading" | "success";

    onConfirm: () => void;
    onClose: () => void;

    resourceName: string;
    action: boolean;
    contentType: string;
}

export const PublishDialog: React.FC<PublishDialogProps> = ({
    contentType,
    open,
    onOpenChange,
    step,
    resourceName,
    action,
    onConfirm,
    onClose,
}) => {
    const isPublish = action === false;

    /** ---------- CONFIRM STATE ---------- */
    if (step === "confirm") {
        const alertMessage =
            contentType === "Bible"
                ? isPublish
                    ? "Publishing a bible will publish both the text and audio bible"
                    : "Unpublishing a bible will unpublish both the text and audio bible"
                : isPublish
                    ? "Once published, this resource will be visible to public"
                    : "Once unpublished, this resource will be hidden from public";

        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {isPublish
                                ? `Confirm Publish ${contentType}`
                                : `Confirm Unpublish ${contentType}`}
                        </DialogTitle>
                        <DialogDescription>
                            {isPublish
                                ? "This action will make the resource publicly available."
                                : "This action will hide the resource from users."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-3 text-gray-800">
                        Are you sure you want to{" "}
                        <span className="font-semibold">
                            {isPublish ? "publish" : "unpublish"}
                        </span>{" "}
                        <span className="font-bold">{resourceName}</span>?
                    </div>

                    <div
                        className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${isPublish
                            ? "border-amber-200 bg-amber-50 text-amber-800"
                            : "border-gray-200 bg-gray-100 text-gray-700"
                            }`}
                    >
                        <CircleAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p>{alertMessage}</p>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={onConfirm}
                            className={
                                isPublish
                                    ? "bg-green-600 hover:bg-green-700 text-white"
                                    : "bg-red-600 hover:bg-red-700 text-white"
                            }
                        >
                            {isPublish ? "Publish" : "Unpublish"}
                        </Button>

                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    /** ---------- LOADING STATE ---------- */
    if (step === "loading") {
        return (
            <Dialog open={open} onOpenChange={() => { }}>
                <DialogContent showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>
                            {action === false ? "Publishing resource" : "Unpublishing resource"}
                        </DialogTitle>
                        <DialogDescription>
                            This may take a while. Please wait.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center justify-center gap-3 py-8">
                        <Spinner className="size-8 text-gray-600" />
                        <p className="text-md text-gray-600">
                            {action === false ? "Publishing resource" : "Unpublishing resource"} <span className="font-semibold">{resourceName}</span>
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }


    /** ---------- SUCCESS STATE ---------- */
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isPublish
                            ? `${contentType} Published Successfully`
                            : `${contentType} Unpublished Successfully`}
                    </DialogTitle>
                    <DialogDescription>
                        The resource published status has been updated successfully.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-3 text-gray-800">
                    The resource <span className="font-bold">{resourceName}</span> has been{" "}
                    <span className="font-semibold">
                        {isPublish ? "published" : "unpublished"}
                    </span>.
                </div>

                <div
                    className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${isPublish
                        ? "border-green-200 bg-green-50 text-green-800"
                        : "border-gray-200 bg-gray-100 text-gray-700"
                        }`}
                >
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                        {isPublish
                            ? "The resource is now publicly available."
                            : "The resource is no longer visible to the public."}
                    </p>
                </div>

                <DialogFooter>
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
