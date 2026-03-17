(function() {
    "use strict";

    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];

    // 1. 入力制御（リアルタイムで桁数と文字種を制限）
    const handleInputControl = (e) => {
        const fieldId = e.target.closest('[field-id]')?.getAttribute('field-id');
        if (!fieldId) return;

        let val = e.target.value;

        // 電話番号関連：数字のみ最大11桁
        if (fieldId.includes("電話番号")) {
            val = val.replace(/[^\d]/g, ""); // 数字以外削除
            if (val.length > 11) val = val.slice(0, 11);
            e.target.value = val;
        }

        // 郵便番号：自動ハイフン挿入 (123-4567)
        if (fieldId === "郵便番号") {
            val = val.replace(/[^\d]/g, ""); // 一旦数字のみに
            if (val.length > 3) {
                val = val.slice(0, 3) + "-" + val.slice(3, 7);
            }
            e.target.value = val;
        }
    };

    // エラー表示・消去関数
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

    // 送信前バリデーション
    const validateAll = (record) => {
        let hasError = false;
        const isDiff = record["返送先対象者確認"]?.value === "返送先が異なる";
        document.querySelectorAll('[field-id]').forEach(el => removeError(el.getAttribute('field-id')));

        // 電話番号：10桁または11桁
        const telIds = ["連絡先電話番号", "モバイルルーターの電話番号"];
        if (isDiff) telIds.push("返送先対象者の電話番号");
        telIds.forEach(id => {
            const val = (record[id]?.value || "").replace(/[^\d]/g, "");
            if (val.length < 10 || val.length > 11) {
                showError(id, "数字10桁または11桁で入力してください");
                hasError = true;
            }
        });

        // メール
        const mailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        if (!(record["連絡先メールアドレス"]?.value || "").match(mailRegex)) {
            showError("連絡先メールアドレス", "正しいメールアドレス形式で入力してください");
            hasError = true;
        }
        if (isDiff && !(record["返送先対象者のメールアドレス"]?.value || "").match(mailRegex)) {
            showError("返送先対象者のメールアドレス", "正しいメールアドレス形式で入力してください");
            hasError = true;
        }

        // 郵便番号：XXX-XXXX 形式
        if (!(record["郵便番号"]?.value || "").match(/^\d{3}-\d{4}$/)) {
            showError("郵便番号", "郵便番号を正しく入力してください (例: 123-4567)");
            hasError = true;
        }

        if (isDiff) {
            targetFieldIds.forEach(id => {
                if (!(record[id]?.value || "").trim()) { showError(id, "必須項目です"); hasError = true; }
            });
        }

        if (hasError) kb.alert("入力内容に誤りがあります。");
        return !hasError;
    };

    const updateVisibility = (record) => {
        const isDifferent = record["返送先対象者確認"]?.value === "返送先が異なる";
        document.body.classList.toggle("show-target-fields", isDifferent);
        if (!isDifferent) targetFieldIds.forEach(id => { if (record[id]) record[id].value = ""; });
    };

    // イベント登録
    const timer = setInterval(() => {
        if (typeof kb !== 'undefined' && kb.event) {
            clearInterval(timer);
            
            // リアルタイム入力監視を登録
            document.addEventListener('input', handleInputControl);

            kb.event.on('kb.view.show', (ev) => { 
                updateVisibility(ev.record); 
                return ev; 
            });

            kb.event.on('kb.change.返送先対象者確認', (ev) => { updateVisibility(ev.record); return ev; });
            
            kb.event.on('kb.create.submit', (ev) => { 
                if (!validateAll(ev.record)) ev.error = true; 
                return ev; 
            });
        }
    }, 100);
})();
