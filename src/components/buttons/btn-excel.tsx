import { Button } from "@/components/ui/button";
import { Table } from "@tanstack/react-table";
import { ClipboardPaste } from "lucide-react";
import * as XLSX from "xlsx";

// We use generics <TData> to make the component type-safe and reusable
// for any table and any data structure.
interface ButtonExcelProps<TData> {
    table: Table<TData>;
    filename?: string;
    sheetName?: string;
}

export default function ButtonExcel<TData>({
    table,
    filename = "dados_tabela.xlsx",
    sheetName = "Planilha1"
}: ButtonExcelProps<TData>) {

    const handleExport = () => {
        const visibleColumns = table
            .getVisibleFlatColumns()
            .filter(
                (col) => col.id !== "select" && col.id !== "actions"
            );

        const headers = visibleColumns.map((col) => col.id);

        const dataRows = table.getFilteredRowModel().rows.map(row => {
            const rowData: { [key: string]: any } = {};

            visibleColumns.forEach(col => {
                let value = row.getValue(col.id);

                if (typeof value === 'object' && value !== null) {
                    if ('nome' in value) {
                        value = value.nome;
                    } else if ('name' in value) {
                        value = value.name;
                    } else {
                        value = JSON.stringify(value);
                    }
                }

                rowData[col.id] = value;
            });
            return rowData;
        });

        const worksheet = XLSX.utils.json_to_sheet(dataRows, { header: headers });

        // 5. Create a new workbook and append the worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        // 6. Trigger the file download
        XLSX.writeFile(workbook, filename);
    };

    return (
        <Button onClick={handleExport} disabled={table.getRowModel().rows.length === 0}>
            <ClipboardPaste className="mr-2 h-4 w-4" />
            Exportar Excel
        </Button>
    );
}