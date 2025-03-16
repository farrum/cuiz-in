
import * as XLSX from 'xlsx';

export const generateExcelFile = (data: any[], filename: string): void => {
  try {
    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error('Error generating Excel file:', error);
    throw error;
  }
};
