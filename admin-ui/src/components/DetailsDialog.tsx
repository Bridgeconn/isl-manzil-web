import { useMemo, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

type DetailsCellProps = {
    text?: string | null;
    limit?: number;
    title?: string;
    triggerVariant?: "text" | "icon";
    justify?: "between" | "start" | "center"
};

export function DetailsDialog({
    text,
    limit = 25,
    title = "Details",
    triggerVariant = "text",
    justify = "between"
}: DetailsCellProps) {
    const [open, setOpen] = useState(false);
    const value = text ?? "";

    const isTruncated = value.length > limit;
    const wrapperJustifyClass = justify === "start" ? "justify-start" : justify === "center" ? "justify-center" : "justify-between"

    const display = useMemo(() => {
        if (!value) return "";

        if (!isTruncated) return value;

        if (triggerVariant === "text") {
            return value.slice(0, limit) + "...";
        }

        return value.slice(0, limit);
    }, [value, limit, isTruncated, triggerVariant]);

    const handleOpen = () => setOpen(true);

    return (
        <>
            <div className={`flex flex-row items-center ${wrapperJustifyClass} gap-1 w-full`}>
                <div className="min-w-0 whitespace-nowrap overflow-hidden truncate">
                    {display}
                </div>


                {isTruncated && (
                    <>
                        {triggerVariant === "text" && (
                            <button
                                type="button"
                                onClick={handleOpen}
                                className="text-xs underline shrink-0"
                            >
                                See More
                            </button>
                        )}

                        {triggerVariant === "icon" && (
                            <button
                                type="button"
                                onClick={handleOpen}
                                className="shrink-0 inline-flex items-center justify-center rounded-md
                        hover:bg-gray-200 transition-all group mt-1 p-1"
                                title="See More"
                            >
                                <MoreHorizontal className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                            </button>
                        )}
                    </>
                )}
            </div>


            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-2xl w-[90vw] max-w-[900px] p-0 overflow-hidden">
                    <div className="flex flex-col max-h-[80vh]">
                        <DialogHeader className="px-6 pt-6">
                            <DialogTitle>{title}</DialogTitle>
                            <div className="mt-1 border-b border-gray-300" />
                        </DialogHeader>

                        <div className="px-6 py-4 overflow-auto text-justify">
                            <div className="whitespace-pre-wrap break-words">
                                {value || "No details available."}
                            </div>
                        </div>

                        <DialogFooter className="px-6 pb-6 pt-3">
                            <DialogClose asChild>
                                <Button>Close</Button>
                            </DialogClose>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
