(function() {
    "use strict";

    const MSG_ERROR = "入力内容に誤りがあります。\n赤枠の項目を確認してください。";
    const MSG_CONFIRM = "入力内容に問題はありませんか？\nよろしければ送信してください。";
    const MSG_COMPLETE = "送信が完了しました。\n完了メールが送付されますので、ご確認ください。";
    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];

    /**
     * 1. ポップアップの監視（メッセージエリアの置換のみ実行）
     */
    const observePopup = () => {
        const targetNode = document.body;
        if (!targetNode) {
            const retry = setInterval(() => {
                if (document.body) {
                    clearInterval(retry);
                    observePopup();
                }
            }, 100);
            return;
        }

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType !== 1) return;

                    // --- 送信完了(Done!) エリアの特定 ---
                    // 送付いただいたHTMLの「height: 172px」を持つdivを直接探します
                    const doneMsg = node.querySelector('div[style*="height: 172px"]') || (node.style && node.style.height === '172px' ? node : null);
                    
                    if (doneMsg && doneMsg.innerText.trim() === "Done!") {
                        // メッセージの書き換え
                        doneMsg.innerText = MSG_COMPLETE;
                        
                        // デザインの強制修正（CSS側でも制御しますがJSでも補強します）
                        doneMsg.style.setProperty('height', 'auto', 'important');
                        doneMsg.style.setProperty('min-height', '120px', 'important');
                        doneMsg.style.setProperty('display', 'flex', 'important');
                        doneMsg.style.setProperty('align-items', 'center', 'important');
                        doneMsg.style.setProperty('justify-content', 'center', 'important');
                        doneMsg.style.setProperty('font-size', '22px', 'important');
                        doneMsg.style.setProperty('font-weight', 'bold', 'important');
                        doneMsg.style.setProperty('text-align', 'center', 'important');
                        doneMsg.style.setProperty('white-space', 'pre-wrap', 'important');

                        // 外枠の高さも自動調整
                        const parent = doneMsg.parentElement;
                        if (parent) {
                            parent.style.setProperty('height', 'auto', 'important');
                            parent.style.setProperty('padding-bottom', '3em', 'important'); // ボタン位置の確保
                        }
                    }

                    // --- エラー・確認メッセージの処理 ---
                    const msgArea = node.querySelector('div[style*="overflow: hidden auto"]') || node.querySelector('div[style*="height:"]');
                    if (msgArea && msgArea.innerText.trim() !== MSG_COMPLETE && msgArea.innerText.trim() !== "Done!") {
                        const txt = msgArea.innerText.trim();
                        if (txt.includes("誤り") || txt.includes("必須") || txt.includes("入力") || txt.includes("確認")) {
                            msgArea.innerText = MSG_ERROR;
                        } else if (txt.length > 0 && txt !== MSG_CONFIRM) {
                            msgArea.innerText = MSG_CONFIRM;
                        }
                    }
                });
            });
        });
        observer.observe(targetNode, { childList: true, subtree: true });
    };

    /**
     * 2. 郵便番号のリセット（1文字1枠の残像対策）
     */
    const resetPostalInput = () => {
        const parentField = document.querySelector('[field-id="郵便番号"]');
        if (!parentField) return;
        const oldContainer = parentField.querySelector('.postal-box-container');
        if (oldContainer) oldContainer.remove();
        const originalInput = parentField.querySelector('input');
        if (originalInput) {
            originalInput.style.display = 'block';
            originalInput.style.position = 'static';
            originalInput.style.opacity = '1';
        }
    };

    /**
     * 3. 入力制御（数字制限など）
     */
    const handleInputControl = (e) => {
        const fieldWrap = e.target.closest('[field-id]');
        if (!fieldWrap) return;
        const fieldId = fieldWrap.getAttribute('field-id');
        let val = e.target.value;
        if (fieldId === "郵便番号") {
            let digits = val.replace(/[^\d]/g, "");
            e.target.value = digits.length <= 3 ? digits : digits.slice(0, 3) + "-" + digits.slice(3, 7);
        } else if (fieldId && fieldId.includes("電話番号")) {
            e.target.value = val.replace(/[^\d]/g, "").slice(0, 11);
        }
    };

    /**
     * 4. バリデーション
     */
    const validateAll = (record) => {
        let hasError = false;
        const isDiff = record["返送先対象者確認"]?.value === "返送先が異なる";

        const removeError = (id) => {
            const container = document.querySelector(`[field-id="${id}"]`);
            if (!container) return;
            const existing = container.querySelector('.custom-error-container');
            if (existing) existing.remove();
        };

        const showError = (id, message) => {
            const container = document.querySelector(`[field-id="${id}"]`);
            if (!container) return;
            removeError(id);
            const errorWrap = document.createElement('div');
            errorWrap.className = 'custom-error-container';
            errorWrap.innerHTML = `<div class="error-triangle"></div><div class="error-message">${message}</div>`;
            container.appendChild(errorWrap);
        };

        document.querySelectorAll('[field-id]').forEach(el => removeError(el.getAttribute('field-id')));

        const zipVal = (record["郵便番号"]?.value || "").replace(/[^\d]/g, "");
        if (zipVal && zipVal.length !== 7) {
            showError("郵便番号", "7桁の数字を入力してください");
            hasError = true;
        }

        const telIds = ["連絡先電話番号", "モバイルルーターの電話番号"];
        if (isDiff) telIds.push("返送先対象者の電話番号");
        telIds.forEach(id => {
            const val = (record[id]?.value || "").replace(/[^\d]/g, "");
            if (val && (val.length < 10 || val.length > 11)) {
                showError(id, "数字10桁または11桁で入力してください");
                hasError = true;
            }
        });

        if (isDiff) {
            targetFieldIds.forEach(id => {
                if (!(record[id]?.value || "").trim()) {
                    showError(id, "必須項目です");
                    hasError = true;
                }
            });
        }
        if (hasError) {
            if (typeof kb !== 'undefined' && kb.alert) kb.alert(MSG_ERROR);
        }
        return !hasError;
    };

    const updateVisibility = (record) => {
        const isDifferent = record["返送先対象者確認"]?.value === "返送先が異なる";
        document.body.classList.toggle("show-target-fields", isDifferent);
    };

    // --- 実行 ---
    observePopup();
    document.addEventListener('input', handleInputControl);
    setInterval(resetPostalInput, 1000);

    if (typeof kb !== 'undefined' && kb.event) {
        kb.event.on(['kb.view.show', 'kb.create.show', 'kb.edit.show'], (ev) => {
            updateVisibility(ev.record);
            return ev;
        });
        kb.event.on('kb.change.返送先対象者確認', (ev) => {
            updateVisibility(ev.record);
            return ev;
        });
        kb.event.on(['kb.create.submit', 'kb.edit.submit'], (ev) => {
            if (!validateAll(ev.record)) {
                ev.error = true;
            }
            return ev;
        });
    }
})();
