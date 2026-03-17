(function() {
    "use strict";

    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];

    const showError = (fieldId, message) => {
        const container = document.querySelector(`[field-id="${fieldId}"]`);
        if (!container) return;
        removeError(fieldId);
        const input = container.querySelector('input, select, textarea');
        if (input) input.classList.add('error-input');
        const errorWrap = document.createElement('div');
        errorWrap.className = 'custom-error-container';
        const triangle = document.createElement('div');
        triangle.className = 'error-triangle';
        const errorSpan = document.createElement('span');
        errorSpan.className = 'error-message';
        errorSpan.innerText = message;
        errorWrap.appendChild(triangle);
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
        const checkFormat = (id, regex, msg) => {
            const val = record[id]?.value || "";
            if (!val.match(regex)) { showError(id, msg); hasError = true; }
        };
        checkFormat("連絡先電話番号", /^\d{10,11}$/, "数字のみ10〜11桁で入力してください");
        checkFormat("モバイルルーターの電話番号", /^\d{10,11}$/, "数字のみ10〜11桁で入力してください");
        if (isDiff) checkFormat("返送先対象者の電話番号", /^\d{10,11}$/, "数字のみ10〜11桁で入力してください");
        const mailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        checkFormat("連絡先メールアドレス", mailRegex, "メールアドレス形式で入力してください");
        if (isDiff) checkFormat("返送先対象者のメールアドレス", mailRegex, "メールアドレス形式で入力してください");
        checkFormat("郵便番号", /^\d{7}$/, "数字7桁で入力してください");
        if (isDiff) {
            targetFieldIds.forEach(id => {
                if (!(record[id]?.value || "").trim()) { showError(id, "必須項目です"); hasError = true; }
            });
        }
        return !hasError;
    };

    const updateVisibility = (record) => {
        const isDifferent = record["返送先対象者確認"]?.value === "返送先が異なる";
        document.body.classList.toggle("show-target-fields", isDifferent);
        if (!isDifferent) targetFieldIds.forEach(id => { if (record[id]) record[id].value = ""; });
    };

    const timer = setInterval(() => {
        if (typeof kb !== 'undefined' && kb.event) {
            clearInterval(timer);
            kb.event.on('kb.view.show', (ev) => { updateVisibility(ev.record); return ev; });
            kb.event.on('kb.change.返送先対象者確認', (ev) => { updateVisibility(ev.record); return ev; });
            kb.event.on('kb.create.submit', (ev) => { if (!validateAll(ev.record)) ev.error = true; return ev; });
        }
    }, 100);
})();
