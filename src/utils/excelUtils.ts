
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
