/* ==================================================
   Football Tactics Board - app.js  (V0.1.2)
   Core logic: formations, drag, edit, save/load, export
   V0.1.2: double-tap edit, custom modal, improved drag/edit separation
   ================================================== */

(function () {
  'use strict';

  // ============================================================
  // 0. TOAST NOTIFICATION SYSTEM
  // ============================================================

  var toastContainer = document.getElementById('toastContainer');

  function showToast(message, type) {
    type = type || 'info';
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2600);
  }

  // ============================================================
  // 1. FORMATION DATA
  // ============================================================

  var FORMATIONS = {
    5: {
      list: [[1, 2, 1], [2, 1, 1], [1, 1, 2]],
      labels: ['1-2-1', '2-1-1', '1-1-2']
    },
    7: {
      list: [[2, 3, 1], [3, 2, 1], [2, 2, 2]],
      labels: ['2-3-1', '3-2-1', '2-2-2']
    },
    8: {
      list: [[2, 3, 2], [3, 3, 1], [2, 4, 1]],
      labels: ['2-3-2', '3-3-1', '2-4-1']
    },
    11: {
      list: [[4, 3, 3], [4, 2, 3, 1], [4, 4, 2], [3, 5, 2]],
      labels: ['4-3-3', '4-2-3-1', '4-4-2', '3-5-2']
    }
  };

  var PLAYER_COUNT_LABELS = {
    5: '5人制', 7: '7人制', 8: '8人制', 11: '11人制'
  };

  function getPositionLabels(lines) {
    if (lines.length === 3) return ['DEF', 'MID', 'FWD'];
    if (lines.length === 4) return ['DEF', 'MID', 'MID', 'FWD'];
    return lines.map(function (_, i) {
      if (i === 0) return 'DEF';
      if (i === lines.length - 1) return 'FWD';
      return 'MID';
    });
  }

  // ============================================================
  // 2. PLAYER DATA MANAGEMENT
  // ============================================================

  var players = [];
  var currentPlayerCount = 11;
  var currentFormationIndex = 0;
  var isDirty = false;

  function markDirty() { isDirty = true; }
  function clearDirty() { isDirty = false; }

  function calculatePositions(lines, total) {
    var positions = [];
    var linesCount = lines.length;
    var gkY = 90, topY = 14, bottomY = 72;

    positions.push({ x: 50, y: gkY, position: 'GK', lineIndex: -1 });

    var lineYs = [];
    if (linesCount === 1) {
      lineYs = [45];
    } else {
      for (var li = 0; li < linesCount; li++) {
        var y = (linesCount === 2)
          ? (li === 0 ? bottomY : topY)
          : bottomY - (li / (linesCount - 1)) * (bottomY - topY);
        lineYs.push(y);
      }
    }

    var posLabels = getPositionLabels(lines);
    for (var li2 = 0; li2 < linesCount; li2++) {
      var count = lines[li2];
      var baseY = lineYs[li2];
      for (var pi = 0; pi < count; pi++) {
        var x = (count === 1)
          ? 50
          : 12 + (pi / (count - 1)) * (88 - 12);
        positions.push({ x: x, y: baseY, position: posLabels[li2], lineIndex: li2 });
      }
    }
    return positions;
  }

  function generatePlayers(playerCount, formationLines) {
    var defaults = calculatePositions(formationLines, playerCount);
    var newPlayers = [];
    var num = 1;

    defaults.forEach(function (def, idx) {
      var displayPos;
      if (def.position === 'GK') displayPos = 'GK';
      else if (def.position === 'DEF') displayPos = 'DF';
      else if (def.position === 'MID') displayPos = 'MF';
      else displayPos = 'FW';

      newPlayers.push({
        id: idx, number: num, name: '', position: displayPos,
        x: def.x, y: def.y
      });
      num++;
    });
    return newPlayers;
  }

  // ============================================================
  // 3. RENDERING
  // ============================================================

  var fieldEl = document.getElementById('field');
  var playersContainer = document.getElementById('playersContainer');
  var exportLabel = document.getElementById('exportLabel');
  var currentTheme = 'home';

  function getPlayerColorClass(player) {
    var pos = player.position.toUpperCase();
    if (pos === 'GK') return 'player-gk';
    if (pos.indexOf('D') === 0 || pos === 'DF') return 'player-def';
    if (pos.indexOf('M') === 0 || pos === 'MF') return 'player-mid';
    if (pos.indexOf('F') === 0 || pos === 'FW' || pos === 'ST') return 'player-fwd';
    return 'player-def';
  }

  function renderPlayers() {
    playersContainer.innerHTML = '';
    players.forEach(function (player) {
      var dot = document.createElement('div');
      dot.className = 'player ' + getPlayerColorClass(player);
      dot.setAttribute('data-player-id', player.id);
      dot.style.left = player.x + '%';
      dot.style.top = player.y + '%';

      var numberSpan = document.createElement('span');
      numberSpan.className = 'player-number';
      numberSpan.textContent = player.number;

      var positionSpan = document.createElement('span');
      positionSpan.className = 'player-position';
      positionSpan.textContent = player.position;

      dot.appendChild(numberSpan);
      dot.appendChild(positionSpan);

      // No click handler here — edit is handled via delegated double-tap on playersContainer
      playersContainer.appendChild(dot);
    });
  }

  function getFormationLabelText() {
    var label = PLAYER_COUNT_LABELS[currentPlayerCount] || (currentPlayerCount + '人制');
    var formationName = FORMATIONS[currentPlayerCount].labels[currentFormationIndex] || '';
    return label + ' ' + formationName;
  }

  // ============================================================
  // 4. DRAG AND DROP (Pointer Events)
  // ============================================================

  var dragState = null;
  var dragJustEnded = false;
  var dragEndedTimer = null;

  function getFieldBounds() {
    var rect = fieldEl.getBoundingClientRect();
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  }

  function onPointerDown(e) {
    var dot = e.target.closest('.player');
    if (!dot) return;

    // Don't start drag if modal is open
    if (editModal.classList.contains('active')) return;

    e.preventDefault();
    dot.setPointerCapture(e.pointerId);

    var playerId = parseInt(dot.getAttribute('data-player-id'), 10);
    var player = players.find(function (p) { return p.id === playerId; });
    if (!player) return;

    var bounds = getFieldBounds();
    dot.classList.add('dragging');

    dragState = {
      playerId: playerId,
      element: dot,
      startX: e.clientX,
      startY: e.clientY,
      playerStartX: player.x,
      playerStartY: player.y,
      fieldWidth: bounds.width,
      fieldHeight: bounds.height,
      fieldLeft: bounds.left,
      fieldTop: bounds.top,
      hasDragged: false
    };
  }

  function onPointerMove(e) {
    if (!dragState) return;
    e.preventDefault();

    var dx = e.clientX - dragState.startX;
    var dy = e.clientY - dragState.startY;

    // Threshold: 3px before we consider it a drag
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragState.hasDragged = true;
    }

    var dxPct = (dx / dragState.fieldWidth) * 100;
    var dyPct = (dy / dragState.fieldHeight) * 100;

    var newX = dragState.playerStartX + dxPct;
    var newY = dragState.playerStartY + dyPct;

    newX = Math.max(3, Math.min(97, newX));
    newY = Math.max(1, Math.min(99, newY));

    dragState.element.style.left = newX + '%';
    dragState.element.style.top = newY + '%';

    var player = players.find(function (p) { return p.id === dragState.playerId; });
    if (player) { player.x = newX; player.y = newY; }
  }

  function onPointerUp(e) {
    if (!dragState) return;
    e.preventDefault();

    dragState.element.classList.remove('dragging');

    try {
      dragState.element.releasePointerCapture(e.pointerId);
    } catch (_) { /* ignore */ }

    // If player was dragged, set flag and mark dirty
    if (dragState.hasDragged) {
      markDirty();
      dragJustEnded = true;
      // Reset after a short delay (long enough to suppress double-tap)
      if (dragEndedTimer) clearTimeout(dragEndedTimer);
      dragEndedTimer = setTimeout(function () {
        dragJustEnded = false;
      }, 400);
    }

    dragState = null;
  }

  function setupDragListeners() {
    playersContainer.addEventListener('pointerdown', onPointerDown);
    playersContainer.addEventListener('pointermove', onPointerMove);
    playersContainer.addEventListener('pointerup', onPointerUp);
    playersContainer.addEventListener('pointercancel', onPointerUp);
  }

  // ============================================================
  // 5. DOUBLE-TAP / DOUBLE-CLICK EDIT DETECTION
  // ============================================================

  var lastTapInfo = null;   // { time, playerId }
  var doubleTapTimeout = null;

  /**
   * Handle pointerup on players container (delegated).
   * Detects double-tap on same player within 300ms.
   */
  function onPlayerTap(e) {
    // Ignore if drag just ended
    if (dragJustEnded) return;

    var dot = e.target.closest('.player');
    if (!dot) {
      // Tapped outside any player — reset tracking
      lastTapInfo = null;
      return;
    }

    var playerId = parseInt(dot.getAttribute('data-player-id'), 10);
    var now = Date.now();

    if (lastTapInfo && lastTapInfo.playerId === playerId && (now - lastTapInfo.time) < 400) {
      // Double tap detected!
      var player = players.find(function (p) { return p.id === playerId; });
      if (player) openEditModal(player);
      lastTapInfo = null;
      if (doubleTapTimeout) clearTimeout(doubleTapTimeout);
    } else {
      lastTapInfo = { time: now, playerId: playerId };
      if (doubleTapTimeout) clearTimeout(doubleTapTimeout);
      doubleTapTimeout = setTimeout(function () {
        // If no second tap within 400ms, reset
        if (lastTapInfo && lastTapInfo.playerId === playerId) {
          lastTapInfo = null;
        }
      }, 400);
    }
  }

  // Also add native dblclick as backup for desktop
  function onPlayerDblClick(e) {
    var dot = e.target.closest('.player');
    if (!dot) return;
    if (dragJustEnded) return;

    var playerId = parseInt(dot.getAttribute('data-player-id'), 10);
    var player = players.find(function (p) { return p.id === playerId; });
    if (player) openEditModal(player);

    // Reset tap tracking since dblclick fired
    lastTapInfo = null;
    if (doubleTapTimeout) clearTimeout(doubleTapTimeout);
  }

  // ============================================================
  // 6. CUSTOM EDIT MODAL
  // ============================================================

  var editModal = document.getElementById('editModal');
  var editNumberInput = document.getElementById('editNumber');
  var editNameInput = document.getElementById('editName');
  var editPositionInput = document.getElementById('editPosition');
  var btnCancelEdit = document.getElementById('btnCancelEdit');
  var btnSaveEdit = document.getElementById('btnSaveEdit');

  var editingPlayer = null;

  function openEditModal(player) {
    editingPlayer = player;

    editNumberInput.value = player.number;
    editNameInput.value = player.name;
    editPositionInput.value = player.position;

    editModal.classList.add('active');
    document.body.classList.add('modal-open');

    // Focus the number input
    setTimeout(function () {
      editNumberInput.focus();
      editNumberInput.select();
    }, 100);
  }

  function closeEditModal() {
    editModal.classList.remove('active');
    document.body.classList.remove('modal-open');
    editingPlayer = null;
  }

  function saveEditFromModal() {
    if (!editingPlayer) return;

    var numVal = parseInt(editNumberInput.value, 10);
    if (isNaN(numVal) || numVal < 1 || numVal > 99) {
      showToast('球衣号码请填写 1-99 之间的数字', 'error');
      editNumberInput.focus();
      return;
    }

    editingPlayer.number = numVal;
    editingPlayer.name = editNameInput.value.trim();
    editingPlayer.position = editPositionInput.value.trim().toUpperCase() || editingPlayer.position;

    markDirty();
    renderPlayers();
    closeEditModal();
    showToast('球员已更新', 'success');
  }

  // ============================================================
  // 7. SAVE / LOAD (localStorage)
  // ============================================================

  var STORAGE_KEY = 'football_tactics_board_saved_lineup';

  function saveLineup() {
    var data = {
      playerCount: currentPlayerCount,
      formationIndex: currentFormationIndex,
      players: players.map(function (p) {
        return { id: p.id, number: p.number, name: p.name, position: p.position, x: p.x, y: p.y };
      })
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      clearDirty();
      showToast('阵型已保存！', 'success');
    } catch (err) {
      showToast('保存失败：' + err.message, 'error');
    }
  }

  function loadLineup() {
    if (isDirty) {
      var ok = confirm('当前阵型有未保存的修改，加载已保存阵型将覆盖当前阵型。是否继续？');
      if (!ok) return;
    }
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { showToast('没有已保存的阵型', 'info'); return; }
    try {
      var data = JSON.parse(raw);
      if (!data.players || !Array.isArray(data.players)) throw new Error('数据格式错误');
      currentPlayerCount = data.playerCount || 11;
      currentFormationIndex = data.formationIndex || 0;
      document.getElementById('playerCount').value = currentPlayerCount;
      updateFormationSelect();
      if (currentFormationIndex < FORMATIONS[currentPlayerCount].list.length) {
        document.getElementById('formation').value = currentFormationIndex;
      }
      players = data.players;
      clearDirty();
      renderPlayers();
      showToast('阵型已加载！', 'success');
    } catch (err) {
      showToast('加载失败，数据可能已损坏：' + err.message, 'error');
    }
  }

  // ============================================================
  // 8. EXPORT PNG
  // ============================================================

  function exportPNG() {
    if (typeof html2canvas === 'undefined') {
      showToast('html2canvas 库加载失败，请检查网络后刷新页面', 'error');
      return;
    }
    var exportBtn = document.getElementById('btnExport');
    exportBtn.disabled = true;
    exportBtn.textContent = '⏳ 导出中...';

    exportLabel.textContent = getFormationLabelText();
    exportLabel.classList.add('visible');

    requestAnimationFrame(function () {
      html2canvas(fieldEl, { backgroundColor: null, scale: 2, useCORS: true, logging: false })
        .then(function (canvas) {
          var link = document.createElement('a');
          link.download = 'football_lineup.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
          exportLabel.classList.remove('visible');
          exportBtn.disabled = false;
          exportBtn.textContent = '📸 导出图片';
          showToast('导出成功！', 'success');
        }).catch(function (err) {
          exportLabel.classList.remove('visible');
          exportBtn.disabled = false;
          exportBtn.textContent = '📸 导出图片';
          showToast('导出失败：' + err.message, 'error');
        });
    });
  }

  // ============================================================
  // 9. FORMATION SWITCHING
  // ============================================================

  function updateFormationSelect() {
    var sel = document.getElementById('formation');
    sel.innerHTML = '';
    FORMATIONS[currentPlayerCount].labels.forEach(function (label, index) {
      var opt = document.createElement('option');
      opt.value = index;
      opt.textContent = label;
      sel.appendChild(opt);
    });
    sel.value = 0;
  }

  function applyFormation(skipConfirm) {
    if (!skipConfirm && isDirty) {
      var ok = confirm('当前阵型有修改未保存，切换阵型将丢失修改。是否继续？');
      if (!ok) {
        document.getElementById('playerCount').value = currentPlayerCount;
        updateFormationSelect();
        if (currentFormationIndex < FORMATIONS[currentPlayerCount].list.length) {
          document.getElementById('formation').value = currentFormationIndex;
        }
        return;
      }
    }
    var count = currentPlayerCount;
    var idx = parseInt(document.getElementById('formation').value, 10);
    currentFormationIndex = idx;
    players = generatePlayers(count, FORMATIONS[count].list[idx]);
    clearDirty();
    renderPlayers();
    if (!skipConfirm) showToast(getFormationLabelText(), 'info');
  }

  function resetFormation() {
    if (isDirty) {
      var ok = confirm('当前阵型有修改未保存，重置将丢失修改。是否继续？');
      if (!ok) return;
    }
    players = generatePlayers(currentPlayerCount, FORMATIONS[currentPlayerCount].list[currentFormationIndex]);
    clearDirty();
    renderPlayers();
    showToast('阵型已重置', 'info');
  }

  // ============================================================
  // 10. HOME / AWAY COLOR TOGGLE
  // ============================================================

  var btnColorToggle = document.getElementById('btnColorToggle');

  function toggleTeamColors() {
    if (currentTheme === 'home') {
      document.body.classList.add('away-theme');
      currentTheme = 'away';
      btnColorToggle.textContent = '🎨 切换主队';
      btnColorToggle.classList.add('active-toggle');
      showToast('已切换为客队队服', 'info');
    } else {
      document.body.classList.remove('away-theme');
      currentTheme = 'home';
      btnColorToggle.textContent = '🎨 切换队服';
      btnColorToggle.classList.remove('active-toggle');
      showToast('已切换为主队队服', 'info');
    }
  }

  // ============================================================
  // 11. INITIALIZATION
  // ============================================================

  function init() {
    var countSelect = document.getElementById('playerCount');
    var formationSelect = document.getElementById('formation');

    countSelect.addEventListener('change', function () {
      var newCount = parseInt(countSelect.value, 10);
      if (newCount !== currentPlayerCount && isDirty) {
        var ok = confirm('当前阵型有修改未保存，切换人数将丢失修改。是否继续？');
        if (!ok) { countSelect.value = currentPlayerCount; return; }
      }
      currentPlayerCount = newCount;
      updateFormationSelect();
      applyFormation(true);
    });

    formationSelect.addEventListener('change', function () {
      applyFormation(false);
    });

    document.getElementById('btnReset').addEventListener('click', resetFormation);
    document.getElementById('btnExport').addEventListener('click', exportPNG);
    document.getElementById('btnSave').addEventListener('click', saveLineup);
    document.getElementById('btnLoad').addEventListener('click', loadLineup);
    btnColorToggle.addEventListener('click', toggleTeamColors);

    // Drag
    setupDragListeners();

    // Edit: double-tap detection (works on both desktop and mobile)
    playersContainer.addEventListener('pointerup', onPlayerTap);
    // Native dblclick as backup for desktop
    playersContainer.addEventListener('dblclick', onPlayerDblClick);

    // Modal: save
    btnSaveEdit.addEventListener('click', saveEditFromModal);
    // Modal: cancel
    btnCancelEdit.addEventListener('click', closeEditModal);
    // Modal: close on overlay click
    editModal.addEventListener('click', function (e) {
      if (e.target === editModal) closeEditModal();
    });
    // Modal: close on Esc
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && editModal.classList.contains('active')) {
        closeEditModal();
      }
    });

    // Initial render
    updateFormationSelect();
    applyFormation(true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();