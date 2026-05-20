// master_data.js — Master Data Management Logic

document.addEventListener('DOMContentLoaded', () => {
    // === Auth Guard: Admin only ===
    if (!requireAuth()) return;
    const user = getUser();
    if (user.role !== 'admin') {
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
        window.location.href = 'index.html';
        return;
    }
    renderUserBar('userBar');

    // === Shared Upload Helper ===
    async function handleUpload(formId, inputId, endpoint, buttonId, statusId, fileName) {
        const form = document.getElementById(formId);
        const status = document.getElementById(statusId);
        const btn = document.getElementById(buttonId);
        const fileInput = document.getElementById(inputId);

        if (!form || !fileInput) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!fileInput.files || fileInput.files.length === 0) return;

            const file = fileInput.files[0];
            const formData = new FormData();
            formData.append('file', file, fileName);

            btn.disabled = true;
            const originalText = btn.textContent;
            btn.textContent = '⏳ Uploading...';
            status.textContent = '';

            try {
                const response = await fetch(`/api/${endpoint}`, { method: 'POST', body: formData });
                const result = await response.json();
                if (response.ok && result.success) {
                    status.textContent = '✅ อัปโหลดสำเร็จ';
                    status.style.color = 'green';
                    form.reset();
                } else { throw new Error(result.message || 'Upload failed'); }
            } catch (err) {
                status.textContent = '❌ ' + err.message;
                status.style.color = 'red';
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });
    }

    // === Initialize Uploaders ===
    handleUpload('uploadListForm', 'listFileInput', 'upload-list-data', 'btnUploadList', 'listUploadStatus', 'List.csv');
    handleUpload('uploadItemMasterForm', 'itemMasterFileInput', 'upload-item-master', 'btnUploadItemMaster', 'itemMasterUploadStatus', 'ItemMaster.csv');
    handleUpload('uploadGLForm', 'glFileInput', 'upload-gl-data', 'btnUploadGL', 'glUploadStatus', 'GL.csv');
    handleUpload('uploadSizeForm', 'sizeFileInput', 'upload-size-data', 'btnUploadSize', 'sizeUploadStatus', 'Size.csv');
});
