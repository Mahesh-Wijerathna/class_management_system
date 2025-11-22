import React, { useEffect, useState } from 'react';
import { getUserPermissions } from '../../../api/rbac';
import { getUserData } from '../../../api/apiUtils';
import { 
  FaChartBar, 
  FaMoneyBill, 
  FaFileInvoice, 
  FaClock, 
  FaTicketAlt, 
  FaUserPlus, 
  FaSearch, 
  FaHistory, 
  FaPrint, 
  FaLock, 
  FaSignOutAlt,
  FaBarcode,
  FaUser,
  FaGraduationCap,
  FaBook,
  FaClipboardList,
  FaCog,
  FaBell,
  FaQrcode,
  FaCamera,
  FaStickyNote,
  FaExclamationTriangle,
  FaIdCard
} from 'react-icons/fa';

// All possible sidebar sections with permission requirements
const allCashierSidebarSections = [
  {
    section: 'Dashboard Overview',
    items: [
      { 
        name: 'Cashier Dashboard', 
        path: '/cashierdashboard', 
        icon: <FaChartBar className="h-5 w-5" />,
        permission: 'dashboard_overview.cashier_dashboard'
      },
    ]
  },
  {
    section: 'Student Tracking',
    items: [
      { 
        name: 'Late Payments', 
        path: '/cashier/late-payments', 
        icon: <FaExclamationTriangle className="h-5 w-5" />,
        permission: 'student_tracking.late_payments'
      },
      { 
        name: 'Forget ID Card Students', 
        path: '/cashier/forget-id-card', 
        icon: <FaIdCard className="h-5 w-5" />,
        permission: 'student_tracking.forget_id_card_students'
      },
    ]
  }
  // Commented sections can be uncommented when permissions are added
  // {
  //   section: 'Payment Management',
  //   items: [
  //     { name: 'Quick Payment', path: '/cashier/quick-payment', icon: <FaMoneyBill className="h-5 w-5" />, permission: 'payment_processing.process_payment' },
  //     { name: 'Payment History', path: '/cashier/payment-history', icon: <FaHistory className="h-5 w-5" />, permission: 'payment_processing.payment_history' },
  //     { name: 'Pending Payments', path: '/cashier/pending-payments', icon: <FaClock className="h-5 w-5" />, permission: 'payment_processing.pending_payments' },
  //     { name: 'Receipt Management', path: '/cashier/receipts', icon: <FaFileInvoice className="h-5 w-5" />, permission: 'payment_processing.receipt_management' },
  //   ]
  // },
];

// Function to filter sidebar sections based on user permissions
const filterSidebarByPermissions = (sections, userPermissions) => {
  console.log('🔍 filterSidebarByPermissions called');
  console.log('📋 All sidebar sections:', sections);
  console.log('👤 User permissions from backend:', userPermissions);
  
  if (!userPermissions || userPermissions.length === 0) {
    console.warn('⚠️ No user permissions provided - returning empty sidebar');
    return [];
  }

  const permissionNames = userPermissions.map(p => p.name);
  console.log('🔑 Permission names extracted:', permissionNames);
  
  const filtered = sections
    .map(section => {
      console.log(`\n📂 Processing section: "${section.section}"`);
      const filteredItems = section.items.filter(item => {
        console.log(`  📌 Item: "${item.name}"`);
        console.log(`     Required permission: "${item.permission || 'NONE'}"`);
        
        // If item has no permission requirement, show it
        if (!item.permission) {
          console.log(`     ✅ No permission required - SHOWING`);
          return true;
        }
        
        // Check if user has the required permission
        const hasPermission = permissionNames.includes(item.permission);
        console.log(`     ${hasPermission ? '✅' : '❌'} Permission check: ${hasPermission ? 'SHOWING' : 'HIDING'}`);
        return hasPermission;
      });
      
      console.log(`  📊 Section "${section.section}" filtered items:`, filteredItems.length, 'of', section.items.length);
      
      return {
        ...section,
        items: filteredItems
      };
    })
    .filter(section => {
      const keep = section.items.length > 0;
      console.log(`  ${keep ? '✅' : '❌'} Section "${section.section}": ${keep ? 'KEEPING' : 'REMOVING'} (${section.items.length} items)`);
      return keep;
    });
  
  console.log('\n🎯 Final filtered sections:', filtered);
  console.log('📊 Total sections shown:', filtered.length);
  
  return filtered;
};

// Hook to get filtered sidebar sections
export const useCashierSidebar = () => {
  const [sidebarSections, setSidebarSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        setLoading(true);
        
        console.log('🚀 useCashierSidebar - Starting permission fetch');
        
        // Get user data using the same method as the rest of the dashboard
        const userData = getUserData();
        console.log('👤 User data from getUserData():', userData);
        
        // Try multiple possible user ID fields
        const userId = userData?.userid || userData?.id || userData?.user_id;
        console.log('🆔 User ID extracted:', userId);
        
        // Also check localStorage for 'user' key as fallback
        if (!userId) {
          console.log('⚠️ No userid in getUserData(), checking localStorage["user"]...');
          try {
            const fallbackUser = JSON.parse(localStorage.getItem('user') || '{}');
            console.log('📦 Fallback user from localStorage["user"]:', fallbackUser);
            const fallbackId = fallbackUser?.userid || fallbackUser?.id || fallbackUser?.user_id;
            console.log('🆔 Fallback ID:', fallbackId);
            
            if (fallbackId) {
              console.log('✅ Using fallback user ID:', fallbackId);
              await fetchAndFilterPermissions(fallbackId);
              return;
            }
          } catch (e) {
            console.error('❌ Error parsing fallback user:', e);
          }
        }

        if (!userId) {
          console.warn('⚠️ No user ID found - sidebar will be empty');
          console.log('💡 Available storage keys:', Object.keys(localStorage), Object.keys(sessionStorage));
          setSidebarSections([]);
          setLoading(false);
          return;
        }

        await fetchAndFilterPermissions(userId);
        
      } catch (err) {
        console.error('❌ Error in fetchUserPermissions:', err);
        console.error('Error details:', err.message, err.stack);
        setError(err.message);
        setSidebarSections([]);
        setLoading(false);
      }
    };

    const fetchAndFilterPermissions = async (userId) => {
      console.log('📡 Fetching permissions from RBAC API for user:', userId);
      
      // Fetch user permissions from RBAC API
      const response = await getUserPermissions(userId);
      console.log('📥 RBAC API Response:', response);
      
      if (response.success && response.permissions) {
        console.log('✅ Permissions received:', response.permissions);
        console.log('📊 Number of permissions:', response.permissions.length);
        
        const filteredSections = filterSidebarByPermissions(
          allCashierSidebarSections, 
          response.permissions
        );
        
        console.log('🎯 Setting sidebar sections:', filteredSections);
        setSidebarSections(filteredSections);
      } else {
        console.warn('⚠️ API response unsuccessful or no permissions:', response);
        setSidebarSections([]);
      }
      
      setLoading(false);
      console.log('✅ useCashierSidebar - Permission fetch complete');
    };

    fetchUserPermissions();
  }, []);

  return { sidebarSections, loading, error };
};

// Default export for backward compatibility (returns all sections without filtering)
const cashierSidebarSections = allCashierSidebarSections;

export default cashierSidebarSections;