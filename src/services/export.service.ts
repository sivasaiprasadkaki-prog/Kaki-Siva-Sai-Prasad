import { Injectable } from '@angular/core';
import { Ledger, Expense } from '../models';

// To inform TypeScript about the global variables from the CDN scripts
declare var jspdf: any;
declare var XLSX: any;

interface ExpenseWithBalance extends Expense {
    balance: number;
}

@Injectable({ providedIn: 'root' })
export class ExportService {

    exportToExcel(ledger: Ledger, expensesWithBalance: ExpenseWithBalance[]): void {
        const data = expensesWithBalance.map(exp => ({
            'Date & Time': new Date(exp.date).toLocaleString(),
            'Details': exp.details,
            'Category': exp.category,
            'Mode': exp.mode,
            'Cash In': exp.type === 'cash-in' ? exp.amount : '',
            'Cash Out': exp.type === 'cash-out' ? exp.amount : '',
            'Balance': exp.balance
        }));

        const totalIn = expensesWithBalance.filter(e => e.type === 'cash-in').reduce((sum, e) => sum + e.amount, 0);
        const totalOut = expensesWithBalance.filter(e => e.type === 'cash-out').reduce((sum, e) => sum + e.amount, 0);
        const finalBalance = totalIn - totalOut;
        
        // Add spacer and totals row
        data.push({} as any); 
        data.push({
            'Details': 'TOTALS',
            'Cash In': totalIn,
            'Cash Out': totalOut,
            'Balance': finalBalance
        } as any);

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');
        XLSX.writeFile(workbook, `${ledger.name.replace(/\s/g, '_')}_expenses.xlsx`);
    }

    async exportToPdf(ledger: Ledger, expensesWithBalance: ExpenseWithBalance[]): Promise<void> {
        const doc = new jspdf.jsPDF();

        // Title
        doc.setFontSize(22);
        doc.text(`TripTracker Ledger: ${ledger.name}`, 14, 20);
        doc.setFontSize(12);
        doc.text(`Exported on: ${new Date().toLocaleDateString()}`, 14, 28);

        // Table
        const head = [['Date', 'Details', 'Category', 'Mode', 'Cash In', 'Cash Out', 'Balance']];
        const body = expensesWithBalance.map(exp => ([
            new Date(exp.date).toLocaleDateString(),
            exp.details,
            exp.category,
            exp.mode,
            exp.type === 'cash-in' ? exp.amount.toFixed(2) : '',
            exp.type === 'cash-out' ? exp.amount.toFixed(2) : '',
            exp.balance.toFixed(2)
        ]));

        (doc as any).autoTable({
            startY: 35,
            head: head,
            body: body,
            theme: 'grid',
            headStyles: {
                fillColor: [20, 184, 166], // teal-500 from Tailwind
                textColor: [255, 255, 255]
            },
            didParseCell: (data: any) => {
                if (data.section === 'body' && data.row.index != null) {
                    const expense = expensesWithBalance[data.row.index];
                    if (expense?.type === 'cash-in') {
                        data.cell.styles.textColor = [34, 197, 94]; // green-500
                    } else if (expense?.type === 'cash-out') {
                        data.cell.styles.textColor = [239, 68, 68]; // red-500
                    }
                }
            }
        });

        // Attachments
        const allAttachments = expensesWithBalance.flatMap(e => e.attachments);
        if (allAttachments.length > 0) {
            doc.addPage();
            doc.setFontSize(18);
            doc.text('Attachments', 14, 20);

            let yPos = 30;
            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            const availableWidth = pageWidth - margin * 2;
            const availableHeight = pageHeight - margin * 2;

            for (const attachment of allAttachments) {
                if (attachment.type.startsWith('image/')) {
                    try {
                        const img = new Image();
                        img.src = attachment.dataUrl;
                        await new Promise(resolve => img.onload = resolve);
                        
                        const aspectRatio = img.width / img.height;
                        let imgWidth = availableWidth;
                        let imgHeight = imgWidth / aspectRatio;

                        if (imgHeight > availableHeight) {
                            imgHeight = availableHeight;
                            imgWidth = imgHeight * aspectRatio;
                        }

                        const x = (pageWidth - imgWidth) / 2;
                        const y = (pageHeight - imgHeight) / 2;

                        doc.addImage(attachment.dataUrl, attachment.type.split('/')[1].toUpperCase(), x, y, imgWidth, imgHeight);
                        if (allAttachments.indexOf(attachment) < allAttachments.length - 1) {
                            doc.addPage();
                        }

                    } catch (e) {
                        console.error("Error adding image to PDF:", e);
                        doc.text(`Could not load image: ${attachment.name}`, 14, yPos);
                        yPos += 10;
                    }
                }
            }
        }

        doc.save(`${ledger.name.replace(/\s/g, '_')}_expenses.pdf`);
    }
}