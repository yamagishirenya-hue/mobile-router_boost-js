(function() {
    "use strict";

    /**
     * 【強化版】タブのアイコン（ファビコン）を強制的に変更する
     * 既存のすべてのアイコン設定を削除してから、新しい設定を追加します。
     * @param {string} url - 変更したいアイコン画像のURL
     */
    const updateFavicon = (url) => {
        if (!url) return;

        // 既存のすべてのアイコン用リンク要素（relにiconが含まれるもの）を一旦削除する
        // これにより、デフォルトのfavicon.svgなどの影響を完全に排除します
        const existingLinks = document.querySelectorAll("link[rel*='icon']");
        existingLinks.forEach(link => {
            link.parentNode.removeChild(link);
        });

        // 新しいアイコン要素を作成して追加する
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.type = 'image/x-icon'; // .icoファイルの場合
        newLink.href = url;
        document.head.appendChild(newLink);
    };

    /**
     * 将来の名称変更に対応するための定義
     */
    const PREFIXES = ['bst', 'kb'];

    const getSelector = (cls) => PREFIXES.map(p => `.${p}-${cls}`).join(', ');

    /**
     * 表示メッセージの定数定義
     */
    const MSG_ERROR = "入力内容に誤りがあります。\n赤枠の項目を確認してください。";
    const MSG_CONFIRM = "入力内容に問題はありませんか？\nよろしければ送信してください。";
    const MSG_COMPLETE = "送信が完了しました。\n完了メールが送付されますので、ご確認ください。";
    const MSG_EXT_ERROR = "次の拡張子のみ添付可能です。\njpg, png, gif, webp, heic, xlsx, docx";
    const MSG_MAIL_ERROR = "正しいメールアドレスの形式で入力してください。";
    
    const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'xlsx', 'docx'];
    
    const requesterFieldIds = ["氏名", "会社名", "連絡先電話番号", "連絡先メールアドレス"];
    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];

    /**
     * 0. エラー表示の生成
     */
    const showError = (fieldId, message) => {
        const fieldEl = document.querySelector(`[field-id="${fieldId}"]`);
        if (!fieldEl) return;
        const input = fieldEl.querySelector('input, select, textarea');
        if (input) input.classList.add('error-input');
        if (fieldEl.querySelector('.custom-error-container')) return;
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
        const submitBtn = document.querySelector(getSelector('injector-button'));
        if (!submitBtn) return;
        
        const agreeRadio = document.querySelector('input[data-name="修理受付費同意可否"][value="同意します。"]') || 
                           document.querySelector('input[name="repair_cost_agree"][value="同意します。"]');
        
        if (agreeRadio && agreeRadio.checked) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = "1";
            submitBtn.style.cursor = "pointer";
            submitBtn.style.pointerEvents = "auto";
        } else {
            submitBtn.disabled = true;
            submitBtn.style.pointerEvents = "none";
        }
    };

    /**
     * 3. ポップアップの監視・書き換え
     */
    const updatePopupByContent = () => {
        const msgAreas = document.querySelectorAll('div[style*="overflow: hidden auto"][style*="width: 100%"]');
        msgAreas.forEach(msgArea => {
            const popup = msgArea.closest(getSelector('dialog')) || msgArea.closest('div[style*="rgb(240, 240, 240)"]') || msgArea.parentElement;
            
            if (popup) {
                const isOverlay = popup.offsetWidth >= window.innerWidth * 0.9;
                if (isOverlay) {
                    popup.style.setProperty('background-color', 'rgba(0, 0, 0, 0.5)', 'important');
                    popup.style.setProperty('display', 'flex', 'important');
                    popup.style.setProperty('align-items', 'center', 'important');
                    popup.style.setProperty('justify-content', 'center', 'important');
                    popup.style.setProperty('height', '100%', 'important');
                    popup.style.setProperty('width', '100%', 'important');
                    popup.style.setProperty('top', '0', 'important');

                    msgArea.style.setProperty('background-color', '#ffffff', 'important');
                    msgArea.style.setProperty('border-radius', '12px', 'important');
                    msgArea.style.setProperty('box-shadow', '0 10px 40px rgba(0,0,0,0.3)', 'important');
                    msgArea.style.setProperty('width', 'auto', 'important');
                    msgArea.style.setProperty('min-width', '450px', 'important');
                    msgArea.style.setProperty('height', 'auto', 'important');
                    msgArea.style.setProperty('margin', 'auto', 'important');
                    msgArea.style.setProperty('position', 'relative', 'important');
                } else {
                    popup.style.setProperty('background-color', '#ffffff', 'important');
                    popup.style.setProperty('border-radius', '12px', 'important');
                    popup.style.setProperty('box-shadow', '0 10px 40px rgba(0,0,0,0.2)', 'important');
                    popup.style.setProperty('min-width', '450px', 'important');
                }
            }
            msgArea.style.setProperty('min-height', '100px', 'important');
            msgArea.style.setProperty('padding', '40px 30px', 'important');
            const txt = msgArea.innerText.trim();
            const targetErrorHtml = MSG_ERROR.replace(/\n/g, '<br>');
            const targetConfirmHtml = MSG_CONFIRM.replace(/\n/g, '<br>');
            const targetExtErrorHtml = MSG_EXT_ERROR.replace(/\n/g, '<br>');
            if (txt.includes("誤り") || txt.includes("必須") || txt.includes("入力してください")) {
                if (msgArea.innerHTML !== targetErrorHtml) msgArea.innerHTML = targetErrorHtml;
            } else if (txt.includes("画像") || txt.includes("拡張子")) {
                if (msgArea.innerHTML !== targetExtErrorHtml) msgArea.innerHTML = targetExtErrorHtml;
            } else if (txt.length > 0 && !txt.includes("送信が完了しました") && !txt.includes("削除") && !txt.includes("OK") && !txt.includes("Cancel") && txt !== MSG_COMPLETE) {
                if (msgArea.innerHTML !== targetConfirmHtml) msgArea.innerHTML = targetConfirmHtml;
            }
        });

        const allDivs = document.querySelectorAll('div');
        const doneMsg = Array.from(allDivs).find(el => el.innerText.trim() === "Done!" || el.innerText.includes("送信が完了しました"));
        if (doneMsg) {
            const doneDialog = doneMsg.closest(getSelector('dialog')) || doneMsg.closest('div[style*="rgb(240, 240, 240)"]') || doneMsg.parentElement;
            if (doneDialog) {
                doneDialog.style.setProperty('position', 'fixed', 'important');
                doneDialog.style.setProperty('top', '50%', 'important');
                doneDialog.style.setProperty('left', '50%', 'important');
                doneDialog.style.setProperty('transform', 'translate(-50%, -50%)', 'important');
                doneDialog.style.setProperty('width', 'auto', 'important');
                doneDialog.style.setProperty('min-width', '450px', 'important');
                doneDialog.style.setProperty('height', 'auto', 'important');
                doneDialog.style.setProperty('background-color', '#ffffff', 'important');
                doneDialog.style.setProperty('border-radius', '12px', 'important');
                doneDialog.style.setProperty('box-shadow', '0 10px 40px rgba(0,0,0,0.3)', 'important');
                doneDialog.style.setProperty('display', 'flex', 'important');
                doneDialog.style.setProperty('flex-direction', 'column', 'important');
                doneDialog.style.setProperty('align-items', 'center', 'important');
                doneDialog.style.setProperty('padding', '0', 'important');
                doneDialog.style.setProperty('z-index', '999999', 'important');
                doneDialog.style.setProperty('overflow', 'hidden', 'important');
                const targetCompleteHtml = MSG_COMPLETE.replace(/\n/g, '<br>');
                const btnId = "custom-ok-button";
                if (!doneDialog.querySelector('.custom-msg-area')) {
                    doneDialog.innerHTML = `<div class="custom-msg-area" style="font-size: 18px !important; padding: 45px 30px !important; text-align: center !important; line-height: 1.6 !important; font-weight: bold !important; color: #333 !important; flex: 1;">${targetCompleteHtml}</div>`;
                }
                if (!document.getElementById(btnId)) {
                    const btnWrapper = document.createElement('div');
                    btnWrapper.style.cssText = "width: 100%; text-align: center; border-top: 1px solid #eeeeee; padding: 20px 0; background-color: #f8f9fa;";
                    const btn = document.createElement('button');
                    btn.id = btnId;
                    btn.innerText = "OK";
                    btn.style.cssText = "background-color: #007bff; color: #fff; border: none; border-radius: 4px; padding: 8px 45px; font-size: 16px; font-weight: bold; cursor: pointer; transition: background 0.2s; min-width: 120px;";
                    btn.onmouseover = () => btn.style.backgroundColor = "#0056b3";
                    btn.onmouseout = () => btn.style.backgroundColor = "#007bff";
                    btn.onclick = (e) => { e.preventDefault(); window.location.reload(); };
                    btnWrapper.appendChild(btn);
                    doneDialog.appendChild(btnWrapper);
                }
            }
        }
    };

    /**
     * 4. 郵便番号フィールドの補正
     */
    const resetPostalInput = () => {
        const parentField = document.querySelector('[field-id="郵便番号"]');
        if (!parentField) return;
        const oldContainer = parentField.querySelector('.postal-box-container');
        if (oldContainer) oldContainer.remove();
        const input = parentField.querySelector('input');
        if (input) { input.style.display = 'block'; input.style.position = 'static'; input.style.opacity = '1'; }
    };

    /**
     * 5. フォームのバリデーション
     */
    const validateAll = (record) => {
        let hasError = false;
        const checkValue = record["返送先対象者確認"]?.value;
        const isDiff = checkValue === "返送先が異なる";
        
        document.querySelectorAll('[field-id]').forEach(el => {
            el.querySelectorAll('.error-input').forEach(e => e.classList.remove('error-input'));
            const existing = el.querySelector('.custom-error-container');
            if (existing) existing.remove();
        });

        requesterFieldIds.forEach(id => {
            if (!record[id] || !(record[id].value || "").trim()) { showError(id, "必須項目です。"); hasError = true; }
        });

        const zipVal = (record["郵便番号"]?.value || "").replace(/[^\d]/g, "");
        if (zipVal && zipVal.length !== 7) { showError("郵便番号", "7桁の数字で入力してください。"); hasError = true; }

        const telIds = ["連絡先電話番号", "モバイルルーターの電話番号"];
        if (isDiff) telIds.push("返送先対象者の電話番号");
        telIds.forEach(id => {
            if (record[id]) {
                const val = (record[id].value || "").replace(/[^\d]/g, "");
                if (val && (val.length < 10 || val.length > 11)) { showError(id, "10桁または11桁の数字で入力してください。"); hasError = true; }
            }
        });

        if (isDiff) { targetFieldIds.forEach(id => { if (!record[id] || !(record[id].value || "").trim()) { showError(id, "必須項目です。"); hasError = true; } }); }

        const emailIds = ["連絡先メールアドレス"];
        if (isDiff) emailIds.push("返送先対象者のメールアドレス");
        
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        emailIds.forEach(id => {
            if (record[id]) {
                const val = (record[id].value || "").trim();
                if (val && !emailRegex.test(val)) { showError(id, MSG_MAIL_ERROR); hasError = true; }
            }
        });
        
        document.querySelectorAll(getSelector('file')).forEach(field => {
            const hiddenInput = field.querySelector('input[type="hidden"]');
            const fieldId = field.closest('[field-id]')?.getAttribute('field-id');
            if (hiddenInput && fieldId) {
                try {
                    const valStr = hiddenInput.value || "[]";
                    const files = JSON.parse(valStr);
                    if (files.length > 0 && files.some(f => !IMAGE_EXTENSIONS.includes((f.name || "").split('.').pop().toLowerCase()))) {
                        showError(fieldId, MSG_EXT_ERROR); hasError = true;
                    }
                } catch (e) {}
            }
        });
        
        if (hasError && typeof kb !== 'undefined' && kb.alert) kb.alert(MSG_ERROR);
        return !hasError;
    };

    /**
     * 6. 返送先情報のフィールド出し分け
     */
    const updateVisibility = (record) => {
        if (!record) return;
        const checkValue = record["返送先対象者確認"]?.value;
        const isDifferent = (checkValue === "返送先が異なる");
        document.body.classList.toggle("show-target-fields", isDifferent);
    };

    /**
     * 7. ファイル添付フィールドのカスタマイズ
     */
    const customizeFileField = () => {
        const fileFields = document.querySelectorAll(getSelector('file'));
        fileFields.forEach(field => {
            const hiddenInput = field.querySelector('input[type="hidden"]');
            if (!hiddenInput) return;
            
            const btn = field.querySelector('button' + getSelector('icon-file').replace(/,/g, ', button')) || 
                        field.querySelector('button' + getSelector('search').replace(/,/g, ', button')) || 
                        field.querySelector('button');
            if (!btn) return;
            
            const renderFileNames = (buttonElement, files, inputEl) => {
                let listArea = buttonElement.querySelector('.kb-custom-file-list');
                if (!listArea) {
                    listArea = document.createElement('div');
                    listArea.className = 'kb-custom-file-list';
                    listArea.style.cssText = 'width:100%; margin-top:15px; display:flex; flex-direction:column; gap:8px; padding:0 20px 20px; box-sizing:border-box; pointer-events:auto;';
                    buttonElement.appendChild(listArea);
                }
                listArea.innerHTML = '';
                files.forEach((file, index) => {
                    const item = document.createElement('div');
                    item.style.cssText = 'display:flex; align-items:center; gap:8px; background:#f0f7ff; padding:8px 12px; border-radius:8px; border:1px solid #cce5ff;';
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
                    };
                    item.appendChild(nameSpan); item.appendChild(delBtn); listArea.appendChild(item);
                });
            };

            const currentValue = hiddenInput.value || "[]";
            if (field.dataset.lastValue !== currentValue) {
                try { renderFileNames(btn, JSON.parse(currentValue), hiddenInput); field.dataset.lastValue = currentValue; } catch(e) {}
            }

            if (!field.dataset.dragHandled) {
                const preventDefaults = (e) => { e.preventDefault(); e.stopPropagation(); };
                ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(name => field.addEventListener(name, preventDefaults, false));
                field.addEventListener('drop', (e) => {
                    const droppedFiles = e.dataTransfer.files;
                    if (droppedFiles.length > 0 && typeof kb !== 'undefined' && kb.file && kb.file.upload) {
                        kb.file.upload(droppedFiles[0]).then(res => {
                            let currentFiles = JSON.parse(hiddenInput.value || "[]");
                            currentFiles.push(res);
                            hiddenInput.value = JSON.stringify(currentFiles);
                            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
                        });
                    }
                }, false);
                field.dataset.dragHandled = "true";
            }

            if (field.dataset.customized) return;
            
            const defaultGuide = field.querySelector(getSelector('guide'));
            if (defaultGuide) defaultGuide.style.setProperty('display', 'none', 'important');
            
            btn.style.setProperty('background-image', 'none', 'important');
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
            field.dataset.customized = "true";
        });
    };

    // --- メインイベントリスナー ---
    document.addEventListener('change', (e) => {
        const fieldWrap = e.target.closest('[field-id]');
        const fieldId = fieldWrap ? fieldWrap.getAttribute('field-id') : null;
        if (fieldId === '契約会社名') updateCarrierGuidance(e.target.value);
        if (fieldId === '返送先対象者確認') updateVisibility({ "返送先対象者確認": { value: e.target.value } });
        if (e.target.name === 'repair_cost_agree' || e.target.getAttribute('data-name') === '修理受付費同意可否') updateSubmitButtonState();
    });

    document.addEventListener('input', (e) => {
        const fieldWrap = e.target.closest('[field-id]');
        if (!fieldWrap) return;
        const fieldId = fieldWrap.getAttribute('field-id');
        let val = e.target.value;
        if (fieldId === "郵便番号") e.target.value = val.replace(/[^\d]/g, "").slice(0, 7).replace(/(\d{3})(\d{4})/, '$1-$2');
        else if (fieldId && (fieldId.includes("電話番号") || fieldId.includes("お電話番号"))) e.target.value = val.replace(/[^\d]/g, "").slice(0, 11);
        else if (fieldId && fieldId.includes("メールアドレス")) e.target.value = val.replace(/[^a-zA-Z0-9@.!#$%&'*+/=?^_`{|}~-]/g, "");
    });

    // 監視頻度を上げて上書きを防止
    setInterval(() => { 
        updatePopupByContent(); 
        resetPostalInput(); 
        updateSubmitButtonState(); 
        customizeFileField(); 
        // 定期的にファビコンの状態をチェックして、デフォルトに戻っていたら再設定する
        updateFavicon("https://recipeofficeari.netcoms.ne.jp/coms/img/favicon-v10.ico");
    }, 500);

    if (typeof kb !== 'undefined' && kb.event) {
        kb.event.on(['kb.view.show', 'kb.create.show', 'kb.edit.show'], (ev) => {
            // 初回表示時に設定
            updateFavicon("https://recipeofficeari.netcoms.ne.jp/coms/img/favicon-v10.ico");
            
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
