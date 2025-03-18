import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, doc, updateDoc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db, auth, checkAndUpdateActionLimit, getRemainingLimits } from '../firebase/config';
import { useNavigate, useLocation } from 'react-router-dom';

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

const CATEGORIES = [
  'UR (Unreserved)',
  'OBC (Other Backward Class)',
  'SC (Scheduled Caste)',
  'ST (Scheduled Tribe)',
  'EWS (Economically Weaker Section)'
];

// Department structure
const DEPARTMENT_STRUCTURE = {
  'Engineering': {
    subDepartments: {
      'Permanent Way (P-Way)': [
        'JE (P-Way)',
        'SSE (P-Way)',
        'Assistant P.Way',
        'Track Maintainer-IV',
        'Keyman',
        'Gangman'
      ],
      'Works': [
        'JE (Works)',
        'SSE (Works)',
        'Assistant (Workshop)',
        'Bridge Inspector',
        'Mason',
        'Carpenter'
      ],
      'Bridge': [
        'JE (Bridge)',
        'SSE (Bridge)',
        'Assistant Bridge'
      ],
      'Mechanical': [
        'JE (Mechanical)',
        'SSE (Mechanical)',
        'Assistant (Workshop)',
        'Assistant Carriage & Wagon',
        'Assistant Loco Shed (Diesel)',
        'Fitter',
        'Welder',
        'Train Examiner',
        'Technician',
        'Chemical & Metallurgical Assistant'
      ],
      'Electrical': [
        'JE (Electrical)',
        'SSE (Electrical)',
        'JE (Electrical/TRD)',
        'JE (Electrical/TRS)',
        'JE (Electrical Workshop)',
        'Assistant Loco Shed (Electrical)',
        'Assistant TL & AC (Workshop)',
        'Assistant TL & AC',
        'Assistant TRD'
      ],
      'Signal & Telecom (S&T)': {
        'Signal Section': [
          'JE (Signal)',
          'SSE (Signal)',
          'Assistant (S&T)',
          'Technician (Signal)'
        ],
        'Telecom Section': [
          'JE (Telecom)',
          'SSE (Telecom)',
          'Technician (Telecom)'
        ],
        'R&D & Design': [
          'JE (S&T Design)',
          'JE (S&T R&D)',
          'JE (S&T Workshop)'
        ]
      },
      'Traction Distribution (OHE)': [
        'Loco Inspector',
        'OHE Technician',
        'SSE OHE',
        'Assistant TRD'
      ],
      'Traction Rolling Stock (TRS)': [
        'JE (TRS)',
        'SSE (TRS)',
        'Loco Supervisor',
        'TRS Technician'
      ],
      'Research & Development (R&D)': [
        'JE (Research/TI)',
        'JE (Research/Instrumentation)'
      ]
    }
  },
  'Traffic': {
    subDepartments: {
      'Operations': [
        'Station Master',
        'Train Manager (Goods Guard)',
        'Train Controller',
        'Traffic Inspector',
        'Pointsman B'
      ],
      'Commercial': [
        'Booking Clerk',
        'Goods Clerk',
        'Enquiry Cum Reservation Clerk (ECRC)',
        'Commercial Apprentice',
        'Ticket Supervisor',
        'Ticket Clerk',
        'Senior Commercial cum Ticket Clerk'
      ]
    }
  },
  'Accounts': {
    subDepartments: {
      'Finance & Budgeting': [
        'Junior Accounts Assistant (JAA)',
        'Senior Accounts Assistant (SAA)',
        'Accounts Officer'
      ],
      'Payroll & Salary Processing': [
        'Accounts Clerk',
        'Bill Clerk',
        'Senior Clerk cum Typist',
        'Junior Clerk cum Typist'
      ],
      'Information Technology': [
        'JE (Information Technology)'
      ]
    }
  },
  'Personnel': {
    subDepartments: {
      'HR & Recruitment': [
        'Office Superintendent (OS)',
        'Clerk',
        'Chief Office Superintendent'
      ],
      'Settlement & Payroll': [
        'Bill Clerk',
        'Staff dealing with advances'
      ]
    }
  },
  'Stores': {
    subDepartments: {
      'Purchase Section': [
        'Purchase Clerk',
        'Tender Clerk',
        'Assistant Superintendent'
      ],
      'Scrap & Disposal': [
        'Disposal Clerk',
        'Scrap Yard Supervisor'
      ],
      'Depot Management': [
        'Depot Material Superintendent (DMS)'
      ],
      'Printing Press': [
        'JE (Printing Press)'
      ]
    }
  },
  'Medical': {
    subDepartments: {
      'Hospital Staff': [
        'Staff Nurse',
        'Pharmacist',
        'Lab Technician',
        'Doctor',
        'Nursing Superintendent'
      ],
      'Health Inspectors': [
        'Health & Sanitary Inspector'
      ]
    }
  },
  'Security': {
    subDepartments: {
      'Railway Protection Force (RPF)': [
        'Constable',
        'Sub-Inspector (SI)',
        'Inspector',
        'Assistant Security Commissioner'
      ],
      'Railway Protection Special Force (RPSF)': [
        'Constable',
        'SI',
        'Commando'
      ]
    }
  },
  'NTPC': {
    subDepartments: {
      'Non-Technical Popular Categories': [
        'Junior Clerk cum Typist',
        'Accounts Clerk cum Typist',
        'Trains Clerk',
        'Commercial cum Ticket Clerk'
      ]
    }
  }
};

const GRADE_PAY = [
  '1800',
  '1900',
  '2000',
  '2400',
  '2800',
  '4200',
  '4600',
  '4800',
  '5400',
  '6600'
];

const EmployeeForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editMode = location.state?.editMode || false;
  const initialData = location.state?.requestData || {
    name: '',
    category: '',
    jobId: '',
    department: '',
    subDepartment: '',
    subSubDepartment: '',
    post: '',
    gradePay: '',
    contactNumber: '',
    currentZone: '',
    currentDivision: '',
    wantedZone1: '',
    wantedDivision1: '',
    wantedZone2: '',
    wantedDivision2: '',
    wantedZone3: '',
    wantedDivision3: ''
  };

  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [limitWarningMessage, setLimitWarningMessage] = useState('');
  const [remainingCreates, setRemainingCreates] = useState(2);

  // Make sure form data is properly loaded in edit mode
  useEffect(() => {
    if (editMode && location.state?.requestData) {
      console.log('Loading edit data:', location.state.requestData);
      setFormData(location.state.requestData);
    }
  }, [editMode, location.state]);

  useEffect(() => {
    const fetchLimits = async () => {
      if (auth.currentUser) {
        const limits = await getRemainingLimits(auth.currentUser.uid);
        setRemainingCreates(limits.create);
      }
    };
    fetchLimits();
  }, []);

  // Memoize expensive computations
  const getDivisions = useMemo(() => (zone) => {
    return zone ? RAILWAY_DATA[zone] || [] : [];
  }, []);

  const getSubDepartments = useMemo(() => (department) => {
    if (!department) return [];
    const subDepts = DEPARTMENT_STRUCTURE[department]?.subDepartments || {};
    return Object.keys(subDepts);
  }, []);

  // Direct form update (no debounce)
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Create updated data object
    const updatedData = { ...formData, [name]: value };

    // Only reset dependent fields if not in edit mode or if fields were actually changed by user
    if (name === 'department') {
      // In edit mode, only reset if the department was actually changed
      if (!editMode || (editMode && value !== location.state?.requestData?.department)) {
        updatedData.subDepartment = '';
        updatedData.subSubDepartment = '';
        updatedData.post = '';
      }
    } 
    
    else if (name === 'subDepartment') {
      // In edit mode, only reset if the subDepartment was actually changed
      if (!editMode || (editMode && value !== location.state?.requestData?.subDepartment)) {
        updatedData.subSubDepartment = '';
        updatedData.post = '';
      }
    }
    
    else if (name === 'subSubDepartment') {
      // In edit mode, only reset if the subSubDepartment was actually changed
      if (!editMode || (editMode && value !== location.state?.requestData?.subSubDepartment)) {
        updatedData.post = '';
      }
    }
    
    else if (name === 'currentZone') {
      // In edit mode, only reset if the zone was actually changed
      if (!editMode || (editMode && value !== location.state?.requestData?.currentZone)) {
        updatedData.currentDivision = '';
      }
    }
    
    else if (name === 'wantedZone1') {
      // In edit mode, only reset if the zone was actually changed
      if (!editMode || (editMode && value !== location.state?.requestData?.wantedZone1)) {
        updatedData.wantedDivision1 = '';
      }
    }
    
    else if (name === 'wantedZone2') {
      // In edit mode, only reset if the zone was actually changed
      if (!editMode || (editMode && value !== location.state?.requestData?.wantedZone2)) {
        updatedData.wantedDivision2 = '';
      }
    }
    
    else if (name === 'wantedZone3') {
      // In edit mode, only reset if the zone was actually changed
      if (!editMode || (editMode && value !== location.state?.requestData?.wantedZone3)) {
        updatedData.wantedDivision3 = '';
      }
    }
    
    // Set the updated data
    setFormData(updatedData);
    console.log('Updated form data:', updatedData);
  };

  // Get available sub-sub-departments based on selected department and sub-department
  const getSubSubDepartments = (department, subDepartment) => {
    if (!department || !subDepartment) return [];
    const subDept = DEPARTMENT_STRUCTURE[department]?.subDepartments[subDepartment];
    if (typeof subDept === 'object' && !Array.isArray(subDept)) {
      return Object.keys(subDept);
    }
    return [];
  };

  // Get available posts based on selected department and sub-department
  const getPosts = (department, subDepartment, subSubDepartment) => {
    if (!department || !subDepartment) return [];
    const subDept = DEPARTMENT_STRUCTURE[department]?.subDepartments[subDepartment];
    
    if (typeof subDept === 'object' && !Array.isArray(subDept)) {
      // Handle nested structure (like S&T)
      return subSubDepartment ? subDept[subSubDepartment] || [] : [];
    } else {
      // Handle flat structure
      return Array.isArray(subDept) ? subDept : [];
    }
  };

  const validateForm = () => {
    const requiredFields = [
      'name', 'category', 'department', 'gradePay', 'contactNumber',
      'currentZone', 'currentDivision', 'wantedZone1', 'wantedDivision1'
    ];
    
    for (const field of requiredFields) {
      if (!formData[field]) {
        setError(`Please fill in all required fields. Missing: ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    // Validate Job ID if provided (optional field)
    if (formData.jobId) {
      if (formData.jobId.length < 6) {
        setError('Job ID must have at least 6 characters');
        return false;
      }
      if (formData.jobId.length > 7) {
        setError('Job ID must have at most 7 characters');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Check if this is a new request
      if (!location.state?.editMode) {
        const limitCheck = await checkAndUpdateActionLimit(auth.currentUser.uid, 'create');
        if (!limitCheck.allowed) {
          setLimitWarningMessage('You have reached the maximum limit of 2 new requests in 24 hours.');
          setShowLimitWarning(true);
          setLoading(false);
          return;
        }
        setRemainingCreates(limitCheck.remainingCount);
      }

      if (!validateForm()) {
        setLoading(false);
        return;
      }

      // Check for existing request
      const existingRequestQuery = query(
        collection(db, 'transferRequests'),
        where('userId', '==', auth.currentUser.uid),
        where('status', '==', 'pending')
      );

      const existingRequestSnapshot = await getDocs(existingRequestQuery);

      if (!editMode && !existingRequestSnapshot.empty) {
        setError('You already have an active transfer request. Please edit or delete it first.');
        setLoading(false);
        return;
      }

      // Create a new object without the documents field
      const { documents, ...dataToSubmit } = formData;

      if (editMode) {
        const docRef = doc(db, 'transferRequests', formData.id);
        await updateDoc(docRef, {
          ...dataToSubmit,
          updatedAt: new Date()
        });
        
        // Update related notifications with the updated transfer request data
        // This will ensure that anyone who has received a request from this user
        // will see the updated information
        try {
          // Find all notifications sent by this user that are pending or accepted
          const notificationsQuery = query(
            collection(db, 'notifications'),
            where('fromUserId', '==', auth.currentUser.uid),
            where('status', 'in', ['pending', 'accepted'])
          );
          
          const notificationsSnapshot = await getDocs(notificationsQuery);
          
          // Update each notification with the new data
          const batch = writeBatch(db);
          let updatedCount = 0;
          
          notificationsSnapshot.forEach((notificationDoc) => {
            const notificationRef = doc(db, 'notifications', notificationDoc.id);
            
            // Update only the fields that might have changed in the transfer request
            batch.update(notificationRef, {
              fromCurrentLocation: `${dataToSubmit.currentZone} (${dataToSubmit.currentDivision})`,
              fromWantedLocation: `${dataToSubmit.wantedZone1} (${dataToSubmit.wantedDivision1})`,
              fromDepartment: dataToSubmit.department,
              fromSubDepartment: dataToSubmit.subDepartment,
              fromPost: dataToSubmit.post,
              lastUpdated: new Date(),
              fromRequestUpdated: true
            });
            
            updatedCount++;
          });
          
          // Commit the batch update
          if (updatedCount > 0) {
            await batch.commit();
            console.log(`Updated ${updatedCount} notifications with new transfer request data`);
          }
        } catch (updateError) {
          console.error('Error updating notifications:', updateError);
          // Don't block the main flow if notification updates fail
        }
        
        if (formData.jobId) {
          setSuccess('Transfer request updated successfully! Your profile will be shown as verified.');
        } else {
          setSuccess('Transfer request updated successfully!');
        }
        
        // Don't navigate away immediately - wait for Firebase to update
        setTimeout(() => {
          // After success, wait and navigate to dashboard with my-transfer-request active
          sessionStorage.setItem('activeSection', 'my-transfer-request');
          navigate('/dashboard');
        }, 2500);  // Increased timeout
      } else {
        await addDoc(collection(db, 'transferRequests'), {
          ...dataToSubmit,
          userId: auth.currentUser.uid,
          createdAt: new Date(),
          status: 'pending'
        });
        
        if (formData.jobId) {
          setSuccess('Transfer request submitted successfully! Your profile will be shown as verified.');
        } else {
          setSuccess('Transfer request submitted successfully!');
        }
        
        // Don't navigate away immediately - wait for Firebase to update
        setTimeout(() => {
          // After success, wait and navigate to dashboard with my-transfer-request active
          sessionStorage.setItem('activeSection', 'my-transfer-request');
          navigate('/dashboard');
        }, 2500);  // Increased timeout
      }
    } catch (error) {
      setError(editMode ? 'Error updating transfer request.' : 'Error submitting transfer request.');
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">
        {editMode ? 'Edit Transfer Request' : 'Employee Mutual Transfer Request'}
      </h2>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
      
      {/* Daily Limit Warning at the top */}
      {!location.state?.editMode && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-600">
              Daily Limit: You can create {remainingCreates} more transfer {remainingCreates === 1 ? 'request' : 'requests'} today.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information Section */}
        <div className="bg-indigo-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-indigo-800 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Employee Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Select Category</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Job ID <span className="text-xs text-gray-500">(optional - for verification)</span>
              </label>
              <input
                type="text"
                name="jobId"
                value={formData.jobId}
                onChange={handleChange}
                placeholder="6-7 character ID"
                minLength="6"
                maxLength="7"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <p className="text-xs text-gray-500 mt-1">Profiles with Job ID will be shown as verifiable</p>
            </div>
          </div>
        </div>

        {/* Professional Information Section */}
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4">Professional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Department *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Select Department</option>
                {Object.keys(DEPARTMENT_STRUCTURE).map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Sub-Department *
              </label>
              <select
                name="subDepartment"
                value={formData.subDepartment}
                onChange={handleChange}
                required
                disabled={!formData.department}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Select Sub-Department</option>
                {getSubDepartments(formData.department).map(subDept => (
                  <option key={subDept} value={subDept}>{subDept}</option>
                ))}
              </select>
            </div>

            {getSubSubDepartments(formData.department, formData.subDepartment).length > 0 && (
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Section *
                </label>
                <select
                  name="subSubDepartment"
                  value={formData.subSubDepartment}
                  onChange={handleChange}
                  required
                  disabled={!formData.subDepartment}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Select Section</option>
                  {getSubSubDepartments(formData.department, formData.subDepartment).map(subSubDept => (
                    <option key={subSubDept} value={subSubDept}>{subSubDept}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Post *
              </label>
              <select
                name="post"
                value={formData.post}
                onChange={handleChange}
                required
                disabled={!formData.subDepartment || (getSubSubDepartments(formData.department, formData.subDepartment).length > 0 && !formData.subSubDepartment)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Select Post</option>
                {getPosts(formData.department, formData.subDepartment, formData.subSubDepartment).map(post => (
                  <option key={post} value={post}>{post}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Grade Pay *
              </label>
              <select
                name="gradePay"
                value={formData.gradePay}
                onChange={handleChange}
                required
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Select Grade Pay</option>
                {GRADE_PAY.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Contact Number *
              </label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                pattern="[0-9]{10}"
                maxLength="10"
                required
                placeholder="Enter 10-digit mobile number"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          </div>
        </div>

        {/* Current Location */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Current Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Current Zone *
              </label>
              <select
                name="currentZone"
                value={formData.currentZone}
                onChange={handleChange}
                required
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Select Current Zone</option>
                {Object.keys(RAILWAY_DATA).map(zone => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Current Division *
              </label>
              <select
                name="currentDivision"
                value={formData.currentDivision}
                onChange={handleChange}
                required
                disabled={!formData.currentZone}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Select Current Division</option>
                {getDivisions(formData.currentZone).map(division => (
                  <option key={division} value={division}>{division}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Preferred Locations */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-4">Preferred Locations</h3>
          
          {/* Preference 1 */}
          <div className="mb-4">
            <h4 className="font-semibold text-purple-700 mb-2">Preference 1 (Required)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Wanted Zone *
                </label>
                <select
                  name="wantedZone1"
                  value={formData.wantedZone1}
                  onChange={handleChange}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Select Wanted Zone</option>
                  {Object.keys(RAILWAY_DATA).map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Wanted Division *
                </label>
                <select
                  name="wantedDivision1"
                  value={formData.wantedDivision1}
                  onChange={handleChange}
                  required
                  disabled={!formData.wantedZone1}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Select Wanted Division</option>
                  {getDivisions(formData.wantedZone1).map(division => (
                    <option key={division} value={division}>{division}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Preference 2 */}
          <div className="mb-4">
            <h4 className="font-semibold text-purple-700 mb-2">Preference 2 (Optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Wanted Zone
                </label>
                <select
                  name="wantedZone2"
                  value={formData.wantedZone2}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Select Wanted Zone</option>
                  {Object.keys(RAILWAY_DATA).map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Wanted Division
                </label>
                <select
                  name="wantedDivision2"
                  value={formData.wantedDivision2}
                  onChange={handleChange}
                  disabled={!formData.wantedZone2}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Select Wanted Division</option>
                  {getDivisions(formData.wantedZone2).map(division => (
                    <option key={division} value={division}>{division}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Preference 3 */}
          <div>
            <h4 className="font-semibold text-purple-700 mb-2">Preference 3 (Optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Wanted Zone
                </label>
                <select
                  name="wantedZone3"
                  value={formData.wantedZone3}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Select Wanted Zone</option>
                  {Object.keys(RAILWAY_DATA).map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Wanted Division
                </label>
                <select
                  name="wantedDivision3"
                  value={formData.wantedDivision3}
                  onChange={handleChange}
                  disabled={!formData.wantedZone3}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Select Wanted Division</option>
                  {getDivisions(formData.wantedZone3).map(division => (
                    <option key={division} value={division}>{division}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 mr-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : editMode ? 'Update Transfer Request' : 'Submit Transfer Request'}
          </button>
        </div>
      </form>

      {/* Limit Warning Modal */}
      {showLimitWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-semibold">Action Limit Reached</h3>
            </div>
            <p className="text-gray-600 mb-4">{limitWarningMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowLimitWarning(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeForm; 