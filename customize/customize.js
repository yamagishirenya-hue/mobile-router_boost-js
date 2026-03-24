(function() {
    "use strict";

    /**
     * 表示メッセージの定数定義
     * ユーザーに表示する文言を一箇所で管理します
     */
    const MSG_ERROR = "入力内容に誤りがあります。\n赤枠の項目を確認してください。";
    const MSG_CONFIRM = "入力内容に問題はありませんか？\nよろしければ送信してください。";
    const MSG_COMPLETE = "送信が完了しました。\n完了メールが送付されますので, ご確認ください。";
    const MSG_EXT_ERROR = "画像ファイル（jpg, png, gif, webp）のみ添付可能です。";
    
    // 「返送先が異なる」場合に必須チェックを行うフィールドのリスト
    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];

    /**
     * 1. キャリア案内文の表示制御
     * セレクトボックス（契約会社名）の選択肢に合わせて、特定のHTML要素を表示/非表示にします
     */
    const updateCarrierGuidance = (selectedValue) => {
        const allSectionIds = ["company_kddi", "company_docomo", "company_softbank", "non_company"];
        
        allSectionIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.setProperty('display', 'none', 'important');
        });

        let targetId = "";
        if (selectedValue === "KDDI(au)") targetId = "company_kddi";
        else if (selectedValue === "docomo") targetId = "company_docomo";
        else if (selectedValue === "Softbank") targetId = "company_softbank";
        else if (selectedValue === "") targetId = "non_company";

        if (targetId) {
            const targetEl = document.getElementById(targetId);
            if (targetEl) targetEl.style.setProperty('display', 'block', 'important');
        }
    };

    /**
     * 2. 送信ボタンの活性・非活性制御
     * 同意ラジオボタンが「同意します。」になっていない場合は送信ボタンを無効化（グレーアウト）します
     */
    const updateSubmitButtonState = () => {
        const submitBtn = document.querySelector('.kb-injector-button');
        if (!submitBtn) return;

        const agreeRadio = document.querySelector('input[data-name="修理費用"][value="同意します。"]');
        
        if (agreeRadio && agreeRadio.checked) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = "1";
            submitBtn.style.cursor = "pointer";
            submitBtn.style.pointerEvents = "auto";
        } else {
            submitBtn.disabled = true;
            submitBtn.style.opacity = "0.5";
            submitBtn.style.cursor = "not-allowed";
            submitBtn.style.pointerEvents = "none";
        }
    };

    /**
     * 3. ポップアップの監視・書き換え
     */
    const updatePopupByContent = () => {
        const popup = document.querySelector('div[style*="rgb(240, 240, 240)"]');
        if (!popup) return;

        const msgArea = popup.querySelector('div[style*="overflow"]') || popup.querySelector('div[style*="height: 172px"]');
        if (!msgArea) return;

        const txt = msgArea.innerText.trim();

        if (txt === "Done!" || txt === MSG_COMPLETE) {
            msgArea.innerText = MSG_COMPLETE;
            msgArea.style.setProperty('height', 'auto', 'important');
            msgArea.style.setProperty('min-height', '100px', 'important');
            msgArea.style.setProperty('display', 'flex', 'important');
            msgArea.style.setProperty('align-items', 'center', 'important');
            msgArea.style.setProperty('justify-content', 'center', 'important');
            msgArea.style.setProperty('font-size', '20px', 'important');

            const okBtn = popup.querySelector('.kb-dialog-button');
            if (okBtn && !okBtn.dataset.listenerAttached) {
                okBtn.addEventListener('click', () => window.location.reload());
                okBtn.dataset.listenerAttached = "true";
            }
        } 
        else if (txt.includes("誤り") || txt.includes("必須") || txt.includes("画像ファイル")) {
            if (!msgArea.innerText.includes(MSG_ERROR) && !msgArea.innerText.includes(MSG_EXT_ERROR)) {
                // すでにエラー文言がセットされている場合は上書きしない（拡張子エラー表示のため）
            }
        } 
        else if (txt.length > 0 && txt !== MSG_CONFIRM && txt !== MSG_COMPLETE && !txt.includes("OK") && !txt.includes("Cancel")) {
            msgArea.innerText = MSG_CONFIRM;
        }
        
        popup.style.setProperty('height', 'auto', 'important');
    };

    /**
     * 4. kb.alert のオーバーライド
     */
    const overrideKbAlert = () => {
        if (typeof kb !== 'undefined' && kb.alert && !kb.alert._isOverridden) {
            const originalAlert = kb.alert;
            kb.alert = function(msg) {
                let customMsg = msg;
                if (msg && (msg.includes("誤り") || msg.includes("必須"))) customMsg = MSG_ERROR;
                else if (msg && msg.includes("拡張子")) customMsg = MSG_EXT_ERROR;
                else if (msg === "Done!") customMsg = MSG_COMPLETE;
                
                const result = originalAlert.apply(this, [customMsg]);
                setTimeout(updatePopupByContent, 50);
                return result;
            };
            kb.alert._isOverridden = true;
        }
    };

    /**
     * 5. 郵便番号フィールドのクリーニング
     */
    const resetPostalInput = () => {
        const parentField = document.querySelector('[field-id="郵便番号"]');
        if (!parentField) return;
        const oldContainer = parentField.querySelector('.postal-box-container');
        if (oldContainer) oldContainer.remove();
        const input = parentField.querySelector('input');
        if (input) {
            input.style.display = 'block';
            input.style.position = 'static';
            input.style.opacity = '1';
        }
    };

    /**
     * 6. フォームのバリデーション
     * 拡張子のチェックを追加しました
     */
    const validateAll = (record) => {
        let hasError = false;
        let extError = false;
        const isDiff = record["返送先対象者確認"]?.value === "返送先が異なる";

        document.querySelectorAll('[field-id]').forEach(el => {
            el.querySelectorAll('.error-input').forEach(e => e.classList.remove('error-input'));
            const existing = el.querySelector('.custom-error-container');
            if (existing) existing.remove();
        });

        // 郵便番号
        const zipVal = (record["郵便番号"]?.value || "").replace(/[^\d]/g, "");
        if (zipVal && zipVal.length !== 7) hasError = true;

        // 電話番号
        const telIds = ["連絡先電話番号", "モバイルルーターの電話番号"];
        if (isDiff) telIds.push("返送先対象者の電話番号");
        telIds.forEach(id => {
            const val = (record[id]?.value || "").replace(/[^\d]/g, "");
            if (val && (val.length < 10 || val.length > 11)) hasError = true;
        });

        // 必須項目チェック
        if (isDiff) {
            targetFieldIds.forEach(id => {
                if (!(record[id]?.value || "").trim()) hasError = true;
            });
        }

        // --- 画像ファイルの拡張子チェック ---
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        // 全ての添付ファイルフィールドをスキャン
        document.querySelectorAll('.kb-file').forEach(field => {
            const fieldId = field.closest('[field-id]')?.getAttribute('field-id');
            if (fieldId && record[fieldId]) {
                const files = record[fieldId].value; // Boosterのファイルオブジェクト配列
                if (Array.isArray(files)) {
                    files.forEach(file => {
                        const fileName = file.name || "";
                        const ext = fileName.split('.').pop().toLowerCase();
                        if (fileName && !imageExtensions.includes(ext)) {
                            extError = true;
                        }
                    });
                }
            }
        });
        
        if (extError) {
            if (typeof kb !== 'undefined' && kb.alert) kb.alert(MSG_EXT_ERROR);
            return false;
        }

        if (hasError && typeof kb !== 'undefined' && kb.alert) kb.alert(MSG_ERROR);
        return !hasError;
    };

    /**
     * 7. 返送先情報のフィールド出し分け
     */
    const updateVisibility = (record) => {
        const isDifferent = record["返送先対象者確認"]?.value === "返送先が異なる";
        document.body.classList.toggle("show-target-fields", isDifferent);
    };

    /**
     * 8. ファイル添付フィールドのデザイン変更 & ドラッグ抑制
     */
    const customizeFileField = () => {
        const fileFields = document.querySelectorAll('.kb-file');
        
        fileFields.forEach(field => {
            // ブラウザがファイルを別タブで開くのを防ぐ（ドラッグイベントの抑制）
            if (!field.dataset.dragHandled) {
                const preventDefaults = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                };
                ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                    field.addEventListener(eventName, preventDefaults, false);
                });
                field.dataset.dragHandled = "true";
            }

            if (field.dataset.customized) return;
            
            const btn = field.querySelector('button.kb-icon-file') || field.querySelector('button.kb-search');
            
            if (btn) {
                btn.style.setProperty('background-image', 'none', 'important');
                btn.style.setProperty('box-shadow', 'none', 'important');
                
                btn.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 30px; box-sizing: border-box;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#007bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                        <div style="font-weight: bold; font-size: 16px; color: #333;">故障箇所の写真を添付してください</div>
                        <div style="font-size: 13px; color: #666;">（ここをクリックしてファイルを選択）</div>
                    </div>
                `;
                
                btn.style.setProperty('display', 'block', 'important');
                btn.style.setProperty('width', '100%', 'important');
                btn.style.setProperty('height', 'auto', 'important');
                btn.style.setProperty('background-color', '#fdfdfd', 'important');
                btn.style.setProperty('border', '2px dashed #007bff', 'important');
                btn.style.setProperty('border-radius', '12px', 'important');
                btn.style.setProperty('padding', '0', 'important');
                btn.style.setProperty('cursor', 'pointer', 'important');
                btn.style.setProperty('transition', 'all 0.2s ease', 'important');
                
                btn.onmouseenter = () => {
                    btn.style.backgroundColor = '#f0f7ff';
                    btn.style.borderColor = '#0056b3';
                };
                btn.onmouseleave = () => {
                    btn.style.backgroundColor = '#fdfdfd';
                    btn.style.borderColor = '#007bff';
                };
            }
            
            field.dataset.customized = "true";
        });
    };

    // --- メインイベントリスナーの登録 ---

    document.addEventListener('change', (e) => {
        const fieldWrap = e.target.closest('[field-id]');
        const fieldId = fieldWrap ? fieldWrap.getAttribute('field-id') : null;

        if (fieldId === '契約会社名') {
            updateCarrierGuidance(e.target.value);
        }

        if (e.target.name === '修理費用' || e.target.getAttribute('data-name') === '修理費用') {
            updateSubmitButtonState();
        }
    });

    document.addEventListener('input', (e) => {
        const fieldWrap = e.target.closest('[field-id]');
        if (!fieldWrap) return;
        const fieldId = fieldWrap.getAttribute('field-id');
        let val = e.target.value;
        
        if (fieldId === "郵便番号") {
            let d = val.replace(/[^\d]/g, "");
            e.target.value = d.length <= 3 ? d : d.slice(0, 3) + "-" + d.slice(3, 7);
        } else if (fieldId && fieldId.includes("電話番号")) {
            e.target.value = val.replace(/[^\d]/g, "").slice(0, 11);
        }
    });

    // 定期監視
    setInterval(() => {
        updatePopupByContent();
        overrideKbAlert();
        resetPostalInput();
        updateSubmitButtonState();
        customizeFileField();
    }, 500);

    // Kintone Booster イベントとの連携
    if (typeof kb !== 'undefined' && kb.event) {
        kb.event.on(['kb.view.show', 'kb.create.show', 'kb.edit.show'], (ev) => {
            updateCarrierGuidance(ev.record["契約会社名"]?.value || ""); 
            updateSubmitButtonState();
            updateVisibility(ev.record);
            customizeFileField();
            return ev;
        });

        kb.event.on('kb.change.返送先対象者確認', (ev) => {
            updateVisibility(ev.record);
            return ev;
        });

        kb.event.on(['kb.create.submit', 'kb.edit.submit'], (ev) => {
            if (!validateAll(ev.record)) {
                ev.error = true;
            } else {
                setTimeout(updatePopupByContent, 100);
            }
            return ev;
        });
    }
})();
