import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import studentSidebarSections from '../StudentDashboardSidebar';

const PAYMENT_API = process.env.REACT_APP_PAYMENT_API_BASE_URL || 'http://localhost:8090';
const TEACHER_API = process.env.REACT_APP_TEACHER_API_BASE_URL || 'http://localhost:8088';

const StudentStudyPackCancel = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [orderId, setOrderId] = useState('');
	const [paymentInfo, setPaymentInfo] = useState(null);
	const [pack, setPack] = useState(null);

	useEffect(() => {
		const run = async () => {
			try {
				const qs = new URLSearchParams(location.search);
				const oid = qs.get('order_id') || qs.get('transactionId') || qs.get('orderId') || '';
				const packIdFromQuery = qs.get('studyPackId') || qs.get('pack_id') || qs.get('packId');
				setOrderId(oid);

				// Try to fetch payment status for additional context
				let foundPackId = packIdFromQuery || null;
				if (oid) {
					try {
						const resp = await axios.get(`${PAYMENT_API}/routes.php/get_payment_status`, { params: { order_id: oid } });
						if (resp.data?.data) {
							setPaymentInfo(resp.data.data);
							const maybeId = resp.data.data.study_pack_id || resp.data.data.class_id;
							if (!foundPackId && resp.data.data?.category === 'study_pack' && maybeId) {
								foundPackId = maybeId;
							}
						}
					} catch (_) {
						// ignore
					}
				}

				// Fetch pack details if we know the id
				if (foundPackId) {
					try {
						const packRes = await axios.get(`${TEACHER_API}/routes.php/study_pack`, { params: { id: foundPackId } });
						if (packRes.data?.success) setPack(packRes.data.data);
					} catch (_) {}
				}
			} catch (e) {
				setError('Could not retrieve payment information.');
			} finally {
				setLoading(false);
			}
		};
		run();
	}, [location.search]);

	const retryPurchase = () => {
		const qs = new URLSearchParams(location.search);
		const packId = qs.get('studyPackId') || qs.get('pack_id') || qs.get('packId') || paymentInfo?.study_pack_id || paymentInfo?.class_id;
		if (packId) {
			navigate(`/student/checkout/${packId}`, { state: { type: 'studyPack' } });
		} else {
			navigate('/student/purchasestudypack');
		}
	};

	return (
		<DashboardLayout userRole="Student" sidebarItems={studentSidebarSections}>
			<div className="p-6 max-w-3xl mx-auto">
				<div className="bg-white rounded-xl shadow p-8 text-center border">
					<h1 className="text-2xl font-semibold text-red-600 mb-2">Payment Cancelled</h1>
					<p className="text-gray-600 mb-6">Your study pack payment was not completed.</p>

					{loading ? (
						<div className="text-gray-500">Checking payment status...</div>
					) : (
						<>
							{orderId && (
								<div className="mb-3 text-sm text-gray-600">
									<span className="font-medium">Order / Transaction ID:</span> {orderId}
								</div>
							)}
							{paymentInfo?.status && (
								<div className="mb-4 text-sm text-gray-600">
									<span className="font-medium">Status:</span> {paymentInfo.status}
									{paymentInfo.message ? ` — ${paymentInfo.message}` : ''}
								</div>
							)}
							{pack && (
								<div className="flex items-center gap-4 justify-center my-4">
									<img
										src={pack.image || '/assets/nfts/Nft3.png'}
										alt={pack.title || 'Study Pack'}
										className="w-20 h-20 rounded object-cover border"
									/>
									<div className="text-left">
										<div className="font-semibold">{pack.title || 'Study Pack'}</div>
										<div className="text-sm text-gray-500">LKR {Number(pack.price || 0).toLocaleString()}</div>
									</div>
								</div>
							)}
							{error && <div className="text-sm text-red-600 mb-4">{error}</div>}

							<div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
								<button onClick={retryPurchase} className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Try Again</button>
								<button onClick={() => navigate('/student/studypacks')} className="px-5 py-2 bg-gray-800 text-white rounded hover:bg-black">My Study Packs</button>
								<button onClick={() => navigate('/student/purchasestudypack')} className="px-5 py-2 bg-white border rounded hover:bg-gray-50">Browse Study Packs</button>
								<button onClick={() => navigate('/studentdashboard')} className="px-5 py-2 bg-white border rounded hover:bg-gray-50">Back to Dashboard</button>
							</div>
						</>
					)}
				</div>
			</div>
		</DashboardLayout>
	);
};

export default StudentStudyPackCancel;
