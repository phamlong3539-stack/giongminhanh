/**
 * Locket Gold & Filter Unlock Script (Optimized & Fixed)
 * Tự động mở khóa Locket Gold, Filter, Badge, Unblur ảnh không cần server bên thứ ba
 */

(function () {
    const isRequest = typeof $response === "undefined";
    const reqUrl = typeof $request !== "undefined" && $request.url ? $request.url : "";
    const reqHeaders = typeof $request !== "undefined" && $request.headers ? $request.headers : {};

    // 1. XỬ LÝ HTTP-REQUEST
    if (isRequest) {
        // Mock phản hồi đổi thông tin profile / badge Gold
        if (reqUrl.includes("changeProfileInfo")) {
            return $done({
                response: {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                        "Access-Control-Allow-Origin": "*"
                    },
                    body: JSON.stringify({
                        data: { badge: "locket_gold", badge_tier: "gold", is_gold: true, success: true },
                        result: { badge: "locket_gold", badge_tier: "gold", is_gold: true, success: true }
                    })
                }
            });
        }

        // Xóa các header cache để RevenueCat và Locket luôn trả về body mới nhất
        let modifiedHeaders = Object.assign({}, reqHeaders);
        for (let k in modifiedHeaders) {
            let lower = k.toLowerCase();
            if (lower === "if-none-match" || lower === "if-modified-since" || lower === "x-revenuecat-etag") {
                delete modifiedHeaders[k];
            }
        }
        return $done({ headers: modifiedHeaders });
    }

    // 2. XỬ LÝ HTTP-RESPONSE
    try {
        let status = $response.status || $response.statusCode || 200;
        let body = $response.body;
        if (!body) return $done({});

        let obj;
        try {
            obj = JSON.parse(body);
        } catch (e) {
            return $done({});
        }

        // Helper: Gán badge Gold và thuộc tính VIP cho bất kỳ object người dùng nào
        function applyGoldBadge(userObj) {
            if (!userObj || typeof userObj !== "object") return;
            userObj.badge = "locket_gold";
            userObj.badge_tier = "gold";
            userObj.tier = "gold";
            userObj.is_gold = true;
            userObj.has_gold = true;
            userObj.gold = true;
            userObj.show_badge = true;
            userObj.gold_subscribed = true;
            userObj.has_gold_subscription = true;
            userObj.subscription_status = "active";
            userObj.is_locked = false;
            userObj.locked = false;
            userObj.requires_gold = false;
            userObj.show_paywall = false;
            userObj.needs_gold = false;
            userObj.upsell = false;
        }

        // Duyệt đệ quy toàn bộ cấu trúc JSON trả về để mở khóa toàn bộ tính năng
        function transformNode(node) {
            if (!node || typeof node !== "object") return;

            if (Array.isArray(node)) {
                for (let i = 0; i < node.length; i++) {
                    transformNode(node[i]);
                }
                return;
            }

            // Gán Gold cho tất cả các đối tượng user, friend, profile
            applyGoldBadge(node);
            if (node.user && typeof node.user === "object") applyGoldBadge(node.user);
            if (node.friend && typeof node.friend === "object") applyGoldBadge(node.friend);
            if (node.profile && typeof node.profile === "object") applyGoldBadge(node.profile);

            // Xóa các cờ khóa tính năng
            const lockKeys = [
                "is_locked", "locked", "requires_gold", "show_paywall",
                "needs_gold", "upsell", "gold_only", "is_blocked"
            ];
            for (let k of lockKeys) {
                if (k in node) node[k] = false;
            }

            // Bật các cờ tính năng mở khóa
            const unlockKeys = [
                "can_view", "is_unlocked", "unlocked", "can_get",
                "can_create", "allowed", "has_access", "can_preview"
            ];
            for (let k of unlockKeys) {
                if (k in node) node[k] = true;
            }

            // Unblur ảnh: Nếu có URL ảnh rõ nét thì thay thế vào vị trí ảnh bị mờ
            const clearUrl = node.transformed_image_url || node.filtered_image_url ||
                             node.preview_url || node.original_url || node.image_url;
            if (clearUrl && typeof clearUrl === "string" && clearUrl.startsWith("http")) {
                if ("blurred_image_url" in node) node.blurred_image_url = clearUrl;
                if ("blurred_preview_url" in node) node.blurred_preview_url = clearUrl;
                if ("blurred_thumbnail_url" in node) node.blurred_thumbnail_url = clearUrl;
            }

            // Đệ quy các key con
            for (let key of Object.keys(node)) {
                if (key !== "user" && key !== "friend" && key !== "profile" && typeof node[key] === "object") {
                    transformNode(node[key]);
                }
            }
        }

        transformNode(obj);

        let respHeaders = Object.assign({}, $response.headers || {});
        delete respHeaders["Content-Encoding"];
        delete respHeaders["content-encoding"];
        delete respHeaders["Content-Length"];
        delete respHeaders["content-length"];
        respHeaders["content-type"] = "application/json; charset=utf-8";

        return $done({
            status: status,
            headers: respHeaders,
            body: JSON.stringify(obj)
        });
    } catch (err) {
        return $done({});
    }
})();

