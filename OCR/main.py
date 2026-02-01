# main.py
import os
import tempfile

from fastapi import FastAPI, UploadFile, File, Header, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from ocr_services import run_ocr   # import hàm bạn đã viết

# ========== SECURITY: Configuration ==========
OCR_API_KEY = os.environ.get('OCR_API_KEY', 'development_key')
OCR_AUTH_ENABLED = os.environ.get('OCR_AUTH_ENABLED', 'false').lower() == 'true'
MAX_FILE_SIZE_MB = int(os.environ.get('OCR_MAX_FILE_SIZE_MB', 10))
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}

app = FastAPI(
    title="CCCD OCR API",
    description="API nhận ảnh CCCD và trả về các trường thông tin",
    version="1.1"
)

# ========== SECURITY: CORS Configuration ==========
origins = [
    "http://localhost:5173",
    "http://localhost:4000",
    "https://uithealthcare.id.vn",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def verify_api_key(x_api_key: str = None):
    """Verify API key if authentication is enabled"""
    if OCR_AUTH_ENABLED:
        if x_api_key != OCR_API_KEY:
            raise HTTPException(status_code=401, detail="Invalid or missing API Key")


def validate_file(file: UploadFile):
    """Validate uploaded file - check extension and size"""
    # Check file extension
    ext = os.path.splitext(file.filename or '')[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    return ext


@app.get("/health")
def health_check():
    return {"status": "ok", "auth_enabled": OCR_AUTH_ENABLED}


@app.post("/ocr-cccd")
async def ocr_cccd(
    file: UploadFile = File(...),
    x_api_key: str = Header(None, alias="X-API-Key")
):
    """
    Nhận 1 file ảnh (multipart/form-data, field name = 'file')
    → chạy pipeline run_ocr → trả về JSON thông tin CCCD.
    
    Security:
    - Optional API key authentication (set OCR_AUTH_ENABLED=true)
    - File type validation (jpg, png, bmp, webp only)
    - File size limit (default 10MB)
    """
    try:
        # SECURITY: Verify API key if enabled
        verify_api_key(x_api_key)
        
        # SECURITY: Validate file type
        suffix = validate_file(file)
        
        # 1. Đọc bytes từ file upload
        content = await file.read()
        
        # SECURITY: Check file size
        file_size_mb = len(content) / (1024 * 1024)
        if file_size_mb > MAX_FILE_SIZE_MB:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE_MB}MB"
            )

        # 2. Lưu tạm ra file để tái sử dụng hàm run_ocr(img_path)
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        # 3. Gọi pipeline OCR hiện tại
        info, items = run_ocr(tmp_path)

        # 4. Xoá file tạm
        try:
            os.remove(tmp_path)
        except OSError:
            pass

        # 5. Trả kết quả dạng JSON
        return JSONResponse(
            content={
                "success": True,
                "filename": file.filename,
                "data": info,  # {'fullName', 'gender', 'dateOfBirth', 'address', ...}
                "items": items  # Danh sách các đoạn text nhận dạng được
            }
        )

    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        # SECURITY: Don't expose internal error details in production
        is_production = os.environ.get('OCR_ENV', 'development') == 'production'
        error_msg = "Internal server error" if is_production else str(e)
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": error_msg}
        )
