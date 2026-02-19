import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Props<T> {
  open: boolean;
  onClose: () => void;
  title: string;
  loading: boolean;
  error?: string | null;
  rows: T[];
  columns: {
    key: keyof T;
    header: string;
    align?: "left" | "center";
    render?: (value: any, row: T) => React.ReactNode;
  }[];
  summary?: React.ReactNode;
}

export function RemoteDataResultDialog<T>({
  open,
  onClose,
  title,
  loading,
  error,
  rows,
  columns,
  summary,
}: Props<T>) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl! h-full max-h-[70vh]! flex flex-col">
        <DialogHeader>
          <div className="text-xl font-bold">{title}</div>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0">
          {/* Loading */}
          {loading && (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking remote data, please wait...
              </div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-red-600">{error}</div>
            </div>
          )}

          {/* Data */}
          {!loading && !error && (
            <div className="flex flex-col flex-1 min-h-0">
              {summary && (
                <div className="mb-3 text-sm font-semibold shrink-0">
                  {summary}
                </div>
              )}

              <div className="flex-1 overflow-auto custom-scrollbar border rounded relative">
                <div className="min-w-max">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                      <tr>
                        {columns.map((c) => (
                          <th
                            key={String(c.key)}
                            className={`px-2 py-1 ${
                              c.align === "center" ? "text-center" : "text-left"
                            }`}
                          >
                            {c.header}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className="border-t">
                          {columns.map((c) => (
                            <td
                              key={String(c.key)}
                              className={`px-2 py-1 align-center ${
                                c.align === "center"
                                  ? "text-center"
                                  : "text-left"
                              }`}
                            >
                              {c.render
                                ? c.render(row[c.key], row)
                                : String(row[c.key] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {rows.length === 0 && (
                  <div className="absolute left-0 right-0 bottom-0 top-[33px] flex items-center justify-center text-gray-500 text-sm pointer-events-none">
                    No data found.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 shrink-0">
          <Button onClick={onClose} className="cursor-pointer">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
