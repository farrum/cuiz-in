
import React from 'react';

const AdDebugPanel: React.FC = () => {
  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm overflow-auto max-h-[80vh]">
      <h3 className="text-lg font-bold mb-2">Ad Debug Panel</h3>
      <div className="space-y-2 text-xs">
        <p>Ad Status: Active</p>
        <p>Cached Ads: {localStorage.getItem('quiz_app_ad_slots') ? 'Available' : 'None'}</p>
        <p>Last Sync: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default AdDebugPanel;
