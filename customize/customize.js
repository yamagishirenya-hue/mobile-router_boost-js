(function() {
    "use strict";

    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];
    const iconBase64 = "iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QkVGNzA3QTE1RTc4MTFFOEI5MDA5RUE2NDFCQTUzNDciIHhtcE1NOklud3RhbmNlSUQ9InhtcC5paWQ6QkVGNzA3QTE1RTc4MTFFOEI5MDA5RUE2NDFCQTUzNDciIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QkVGNzA3QTI1RTc4MTFFOEI5MDA5RUE2NDFCQTUzNDciPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpCRUY3MDc5RjVFNzgxMUU4QjkwMDlFQTY0MUJBNTM0NyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpCRUY3MDdBMDVFNzgxMUU4QjkwMDlFQTY0MUJBNTM0NyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PkBlNTAAAADNSURBVHja7NHBCcJAFATQZNBcYwmSmycPlpI2bCVgAVqAVmAFHmxqncAKQVyz+/N/grADc0iyy0Be6ZwrlgiKhZKH83Ae/v/h1X23l9499vfZk2hYOHpgO7ZkH+xzjl9dsze2Ytfsld3MMXxhm8Hzlj1bD/eu7Zf3rf9mMvx2DaXzZ1SHh66hVP5MrTn86RpK48+qDIdcQ4nyxkRXsTcmuoq9oeAq8oaSa7I3FF2TvKHomuQNZddobxi4RnnDyHXUG0auo94wdP3p/RJgAMw4In5GE/6/AAAAAElFTkSuQmCC";

    const showError = (fieldId, message) => {
        const container = document.querySelector(`[field-id="${fieldId}"]`);
        if (!container) return;
        removeError(fieldId);

        const input = container.querySelector('input, select, textarea');
        if (input) input.classList.add('error-input');

        // エラーエリアのラッパー
        const errorWrap = document.createElement('div');
        errorWrap.className = 'custom-error-container';

        // 三角形アイコン
        const icon = document.createElement('img');
        icon.src = "data:image/png;base64," + iconBase64;
        icon.className = 'error-icon-tri';

        // エラーラベル (span)
        const errorSpan = document.createElement('span');
        errorSpan.className = 'error-message';
        errorSpan.innerText = message;

        errorWrap.appendChild(icon);
        errorWrap.appendChild(errorSpan);
        container.appendChild(errorWrap);
    };

    const removeError = (fieldId) => {
        const container = document.querySelector(`[field-id="${fieldId}"]`);
        if (!container) return;
        const input = container.querySelector('input, select, textarea');
        if (input) input.classList.remove('error-input');
        const existing = container.querySelector('.custom-error-container');
        if (existing) existing.remove();
    };

    const validateAll = (record) => {
        let hasError = false;
        const isDiff = record["返送先対象者確認"]?.value === "返送先が異なる";
        document.querySelectorAll('[field-id]').forEach(el => removeError(el.getAttribute('field-id')));

        const telCheck = (id, label) => {
            if (!(record[id]?.value || "").match(/^\d{10,11}$/)) {
                showError(id, "数字のみ10〜11桁で入力してください");
                hasError = true;
            }
        };

        telCheck("連絡先電話番号");
        telCheck("モバイルルーターの電話番号");
        if (isDiff) telCheck("返送先対象者の電話番号");

        const mailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        if (!(record["連絡先メールアドレス"]?.value || "").match(mailRegex)) {
            showError("連絡先メールアドレス", "正しいメールアドレスの形式で入力してください");
            hasError = true;
        }
        if (isDiff && !(record["返送先対象者のメールアドレス"]?.value || "").match(mailRegex)) {
            showError("返送先対象者のメールアドレス", "正しいメールアドレスの形式で入力してください");
            hasError = true;
        }

        if (!(record["郵便番号"]?.value || "").match(/^\d{7}$/)) {
            showError("郵便番号", "数字7桁で入力してください");
            hasError = true;
        }

        if (isDiff) {
            targetFieldIds.forEach(id => {
                if (!(record[id]?.value || "").trim()) {
                    showError(id, "必須項目です");
                    hasError = true;
                }
            });
        }
        return !hasError;
    };

    const timer = setInterval(() => {
        if (typeof kb !== 'undefined' && kb.event) {
            clearInterval(timer);
            kb.event.on('kb.view.show', (ev) => { document.body.classList.toggle("show-target-fields", ev.record["返送先対象者確認"]?.value === "返送先が異なる"); return ev; });
            kb.event.on('kb.change.返送先対象者確認', (ev) => { 
                const isDiff = ev.record["返送先対象者確認"]?.value === "返送先が異なる";
                document.body.classList.toggle("show-target-fields", isDiff);
                if(!isDiff) targetFieldIds.forEach(id => { if(ev.record[id]) ev.record[id].value = ""; });
                return ev; 
            });
            kb.event.on('kb.create.submit', (ev) => { if (!validateAll(ev.record)) ev.error = true; return ev; });
        }
    }, 100);
})();
