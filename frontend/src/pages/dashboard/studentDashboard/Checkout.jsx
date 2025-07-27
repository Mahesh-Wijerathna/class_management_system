import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import studentSidebarSections from './StudentDashboardSidebar';
import BasicCard from '../../../components/BasicCard';
import studyPacks from './PurchaseStudyPackData';
import BasicForm from '../../../components/BasicForm';
import CustomTextField from '../../../components/CustomTextField';
import CustomSelectField from '../../../components/CustomSelectField';
import * as Yup from 'yup';
import { FaCreditCard, FaUniversity, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaBook } from 'react-icons/fa';
import CustomButton from '../../../components/CustomButton';

const dummyStudent = {
  firstName: 'bawantha',
  lastName: 'rathnayake',
  mobile: '0740901827',
  otherMobile: '',
  email: 'bawantharathnayake25@gmail.com',
  homeCity: '',
  medium: 'Sinhala',
  address: '',
  tuteType: '',
  paymentNote: ''
};

const cityOptions = [
  { value: '', label: 'Select Home City' },
  { value: 'Colombo', label: 'Colombo' },
  { value: 'Kandy', label: 'Kandy' },
  { value: 'Galle', label: 'Galle' },
  { value: 'Kurunegala', label: 'Kurunegala' },
];

const mediumOptions = [
  { value: 'Sinhala', label: 'Sinhala' },
  { value: 'English', label: 'English' },
];

const tuteTypeOptions = [
  { value: '', label: 'Select Tute and Paper Collection Type' },
  { value: 'Speed Post', label: 'Speed Post' },
  { value: 'Physical Class', label: 'Physical Class' },
];

const getValidationSchema = (isStudyPack) =>
  Yup.object().shape({
    firstName: Yup.string().required('Required'),
    lastName: Yup.string().required('Required'),
    mobile: Yup.string().required('Required'),
    email: Yup.string().email('Invalid email').required('Required'),
    homeCity: Yup.string().required('Required'),
    medium: Yup.string().required('Required'),
    tuteType: isStudyPack ? Yup.string() : Yup.string().required('Required'),
    address: isStudyPack
      ? Yup.string()
      : Yup.string().when('tuteType', {
          is: 'Speed Post',
          then: schema => schema.required('Required'),
          otherwise: schema => schema.notRequired(),
        }),
  });

const paymentMethods = [
  { key: 'online', label: 'Online', icon: <FaCreditCard className="text-2xl mx-auto mb-1" />, sinhala: 'ඔන්ලයින් ගෙවීම' },
  { key: 'bank', label: 'Bank transfer', icon: <FaUniversity className="text-2xl mx-auto mb-1" />, sinhala: 'බැංකු හරහා ගෙවීම' },
];

// Get image based on subject or use default
const getClassImage = (subject) => {
  const imageMap = {
    'Physics': '/assets/nfts/Nft1.png',
    'Chemistry': '/assets/nfts/Nft2.png',
    'Mathematics': '/assets/nfts/Nft3.png',
    'Biology': '/assets/nfts/Nft4.png',
    'English': '/assets/nfts/Nft5.png',
    'ICT': '/assets/nfts/Nft6.png'
  };
  return imageMap[subject] || '/assets/nfts/Nft1.png';
};

// Calculate next payment date based on duration
const calculateNextPaymentDate = (duration) => {
  const now = new Date();
  switch (duration) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString();
    case 'yearly':
      return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString();
    default:
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }
};

const Checkout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isStudyPack = location.state && location.state.type === 'studyPack';
  const [classes, setClasses] = useState([]);
  const [cls, setCls] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [promo, setPromo] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  // Load classes from localStorage
  useEffect(() => {
    if (!isStudyPack) {
      const savedClasses = localStorage.getItem('adminClasses');
      if (savedClasses) {
        const allClasses = JSON.parse(savedClasses);
        setClasses(allClasses);
        // Find the specific class by ID
        const foundClass = allClasses.find(c => c.id === parseInt(id, 10));
        setCls(foundClass);
      }
    } else {
      // For study packs, use the static data
      const foundStudyPack = studyPacks[parseInt(id, 10)];
      setCls(foundStudyPack);
    }
  }, [id, isStudyPack]);

  if (!cls) {
    return (
      <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
        <div className="p-6 max-w-2xl mx-auto text-center text-gray-500">
          {isStudyPack ? 'Study Pack not found.' : 'Class not found.'}
        </div>
      </DashboardLayout>
    );
  }

  const handleApplyPromo = () => {
    if (promo === 'DISCOUNT') {
      setAppliedPromo(500);
    } else {
      setAppliedPromo(0);
      alert('Invalid promo code');
    }
  };

  return (
    <DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
      <div className="p-4 max-w-6xl mx-auto">
        <BasicForm initialValues={dummyStudent} validationSchema={getValidationSchema(isStudyPack)} onSubmit={async values => {
          const isSpeedPost = values.tuteType === 'Speed Post';
          const speedPostFee = isSpeedPost ? 300 : 0;
          const basePrice = isStudyPack ? parseInt(cls.price.replace(/\D/g, '')) : cls.price;
          const discount = appliedPromo || 0;
          const total = basePrice - discount + speedPostFee;
          const invoiceId = `INV${Date.now()}`;
          const fullName = `${values.firstName} ${values.lastName}`;
          const orderData = {
            ...values,
            fullName,
            classTitle: cls.title,
            basePrice,
            discount,
            speedPostFee,
            total,
            invoiceId,
            date: new Date().toLocaleDateString(),
          };

          if (paymentMethod === 'bank') {
            if (isStudyPack) {
              // Add to myStudyPacks in localStorage
              const packs = JSON.parse(localStorage.getItem('myStudyPacks') || '[]');
              if (!packs.some(p => p.title === cls.title && p.teacher === cls.teacher)) {
                packs.push(cls);
                localStorage.setItem('myStudyPacks', JSON.stringify(packs));
              }
            } else {
              // Add to myClasses in localStorage
              const myClasses = JSON.parse(localStorage.getItem('myClasses') || '[]');
              const classToAdd = {
                ...cls,
                purchaseDate: new Date().toISOString(),
                paymentStatus: 'pending',
                paymentMethod: 'bank',
                nextPaymentDate: calculateNextPaymentDate(cls.duration),
                attendance: [],
                paymentHistory: [{
                  date: new Date().toISOString(),
                  amount: total,
                  method: 'bank',
                  status: 'pending',
                  invoiceId: invoiceId
                }]
              };
              if (!myClasses.some(c => c.id === cls.id)) {
                myClasses.push(classToAdd);
                localStorage.setItem('myClasses', JSON.stringify(myClasses));
              }
            }
            navigate('/student/bank-transfer', { state: orderData });
          } else {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              if (isStudyPack) {
                // Add to myStudyPacks in localStorage
                const packs = JSON.parse(localStorage.getItem('myStudyPacks') || '[]');
                if (!packs.some(p => p.title === cls.title && p.teacher === cls.teacher)) {
                  packs.push(cls);
                  localStorage.setItem('myStudyPacks', JSON.stringify(packs));
                }
              } else {
                // Add to myClasses in localStorage
                const myClasses = JSON.parse(localStorage.getItem('myClasses') || '[]');
                const classToAdd = {
                  ...cls,
                  purchaseDate: new Date().toISOString(),
                  paymentStatus: 'paid',
                  paymentMethod: 'online',
                  nextPaymentDate: calculateNextPaymentDate(cls.duration),
                  attendance: [],
                  paymentHistory: [{
                    date: new Date().toISOString(),
                    amount: total,
                    method: 'online',
                    status: 'paid',
                    invoiceId: invoiceId
                  }]
                };
                if (!myClasses.some(c => c.id === cls.id)) {
                  myClasses.push(classToAdd);
                  localStorage.setItem('myClasses', JSON.stringify(myClasses));
                }
              }
              navigate('/student/invoice', { state: orderData });
            }, 1200);
          }
        }}>
          {({ errors, touched, handleChange, values }) => {
            const isSpeedPost = values.tuteType === 'Speed Post';
            const speedPostFee = isSpeedPost ? 300 : 0;
            const price = isStudyPack ? parseInt(cls.price.replace(/\D/g, '')) : cls.price;
            const total = price - (appliedPromo || 0) + speedPostFee;
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Card */}
                <div className="md:col-span-2">
                  <div className="bg-white rounded-xl shadow p-6 mb-6 border">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <img src={isStudyPack ? cls.image : getClassImage(cls.subject)} alt={cls.title} className="w-20 h-20 rounded-lg object-cover border" />
                        <div>
                          <div className="font-semibold text-base">{cls.title} <span className="text-xs text-gray-400 font-normal">- {isStudyPack ? 'Study Pack Details' : 'Course Details'}</span></div>
                          <div className="text-xs text-gray-500 mt-1">{cls.teacher}</div>
                          {cls.description && <div className="text-xs text-gray-500 mt-1">{cls.description}</div>}
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 text-cyan-700 font-bold text-lg">
                        LKR {(isStudyPack ? parseInt(cls.price.replace(/\D/g, '')) : cls.price).toLocaleString()}
                      </div>
                    </div>
                    <hr className="mb-6" />
                    <div className="mb-6">
                      <div className="font-semibold mb-2">Choose Your Payment Method</div>
                      <div className="flex gap-4 mb-4">
                        {paymentMethods.map(pm => (
                          <button key={pm.key} onClick={() => setPaymentMethod(pm.key)} className={`flex-1 border rounded-lg p-4 text-center flex flex-col items-center ${paymentMethod===pm.key ? 'border-cyan-600 bg-cyan-50' : 'border-gray-300 bg-white'}`} type="button">
                            {pm.icon}
                            <span className="font-semibold">{pm.label}</span>
                            <span className="text-xs text-gray-500">{pm.sinhala}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border p-4">
                      <div className="font-semibold mb-2">Student Details</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CustomTextField id="firstName" name="firstName" type="text" label="First Name" value={values.firstName} onChange={handleChange} error={errors.firstName} touched={touched.firstName} icon={FaUser} />
                        <CustomTextField id="lastName" name="lastName" type="text" label="Last Name" value={values.lastName} onChange={handleChange} error={errors.lastName} touched={touched.lastName} icon={FaUser} />
                        <CustomTextField id="mobile" name="mobile" type="text" label="Mobile: මුල් දුරකථන අංකය සදන්න eg: 077123456" value={values.mobile} onChange={handleChange} error={errors.mobile} touched={touched.mobile} icon={FaPhone} />
                        <CustomTextField id="email" name="email" type="email" label="Email" value={values.email} onChange={handleChange} error={errors.email} touched={touched.email} icon={FaEnvelope} />
                        <CustomSelectField id="homeCity" name="homeCity" label="Home City" value={values.homeCity} onChange={handleChange} options={cityOptions} error={errors.homeCity} touched={touched.homeCity} />
                        <CustomSelectField id="medium" name="medium" label="Medium" value={values.medium} onChange={handleChange} options={mediumOptions} error={errors.medium} touched={touched.medium} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                        {!isStudyPack && (
                        <CustomSelectField id="tuteType" name="tuteType" label="Tute and Paper Collection Type" value={values.tuteType} onChange={handleChange} options={tuteTypeOptions} error={errors.tuteType} touched={touched.tuteType} />
                        )}
                        {!isStudyPack && values.tuteType === 'Speed Post' && (
                          <CustomTextField id="address" name="address" type="text" label="Delivery Address" value={values.address} onChange={handleChange} error={errors.address} touched={touched.address} icon={FaMapMarkerAlt} />
                        )}
                      </div>
                      {!isStudyPack && (
                        <div className="mt-2 mb-2 text-xs text-red-600 flex items-center gap-2">
                          <span className="font-bold">⚠️ Speed Post</span> tute/paper collection සඳහා අමතරව රු.300ක් (Speed Post) ගාස්තු එකතු වේ.
                        </div>
                      )}
                      <div className="md:col-span-2 grid grid-cols-2 gap-2 mt-2">
                        <CustomButton type="submit" disabled={loading}>
                          {paymentMethod === 'bank' ? 'Proceed to Bank Transfer' : loading ? 'Processing...' : 'Pay Online'}
                        </CustomButton>
                        <CustomButton type="reset" >Reset</CustomButton>
                      </div>
                      {/* Price summary for mobile view */}
                      <div className="block md:hidden mt-6">
                        <div className="bg-white rounded-xl shadow p-4 border">
                          <div className="font-semibold mb-2">Product Price</div>
                          <div className="flex justify-between text-sm mb-1"><span>Price</span><span> LKR {price.toLocaleString()}</span></div>
                          {appliedPromo ? <div className="flex justify-between text-xs text-green-600 mb-1"><span>Promo Applied</span><span>- LKR {appliedPromo.toLocaleString()}</span></div> : null}
                          {isSpeedPost && <div className="flex justify-between text-xs text-red-600 mb-1"><span>Speed Post</span><span>+ LKR 300.00</span></div>}
                          <div className="flex justify-between font-bold text-base border-t pt-2 mt-2"><span>Total</span><span>LKR {total.toLocaleString()}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Right: Promo and Price */}
                <div className="w-full md:w-80">
                  <div className="bg-white rounded-xl shadow p-4 mb-4 border">
                    <div className="font-semibold mb-2">Promo Code</div>
                    <div className="flex gap-2 mb-2">
                      <input value={promo} onChange={e => setPromo(e.target.value)} placeholder="Enter Promo Code" className="border rounded px-3 py-2 text-xs flex-1" />
                      <button onClick={handleApplyPromo} className="bg-pink-100 text-pink-700 px-4 py-2 rounded text-xs font-bold" type="button">Apply</button>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow p-4 border">
                    <div className="font-semibold mb-2">Product Price</div>
                    <div className="flex justify-between text-sm mb-1"><span>Price</span><span> LKR {price.toLocaleString()}</span></div>
                    {appliedPromo ? <div className="flex justify-between text-xs text-green-600 mb-1"><span>Promo Applied</span><span>- LKR {appliedPromo.toLocaleString()}</span></div> : null}
                    {isSpeedPost && <div className="flex justify-between text-xs text-red-600 mb-1"><span>Speed Post</span><span>+ LKR 300.00</span></div>}
                    <div className="flex justify-between font-bold text-base border-t pt-2 mt-2"><span>Total</span><span>LKR {total.toLocaleString()}</span></div>
                  </div>
                </div>
              </div>
            );
          }}
        </BasicForm>
      </div>
    </DashboardLayout>
  );
};

export default Checkout; 