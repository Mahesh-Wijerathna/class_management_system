import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from './StudentDashboardSidebar';
import Receipt from '../../../components/Receipt';
import { FaCheckCircle, FaPrint, FaDownload, FaHome, FaList } from 'react-icons/fa';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();

  const getPayHerePaymentStatus = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:8087/routes.php/get_payment_status?order_id=${orderId}`);
      return await response.json();
    } catch (e) {
      console.error('Error fetching PayHere payment status:', e);
      return { success: false, message: 'Failed to fetch payment status' };
    }
  };

  const getClassDetails = async (classId) => {
    try {
      const response = await fetch(`http://localhost:8087/routes.php/get_class_by_id?id=${classId}`);
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (e) {
      console.error('Error fetching class details:', e);
      return null;
    }
  };

  const verifyEnrollment = async (studentId, classId) => {
    try {
      const response = await fetch(`http://localhost:8087/routes.php/get_student_enrollments?studentId=${studentId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const enrollment = result.data.find(e => e.class_id == classId);
        return enrollment ? true : false;
      }
      return false;
    } catch (e) {
      console.error('Error verifying enrollment:', e);
      return false;
    }
  };

  const getUserData = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      console.error('User data not found in localStorage');
      return null;
    }
    return user;
  };

  useEffect(() => {
    const initializePaymentData = async () => {
      try {
        const orderId = searchParams.get('order_id');
        const paymentId = searchParams.get('payment_id');
        const statusCode = searchParams.get('status_code');

        console.log('🔍 PaymentSuccess - URL Parameters:', { orderId, paymentId, statusCode });

        // Always attempt to verify with backend if orderId is present
        if (orderId) {
          console.log('🎉 PayHere payment successful! Verifying with backend...');
          
          try {
            const paymentStatusResponse = await getPayHerePaymentStatus(orderId);
            console.log('📊 Payment status from backend:', paymentStatusResponse);

            if (paymentStatusResponse.success && paymentStatusResponse.data) {
              const backendPaymentData = paymentStatusResponse.data;
              
              // Check if payment is pending and we're in development mode
              if (backendPaymentData.status === 'pending' && process.env.NODE_ENV === 'development') {
                console.log('🔄 Development mode: Auto-completing pending payment...');
                
                // Auto-complete the payment
                try {
                  const autoCompleteResponse = await fetch(`http://localhost:8087/routes.php/dev/auto_complete_payment?order_id=${orderId}`);
                  const autoCompleteData = await autoCompleteResponse.json();
                  
                  if (autoCompleteData.success) {
                    console.log('✅ Payment auto-completed for development');
                    // Refresh the payment status
                    const refreshedResponse = await getPayHerePaymentStatus(orderId);
                    if (refreshedResponse.success && refreshedResponse.data) {
                      backendPaymentData.status = refreshedResponse.data.status;
                    }
                  }
                } catch (autoCompleteError) {
                  console.error('❌ Error auto-completing payment:', autoCompleteError);
                }
              }
              
              if (backendPaymentData.status === 'paid' || backendPaymentData.status === 'completed') {
                const userData = getUserData();
                
                // Fetch actual class details
                let classDetails = null;
                if (backendPaymentData.class_id) {
                  classDetails = await getClassDetails(backendPaymentData.class_id);
                }
                
                // Parse discount information from notes
                let promoDiscount = 0;
                let theoryDiscount = 0;
                let speedPostFee = 0;
                
                if (backendPaymentData.notes) {
                  const notes = backendPaymentData.notes;
                  const promoMatch = notes.match(/Promo: (\d+)/);
                  const theoryMatch = notes.match(/Theory Discount: (\d+)/);
                  const speedPostMatch = notes.match(/Speed Post: (\d+)/);
                  
                  promoDiscount = promoMatch ? parseFloat(promoMatch[1]) : 0;
                  theoryDiscount = theoryMatch ? parseFloat(theoryMatch[1]) : 0;
                  speedPostFee = speedPostMatch ? parseFloat(speedPostMatch[1]) : 0;
                }
                
                const basePrice = classDetails?.fee || parseFloat(backendPaymentData.amount) || 0;
                const totalDiscount = promoDiscount + theoryDiscount;
                
                const payHerePaymentData = {
                  transactionId: orderId,
                  paymentId: paymentId,
                  status: backendPaymentData.status,
                  paymentMethod: backendPaymentData.payment_method || 'PayHere',
                  date: new Date(backendPaymentData.created_at).toLocaleDateString(),
                  className: backendPaymentData.class_name || 'Class Payment',
                  subject: classDetails?.subject || 'Course',
                  teacher: classDetails?.teacher || 'Instructor',
                  stream: classDetails?.stream || 'General',
                  courseType: classDetails?.course_type || 'Regular',
                  amount: parseFloat(backendPaymentData.amount) || 0,
                  basePrice: basePrice,
                  discount: totalDiscount,
                  speedPostFee: speedPostFee,
                  currency: backendPaymentData.currency || 'LKR',
                  firstName: backendPaymentData.first_name,
                  lastName: backendPaymentData.last_name,
                  email: backendPaymentData.email,
                  phone: backendPaymentData.phone,
                  address: backendPaymentData.address,
                  city: backendPaymentData.city,
                  country: backendPaymentData.country,
                };

                setPaymentData(payHerePaymentData);
                console.log('✅ Payment data set successfully:', payHerePaymentData);
                console.log('🔍 Student Name:', `${payHerePaymentData.firstName} ${payHerePaymentData.lastName}`);
                console.log('🔍 Mobile:', payHerePaymentData.phone);
                console.log('🔍 Email:', payHerePaymentData.email);
                
                // Verify enrollment was created
                if (userData && backendPaymentData.class_id) {
                  const enrollmentVerified = await verifyEnrollment(userData.userid, backendPaymentData.class_id);
                  console.log('🔍 Enrollment verification:', enrollmentVerified ? '✅ SUCCESS' : '❌ FAILED');
                  
                  if (!enrollmentVerified) {
                    console.warn('⚠️ Enrollment not found, triggering manual refresh...');
                    // Wait a bit and try again
                    setTimeout(async () => {
                      const retryVerification = await verifyEnrollment(userData.userid, backendPaymentData.class_id);
                      console.log('🔍 Retry enrollment verification:', retryVerification ? '✅ SUCCESS' : '❌ FAILED');
                    }, 3000);
                  }
                }
                
                // Trigger multiple events to ensure MyClasses gets updated
                window.dispatchEvent(new CustomEvent('refreshMyClasses'));
                window.dispatchEvent(new CustomEvent('paymentCompleted', { 
                  detail: { 
                    transactionId: orderId,
                    classId: backendPaymentData.class_id,
                    status: 'success'
                  }
                }));
                
                // Also trigger a global refresh event
                window.dispatchEvent(new Event('storage'));
                
                console.log('🔄 Events dispatched to refresh MyClasses');
                
                // Also trigger a delayed refresh to ensure data is updated
                setTimeout(() => {
                  console.log('🔄 Delayed refresh triggered');
                  window.dispatchEvent(new CustomEvent('refreshMyClasses'));
                }, 2000);
                
                // Industry-level: Poll for payment status updates
                let pollCount = 0;
                const maxPolls = 10;
                const pollInterval = setInterval(async () => {
                  pollCount++;
                  console.log(`🔄 Payment status poll #${pollCount}`);
                  
                  try {
                    const updatedStatus = await getPayHerePaymentStatus(orderId);
                    if (updatedStatus.success && updatedStatus.data) {
                      if (updatedStatus.data.status === 'paid' || updatedStatus.data.status === 'completed') {
                        console.log('✅ Payment confirmed via polling');
                        clearInterval(pollInterval);
                        window.dispatchEvent(new CustomEvent('refreshMyClasses'));
                      }
                    }
                  } catch (error) {
                    console.error('❌ Polling error:', error);
                  }
                  
                  if (pollCount >= maxPolls) {
                    console.log('⏰ Polling timeout reached');
                    clearInterval(pollInterval);
                  }
                }, 3000); // Poll every 3 seconds
                
                              } else {
                  console.log('⚠️ Payment not yet completed:', backendPaymentData.status);
                  setError('Payment is being processed. Please wait a moment and refresh the page.');
                  
                  // Auto-refresh after 5 seconds
                  setTimeout(() => {
                    console.log('🔄 Auto-refreshing payment status...');
                    window.location.reload();
                  }, 5000);
                }
              
            } else {
              console.error('❌ Payment not found in database:', paymentStatusResponse);
              
              // In development mode, try to auto-complete any pending payment
              if (process.env.NODE_ENV === 'development' && orderId) {
                console.log('🔄 Development mode: Trying to auto-complete payment...');
                try {
                  const autoCompleteResponse = await fetch(`http://localhost:8087/routes.php/dev/auto_complete_payment?order_id=${orderId}`);
                  const autoCompleteData = await autoCompleteResponse.json();
                  
                  if (autoCompleteData.success) {
                    console.log('✅ Payment auto-completed! Refreshing page...');
                    // Refresh the page to show success
                    setTimeout(() => {
                      window.location.reload();
                    }, 1000);
                    return;
                  }
                } catch (autoCompleteError) {
                  console.error('❌ Error auto-completing payment:', autoCompleteError);
                }
              }
              
              setError('Payment not found. Please contact support if you believe this is an error.');
            }
            
          } catch (verifyError) {
            console.error('❌ Error verifying payment:', verifyError);
            
            // In development mode, try to auto-complete any pending payment
            if (process.env.NODE_ENV === 'development' && orderId) {
              console.log('🔄 Development mode: Trying to auto-complete payment after error...');
              try {
                const autoCompleteResponse = await fetch(`http://localhost:8087/routes.php/dev/auto_complete_payment?order_id=${orderId}`);
                const autoCompleteData = await autoCompleteResponse.json();
                
                if (autoCompleteData.success) {
                  console.log('✅ Payment auto-completed! Refreshing page...');
                  // Refresh the page to show success
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                  return;
                }
              } catch (autoCompleteError) {
                console.error('❌ Error auto-completing payment:', autoCompleteError);
              }
            }
            
            setError('Unable to verify payment. Please contact support.');
          }
          
        } else if (location.state) {
          console.log('📊 Using location state payment data:', location.state);
          setPaymentData(location.state);
        } else {
          console.log('❌ No payment data found in URL or location state');
          setError('No payment data found. Please complete a payment first.');
        }
      } catch (error) {
        console.error('❌ Error initializing payment data:', error);
        setError('Error loading payment details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializePaymentData();
  }, [location.state, searchParams]);

  if (loading) {
    return (
      <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
        <div className="p-8 text-center text-gray-500">
          Loading payment details...
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
        <div className="p-8 text-center text-red-500">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  if (!paymentData) {
    return (
      <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
        <div className="p-8 text-center text-gray-500">
          No payment data found. Please complete a payment first.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <FaCheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">
            Your payment has been processed successfully. You can now access your class.
          </p>
        </div>

        {/* Payment Summary Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Payment Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Transaction Details</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Transaction ID:</span> {paymentData.transactionId || paymentData.invoiceId}</div>
                <div><span className="font-medium">Date:</span> {paymentData.date}</div>
                <div><span className="font-medium">Payment Method:</span> {paymentData.paymentMethod || 'Online'}</div>
                <div><span className="font-medium">Status:</span> <span className="text-green-600 font-semibold">Paid</span></div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Class Details</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Class:</span> {paymentData.className}</div>
                <div><span className="font-medium">Subject:</span> {paymentData.subject}</div>
                <div><span className="font-medium">Teacher:</span> {paymentData.teacher}</div>
                <div><span className="font-medium">Amount:</span> LKR {paymentData.amount?.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => setShowReceipt(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPrint />
            View Receipt
          </button>
          <button
            onClick={() => {
              // Trigger a refresh before navigating
              window.dispatchEvent(new CustomEvent('refreshMyClasses'));
              setTimeout(() => {
                navigate('/student/my-classes');
              }, 500);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FaList />
            Go to My Classes
          </button>
          <button
            onClick={() => navigate('/studentdashboard')}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <FaHome />
            Back to Dashboard
          </button>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">What's Next?</h3>
          <div className="space-y-2 text-blue-800">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>Your class has been added to "My Classes" section</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>You can now access class materials and attend sessions</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>Check your email for class schedule and zoom links</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>Download your receipt for your records</p>
            </div>
          </div>
        </div>

        {/* Receipt Modal */}
        {showReceipt && (
          <Receipt
            paymentData={paymentData}
            onClose={() => setShowReceipt(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default PaymentSuccess; 