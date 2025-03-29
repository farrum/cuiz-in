
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

// Format timestamp for reports
export const formatDateForReport = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
};

// Transform ad tracking data for export
export const prepareAdTrackingDataForExport = (data: any[], type: 'views' | 'clicks'): any[] => {
  return data.map(item => {
    const baseData = {
      'Ad Name': item.ad_name || 'Unknown',
      'Position': item.ad_position,
      'Date': formatDateForReport(type === 'views' ? item.view_date : item.click_date),
      'User ID': item.user_id || 'Anonymous',
      'Session ID': item.session_id,
      'Page': item.page_url || 'Unknown',
      'Device': item.device_info || 'Unknown'
    };
    
    if (type === 'clicks') {
      return {
        ...baseData,
        'Conversion': item.conversion ? 'Yes' : 'No'
      };
    }
    
    return baseData;
  });
};

// Download data as CSV file
export const downloadCSV = (data: any[], filename: string): void => {
  try {
    // Create CSV header row from the first object's keys
    const csvContent = data.reduce((csv, row) => {
      const rowContent = Object.values(row).join(',');
      return `${csv}${rowContent}\n`;
    }, Object.keys(data[0]).join(',') + '\n');
    
    // Create blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error generating CSV file:', error);
    throw error;
  }
};
