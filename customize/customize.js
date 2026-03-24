(function() {
    "use strict";

    /**
     * 表示メッセージの定数定義
     */
    const MSG_ERROR = "入力内容に誤りがあります。\n赤枠の項目を確認してください。";
    const MSG_CONFIRM = "入力内容に問題はありませんか？\nよろしければ送信してください。";
    const MSG_COMPLETE = "送信が完了しました。\n完了メールが送付されますので、ご確認ください。";
    const MSG_EXT_ERROR = "画像ファイル（jpg, png, gif, webp）のみ添付可能です。";
    const MSG_SIZE_ERROR = "ファイルサイズが大きすぎます。2MB以下の画像を選択してください。";
    const MSG_SERVER_ERROR = "メール送信サーバーでエラーが発生しました。\n送信設定（フィールドコードの不一致など）を確認してください。";
    
    // 画像として許可する拡張子
    const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    // 許容する最大ファイルサイズ (2MB)
    const MAX_FILE_SIZE = 2 * 1024 * 1024;

    // 「返送先が異なる」場合に必須チェックを行うフィールドのリスト
    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];

    /**
     * 0. エラー表示の生成
     * 項目ごとの下に赤枠のメッセージを表示します
     */
    const showError = (fieldId, message) => {
        const fieldEl = document.querySelector(`[field-id="${fieldId}"]`);
        if (!fieldEl) return;

        // 入力フィールド自体の色を変える
        const input = fieldEl.querySelector('input, select, textarea');
        if (input) input.classList.add('error-input');

        // すでにエラーが表示されている場合は追加しない
        if (fieldEl.querySelector('.custom-error-container')) return;

        // エラーメッセージ（赤枠）の作成
        const errorDiv = document.createElement('div');
        errorDiv.className = 'custom-error-container';
        errorDiv.innerHTML = `<div class="error-message">${message}</div>`;
        fieldEl.appendChild(errorDiv);
    };

    /**
     * 1. キャリア案内文の表示制御
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
        const popups = document.querySelectorAll('div[style*="rgb(240, 240, 240)"], .kb-dialog, div[style*="position: fixed"] > div[style*="z-index"]');
        
        popups.forEach(popup => {
            const msgArea = popup.querySelector('div[style*="overflow"]') || 
                            popup.querySelector('div[style*="height: 172px"]') || 
                            popup.querySelector('.kb-dialog-content') ||
                            popup.querySelector('div > span');
            if (!msgArea) return;

            const txt = msgArea.innerText.trim();
            const lowTxt = txt.toLowerCase();

            if (txt === "Done!" || txt === MSG_COMPLETE) {
                msgArea.innerText = MSG_COMPLETE;
                msgArea.style.setProperty('font-size', '20px', 'important');
                const okBtn = popup.querySelector('.kb-dialog-button');
                if (okBtn && !okBtn.dataset.listenerAttached) {
                    okBtn.addEventListener('click', () => window.location.reload());
                    okBtn.dataset.listenerAttached = "true";
                }
            } 
            else if (txt.includes("削除")) {
                return; 
            }
            else if (lowTxt.includes("error") || lowTxt.includes("500") || lowTxt.includes("server") || lowTxt.includes("failed")) {
                if (msgArea.innerText !== MSG_SERVER_ERROR) msgArea.innerText = MSG_SERVER_ERROR;
            }
            else if (txt.includes("誤り") || txt.includes("必須") || txt.includes("入力してください") || lowTxt.includes("check") || txt.includes("ファイル")) {
                if (msgArea.innerText !== MSG_ERROR) msgArea.innerText = MSG_ERROR;
            }
            else if (txt.length > 0 && txt !== MSG_CONFIRM && txt !== MSG_COMPLETE && !txt.includes("OK") && !txt.includes("Cancel")) {
                msgArea.innerText = MSG_CONFIRM;
            }
            
            popup.style.setProperty('height', 'auto', 'important');
        });
    };

    /**
     * 4. kb.alert のオーバーライド
     */
    const overrideKbAlert = () => {
        if (typeof kb !== 'undefined' && kb.alert && !kb.alert._isOverridden) {
            const originalAlert = kb.alert;
            kb.alert = function(msg) {
                let customMsg = msg;
                const lowMsg = (msg || "").toLowerCase();

                if (msg && msg.includes("削除")) {
                    customMsg = msg;
                } else if (lowMsg.includes("error") || lowMsg.includes("500") || lowMsg.includes("server") || lowMsg.includes("failed")) {
                    customMsg = MSG_SERVER_ERROR;
                } else if (msg && (msg.includes("誤り") || msg.includes("必須") || msg.includes("入力") || msg.includes("ファイル"))) {
                    customMsg = MSG_ERROR;
                } else if (msg === "Done!") {
                    customMsg = MSG_COMPLETE;
                }
                
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
     * 【修正】送信時に添付ファイルの拡張子をチェックし, 赤枠メッセージを出すようにしました
     */
    const validateAll = (record) => {
        let hasError = false;
        const isDiff = record["返送先対象者確認"]?.value === "返送先が異なる";

        // 全てのエラー表示を一旦クリア
        document.querySelectorAll('[field-id]').forEach(el => {
            el.querySelectorAll('.error-input').forEach(e => e.classList.remove('error-input'));
            const existing = el.querySelector('.custom-error-container');
            if (existing) existing.remove();
        });

        // 郵便番号
        const zipVal = (record["郵便番号"]?.value || "").replace(/[^\d]/g, "");
        if (zipVal && zipVal.length !== 7) {
            showError("郵便番号", "7桁の数字で入力してください。");
            hasError = true;
        }

        // 電話番号
        const telIds = ["連絡先電話番号", "モバイルルーターの電話番号"];
        if (isDiff) telIds.push("返送先対象者の電話番号");
        telIds.forEach(id => {
            const val = (record[id]?.value || "").replace(/[^\d]/g, "");
            if (val && (val.length < 10 || val.length > 11)) {
                showError(id, "10桁または11桁の数字で入力してください。");
                hasError = true;
            }
        });

        // 必須項目チェック（返送先が異なる場合）
        if (isDiff) {
            targetFieldIds.forEach(id => {
                if (!(record[id]?.value || "").trim()) {
                    showError(id, "必須項目です。");
                    hasError = true;
                }
            });
        }

        // --- ファイル拡張子のバリデーションチェック ---
        document.querySelectorAll('.kb-file').forEach(field => {
            const hiddenInput = field.querySelector('input[type="hidden"]');
            const fieldId = field.closest('[field-id]')?.getAttribute('field-id');
            if (hiddenInput && fieldId) {
                try {
                    const files = JSON.parse(hiddenInput.value || "[]");
                    let fieldExtError = false;
                    files.forEach(file => {
                        const fileName = file.name || "";
                        const ext = fileName.split('.').pop().toLowerCase();
                        if (fileName && !IMAGE_EXTENSIONS.includes(ext)) {
                            fieldExtError = true;
                        }
                    });
                    if (fieldExtError) {
                        showError(fieldId, MSG_EXT_ERROR);
                        hasError = true;
                    }
                } catch (e) {}
            }
        });

        if (hasError && typeof kb !== 'undefined' && kb.alert) {
            kb.alert(MSG_ERROR);
        }
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
     * 8. ファイル添付フィールドのカスタマイズ
     */
    const customizeFileField = () => {
        const fileFields = document.querySelectorAll('.kb-file');
        
        fileFields.forEach(field => {
            const hiddenInput = field.querySelector('input[type="hidden"]');
            if (!hiddenInput) return;

            const defaultGuide = field.querySelector('.kb-guide');
            if (defaultGuide) defaultGuide.style.setProperty('display', 'none', 'important');

            const btn = field.querySelector('button.kb-icon-file') || field.querySelector('button.kb-search');
            if (!btn) return;

            const renderFileNames = (buttonElement, files, inputEl) => {
                let listArea = buttonElement.querySelector('.kb-custom-file-list');
                if (!listArea) {
                    listArea = document.createElement('div');
                    listArea.className = 'kb-custom-file-list';
                    listArea.style.cssText = 'width:100%; margin-top:15px; display:flex; flex-direction:column; gap:8px; padding:0 20px 20px; box-sizing:border-box;';
                    buttonElement.appendChild(listArea);
                }
                listArea.innerHTML = '';
                files.forEach((file, index) => {
                    const item = document.createElement('div');
                    item.style.cssText = 'display:flex; align-items:center; gap:8px; background:#f0f7ff; padding:8px 12px; border-radius:8px; border:1px solid #cce5ff; pointer-events:auto;';
                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = file.name;
                    nameSpan.style.cssText = 'font-size:13px; color:#333; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; text-align:left; font-weight:normal;';
                    const delBtn = document.createElement('span');
                    delBtn.textContent = '×';
                    delBtn.style.cssText = 'color:#e53935; cursor:pointer; font-weight:bold; font-size:18px; padding:0 6px; line-height:1;';
                    delBtn.onclick = (e) => {
                        e.preventDefault(); e.stopPropagation();
                        files.splice(index, 1);
                        inputEl.value = JSON.stringify(files);
                        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
                        renderFileNames(buttonElement, files, inputEl);
                    };
                    item.appendChild(nameSpan); item.appendChild(delBtn); listArea.appendChild(item);
                });
            };

            const currentValue = hiddenInput.value || "[]";
            if (field.dataset.lastValue !== currentValue) {
                try {
                    const files = JSON.parse(currentValue);
                    renderFileNames(btn, files, hiddenInput);
                    field.dataset.lastValue = currentValue;
                } catch(e) {}
            }

            let fileInput = field.querySelector('input[type="file"]');
            if (!fileInput) {
                fileInput = document.createElement('input');
                fileInput.type = 'file'; fileInput.style.display = 'none'; 
                // accept属性はユーザー利便性のために残しますが、プログラム側でのブロックは行いません
                fileInput.accept = "image/*";
                field.appendChild(fileInput);
            }

            const handleFileUpload = async (file) => {
                // 送信時にチェックするため, ここでの即時エラー・中断処理を削除しました
                if (typeof kb === 'undefined' || !kb.file || !kb.file.upload) return;
                try {
                    const uploadResult = await kb.file.upload(file);
                    let currentFiles = [];
                    try { currentFiles = JSON.parse(hiddenInput.value || "[]"); } catch(e) { currentFiles = []; }
                    currentFiles.push(uploadResult);
                    hiddenInput.value = JSON.stringify(currentFiles);
                    hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
                } catch (err) { console.error("Upload failed", err); }
            };

            if (!field.dataset.dragHandled) {
                const preventDefaults = (e) => { e.preventDefault(); e.stopPropagation(); };
                const highlight = () => { btn.style.backgroundColor = '#f0f7ff'; btn.style.borderColor = '#0056b3'; };
                const unhighlight = () => { btn.style.backgroundColor = '#fdfdfd'; btn.style.borderColor = '#007bff'; };
                ['dragenter', 'dragover'].forEach(name => field.addEventListener(name, (e) => { preventDefaults(e); highlight(); }, false));
                ['dragleave', 'drop'].forEach(name => field.addEventListener(name, (e) => { preventDefaults(e); unhighlight(); }, false));
                field.addEventListener('drop', (e) => {
                    const droppedFiles = e.dataTransfer.files;
                    if (droppedFiles.length > 0) handleFileUpload(droppedFiles[0]);
                }, false);
                fileInput.addEventListener('change', (e) => {
                    if (e.target.files.length > 0) { handleFileUpload(e.target.files[0]); e.target.value = ''; }
                });
                field.dataset.dragHandled = "true";
            }

            if (field.dataset.customized) return;
            btn.style.setProperty('background-image', 'none', 'important');
            btn.style.setProperty('box-shadow', 'none', 'important');
            btn.style.setProperty('height', 'auto', 'important');
            btn.style.setProperty('min-height', '120px', 'important');
            btn.innerHTML = `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 30px 20px 10px; box-sizing: border-box; pointer-events: none;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#007bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                <div style="font-weight: bold; font-size: 16px; color: #333;">故障箇所の写真を添付してください</div>
                <div style="font-size: 13px; color: #666;">（ここをクリック または ファイルをドロップ）</div></div>`;
            btn.style.setProperty('display', 'block', 'important');
            btn.style.setProperty('width', '100%', 'important');
            btn.style.setProperty('background-color', '#fdfdfd', 'important');
            btn.style.setProperty('border', '2px dashed #007bff', 'important');
            btn.style.setProperty('border-radius', '12px', 'important');
            btn.style.setProperty('padding', '0', 'important');
            btn.style.setProperty('cursor', 'pointer', 'important');
            btn.style.setProperty('transition', 'all 0.2s ease', 'important');
            btn.onmouseenter = () => { btn.style.backgroundColor = '#f0f7ff'; btn.style.borderColor = '#0056b3'; };
            btn.onmouseleave = () => { btn.style.backgroundColor = '#fdfdfd'; btn.style.borderColor = '#007bff'; };
            field.dataset.customized = "true";
        });
    };

    document.addEventListener('change', (e) => {
        const fieldWrap = e.target.closest('[field-id]');
        const fieldId = fieldWrap ? fieldWrap.getAttribute('field-id') : null;
        if (fieldId === '契約会社名') updateCarrierGuidance(e.target.value);
        if (e.target.name === '修理費用' || e.target.getAttribute('data-name') === '修理費用') updateSubmitButtonState();
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

    setInterval(() => {
        updatePopupByContent();
        overrideKbAlert();
        resetPostalInput();
        updateSubmitButtonState();
        customizeFileField();
    }, 500);

    if (typeof kb !== 'undefined' && kb.event) {
        kb.event.on(['kb.view.show', 'kb.create.show', 'kb.edit.show'], (ev) => {
            updateCarrierGuidance(ev.record["契約会社名"]?.value || ""); 
            updateSubmitButtonState();
            updateVisibility(ev.record);
            customizeFileField();
            return ev;
        });
        kb.event.on('kb.change.返送先対象者確認', (ev) => { updateVisibility(ev.record); return ev; });
        kb.event.on(['kb.create.submit', 'kb.edit.submit'], (ev) => {
            if (!validateAll(ev.record)) ev.error = true;
            else setTimeout(updatePopupByContent, 100);
            return ev;
        });
    }
})();
