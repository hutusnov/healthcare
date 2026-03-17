import { useState, useRef, useEffect } from 'react';
import { ocrAPI } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Alert, Loading } from '../components/common';
import {
    FileText,
    Upload,
    Image,
    X,
    CheckCircle,
    Copy,
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

    useEffect(() => () => {
        if (preview) URL.revokeObjectURL(preview);
    }, [preview]);

    const handleFile = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Vui long chon file hinh anh');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('File qua lon. Vui long chon file nho hon 10MB');
            return;
        }

        if (preview) URL.revokeObjectURL(preview);
        setSelectedFile(file);
        setPreview(URL.createObjectURL(file));
        setError('');
        setResult(null);
    };

    const handleFileSelect = (event) => handleFile(event.target.files?.[0]);
    const handleDrop = (event) => {
        event.preventDefault();
        handleFile(event.dataTransfer.files?.[0]);
    };

    const handleScan = async () => {
        if (!selectedFile) {
            setError('Vui long chon anh CCCD');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await ocrAPI.scanDocument(selectedFile);
            setResult(response.data);
        } catch (err) {
            console.error('Loi OCR:', err);
            setError(err.response?.data?.detail || err.response?.data?.message || 'Khong the xu ly anh. Vui long thu lai.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!result) return;
        await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                    Quet CCCD
                </h1>
                <p className="text-gray-400 mt-1">Trich xuat thong tin tu anh CCCD bang OCR service</p>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="w-5 h-5 text-primary-400" />
                            Tai anh len
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
                                onDragOver={(event) => event.preventDefault()}
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-dark-100 hover:border-primary-500 rounded-xl p-8 text-center cursor-pointer transition-colors"
                            >
                                <div className="w-16 h-16 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Image className="w-8 h-8 text-primary-400" />
                                </div>
                                <h3 className="text-white font-medium mb-2">Keo tha anh vao day</h3>
                                <p className="text-gray-400 text-sm mb-4">hoac click de chon file</p>
                                <p className="text-gray-500 text-xs">Ho tro JPG, PNG, WEBP (toi da 10MB)</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative">
                                    <img src={preview} alt="Preview" className="w-full h-64 object-contain bg-dark-300 rounded-lg" />
                                    <button
                                        onClick={clearFile}
                                        className="absolute top-2 right-2 p-2 bg-dark-400/80 hover:bg-red-600 rounded-full transition-colors"
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                                <p className="text-gray-400 text-sm text-center">{selectedFile?.name}</p>
                                <Button onClick={handleScan} loading={loading} fullWidth size="lg">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    {loading ? 'Dang xu ly...' : 'Quet CCCD'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-secondary-400" />
                            Ket qua
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-12">
                                <Loading text="Dang phan tich anh..." />
                            </div>
                        ) : result ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-green-400">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-medium">Quet thanh cong</span>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-400 text-sm">Thong tin trich xuat</span>
                                        <button onClick={handleCopy} className="flex items-center gap-1 text-primary-400 hover:text-primary-300 text-sm">
                                            <Copy className="w-4 h-4" />
                                            {copied ? 'Da sao chep' : 'Sao chep JSON'}
                                        </button>
                                    </div>
                                    <div className="bg-dark-300 rounded-lg p-4 max-h-80 overflow-y-auto">
                                        <pre className="text-white text-sm whitespace-pre-wrap font-mono">
                                            {JSON.stringify(result, null, 2)}
                                        </pre>
                                    </div>
                                </div>

                                <Button variant="outline" fullWidth onClick={clearFile}>
                                    Quet anh khac
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-white font-medium mb-2">Chua co ket qua</h3>
                                <p className="text-gray-400 text-sm">Tai anh CCCD len va nhan Quet CCCD de trich xuat thong tin</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
