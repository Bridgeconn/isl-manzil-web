import type { ColumnMeta } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    align?: "left" | "center" | "right" | "number";
  }
}