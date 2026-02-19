/**
 * Convert an array of objects to CSV and trigger a browser download.
 *
 * @param rows     - Array of objects to export
 * @param columns  - Column definitions: { key, label }
 * @param filename - Filename without extension
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportToCSV<T extends Record<string, any>>(
    rows: T[],
    columns: { key: string; label: string }[],
    filename: string
) {
    if (rows.length === 0) return;

    const escape = (val: unknown): string => {
        if (val == null) return "";
        const str = String(val);
        // Escape double quotes and wrap in quotes if needed
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const header = columns.map((c) => escape(c.label)).join(",");
    const body = rows
        .map((row) =>
            columns.map((c) => escape(row[c.key])).join(",")
        )
        .join("\n");

    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();

    URL.revokeObjectURL(url);
}
