import React, { useState, useEffect } from 'react';

const EditModal = ({ isOpen, onClose, request, onSave }) => {
  const [formData, setFormData] = useState(request || {});
  const [errors, setErrors] = useState({});

  // Railway Zones and Divisions data
  const RAILWAY_DATA = {
    'Central Railway': ['Mumbai (CST)', 'Bhusawal', 'Nagpur', 'Solapur', 'Pune'],
    'Eastern Railway': ['Asansol', 'Howrah', 'Malda', 'Sealdah'],
    'East Central Railway': ['Danapur', 'Dhanbad', 'Mughalsarai', 'Samastipur', 'Sonpur'],
    'East Coast Railway': ['Khurda Road', 'Sambalpur', 'Waltair'],
    'Northern Railway': ['Ambala', 'Delhi', 'Lucknow', 'Moradabad', 'Ferozpur'],
    'North Central Railway': ['Allahabad', 'Agra', 'Jhansi'],
    'North Eastern Railway': ['Lucknow', 'Izzatnagar', 'Varanasi'],
    'Northeast Frontier Railway': ['Katihar', 'Alipurduar', 'Rangiya', 'Lumding', 'Tinsukia'],
    'North Western Railway': ['Ajmer', 'Bikaner', 'Jaipur', 'Jodhpur'],
    'Southern Railway': ['Chennai', 'Madurai', 'Palghat', 'Trichy', 'Trivandrum', 'Salem'],
    'South Central Railway': ['Guntakal', 'Guntur', 'Hyderabad', 'Nanded', 'Secunderabad', 'Vijayawada'],
    'South Eastern Railway': ['Adra', 'Chakradharpur', 'Kharagpur', 'Ranchi'],
    'South East Central Railway': ['Bilaspur', 'Nagpur', 'Raipur'],
    'South Western Railway': ['Bangalore', 'Hubli', 'Mysore'],
    'Western Railway': ['Mumbai (Central)', 'Vadodara', 'Ratlam', 'Ahmedabad', 'Rajkot', 'Bhavnagar'],
    'West Central Railway': ['Bhopal', 'Jabalpur', 'Kota'],
    'Metro Railway': ['Kolkata']
  };

  // Update form data when request changes
  useEffect(() => {
    if (request) {
      setFormData(request);
    }
  }, [request]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleZoneChange = (prefix, value) => {
    // Reset division when zone changes
    setFormData({
      ...formData,
      [`${prefix}Zone`]: value,
      [`${prefix}Division`]: ''
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Basic validation
    if (!formData.currentZone) {
      newErrors.currentZone = 'Current zone is required';
    }
    
    if (!formData.currentDivision) {
      newErrors.currentDivision = 'Current division is required';
    }
    
    if (!formData.wantedZone1) {
      newErrors.wantedZone1 = 'Requested zone is required';
    }
    
    if (!formData.wantedDivision1) {
      newErrors.wantedDivision1 = 'Requested division is required';
    }
    
    // Set errors
    setErrors(newErrors);
    
    // Return true if no errors
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Format data for saving
    const updatedData = {
      ...formData,
      currentLocation: `${formData.currentZone} (${formData.currentDivision})`,
      wantedLocation: `${formData.wantedZone1} (${formData.wantedDivision1})`
    };
    
    // Call the onSave function with updated data
    onSave(updatedData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">Edit Transfer Request</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Current Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zone <span className="text-red-500">*</span>
                </label>
                <select
                  name="currentZone"
                  value={formData.currentZone || ''}
                  onChange={(e) => handleZoneChange('current', e.target.value)}
                  className={`w-full p-2 border rounded-md ${errors.currentZone ? 'border-red-500' : 'border-gray-300'}`}
                  required
                >
                  <option value="">Select Zone</option>
                  {Object.keys(RAILWAY_DATA).map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
                {errors.currentZone && <p className="text-red-500 text-xs mt-1">{errors.currentZone}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Division <span className="text-red-500">*</span>
                </label>
                <select
                  name="currentDivision"
                  value={formData.currentDivision || ''}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md ${errors.currentDivision ? 'border-red-500' : 'border-gray-300'}`}
                  disabled={!formData.currentZone}
                  required
                >
                  <option value="">Select Division</option>
                  {formData.currentZone && RAILWAY_DATA[formData.currentZone]?.map(division => (
                    <option key={division} value={division}>{division}</option>
                  ))}
                </select>
                {errors.currentDivision && <p className="text-red-500 text-xs mt-1">{errors.currentDivision}</p>}
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Requested Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zone <span className="text-red-500">*</span>
                </label>
                <select
                  name="wantedZone1"
                  value={formData.wantedZone1 || ''}
                  onChange={(e) => handleZoneChange('wanted', e.target.value)}
                  className={`w-full p-2 border rounded-md ${errors.wantedZone1 ? 'border-red-500' : 'border-gray-300'}`}
                  required
                >
                  <option value="">Select Zone</option>
                  {Object.keys(RAILWAY_DATA).map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
                {errors.wantedZone1 && <p className="text-red-500 text-xs mt-1">{errors.wantedZone1}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Division <span className="text-red-500">*</span>
                </label>
                <select
                  name="wantedDivision1"
                  value={formData.wantedDivision1 || ''}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md ${errors.wantedDivision1 ? 'border-red-500' : 'border-gray-300'}`}
                  disabled={!formData.wantedZone1}
                  required
                >
                  <option value="">Select Division</option>
                  {formData.wantedZone1 && RAILWAY_DATA[formData.wantedZone1]?.map(division => (
                    <option key={division} value={division}>{division}</option>
                  ))}
                </select>
                {errors.wantedDivision1 && <p className="text-red-500 text-xs mt-1">{errors.wantedDivision1}</p>}
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Department Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sub-Department
                </label>
                <input
                  type="text"
                  name="subDepartment"
                  value={formData.subDepartment || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Post/Position
                </label>
                <input
                  type="text"
                  name="post"
                  value={formData.post || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal; 