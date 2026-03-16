import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, Button } from '../components/common';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';

export const PaymentReturn = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        const resultCode = searchParams.get('resultCode');
        const message = searchParams.get('message');

        // MoMo result codes: 0 = success, other = failed
        if (resultCode === '0') {
            setStatus('success');
        } else {
            setStatus('failed');
        }
    }, [searchParams]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="max-w-md w-full text-center">
                {status === 'success' ? (
                    <>
                        <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Thanh toán thành công!</h1>
                        <p className="text-gray-400 mb-6">
                            Cảm ơn bạn đã thanh toán. Lịch hẹn của bạn đã được xác nhận.
                        </p>
                        <Link to="/dashboard/appointments">
                            <Button fullWidth size="lg">
                                Xem lịch hẹn
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </>
                ) : (
                    <>
                        <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-10 h-10 text-red-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Thanh toán thất bại</h1>
                        <p className="text-gray-400 mb-6">
                            Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.
                        </p>
                        <div className="space-y-3">
                            <Link to="/dashboard/appointments">
                                <Button fullWidth size="lg">
                                    Quay lại lịch hẹn
                                </Button>
                            </Link>
                            <Link to="/" className="block text-gray-400 hover:text-white">
                                Về trang chủ
                            </Link>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
};
