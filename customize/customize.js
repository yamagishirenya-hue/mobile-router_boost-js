(function() {
    "use strict";

    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];

    // ラベル内のテキスト装飾（【必須】と※以降）
    const applyCaptionFormatting = () => {
        const captions = document.querySelectorAll('.kb-field-caption');
        if (captions.length === 0) return false; // まだ要素がなければ戻る

        captions.forEach(el => {
            let html = el.innerHTML;

            // 1. 【必須】が含まれる場合、赤文字用クラスを付与
            if (html.includes('必須') && !el.classList.contains('is-required-label')) {
                el.classList.add('is-required-label');
            }

            // 2. ※が含まれる場合、その行以降をspanで囲む
            // すでに囲まれている場合はスキップ
            if (html.includes('※') && !html.includes('class="kb-note-text"')) {
                // <br>※ などのパターンを想定し、※から末尾までをスパンで囲む
                html = html.replace(/(※.*)/g, '<span class="kb-note-text">$1</span>');
                el.innerHTML = html;
            }
        });
        return true;
    };

    const handleInputControl = (e) => {
        const fieldId = e.target.closest('[field-id]')?.getAttribute('field-id');
        if (!fieldId) return;
        let val = e.target.value;
        if (fieldId.includes("電話番号")) {
            val = val.replace(/[^\d]/g, ""); 
            if (val.length > 11) val = val.slice(0, 11);
            e.target.value = val;
        }
        if (fieldId === "郵便番号") {
            val = val.replace(/[^\d]/g, ""); 
            if (val.length > 3) {
                val = val.slice(0, 3) + "-" + val.slice(3, 7);
            } else {
                val = val.slice(0, 3);
            }
            e.target.value = val;
        }
    };

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
        const telIds = ["連絡先電話番号", "モバイルルーターの電話番号"];
        if (isDiff) telIds.push("返送先対象者の電話番号");
        telIds.forEach(id => {
            const val = (record[id]?.value || "").replace(/[^\d]/g, "");
            if (val.length < 10 || val.length > 11) {
                showError(id, "数字10桁または11桁で入力してください");
                hasError = true;
            }
        });
        const mailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        if (!(record["連絡先メールアドレス"]?.value || "").match(mailRegex)) {
            showError("連絡先メールアドレス", "正しい形式で入力してください");
            hasError = true;
        }
        if (isDiff && !(record["返送先対象者のメールアドレス"]?.value || "").match(mailRegex)) {
            showError("返送先対象者のメールアドレス", "正しい形式で入力してください");
            hasError = true;
        }
        if (!(record["郵便番号"]?.value || "").match(/^\d{3}-\d{4}$/)) {
            showError("郵便番号", "正しく入力してください (例: 123-4567)");
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

    // 初期化とイベント監視
    const timer = setInterval(() => {
        if (typeof kb !== 'undefined' && kb.event) {
            clearInterval(timer);
            document.addEventListener('input', handleInputControl);
            
            kb.event.on('kb.view.show', (ev) => { 
                updateVisibility(ev.record);
                
                // 描画が完了するまで最大5秒間、100msごとにラベルの装飾を試みる
                let retryCount = 0;
                const retryFormatting = setInterval(() => {
                    const success = applyCaptionFormatting();
                    retryCount++;
                    if (success || retryCount > 50) clearInterval(retryFormatting);
                }, 100);

                return ev; 
            });

            kb.event.on('kb.change.返送先対象者確認', (ev) => { updateVisibility(ev.record); return ev; });
            kb.event.on('kb.create.submit', (ev) => { if (!validateAll(ev.record)) ev.error = true; return ev; });
        }
    }, 100);
})();
