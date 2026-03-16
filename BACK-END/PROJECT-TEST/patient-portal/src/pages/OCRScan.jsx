import { useState, useRef, useEffect } from 'react';
import { ocrAPI } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Alert, Loading } from '../components/common';
import {
    FileText,
    Upload,
    Camera,
    Image,
    X,
    CheckCircle,
    Copy,
    Download,
    Sparkles
} from 'lucide-react';

export const OCRScan = () => {
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const [copied, setCopied] = useState(false);

    // SECURITY: Cleanup Object URLs to prevent memory leaks
    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Vui lòng chọn file hình ảnh');
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                setError('File quá lớn. Vui lòng chọn file nhỏ hơn 10MB');
                return;
            }

            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
            setError('');
            setResult(null);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Vui lòng chọn file hình ảnh');
                return;
            }
            setSelectedFile(file);
            if (preview) URL.revokeObjectURL(preview);
            setPreview(URL.createObjectURL(file));
            setError('');
            setResult(null);
        }
    };

    const handleScan = async () => {
        if (!selectedFile) {
            setError('Vui lòng chọn ảnh đơn thuốc');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await ocrAPI.scanPrescription(selectedFile);
            setResult(response.data?.data || response.data);
        } catch (err) {
            console.error('Lỗi OCR:', err);
            setError(err.response?.data?.message || 'Không thể xử lý ảnh. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (result?.text) {
            navigator.clipboard.writeText(result.text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const clearFile = () => {
        if (preview) URL.revokeObjectURL(preview);
        setSelectedFile(null);
        setPreview(null);
        setResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-primary-400" />
                    Quét đơn thuốc
                </h1>
                <p className="text-gray-400 mt-1">
                    Sử dụng AI để trích xuất thông tin từ đơn thuốc
                </p>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Upload Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="w-5 h-5 text-primary-400" />
                            Tải ảnh lên
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {!preview ? (
                            <div
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-dark-100 hover:border-primary-500 rounded-xl p-8 text-center cursor-pointer transition-colors"
                            >
                                <div className="w-16 h-16 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Image className="w-8 h-8 text-primary-400" />
                                </div>
                                <h3 className="text-white font-medium mb-2">Kéo thả ảnh vào đây</h3>
                                <p className="text-gray-400 text-sm mb-4">hoặc click để chọn file</p>
                                <p className="text-gray-500 text-xs">Hỗ trợ: JPG, PNG, WEBP (tối đa 10MB)</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative">
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="w-full h-64 object-contain bg-dark-300 rounded-lg"
                                    />
                                    <button
                                        onClick={clearFile}
                                        className="absolute top-2 right-2 p-2 bg-dark-400/80 hover:bg-red-600 rounded-full transition-colors"
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                                <p className="text-gray-400 text-sm text-center">{selectedFile?.name}</p>
                                <Button
                                    onClick={handleScan}
                                    loading={loading}
                                    fullWidth
                                    size="lg"
                                    className="group"
                                >
                                    <Sparkles className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                                    {loading ? 'Đang xử lý...' : 'Quét đơn thuốc'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Result Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-secondary-400" />
                            Kết quả
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-12">
                                <Loading text="Đang phân tích ảnh..." />
                                <p className="text-gray-500 text-sm mt-4">
                                    AI đang trích xuất thông tin từ đơn thuốc...
                                </p>
                            </div>
                        ) : result ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-green-400">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-medium">Quét thành công!</span>
                                </div>

                                {/* Extracted Text */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-400 text-sm">Nội dung trích xuất:</span>
                                        <button
                                            onClick={handleCopy}
                                            className="flex items-center gap-1 text-primary-400 hover:text-primary-300 text-sm"
                                        >
                                            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            {copied ? 'Đã sao chép' : 'Sao chép'}
                                        </button>
                                    </div>
                                    <div className="bg-dark-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                                        <pre className="text-white text-sm whitespace-pre-wrap font-mono">
                                            {result.text || JSON.stringify(result, null, 2)}
                                        </pre>
                                    </div>
                                </div>

                                {/* Medications (if parsed) */}
                                {result.medications && result.medications.length > 0 && (
                                    <div>
                                        <span className="text-gray-400 text-sm block mb-2">Thuốc được kê:</span>
                                        <div className="space-y-2">
                                            {result.medications.map((med, index) => (
                                                <div key={index} className="flex items-center gap-3 p-3 bg-dark-300 rounded-lg">
                                                    <div className="w-8 h-8 bg-secondary-600/20 rounded-full flex items-center justify-center">
                                                        <span className="text-secondary-400 font-medium text-sm">{index + 1}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium">{med.name}</p>
                                                        <p className="text-gray-400 text-sm">{med.dosage || med.instructions}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <Button variant="outline" fullWidth onClick={clearFile}>
                                    Quét ảnh khác
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-white font-medium mb-2">Chưa có kết quả</h3>
                                <p className="text-gray-400 text-sm">
                                    Tải ảnh đơn thuốc lên và nhấn "Quét đơn thuốc" để trích xuất thông tin
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Tips */}
            <Card className="bg-gradient-to-r from-primary-600/10 to-secondary-600/10 border-primary-500/30">
                <CardContent>
                    <h3 className="text-white font-medium mb-3">💡 Mẹo để có kết quả tốt nhất:</h3>
                    <ul className="text-gray-400 text-sm space-y-2">
                        <li>• Chụp ảnh trong điều kiện ánh sáng tốt</li>
                        <li>• Đảm bảo đơn thuốc nằm phẳng và rõ nét</li>
                        <li>• Tránh chụp bị mờ, lệch hoặc có bóng</li>
                        <li>• Nên chụp toàn bộ đơn thuốc trong một ảnh</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
};
