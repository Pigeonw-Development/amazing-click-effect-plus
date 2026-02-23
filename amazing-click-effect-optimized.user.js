// ==UserScript==
// @name         Amazing click effect!
// @namespace    http://tampermonkey.net/
// @version      1.14.1
// @description  Enjoy clicking time!
// @author       Super_Diu and twyeottk(1000ttank)
// @contributors Pigeonw Development
// @match        *://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/565342/Amazing%20click%20effect%21.user.js
// @updateURL https://update.greasyfork.org/scripts/565342/Amazing%20click%20effect%21.meta.js
// ==/UserScript==

(function() {
    'use strict';

    const defCfg = {
        BASE_SPD: 3,
        BASE_SPD_MAX: 5,
        BASE_CNT: 12,
        MAX_SPD_LIMIT: 15,
        MIN_SPD_LIMIT: 8,
        MAX_CNT: 30,
        LONG_PRESS: 800,
        SCALE_DUR: 3000,
        MAX_SIZE: 20,
        MIN_ALPHA_SPD: 8,
        ALPHA_SPD_BASE: 25,
        ALPHA_DECAY_SCALE: 1.1,
        TRI_SPD_DECAY: 0.998,
        DOT_R_MIN: 1,
        DOT_R_MAX: 3,
        DOT_INIT_SPD: 1.2,
        DOT_ACCEL: 0.2,
        DOT_ALPHA_SPD: 0.02,
        DOT_FADE_BASE: 0.03,
        DOT_SPAWN_R_MIN: 120,
        DOT_SPAWN_R_MAX: 350,
        DOT_ANGLE_JITTER: 0.3,
        SPD_ALPHA_FACTOR: 0.0001,
        BASE_COLL_PART_CNT: 8,
        MAX_COLL_PART_CNT: 20,
        BASE_COLL_SPD: 2,
        MAX_COLL_SPD: 10,
        BASE_COLL_SIZE: 2,
        MAX_COLL_SIZE: 5,
        MAX_TRACK: 6,
        DOT_TRACK: 3,
        SPD_FADE_FACTOR: 0.002,
        CHARGE_ALPHA_SCALE: 0.3,
        NORMAL_ALPHA_SCALE: 1.0
    };

    const cfg = {};
    Object.keys(defCfg).forEach(k => {
        cfg[k] = GM_getValue(k, defCfg[k]);
    });

    const decimalParams = new Set(['NORMAL_ALPHA_SCALE', 'CHARGE_ALPHA_SCALE', 'MAX_COLL_SPD']);

    function createCfgMenu() {
        GM_registerMenuCommand('⚙️ 点击特效配置', () => {
            const container = document.createElement('div');
            container.style.cssText = `
                position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
                background:#ffffff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.15);
                z-index:9999999;width:90%;max-width:900px;height:80vh;max-height:700px;
                display:flex;flex-direction:column;overflow:hidden;
                font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;
            `;

            const header = document.createElement('div');
            header.style.cssText = `
                display:flex;align-items:center;justify-content:space-between;
                padding:16px 20px;background:#f8fafc;border-bottom:1px solid #e2e8f0;
            `;
            container.appendChild(header);

            const menuBar = document.createElement('div');
            menuBar.style.cssText = `display:flex;gap:8px;`;
            header.appendChild(menuBar);

            const menuItems = [
                { id: 'cfg-panel', text: '配置面板' },
                { id: 'guide-panel', text: '使用说明' }
            ];

            menuItems.forEach(item => {
                const btn = document.createElement('button');
                btn.textContent = item.text;
                btn.style.cssText = `
                    padding:8px 16px;border:none;border-radius:6px;
                    background:${item.id === 'cfg-panel' ? '#3b82f6' : 'transparent'};
                    color:${item.id === 'cfg-panel' ? '#ffffff' : '#334155'};
                    cursor:pointer;transition:all 0.2s ease;
                    font-size:14px;font-weight:500;
                `;
                btn.dataset.target = item.id;
                btn.addEventListener('click', (e) => {
                    menuBar.querySelectorAll('button').forEach(b => {
                        b.style.background = b.dataset.target === e.target.dataset.target ? '#3b82f6' : 'transparent';
                        b.style.color = b.dataset.target === e.target.dataset.target ? '#ffffff' : '#334155';
                    });
                    document.querySelectorAll('.content-panel').forEach(panel => {
                        panel.style.display = panel.id === e.target.dataset.target ? 'block' : 'none';
                    });
                });
                menuBar.appendChild(btn);
            });

            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '×';
            closeBtn.style.cssText = `
                width:32px;height:32px;border:none;border-radius:50%;
                background:#fef2f2;color:#ef4444;cursor:pointer;
                font-size:20px;display:flex;align-items:center;justify-content:center;
                transition:all 0.2s ease;position:relative;z-index:1;outline:none;
            `;
            closeBtn.addEventListener('mouseenter', () => {
                closeBtn.style.background = '#ef4444';
                closeBtn.style.color = '#ffffff';
            });
            closeBtn.addEventListener('mouseleave', () => {
                closeBtn.style.background = '#fef2f2';
                closeBtn.style.color = '#ef4444';
            });
            closeBtn.addEventListener('click', () => {
                container.remove();
                mask.remove();
            });
            header.appendChild(closeBtn);

            const contentWrap = document.createElement('div');
            contentWrap.style.cssText = `
                flex:1;overflow-y:auto;padding:24px;max-height:100%;box-sizing:border-box;background:#fafafa;
            `;
            container.appendChild(contentWrap);

            const cfgPanel = document.createElement('div');
            cfgPanel.id = 'cfg-panel';
            cfgPanel.className = 'content-panel';
            cfgPanel.style.display = 'block';
            cfgPanel.innerHTML = `
                <h2 style="margin:0 0 24px 0;color:#1e293b;font-size:20px;font-weight:600;">点击特效配置</h2>
                <div style="margin-bottom:24px;padding:20px;background:#ffffff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                    <h3 style="margin:0 0 16px 0;color:#334155;font-size:16px;font-weight:600;">📌 普通点击专属参数</h3>
                    <div class="slider-group" data-param="BASE_SPD" style="margin:12px 0;display:flex;flex-direction:column;gap:8px;">
                        <label style="font-size:14px;color:#475569;font-weight:500;">普通点击基础速度</label>
                        <div class="slider-container" style="position:relative;width:100%;height:8px;border-radius:4px;background:#e2e8f0;">
                            <div class="slider-progress" style="position:absolute;top:0;left:0;height:100%;border-radius:4px;background:#3b82f6;width:${((cfg.BASE_SPD-1)/(10-1))*100}%;"></div>
                            <div class="slider-thumb" style="position:absolute;top:50%;transform:translate(-50%,-50%);width:20px;height:20px;border-radius:50%;background:#3b82f6;cursor:pointer;box-shadow:0 2px 6px rgba(59, 130, 246, 0.3);left:${((cfg.BASE_SPD-1)/(10-1))*100}%;"></div>
                            <input type="range" class="slider-input" min="1" max="10" step="1" value="${cfg.BASE_SPD}" style="opacity:0;position:absolute;top:0;left:0;width:100%;height:100%;margin:0;padding:0;cursor:pointer;">
                        </div>
                        <span class="slider-value" style="font-size:12px;color:#64748b;">当前值：${cfg.BASE_SPD}</span>
                    </div>
                    <div class="slider-group" data-param="BASE_SPD_MAX" style="margin:12px 0;display:flex;flex-direction:column;gap:8px;">
                        <label style="font-size:14px;color:#475569;font-weight:500;">普通点击最快速度</label>
                        <div class="slider-container" style="position:relative;width:100%;height:8px;border-radius:4px;background:#e2e8f0;">
                            <div class="slider-progress" style="position:absolute;top:0;left:0;height:100%;border-radius:4px;background:#3b82f6;width:${((cfg.BASE_SPD_MAX-3)/(15-3))*100}%;"></div>
                            <div class="slider-thumb" style="position:absolute;top:50%;transform:translate(-50%,-50%);width:20px;height:20px;border-radius:50%;background:#3b82f6;cursor:pointer;box-shadow:0 2px 6px rgba(59, 130, 246, 0.3);left:${((cfg.BASE_SPD_MAX-3)/(15-3))*100}%;"></div>
                            <input type="range" class="slider-input" min="3" max="15" step="1" value="${cfg.BASE_SPD_MAX}" style="opacity:0;position:absolute;top:0;left:0;width:100%;height:100%;margin:0;padding:0;cursor:pointer;">
                        </div>
                        <span class="slider-value" style="font-size:12px;color:#64748b;">当前值：${cfg.BASE_SPD_MAX}</span>
                    </div>
                    <div class="slider-group" data-param="BASE_CNT" style="margin:12px 0;display:flex;flex-direction:column;gap:8px;">
                        <label style="font-size:14px;color:#475569;font-weight:500;">普通点击生成数量</label>
                        <div class="slider-container" style="position:relative;width:100%;height:8px;border-radius:4px;background:#e2e8f0;">
                            <div class="slider-progress" style="position:absolute;top:0;left:0;height:100%;border-radius:4px;background:#3b82f6;width:${((cfg.BASE_CNT-5)/(20-5))*100}%;"></div>
                            <div class="slider-thumb" style="position:absolute;top:50%;transform:translate(-50%,-50%);width:20px;height:20px;border-radius:50%;background:#3b82f6;cursor:pointer;box-shadow:0 2px 6px rgba(59, 130, 246, 0.3);left:${((cfg.BASE_CNT-5)/(20-5))*100}%;"></div>
                            <input type="range" class="slider-input" min="5" max="20" step="1" value="${cfg.BASE_CNT}" style="opacity:0;position:absolute;top:0;left:0;width:100%;height:100%;margin:0;padding:0;cursor:pointer;">
                        </div>
                        <span class="slider-value" style="font-size:12px;color:#64748b;">当前值：${cfg.BASE_CNT}</span>
                    </div>
                    <div class="slider-group" data-param="NORMAL_ALPHA_SCALE" style="margin:12px 0;display:flex;flex-direction:column;gap:8px;">
                        <label style="font-size:14px;color:#475569;font-weight:500;">普通三角形消失速度倍率</label>
                        <div class="slider-container" style="position:relative;width:100%;height:8px;border-radius:4px;background:#e2e8f0;">
                            <div class="slider-progress" style="position:absolute;top:0;left:0;height:100%;border-radius:4px;background:#3b82f6;width:${((cfg.NORMAL_ALPHA_SCALE-0.1)/(2-0.1))*100}%;"></div>
                            <div class="slider-thumb" style="position:absolute;top:50%;transform:translate(-50%,-50%);width:20px;height:20px;border-radius:50%;background:#3b82f6;cursor:pointer;box-shadow:0 2px 6px rgba(59, 130, 246, 0.3);left:${((cfg.NORMAL_ALPHA_SCALE-0.1)/(2-0.1))*100}%;"></div>
                            <input type="range" class="slider-input" min="0.1" max="2" step="0.1" value="${cfg.NORMAL_ALPHA_SCALE}" style="opacity:0;position:absolute;top:0;left:0;width:100%;height:100%;margin:0;padding:0;cursor:pointer;">
                        </div>
                        <span class="slider-value" style="font-size:12px;color:#64748b;">当前值：${cfg.NORMAL_ALPHA_SCALE.toFixed(1)}</span>
                    </div>
                </div>
                <div style="margin-bottom:24px;padding:20px;background:#ffffff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                    <h3 style="margin:0 0 16px 0;color:#334155;font-size:16px;font-weight:600;">🚀 蓄力专属参数</h3>
                    <div class="slider-group" data-param="MIN_SPD_LIMIT" style="margin:12px 0;display:flex;flex-direction:column;gap:8px;">
                        <label style="font-size:14px;color:#475569;font-weight:500;">蓄力最慢速度</label>
                        <div class="slider-container" style="position:relative;width:100%;height:8px;border-radius:4px;background:#e2e8f0;">
                            <div class="slider-progress" style="position:absolute;top:0;left:0;height:100%;border-radius:4px;background:#3b82f6;width:${((cfg.MIN_SPD_LIMIT-5)/(15-5))*100}%;"></div>
                            <div class="slider-thumb" style="position:absolute;top:50%;transform:translate(-50%,-50%);width:20px;height:20px;border-radius:50%;background:#3b82f6;cursor:pointer;box-shadow:0 2px 6px rgba(59, 130, 246, 0.3);left:${((cfg.MIN_SPD_LIMIT-5)/(15-5))*100}%;"></div>
                            <input type="range" class="slider-input" min="5" max="15" step="1" value="${cfg.MIN_SPD_LIMIT}" style="opacity:0;position:absolute;top:0;left:0;width:100%;height:100%;margin:0;padding:0;cursor:pointer;">
                        </div>
                        <span class="slider-value" style="font-size:12px;color:#64748b;">当前值：${cfg.MIN_SPD_LIMIT}</span>
                    </div>
                    <div class="slider-group" data-param="MAX_SPD_LIMIT" style="margin:12px 0;display:flex;flex-direction:column;gap:8px;">
                        <label style="font-size:14px;color:#475569;font-weight:500;">蓄力最大速度</label>
                        <div class="slider-container" style="position:relative;width:100%;height:8px;border-radius:4px;background:#e2e8f0;">
                            <div class="slider-progress" style="position:absolute;top:0;left:0;height:100%;border-radius:4px;background:#3b82f6;width:${((cfg.MAX_SPD_LIMIT-10)/(30-10))*100}%;"></div>
                            <div class="slider-thumb" style="position:absolute;top:50%;transform:translate(-50%,-50%);width:20px;height:20px;border-radius:50%;background:#3b82f6;cursor:pointer;box-shadow:0 2px 6px rgba(59, 130, 246, 0.3);left:${((cfg.MAX_SPD_LIMIT-10)/(30-10))*100}%;"></div>
                            <input type="range" class="slider-input" min="10" max="30" step="1" value="${cfg.MAX_SPD_LIMIT}" style="opacity:0;position:absolute;top:0;left:0;width:100%;height:100%;margin:0;padding:0;cursor:pointer;">
                        </div>
                        <span class="slider-value" style="font-size:12px;color:#64748b;">当前值：${cfg.MAX_SPD_LIMIT}</span>
                    </div>
                    <div class="slider-group" data-param="MAX_CNT" style="margin:12px 0;display:flex;flex-direction:column;gap:8px;">
                        <label style="font-size:14px;color:#475569;font-weight:500;">蓄力最大生成数量</label>
                        <div class="slider-container" style="position:relative;width:100%;height:8px;border-radius:4px;background:#e2e8f0;">
                            <div class="slider-progress" style="position:absolute;top:0;left:0;height:100%;border-radius:4px;background:#3b82f6;width:${((cfg.MAX_CNT-20)/(50-20))*100}%;"></div>
                            <div class="slider-thumb" style="position:absolute;top:50%;transform:translate(-50%,-50%);width:20px;height:20px;border-radius:50%;background:#3b82f6;cursor:pointer;box-shadow:0 2px 6px rgba(59, 130, 246, 0.3);left:${((cfg.MAX_CNT-20)/(50-20))*100}%;"></div>
                            <input type="range" class="slider-input" min="20" max="50" step="1" value="${cfg.MAX_CNT}" style="opacity:0;position:absolute;top:0;left:0;width:100%;height:100%;margin:0;padding:0;cursor:pointer;">
                        </div>
                        <span class="slider-value" style="font-size:12px;color:#64748b;">当前值：${cfg.MAX_CNT}</span>
                    </div>
                    <div class="slider-group" data-param="LONG_PRESS" style="margin:12px 0;display:flex;flex-direction:column;gap:8px;">
                        <label style="font-size:14px;color:#475569;font-weight:500;">蓄力触发时间(ms)</label>
                        <div class="slider-container" style="position:relative;width:100%;height:8px;border-radius:4px;background:#e2e8f0;">
                            <div class="slider-progress" style="position:absolute;top:0;left:0;height:100%;border-radius:4px;background:#3b82f6;width:${((cfg.LONG_PRESS-500)/(2000-500))*100}%;"></div>
                            <div class="slider-thumb" style="position:absolute;top:50%;transform:translate(-50%,-50%);width:20px;height:20px;border-radius:50%;background:#3b82f6;cursor:pointer;box-shadow:0 2px 6px rgba(59, 130, 246, 0.3);left:${((cfg.LONG_PRESS-500)/(2000-500))*100}%;"></div>
                            <input type="range" class="slider-input" min="500" max="2000" step="100" value="${cfg.LONG_PRESS}" style="opacity:0;position:absolute;top:0;left:0;width:100%;height:100%;margin:0;padding:0;cursor:pointer;">
                        </div>
                        <span class="slider-value" style="font-size:12px;color:#64748b;">当前值：${cfg.LONG_PRESS}</span>
                    </div>
                    <div class="slider-group" data-param="CHARGE_ALPHA_SCALE" style="margin:12px 0;display:flex;flex-direction:column;gap:8px;">
                        <label style="font-size:14px;color:#475569;font-weight:500;">蓄力消失速度倍率</label>
                        <div class="slider-container" style="position:relative;width:100%;height:8px;border-radius:4px;background:#e2e8f0;">
                            <div class="slider-progress" style="position:absolute;top:0;left:0;height:100%;border-radius:4px;background:#3b82f6;width:${((cfg.CHARGE_ALPHA_SCALE-0.1)/(1-0.1))*100}%;"></div>
                            <div class="slider-thumb" style="position:absolute;top:50%;transform:translate(-50%,-50%);width:20px;height:20px;border-radius:50%;background:#3b82f6;cursor:pointer;box-shadow:0 2px 6px rgba(59, 130, 246, 0.3);left:${((cfg.CHARGE_ALPHA_SCALE-0.1)/(1-0.1))*100}%;"></div>
                            <input type="range" class="slider-input" min="0.1" max="1" step="0.1" value="${cfg.CHARGE_ALPHA_SCALE}" style="opacity:0;position:absolute;top:0;left:0;width:100%;height:100%;margin:0;padding:0;cursor:pointer;">
                        </div>
                        <span class="slider-value" style="font-size:12px;color:#64748b;">当前值：${cfg.CHARGE_ALPHA_SCALE.toFixed(1)}</span>
                    </div>
                </div>
                <div style="margin-bottom:24px;padding:20px;background:#ffffff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                    <h3 style="margin:0 0 16px 0;color:#334155;font-size:16px;font-weight:600;">🔧 核心通用参数</h3>
                    <div class="slider-group" data-param="MAX_SIZE" style="margin:12px 0;display:flex;flex-direction:column;gap:8px;">
                        <label style="font-size:14px;color:#475569;font-weight:500;">三角形最大尺寸</label>
                        <div class="slider-container" style="position:relative;width:100%;height:8px;border-radius:4px;background:#e2e8f0;">
                            <div class="slider-progress" style="position:absolute;top:0;left:0;height:100%;border-radius:4px;background:#3b82f6;width:${((cfg.MAX_SIZE-10)/(30-10))*100}%;"></div>
                            <div class="slider-thumb" style="position:absolute;top:50%;transform:translate(-50%,-50%);width:20px;height:20px;border-radius:50%;background:#3b82f6;cursor:pointer;box-shadow:0 2px 6px rgba(59, 130, 246, 0.3);left:${((cfg.MAX_SIZE-10)/(30-10))*100}%;"></div>
                            <input type="range" class="slider-input" min="10" max="30" step="1" value="${cfg.MAX_SIZE}" style="opacity:0;position:absolute;top:0;left:0;width:100%;height:100%;margin:0;padding:0;cursor:pointer;">
                        </div>
                        <span class="slider-value" style="font-size:12px;color:#64748b;">当前值：${cfg.MAX_SIZE}</span>
                    </div>
                    <div class="slider-group" data-param="MAX_COLL_SPD" style="margin:12px 0;display:flex;flex-direction:column;gap:8px;">
                        <label style="font-size:14px;color:#475569;font-weight:500;">碰撞粒子最大速度</label>
                        <div class="slider-container" style="position:relative;width:100%;height:8px;border-radius:4px;background:#e2e8f0;">
                            <div class="slider-progress" style="position:absolute;top:0;left:0;height:100%;border-radius:4px;background:#3b82f6;width:${((cfg.MAX_COLL_SPD-5)/(20-5))*100}%;"></div>
                            <div class="slider-thumb" style="position:absolute;top:50%;transform:translate(-50%,-50%);width:20px;height:20px;border-radius:50%;background:#3b82f6;cursor:pointer;box-shadow:0 2px 6px rgba(59, 130, 246, 0.3);left:${((cfg.MAX_COLL_SPD-5)/(20-5))*100}%;"></div>
                            <input type="range" class="slider-input" min="5" max="20" step="0.5" value="${cfg.MAX_COLL_SPD}" style="opacity:0;position:absolute;top:0;left:0;width:100%;height:100%;margin:0;padding:0;cursor:pointer;">
                        </div>
                        <span class="slider-value" style="font-size:12px;color:#64748b;">当前值：${cfg.MAX_COLL_SPD.toFixed(1)}</span>
                    </div>
                    <div class="slider-group" data-param="MAX_TRACK" style="margin:12px 0;display:flex;flex-direction:column;gap:8px;">
                        <label style="font-size:14px;color:#475569;font-weight:500;">三角形尾迹长度</label>
                        <div class="slider-container" style="position:relative;width:100%;height:8px;border-radius:4px;background:#e2e8f0;">
                            <div class="slider-progress" style="position:absolute;top:0;left:0;height:100%;border-radius:4px;background:#3b82f6;width:${((cfg.MAX_TRACK-2)/(15-2))*100}%;"></div>
                            <div class="slider-thumb" style="position:absolute;top:50%;transform:translate(-50%,-50%);width:20px;height:20px;border-radius:50%;background:#3b82f6;cursor:pointer;box-shadow:0 2px 6px rgba(59, 130, 246, 0.3);left:${((cfg.MAX_TRACK-2)/(15-2))*100}%;"></div>
                            <input type="range" class="slider-input" min="2" max="15" step="1" value="${cfg.MAX_TRACK}" style="opacity:0;position:absolute;top:0;left:0;width:100%;height:100%;margin:0;padding:0;cursor:pointer;">
                        </div>
                        <span class="slider-value" style="font-size:12px;color:#64748b;">当前值：${cfg.MAX_TRACK}</span>
                    </div>
                    <div class="slider-group" data-param="DOT_TRACK" style="margin:12px 0;display:flex;flex-direction:column;gap:8px;">
                        <label style="font-size:14px;color:#475569;font-weight:500;">圆点尾迹长度</label>
                        <div class="slider-container" style="position:relative;width:100%;height:8px;border-radius:4px;background:#e2e8f0;">
                            <div class="slider-progress" style="position:absolute;top:0;left:0;height:100%;border-radius:4px;background:#3b82f6;width:${((cfg.DOT_TRACK-1)/(8-1))*100}%;"></div>
                            <div class="slider-thumb" style="position:absolute;top:50%;transform:translate(-50%,-50%);width:20px;height:20px;border-radius:50%;background:#3b82f6;cursor:pointer;box-shadow:0 2px 6px rgba(59, 130, 246, 0.3);left:${((cfg.DOT_TRACK-1)/(8-1))*100}%;"></div>
                            <input type="range" class="slider-input" min="1" max="8" step="1" value="${cfg.DOT_TRACK}" style="opacity:0;position:absolute;top:0;left:0;width:100%;height:100%;margin:0;padding:0;cursor:pointer;">
                        </div>
                        <span class="slider-value" style="font-size:12px;color:#64748b;">当前值：${cfg.DOT_TRACK}</span>
                    </div>
                </div>
                <div style="display:flex;gap:12px;margin-top:24px;">
                    <button id="saveBtn" style="padding:10px 20px;background:#10b981;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:500;transition:all 0.2s;">
                        保存配置
                    </button>
                    <button id="resetBtn" style="padding:10px 20px;background:#f59e0b;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:500;transition:all 0.2s;">
                        重置默认值
                    </button>
                </div>
            `;
            contentWrap.appendChild(cfgPanel);

            const guidePanel = document.createElement('div');
            guidePanel.id = 'guide-panel';
            guidePanel.className = 'content-panel';
            guidePanel.style.display = 'none';
            guidePanel.innerHTML = `
                <h2 style="margin:0 0 24px 0;color:#1e293b;font-size:20px;font-weight:600;">使用说明</h2>
                <div style="font-size:14px;line-height:1.8;color:#475569;background:#ffffff;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                    <div style="margin-bottom:20px;">
                        <h4 style="margin:0 0 12px 0;color:#334155;font-size:16px;font-weight:600;">1. 基础操作</h4>
                        <ul style="margin:0;padding-left:20px;">
                            <li>点击：释放蓝色三角</li>
                            <li>长按：蓄力越久，威力越大</li>
                            <li>开启碰撞模式：按下键盘左上角 "~"（ESC下面）开启，所有三角形都会爆炸！</li>
                        </ul>
                    </div>
                    <div style="margin-bottom:20px;">
                        <h4 style="margin:0 0 12px 0;color:#334155;font-size:16px;font-weight:600;">2. 注意事项</h4>
                        <ul style="margin:0;padding-left:20px;">
                            <li>配置修改后需点击「保存配置」才能生效</li>
                            <li>最慢速度建议大于最快速度（不然到底是最大还是最小？）</li>
                            <li>参数值过大可能导致卡顿哦~</li>
                        </ul>
                    </div>
                    <div style="margin-bottom:0;">
                        <h4 style="margin:0 0 12px 0;color:#334155;font-size:16px;font-weight:600;">3. 开发人员</h4>
                        <ul style="margin:0;padding-left:20px;">
                            <li>Super_Diu（uid：1057013）项目开创者</li>
                            <li>twyeottk （uid：1635665）项目合作者（比楼上厉害）</li>
                            <li>doubao（uid：？）项目开发者</li>
                        </ul>
                    </div>
                </div>
            `;
            contentWrap.appendChild(guidePanel);

            const mask = document.createElement('div');
            mask.style.cssText = `
                position:fixed;top:0;left:0;width:100%;height:100%;
                background:rgba(0,0,0,0.5);z-index:9999998;backdrop-filter:blur(2px);
            `;
            document.body.appendChild(mask);
            document.body.appendChild(container);

            function initSlider(sliderGroup) {
                const container = sliderGroup.querySelector('.slider-container');
                const progress = sliderGroup.querySelector('.slider-progress');
                const thumb = sliderGroup.querySelector('.slider-thumb');
                const input = sliderGroup.querySelector('.slider-input');
                const valueDisplay = sliderGroup.querySelector('.slider-value');
                const paramName = sliderGroup.dataset.param;

                const min = parseFloat(input.min);
                const max = parseFloat(input.max);
                const step = parseFloat(input.step);

                const showDecimal = decimalParams.has(paramName);

                const getPercent = (value) => {
                    return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
                };

                const formatValue = (value) => {
                    if (showDecimal) {
                        return value.toFixed(1);
                    }
                    return Math.round(value).toString();
                };

                const updateSlider = (value, animate = false) => {
                    const percent = getPercent(value);

                    if (animate) {
                        progress.style.transition = 'width 0.2s ease';
                        thumb.style.transition = 'left 0.2s ease';
                    } else {
                        progress.style.transition = 'none';
                        thumb.style.transition = 'none';
                    }

                    progress.style.width = `${percent}%`;
                    thumb.style.left = `${percent}%`;

                    input.value = value;

                    valueDisplay.textContent = `当前值：${formatValue(value)}`;
                };

                const getValueFromMouse = (clientX) => {
                    const rect = container.getBoundingClientRect();
                    const mouseX = Math.max(0, Math.min(rect.width, clientX - rect.left));
                    const percent = (mouseX / rect.width);
                    let value = min + percent * (max - min);

                    if (step !== 1) {
                        value = Math.round(value / step) * step;
                    } else {
                        value = Math.round(value);
                    }

                    return Math.max(min, Math.min(max, value));
                };

                updateSlider(parseFloat(input.value), false);

                let isDragging = false;

                const handleMouseDown = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    isDragging = true;

                    const value = getValueFromMouse(e.clientX);
                    updateSlider(value, false);

                    const handleMouseMove = (e) => {
                        if (!isDragging) return;
                        const value = getValueFromMouse(e.clientX);
                        updateSlider(value, false);
                    };

                    const handleMouseUp = () => {
                        if (!isDragging) return;
                        isDragging = false;

                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                        document.removeEventListener('mouseleave', handleMouseUp);
                    };

                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                    document.addEventListener('mouseleave', handleMouseUp);
                };

                thumb.addEventListener('mousedown', handleMouseDown);
                container.addEventListener('mousedown', handleMouseDown);

                input.addEventListener('input', () => {
                    updateSlider(parseFloat(input.value), true);
                });

                sliderGroup.getValue = () => {
                    return parseFloat(input.value);
                };
            }

            document.querySelectorAll('.slider-group').forEach(initSlider);

            document.getElementById('saveBtn').addEventListener('click', () => {
                document.querySelectorAll('.slider-group').forEach(group => {
                    const paramName = group.dataset.param;
                    const value = group.getValue();
                    GM_setValue(paramName, value);
                    cfg[paramName] = value;
                });

                alert('配置保存成功！立即生效');
                container.remove();
                mask.remove();
            });

            document.getElementById('resetBtn').addEventListener('click', () => {
                if (confirm('确定要重置所有配置为默认值吗？')) {
                    Object.keys(defCfg).forEach(k => {
                        GM_setValue(k, defCfg[k]);
                        cfg[k] = defCfg[k];
                    });
                    alert('已重置为默认配置！');
                    container.remove();
                    mask.remove();
                    location.reload();
                }
            });
        });
    }

    function clickTriEffect() {
        let tris = [];
        let dots = [];
        let cvs, ctx;
        let w, h;

        const blueColors = ["#1E90FF", "#4169E1", "#00BFFF", "#87CEFA", "#6495ED", "#0099FF", "#7B68EE"];
        const triTypes = ["acute", "right", "obtuse", "isosceles", "equilateral"];
        let MAX_TRACK = cfg.MAX_TRACK;
        let DOT_TRACK = cfg.DOT_TRACK;

        let pressStart = 0;
        let isPress = false;
        let px = 0, py = 0;
        let lastDotSpawn = 0;
        const DOT_INTERVAL = 150;
        let collMode = false;
        const CONTENT_TAGS = new Set(['P', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'A', 'LI', 'TD', 'IMG', 'CANVAS', 'SVG', 'VIDEO']);
        const INTERACTIVE_TAGS = new Set(['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT', 'TEXTAREA', 'LABEL', 'FORM']);

        cvs = document.createElement("canvas");
        document.body.appendChild(cvs);
        cvs.setAttribute("style", "width:100%;height:100%;top:0;left:0;z-index:99999;position:fixed;pointer-events:none;");
        ctx = cvs.getContext("2d");
        updateCvsSize();
        window.addEventListener('resize', updateCvsSize, false);
        requestAnimationFrame(loop);

        window.addEventListener("keydown", function(e) {
            if (e.keyCode === 192) {
                const activeEl = document.activeElement;
                if (INTERACTIVE_TAGS.has(activeEl.tagName) || activeEl.isContentEditable) {
                    return;
                } else {
                    collMode = !collMode;
                    e.preventDefault();
                }
            }
        });

        window.addEventListener("mousedown", function(e){
            isPress = true;
            pressStart = Date.now();
            px = e.clientX;
            py = e.clientY;
            lastDotSpawn = Date.now();
        });

        window.addEventListener("mouseup", createEffect);
        window.addEventListener("mouseout", function(){
            isPress = false;
            pressStart = 0;
            dots.forEach(dot => dot.needFade = true);
        });

        window.addEventListener("mousemove", function(e){
            if(isPress){
                px = e.clientX;
                py = e.clientY;
                dots.forEach(dot => {
                    if(!dot.arrived && !dot.hasColl) {
                        dot.tx = px;
                        dot.ty = py;
                        dot.angle = Math.atan2(dot.ty - dot.y, dot.tx - dot.x);
                    }
                });
            }
        });

        function updateCvsSize(){
            cvs.width = window.innerWidth * 2;
            cvs.height = window.innerHeight * 2;
            cvs.style.width = window.innerWidth + 'px';
            cvs.style.height = window.innerHeight + 'px';
            ctx.scale(2,2);
            w = window.innerWidth;
            h = window.innerHeight;
        }

        function alphaToHex(alpha){
            const hex = Math.floor(Math.max(0, Math.min(255, alpha*255))).toString(16);
            return hex.length===1 ? '0'+hex : hex;
        }

        function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
        function randFloat(min,max){ return Math.random()*(max-min)+min; }

        function isRealContentEl(el) {
            if (!el) return false;
            if (INTERACTIVE_TAGS.has(el.tagName)) return false;
            if (['IMG', 'CANVAS', 'SVG', 'VIDEO'].includes(el.tagName)) return true;
            if (CONTENT_TAGS.has(el.tagName)) {
                const text = el.textContent?.trim() || '';
                const rect = el.getBoundingClientRect();
                const hasSize = rect.width > 0 && rect.height > 0;
                const isVisible = window.getComputedStyle(el).display !== 'none' &&
                                  window.getComputedStyle(el).visibility !== 'hidden';
                return text.length > 0 && hasSize && isVisible;
            }
            const parent = el.parentElement;
            return parent ? isRealContentEl(parent) : false;
        }

        function isPointOnContent(x, y) {
            const el = document.elementFromPoint(x, y);
            if (!el || el === cvs) return false;
            return isRealContentEl(el);
        }

        function checkColl(x, y) {
            if (!collMode) return false;
            if (x < 0 || x > w || y < 0 || y > h) return true;
            return isPointOnContent(x, y);
        }

        function getBounceRange(flyAngle) {
            flyAngle = flyAngle % (Math.PI * 2);
            if (flyAngle < 0) flyAngle += Math.PI * 2;

            let minAngle, maxAngle;
            if (flyAngle >= Math.PI/2 && flyAngle <= Math.PI*3/2) {
                if (flyAngle >= Math.PI/2 && flyAngle <= Math.PI) {
                    minAngle = -Math.PI;
                    maxAngle = 0;
                } else {
                    minAngle = -Math.PI/2;
                    maxAngle = Math.PI/2;
                }
            } else {
                if (flyAngle < Math.PI/2) {
                    minAngle = -Math.PI/2;
                    maxAngle = Math.PI/2;
                } else {
                    minAngle = Math.PI/2;
                    maxAngle = Math.PI*3/2;
                }
            }

            if (flyAngle > Math.PI/4 && flyAngle < Math.PI*3/4) {
                minAngle = -Math.PI;
                maxAngle = 0;
            } else if (flyAngle > Math.PI*5/4 && flyAngle < Math.PI*7/4) {
                minAngle = -Math.PI/2;
                maxAngle = Math.PI/2;
            }

            return { minAngle, maxAngle };
        }

        function createCollEffect(x, y, color, size, flyAngle, spd) {
            const sizeRatio = Math.min(1, size / cfg.MAX_SIZE);
            const spdRatio = Math.min(1, spd / cfg.MAX_SPD_LIMIT);
            const partCnt = Math.floor(cfg.BASE_COLL_PART_CNT + sizeRatio * (cfg.MAX_COLL_PART_CNT - cfg.BASE_COLL_PART_CNT));
            const maxSpd = cfg.BASE_COLL_SPD + spdRatio * (cfg.MAX_COLL_SPD - cfg.BASE_COLL_SPD);
            const maxSize = cfg.BASE_COLL_SIZE + sizeRatio * (cfg.MAX_COLL_SIZE - cfg.BASE_COLL_SIZE);
            const { minAngle, maxAngle } = getBounceRange(flyAngle);

            for (let i = 0; i < partCnt; i++) {
                const angle = randFloat(minAngle, maxAngle);
                const centerAngle = (minAngle + maxAngle) / 2;
                const spdFactor = Math.cos(angle - centerAngle);
                const partSpd = randFloat(maxSpd * 0.7, maxSpd) * (0.9 + spdFactor * 0.3);
                const partSize = randFloat(maxSize * 0.5, maxSize);

                tris.push(new CollPart(
                    x, y,
                    angle,
                    partSpd,
                    partSize,
                    color,
                    sizeRatio
                ));
            }
        }

        function createEffect(){
            if(!isPress) return;
            const pressDur = Date.now() - pressStart;
            isPress = false;
            pressStart = 0;
            dots.forEach(dot => dot.needFade = true);

            let sizeMin = 7, sizeMax = 13;
            let alphaSpdMin = cfg.ALPHA_SPD_BASE, alphaSpdMax = 35;
            let createCnt = cfg.BASE_CNT;
            let spdMin, spdMax;
            let isCharge = false;

            if(pressDur < cfg.LONG_PRESS){
                spdMin = cfg.BASE_SPD;
                spdMax = cfg.BASE_SPD_MAX;
            } else {
                isCharge = true;
                const over = pressDur - cfg.LONG_PRESS;
                const scale = Math.min(1, over/cfg.SCALE_DUR);
                createCnt = Math.floor(cfg.BASE_CNT + scale*(cfg.MAX_CNT - cfg.BASE_CNT));
                sizeMax = 13 + scale*(cfg.MAX_SIZE - 13);
                spdMin = cfg.MIN_SPD_LIMIT;
                spdMax = cfg.MAX_SPD_LIMIT;
                alphaSpdMin = cfg.ALPHA_SPD_BASE - scale*(cfg.ALPHA_SPD_BASE - cfg.MIN_ALPHA_SPD);
                alphaSpdMax = 35 - scale*(35 - cfg.MIN_ALPHA_SPD);
            }

            for(let i=0;i<createCnt;i++){
                const triSpd = randFloat(spdMin, spdMax);
                let triAlphaSpd = randFloat(alphaSpdMin, alphaSpdMax);
                triAlphaSpd = (Math.min(triAlphaSpd + triSpd * (isCharge ? 0.5 : 2), 50) / (1000 * cfg.ALPHA_DECAY_SCALE)) + (triSpd * cfg.SPD_FADE_FACTOR);
                const triSize = randInt(sizeMin, sizeMax);
                tris.push(new Triangle(px, py, triSize, triSpd, triAlphaSpd, isCharge));
            }
        }

        class CollPart {
            constructor(x, y, angle, spd, size, color, sizeRatio) {
                this.x = x;
                this.y = y;
                this.angle = angle;
                this.spd = spd;
                this.size = size;
                this.color = color;
                this.alpha = 1;
                this.alphaSpd = randFloat(0.012, 0.025) * (1 - sizeRatio * 0.5);
                this.sizeSpd = randFloat(0.04, 0.08) * (1 - sizeRatio * 0.4);
                this.isCollPart = true;
                this.decel = 0.97;
                this.decelStep = 0.005;
            }

            update() {
                if (this.alpha <= 0) return;
                this.x += Math.cos(this.angle) * this.spd;
                this.y += Math.sin(this.angle) * this.spd;
                this.spd *= this.decel;
                this.decel = Math.max(0.92, this.decel - this.decelStep);
                this.alpha = Math.max(0, this.alpha - this.alphaSpd);
                this.size = Math.max(0, this.size - this.sizeSpd);
            }

            draw() {
                if (this.alpha <= 0 || this.size <= 0) return;
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }

        class Dot {
            constructor(tx,ty){
                this.tx = tx; this.ty = ty;
                this.hasColl = false;
                let x, y, attempts = 0;
                do {
                    const r = randFloat(cfg.DOT_SPAWN_R_MIN, cfg.DOT_SPAWN_R_MAX);
                    let angle = randFloat(0, Math.PI*2);
                    angle += randFloat(-cfg.DOT_ANGLE_JITTER, cfg.DOT_ANGLE_JITTER);
                    x = tx + Math.cos(angle)*r;
                    y = ty + Math.sin(angle)*r;
                    attempts++;
                } while (isPointOnContent(x, y) && attempts < 30);

                this.x = x;
                this.y = y;
                this.r = randFloat(cfg.DOT_R_MIN, cfg.DOT_R_MAX);
                this.color = blueColors[Math.floor(Math.random()*blueColors.length)];
                this.alpha = 0;
                this.spd = cfg.DOT_INIT_SPD + randFloat(-0.2, 0.2);
                this.accel = cfg.DOT_ACCEL + randFloat(-0.05, 0.05);
                this.needFade = false;
                this.angle = Math.atan2(ty - this.y, tx - this.x);
                this.track = [];
                this.arrived = false;
            }

            addTrack(){
                if(this.arrived || this.hasColl) return;
                this.track.push({x:this.x,y:this.y,alpha:this.alpha,r:this.r});
                if(this.track.length>DOT_TRACK) this.track.shift();
            }

            update(){
                if(this.arrived || this.hasColl){
                    this.alpha=0;
                    this.track = [];
                    return;
                }

                if (collMode && checkColl(this.x, this.y)) {
                    this.hasColl = true;
                    this.alpha = 0;
                    this.track = [];
                    return;
                }

                this.addTrack();
                const spdFactor = 1+this.spd*cfg.SPD_ALPHA_FACTOR;
                this.alpha = this.needFade ? Math.max(0,this.alpha-cfg.DOT_FADE_BASE*spdFactor)
                                           : Math.min(1,this.alpha+cfg.DOT_ALPHA_SPD*spdFactor);
                const dx = this.tx - this.x;
                const dy = this.ty - this.y;
                const dist = Math.sqrt(dx*dx+dy*dy);
                const nextStep = this.spd+this.accel;
                if(dist<=this.r*3 || nextStep>=dist){
                    this.arrived=true;
                    this.alpha=0;
                    this.track=[];
                    this.x=this.tx;
                    this.y=this.ty;
                } else {
                    this.spd = Math.min(this.spd+this.accel,8);
                    this.x += Math.cos(this.angle)*this.spd;
                    this.y += Math.sin(this.angle)*this.spd;
                }
            }

            drawTrail(){
                if(this.track.length<2 || this.alpha<=0 || this.arrived || this.hasColl) return;
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(this.track[0].x,this.track[0].y);
                for(let i=1;i<this.track.length;i++) ctx.lineTo(this.track[i].x,this.track[i].y);
                const lineW = this.r*0.3;
                if(lineW<=0){ctx.restore();return;}
                const grad = ctx.createLinearGradient(
                    this.track[0].x,this.track[0].y,
                    this.track[this.track.length-1].x,this.track[this.track.length-1].y
                );
                grad.addColorStop(0, `${this.color}1A`);
                grad.addColorStop(1, `${this.color}${alphaToHex(Math.min(0.6,this.alpha))}`);
                ctx.lineWidth = lineW;
                ctx.lineCap="butt";
                ctx.lineJoin="miter";
                ctx.strokeStyle = grad;
                ctx.stroke();
                ctx.restore();
            }

            draw(){
                if(this.alpha<=0||this.arrived||this.hasColl) return;
                this.drawTrail();
                ctx.save();
                ctx.globalAlpha=this.alpha;
                ctx.fillStyle=this.color;
                ctx.beginPath();
                ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }

        class Triangle {
            constructor(x,y,size,spd,alphaSpd,isCharge){
                this.x=x;this.y=y;
                this.angle=Math.random()*Math.PI*2;
                this.spd=spd;
                this.rotSpd=(Math.random()-0.5)*18;
                this.rot=0;
                this.size=size;
                this.color=blueColors[Math.floor(Math.random()*blueColors.length)];
                this.type=triTypes[Math.floor(Math.random()*triTypes.length)];
                this.alpha=1;
                this.alphaSpd=alphaSpd;
                this.sizeSpd=randInt(5,12)/2000;
                this.track=[];
                this.hasColl = false;
                this.isCharge = isCharge || false;
            }

            update(){
                if(this.alpha<=0) return;

                if (collMode && !this.hasColl && checkColl(this.x, this.y)) {
                    this.hasColl = true;
                    createCollEffect(this.x, this.y, this.color, this.size, this.angle, this.spd);
                    this.alpha = 0;
                    return;
                }
                this.addTrack();
                this.spd *= cfg.TRI_SPD_DECAY;
                this.x += Math.cos(this.angle) * this.spd;
                this.y += Math.sin(this.angle) * this.spd;
                this.rot += this.rotSpd;
                this.size = Math.max(1, this.size - this.sizeSpd);

                const alphaScale = this.isCharge ? cfg.CHARGE_ALPHA_SCALE : cfg.NORMAL_ALPHA_SCALE;
                this.alpha = Math.max(0, this.alpha - this.alphaSpd * alphaScale);
            }

            addTrack(){
                this.track.push({x:this.x,y:this.y,size:this.size,alpha:this.alpha});
                if(this.track.length>MAX_TRACK) this.track.shift();
            }

            drawSingle(ctx,x,y,rot,size,alpha){
                if(alpha<=0||size<=0) return;
                ctx.save();
                ctx.globalAlpha=alpha;
                ctx.translate(x,y);
                ctx.rotate(rot*Math.PI/180);
                ctx.fillStyle=this.color;
                ctx.beginPath();
                switch(this.type){
                    case"acute":ctx.moveTo(0,-size);ctx.lineTo(size*0.7,size*0.6);ctx.lineTo(-size*0.7,size*0.6);break;
                    case"right":ctx.moveTo(0,-size*0.8);ctx.lineTo(size*0.8,size*0.8);ctx.lineTo(-size*0.8,size*0.8);break;
                    case"obtuse":ctx.moveTo(0,-size);ctx.lineTo(size*1.0,size*0.4);ctx.lineTo(-size*1.0,size*0.4);break;
                    case"isosceles":ctx.moveTo(0,-size);ctx.lineTo(size*0.6,size*0.8);ctx.lineTo(-size*0.6,size*0.8);break;
                    case"equilateral":const h=size*Math.sqrt(3)/2;ctx.moveTo(0,-h/2);ctx.lineTo(size/2,h/2);ctx.lineTo(-size/2,h/2);break;
                }
                ctx.closePath();ctx.fill();ctx.restore();
            }

            drawTrail(ctx){
                if(this.track.length<2||this.alpha<=0) return;
                const trackCnt=this.track.length;
                const startP=this.track[0];
                const endP=this.track[trackCnt-1];
                const trailAngle=Math.atan2(endP.y-startP.y,endP.x-startP.x);
                const endW=endP.size*0.3;
                const startW=endW*0.05;
                ctx.save();
                const endLX=endP.x+Math.cos(trailAngle+Math.PI/2)*endW;
                const endLY=endP.y+Math.sin(trailAngle+Math.PI/2)*endW;
                const endRX=endP.x+Math.cos(trailAngle-Math.PI/2)*endW;
                const endRY=endP.y+Math.sin(trailAngle-Math.PI/2)*endW;
                const startX=startP.x+Math.cos(trailAngle)*startW;
                const startY=startP.y+Math.sin(trailAngle)*startW;
                ctx.beginPath();
                ctx.moveTo(endLX,endLY);
                ctx.lineTo(endRX,endRY);
                ctx.lineTo(startX,startY);
                ctx.closePath();
                const grad=ctx.createLinearGradient(endP.x,endP.y,startP.x,startP.y);
                grad.addColorStop(0,`${this.color}${alphaToHex(Math.min(0.4,this.alpha))}`);
                grad.addColorStop(1,`${this.color}10`);
                ctx.fillStyle=grad;
                ctx.fill();
                ctx.restore();
            }

            draw(){if(this.alpha<=0) return; this.drawTrail(ctx); this.drawSingle(ctx,this.x,this.y,this.rot,this.size,this.alpha);}
        }

        function loop(){
            ctx.clearRect(0,0,w,h);
            if(isPress){
                const pressDur=Date.now()-pressStart;
                if(pressDur >= cfg.LONG_PRESS){
                    const now=Date.now();
                    if(now-lastDotSpawn>=DOT_INTERVAL){
                        dots.push(new Dot(px,py));
                        lastDotSpawn=now;
                    }
                }
            }
            dots.forEach(dot=>dot.update());
            dots.forEach(dot=>dot.draw());
            dots=dots.filter(dot=>dot.alpha>0&&!dot.arrived&&!dot.hasColl);
            tris.forEach(tri=>{
                if (tri.isCollPart) {
                    tri.update();
                } else {
                    tri.update();
                }
            });
            tris.forEach(tri=>{
                if (tri.isCollPart) {
                    tri.draw();
                } else {
                    tri.draw();
                }
            });
            tris=tris.filter(tri=>{
                if (tri.isCollPart) {
                    return tri.alpha > 0 && tri.size > 0;
                } else {
                    return tri.alpha > 0 && !tri.hasColl;
                }
            });
            requestAnimationFrame(loop);
        }
    }

    createCfgMenu();
    clickTriEffect();
})();
