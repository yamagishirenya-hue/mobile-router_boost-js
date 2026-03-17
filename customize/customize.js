(function() {
    "use strict";

    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];

    // 専用タグを新規追加する関数
    const injectCustomDecorations = () => {
        const captions = document.querySelectorAll('.kb-field-caption');
        if (captions.length === 0) return false;

        captions.forEach(el => {
            const text = el.innerText;
            // すでに加工済みの場合はスキップ
            if (el.querySelector('.injected-tag')) return;

            // 1. 【必須】ラベルの追加
            if (text.includes('必須')) {
                const reqTag = document.createElement('span');
                reqTag.className = 'injected-tag custom-required-badge';
                reqTag.innerText = '【必須】';
                el.appendChild(reqTag);
                // 元のテキストから「【必須】」を（見かけ上）消すために透明化
                el.style.color = 'transparent';
                // 必要な文字だけ再構築して表示
                const labelText = document.createElement('span');
                labelText.className = 'injected-tag custom-label-text';
                labelText.innerText = text.replace(/【必須】/g, '');
                el.prepend(labelText);
            }

            // 2. ※注釈の追加
            if (text.includes('※')) {
                const noteText = text.match(/※.*/);
                if (noteText) {
                    const noteTag = document.createElement('div');
                    noteTag.className = 'injected-tag custom-note-text';
                    noteTag.innerText = noteText[0];
                    el.appendChild(noteTag);
                    // 元のテキスト内の※以降はCSSで隠す
                }
            }
        });
        return true;
    };

    // --- 以下、既存の安定動作しているロジック ---
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

    const timer = setInterval(() => {
        if (typeof kb !== 'undefined' && kb.event) {
            clearInterval(timer);
            document.addEventListener('input', handleInputControl);
            kb.event.on('kb.view.show', (ev) => { 
                updateVisibility(ev.record);
                // 描画を待ってタグを注入
                let retry = 0;
                const task = setInterval(() => {
                    if (injectCustomDecorations() || retry > 50) clearInterval(task);
                    retry++;
                }, 100);
                return ev; 
            });
            kb.event.on('kb.change.返送先対象者確認', (ev) => { updateVisibility(ev.record); return ev; });
            kb.event.on('kb.create.submit', (ev) => { if (!validateAll(ev.record)) ev.error = true; return ev; });
        }
    }, 100);
})();
