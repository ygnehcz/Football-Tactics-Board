/* ==================================================
   Football Tactics Board - app.js  (V0.1.1)
   Core logic: formations, drag, edit, save/load, export
   New in V0.1.1: toast notifications, dirty-state confirm,
   export label, home/away color toggle
   ================================================== */

(function () {
  'use strict';

  // ============================================================
  // 0. TOAST NOTIFICATION SYSTEM
  // ============================================================

  var toastContainer = document.getElementById('toastContainer');

  /**
   * Show a toast notification that auto-dismisses
   * @param {string} message
   * @param {'success'|'error'|'info'} type
   */
  function showToast(message, type) {
    type = type || 'info';
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    // Auto-remove after animation
    setTimeout(function () {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
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
    5: '5人制',
    7: '7人制',
    8: '8人制',
    11: '11人制'
  };

  function getPositionLabels(lines) {
    if (lines.length === 3) {
      return ['DEF', 'MID', 'FWD'];
    } else if (lines.length === 4) {
      return ['DEF', 'MID', 'MID', 'FWD'];
    }
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

  /** Dirty flag: true if players have been moved or edited since last formation apply */
  var isDirty = false;

  function markDirty() {
    isDirty = true;
  }

  function clearDirty() {
    isDirty = false;
  }

  function calculatePositions(lines, total) {
    var positions = [];
    var linesCount = lines.length;
    var gkY = 90;
    var topY = 14;
    var bottomY = 72;

    positions.push({ x: 50, y: gkY, position: 'GK', lineIndex: -1 });

    var lineYs = [];
    if (linesCount === 1) {
      lineYs = [45];
    } else {
      for (var li = 0; li < linesCount; li++) {
        var y;
        if (linesCount === 2) {
          y = (li === 0) ? bottomY : topY;
        } else {
          y = bottomY - (li / (linesCount - 1)) * (bottomY - topY);
        }
        lineYs.push(y);
      }
    }

    var posLabels = getPositionLabels(lines);

    for (var li2 = 0; li2 < linesCount; li2++) {
      var count = lines[li2];
      var baseY = lineYs[li2];
      var label = posLabels[li2];

      for (var pi = 0; pi < count; pi++) {
        var x;
        if (count === 1) {
          x = 50;
        } else {
          var spreadStart = 12;
          var spreadEnd = 88;
          x = spreadStart + (pi / (count - 1)) * (spreadEnd - spreadStart);
        }
        positions.push({ x: x, y: baseY, position: label, lineIndex: li2 });
      }
    }

    return positions;
  }

  function generatePlayers(playerCount, formationLines) {
    var defaults = calculatePositions(formationLines, playerCount);
    var newPlayers = [];
    var num = 1;

    defaults.forEach(function (def, idx) {
      var posLabel = def.position;
      var displayPos;
      if (posLabel === 'GK') {
        displayPos = 'GK';
      } else if (posLabel === 'DEF') {
        displayPos = 'DF';
      } else if (posLabel === 'MID') {
        displayPos = 'MF';
      } else {
        displayPos = 'FW';
      }

      newPlayers.push({
        id: idx,
        number: num,
        name: '',
        position: displayPos,
        x: def.x,
        y: def.y
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

  /** Track team color theme: 'home' or 'away' */
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

      dot.addEventListener('click', function (e) {
        e.stopPropagation();
        editPlayer(player);
      });

      playersContainer.appendChild(dot);
    });
  }

  /**
   * Get the current formation label string, e.g. "11人制 4-3-3"
   */
  function getFormationLabelText() {
    var label = PLAYER_COUNT_LABELS[currentPlayerCount] || (currentPlayerCount + '人制');
    var formationLabels = FORMATIONS[currentPlayerCount].labels;
    var formationName = formationLabels[currentFormationIndex] || '';
    return label + ' ' + formationName;
  }

  // ============================================================
  // 4. DRAG AND DROP (Pointer Events)
  // ============================================================

  var dragState = null;

  function getFieldBounds() {
    var rect = fieldEl.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };
  }

  function onPointerDown(e) {
    var dot = e.target.closest('.player');
    if (!dot) return;

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
      didMove: false
    };
  }

  function onPointerMove(e) {
    if (!dragState) return;

    e.preventDefault();

    var dx = e.clientX - dragState.startX;
    var dy = e.clientY - dragState.startY;

    // Only count as a move if the pointer moved at least 2px
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      dragState.didMove = true;
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
    if (player) {
      player.x = newX;
      player.y = newY;
    }
  }

  function onPointerUp(e) {
    if (!dragState) return;

    e.preventDefault();

    dragState.element.classList.remove('dragging');

    try {
      dragState.element.releasePointerCapture(e.pointerId);
    } catch (_) { /* ignore */ }

    // Mark dirty if the player actually moved
    if (dragState.didMove) {
      markDirty();
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
  // 5. EDIT PLAYER
  // ============================================================

  function editPlayer(player) {
    var newNumber = prompt(
      '编辑球员 #' + player.number + '\n\n请输入号码：',
      player.number
    );

    if (newNumber === null) return;

    var numVal = parseInt(newNumber, 10);
    if (isNaN(numVal) || numVal < 1 || numVal > 99) {
      showToast('号码请填写 1-99 之间的数字', 'error');
      return;
    }

    var newName = prompt(
      '编辑球员 #' + numVal + '\n\n请输入姓名（可留空）：',
      player.name
    );

    if (newName === null) return;

    var newPosition = prompt(
      '编辑球员 #' + numVal + ' ' + (newName || '') + '\n\n请输入位置（如 GK, DF, MF, FW, CM, ST 等）：',
      player.position
    );

    if (newPosition === null) return;

    player.number = numVal;
    player.name = newName.trim();
    player.position = newPosition.trim().toUpperCase() || player.position;

    markDirty();
    renderPlayers();
    showToast('球员已更新', 'success');
  }

  // ============================================================
  // 6. SAVE / LOAD (localStorage)
  // ============================================================

  var STORAGE_KEY = 'football_tactics_board_saved_lineup';

  function saveLineup() {
    var data = {
      playerCount: currentPlayerCount,
      formationIndex: currentFormationIndex,
      players: players.map(function (p) {
        return {
          id: p.id,
          number: p.number,
          name: p.name,
          position: p.position,
          x: p.x,
          y: p.y
        };
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
    if (!raw) {
      showToast('没有已保存的阵型', 'info');
      return;
    }

    try {
      var data = JSON.parse(raw);

      if (!data.players || !Array.isArray(data.players)) {
        throw new Error('数据格式错误');
      }

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
  // 7. EXPORT PNG
  // ============================================================

  function exportPNG() {
    if (typeof html2canvas === 'undefined') {
      showToast('html2canvas 库加载失败，请检查网络后刷新页面', 'error');
      return;
    }

    var exportBtn = document.getElementById('btnExport');
    exportBtn.disabled = true;
    exportBtn.textContent = '⏳ 导出中...';

    // Show the formation label on the field for the export
    exportLabel.textContent = getFormationLabelText();
    exportLabel.classList.add('visible');

    // Wait one frame for the label to render, then capture
    requestAnimationFrame(function () {
      html2canvas(fieldEl, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false
      }).then(function (canvas) {
        var link = document.createElement('a');
        link.download = 'football_lineup.png';
        link.href = canvas.toDataURL('image/png');
        link.click();

        // Clean up
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
  // 8. FORMATION SWITCHING
  // ============================================================

  function updateFormationSelect() {
    var sel = document.getElementById('formation');
    sel.innerHTML = '';

    var formationData = FORMATIONS[currentPlayerCount];
    formationData.labels.forEach(function (label, index) {
      var opt = document.createElement('option');
      opt.value = index;
      opt.textContent = label;
      sel.appendChild(opt);
    });

    sel.value = 0;
  }

  /**
   * Apply current formation. If dirty, confirm first.
   * @param {boolean} skipConfirm - if true, skip the dirty check
   */
  function applyFormation(skipConfirm) {
    if (!skipConfirm && isDirty) {
      var ok = confirm('当前阵型有修改未保存，切换阵型将丢失修改。是否继续？');
      if (!ok) {
        // Revert the dropdown selection
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

    var formationLines = FORMATIONS[count].list[idx];
    players = generatePlayers(count, formationLines);
    clearDirty();
    renderPlayers();

    if (!skipConfirm) {
      showToast(getFormationLabelText(), 'info');
    }
  }

  function resetFormation() {
    if (isDirty) {
      var ok = confirm('当前阵型有修改未保存，重置将丢失修改。是否继续？');
      if (!ok) return;
    }

    var formationLines = FORMATIONS[currentPlayerCount].list[currentFormationIndex];
    players = generatePlayers(currentPlayerCount, formationLines);
    clearDirty();
    renderPlayers();
    showToast('阵型已重置', 'info');
  }

  // ============================================================
  // 9. HOME / AWAY COLOR TOGGLE
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
  // 10. INITIALIZATION
  // ============================================================

  function init() {
    var countSelect = document.getElementById('playerCount');
    var formationSelect = document.getElementById('formation');

    countSelect.addEventListener('change', function () {
      var newCount = parseInt(countSelect.value, 10);
      if (newCount !== currentPlayerCount && isDirty) {
        var ok = confirm('当前阵型有修改未保存，切换人数将丢失修改。是否继续？');
        if (!ok) {
          countSelect.value = currentPlayerCount;
          return;
        }
      }
      currentPlayerCount = newCount;
      updateFormationSelect();
      applyFormation(true); // skip confirm since we already confirmed
    });

    formationSelect.addEventListener('change', function () {
      applyFormation(false);
    });

    document.getElementById('btnReset').addEventListener('click', resetFormation);
    document.getElementById('btnExport').addEventListener('click', exportPNG);
    document.getElementById('btnSave').addEventListener('click', saveLineup);
    document.getElementById('btnLoad').addEventListener('click', loadLineup);

    btnColorToggle.addEventListener('click', toggleTeamColors);

    setupDragListeners();

    // Initial render
    updateFormationSelect();
    applyFormation(true); // skip confirm on initial load
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();