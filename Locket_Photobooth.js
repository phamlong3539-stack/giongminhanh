/**
 * Locket Photobooth & Frame Processor (Fixed & Standalone)
 * Xử lý ảnh Photobooth, Khung ảnh, Filter mà không phụ thuộc máy chủ bên thứ ba đã sập
 */

(function () {
    const isRequest = typeof $response === "undefined";
    const reqUrl = typeof $request !== "undefined" && $request.url ? $request.url : "";

    // 1. XỬ LÝ HTTP-REQUEST
    if (isRequest) {
        // Cho phép request gửi trực tiếp tới máy chủ chính thức của Locket
        // Không redirect sang server onrender.com đã chết
        return $done({});
    }

    // 2. XỬ LÝ HTTP-RESPONSE
    try {
        let body = $response.body;
        let status = $response.status || $response.statusCode || 200;

        let obj = {};
        if (body) {
            try {
                obj = JSON.parse(body);
            } catch (e) {
                obj = {};
            }
        }

        // Xóa tất cả các thông báo lỗi nếu server trả về do thiếu gói Gold
        delete obj.error;
        delete obj.errors;
        if (obj.result && typeof obj.result === "object") {
            delete obj.result.error;
            delete obj.result.errors;
            obj.result.status = 200;
            obj.result.is_gold = true;
            obj.result.unlocked = true;
        }

        if (obj.data && typeof obj.data === "object") {
            delete obj.data.error;
            delete obj.data.errors;
            obj.data.status = 200;
            obj.data.is_gold = true;
            obj.data.unlocked = true;
        }

        obj.status = 200;
        obj.success = true;

        let respHeaders = Object.assign({}, $response.headers || {});
        delete respHeaders["Content-Encoding"];
        delete respHeaders["content-encoding"];
        delete respHeaders["Content-Length"];
        delete respHeaders["content-length"];
        respHeaders["content-type"] = "application/json; charset=utf-8";
        respHeaders["Access-Control-Allow-Origin"] = "*";

        return $done({
            status: 200,
            headers: respHeaders,
            body: JSON.stringify(obj)
        });
    } catch (err) {
        return $done({});
    }
})();

