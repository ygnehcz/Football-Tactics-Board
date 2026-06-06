/* ==================================================
   Football Tactics Board - app.js  (V0.2)
   V0.2: grass texture, full markings, ball, team info,
         position i18n, expanded formations
   ================================================== */

(function () {
  'use strict';

  // ============================================================
  // 0. TOAST
  // ============================================================
  var toastContainer = document.getElementById('toastContainer');
  function showToast(msg, type) {
    type = type || 'info';
    var t = document.createElement('div');
    t.className = 'toast toast-' + type; t.textContent = msg;
    toastContainer.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2600);
  }

  // ============================================================
  // 1. POSITION I18N + FORMATION DATA
  // ============================================================

  var POS_ZH = {
    GK: '门将', CB: '中后卫', LB: '左后卫', RB: '右后卫',
    LWB: '左翼卫', RWB: '右翼卫', CDM: '防守中场', CM: '中场',
    CAM: '攻击中场', LM: '左中场', RM: '右中场',
    LW: '左边锋', RW: '右边锋', ST: '前锋', CF: '中锋', SS: '影锋',
    DF: '后卫', MF: '中场', FW: '前锋'
  };

  var positionLang = 'zh'; // 'en' or 'zh'

  function posLabel(key) {
    if (positionLang === 'en') return key;
    return POS_ZH[key] || key;
  }

  var FORMATIONS = {
    5: {
      list: [[1,2,1],[2,1,1],[1,1,2],[2,2],[3,1],[1,3]],
      labels: ['1-2-1','2-1-1','1-1-2','2-2','3-1','1-3']
    },
    7: {
      list: [[2,3,1],[3,2,1],[2,2,2],[3,1,2],[2,1,2,1],[1,3,2],[4,1,1]],
      labels: ['2-3-1','3-2-1','2-2-2','3-1-2','2-1-2-1','1-3-2','4-1-1']
    },
    8: {
      list: [[2,3,2],[3,3,1],[2,4,1],[3,2,2],[2,2,2,1],[4,2,1],[1,4,2],[3,1,3]],
      labels: ['2-3-2','3-3-1','2-4-1','3-2-2','2-2-2-1','4-2-1','1-4-2','3-1-3']
    },
    11: {
      list: [
        [4,3,3],[4,2,3,1],[4,4,2],[3,5,2],
        [4,1,4,1],[4,5,1],[4,3,1,2],[4,4,1,1],
        [3,4,3],[3,4,2,1],[5,3,2],[5,4,1],
        [4,2,2,2],[4,1,2,1,2],[3,1,4,2]
      ],
      labels: [
        '4-3-3','4-2-3-1','4-4-2','3-5-2',
        '4-1-4-1','4-5-1','4-3-1-2','4-4-1-1',
        '3-4-3','3-4-2-1','5-3-2','5-4-1',
        '4-2-2-2','4-1-2-1-2','3-1-4-2'
      ]
    }
  };

  var PLAYER_COUNT_LABELS = { 5: '5人制', 7: '7人制', 8: '8人制', 11: '11人制' };

  function getPositionLabels(lines) {
    var n = lines.length;
    if (n === 2) return ['DEF', 'FWD'];
    if (n === 3) return ['DEF', 'MID', 'FWD'];
    if (n === 4) return ['DEF', 'MID', 'MID', 'FWD'];
    if (n === 5) return ['DEF', 'MID', 'MID', 'MID', 'FWD'];
    return lines.map(function (_, i) {
      if (i === 0) return 'DEF';
      if (i === n - 1) return 'FWD';
      return 'MID';
    });
  }

  // ============================================================
  // 2. DATA STATE
  // ============================================================

  var players = [];
  var currentPlayerCount = 11;
  var currentFormationIndex = 0;
  var isDirty = false;
  var currentTheme = 'home';

  // Ball
  var ball = { x: 50, y: 50 };  // center circle

  // Team info
  var teamInfo = {
    teamName: '', shortName: '', side: 'home',
    opponent: '', competition: '', matchDate: '',
    venue: '', coach: '', captain: '', notes: ''
  };

  function markDirty() { isDirty = true; }
  function clearDirty() { isDirty = false; }

  // ============================================================
  // 3. FORMATION CALC
  // ============================================================

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
        var x = (count === 1) ? 50 : 12 + (pi / (count - 1)) * (88 - 12);
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
  // 4. RENDERING
  // ============================================================

  var fieldEl = document.getElementById('field');
  var playersContainer = document.getElementById('playersContainer');
  var exportLabel = document.getElementById('exportLabel');
  var ballEl = document.getElementById('ball');
  var exportArea = document.getElementById('exportArea');

  function getPlayerColorClass(player) {
    var pos = player.position.toUpperCase();
    if (pos === 'GK') return 'player-gk';
    if (['CB','LB','RB','LWB','RWB'].indexOf(pos) !== -1 || pos === 'DF') return 'player-def';
    if (['CDM','CM','CAM','LM','RM'].indexOf(pos) !== -1 || pos === 'MF') return 'player-mid';
    if (['LW','RW','ST','CF','SS'].indexOf(pos) !== -1 || pos === 'FW') return 'player-fwd';
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

      var numSpan = document.createElement('span');
      numSpan.className = 'player-number';
      numSpan.textContent = player.number;

      var posSpan = document.createElement('span');
      posSpan.className = 'player-position';
      posSpan.textContent = posLabel(player.position);

      dot.appendChild(numSpan);
      dot.appendChild(posSpan);
      playersContainer.appendChild(dot);
    });
  }

  function renderBall() {
    ballEl.style.left = ball.x + '%';
    ballEl.style.top = ball.y + '%';
  }

  // ============================================================
  // 5. TEAM INFO BAR UPDATE
  // ============================================================

  function updateTeamInfoBar() {
    var homeName = teamInfo.teamName || '主队';
    var awayName = teamInfo.opponent || '客队';
    var side = teamInfo.side || 'home';

    if (side === 'away') {
      document.getElementById('tiHomeName').textContent = awayName;
      document.getElementById('tiAwayName').textContent = homeName;
    } else {
      document.getElementById('tiHomeName').textContent = homeName;
      document.getElementById('tiAwayName').textContent = awayName;
    }

    document.getElementById('tiVs').textContent = (homeName && awayName) ? 'vs' : '';
    document.getElementById('tiComp').textContent = teamInfo.competition || '';
    document.getElementById('tiDate').textContent = teamInfo.matchDate || '';
    document.getElementById('tiCoach').textContent = teamInfo.coach ? '教练: ' + teamInfo.coach : '';
  }

  function getFormationLabelText() {
    var label = PLAYER_COUNT_LABELS[currentPlayerCount] || (currentPlayerCount + '人制');
    var formationName = FORMATIONS[currentPlayerCount].labels[currentFormationIndex] || '';
    return label + ' ' + formationName;
  }

  // ============================================================
  // 6. DRAG — Players (unchanged from V0.1.2 except ball support)
  // ============================================================

  var dragState = null;
  var dragJustEnded = false;
  var dragEndedTimer = null;

  function getFieldBounds() {
    var rect = fieldEl.getBoundingClientRect();
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  }

  function onPointerDown(e) {
    // Check if dragging ball
    var ballTarget = e.target.closest('.ball');
    if (ballTarget) {
      e.preventDefault();
      ballTarget.setPointerCapture(e.pointerId);
      var bounds = getFieldBounds();
      ballTarget.classList.add('dragging');
      dragState = {
        isBall: true, element: ballTarget,
        startX: e.clientX, startY: e.clientY,
        playerStartX: ball.x, playerStartY: ball.y,
        fieldWidth: bounds.width, fieldHeight: bounds.height,
        hasDragged: false
      };
      return;
    }

    var dot = e.target.closest('.player');
    if (!dot) return;
    if (document.getElementById('editModal').classList.contains('active')) return;
    if (document.getElementById('teamInfoModal').classList.contains('active')) return;

    e.preventDefault();
    dot.setPointerCapture(e.pointerId);

    var playerId = parseInt(dot.getAttribute('data-player-id'), 10);
    var player = players.find(function (p) { return p.id === playerId; });
    if (!player) return;

    var bounds2 = getFieldBounds();
    dot.classList.add('dragging');

    dragState = {
      isBall: false, playerId: playerId, element: dot,
      startX: e.clientX, startY: e.clientY,
      playerStartX: player.x, playerStartY: player.y,
      fieldWidth: bounds2.width, fieldHeight: bounds2.height,
      hasDragged: false
    };
  }

  function onPointerMove(e) {
    if (!dragState) return;
    e.preventDefault();

    var dx = e.clientX - dragState.startX;
    var dy = e.clientY - dragState.startY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) { dragState.hasDragged = true; }

    var dxPct = (dx / dragState.fieldWidth) * 100;
    var dyPct = (dy / dragState.fieldHeight) * 100;

    var newX = dragState.playerStartX + dxPct;
    var newY = dragState.playerStartY + dyPct;

    newX = Math.max(2, Math.min(98, newX));
    newY = Math.max(1, Math.min(99, newY));

    dragState.element.style.left = newX + '%';
    dragState.element.style.top = newY + '%';

    if (dragState.isBall) {
      ball.x = newX; ball.y = newY;
    } else {
      var player = players.find(function (p) { return p.id === dragState.playerId; });
      if (player) { player.x = newX; player.y = newY; }
    }
  }

  function onPointerUp(e) {
    if (!dragState) return;
    e.preventDefault();

    dragState.element.classList.remove('dragging');
    try { dragState.element.releasePointerCapture(e.pointerId); } catch (_) {}

    if (dragState.hasDragged) {
      if (!dragState.isBall) markDirty();
      dragJustEnded = true;
      if (dragEndedTimer) clearTimeout(dragEndedTimer);
      dragEndedTimer = setTimeout(function () { dragJustEnded = false; }, 400);
    }

    dragState = null;
  }

  function setupDragListeners() {
    playersContainer.addEventListener('pointerdown', onPointerDown);
    ballEl.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
  }

  // ============================================================
  // 7. DOUBLE-TAP EDIT (unchanged from V0.1.2)
  // ============================================================

  var lastTapInfo = null, doubleTapTimeout = null;

  function onPlayerTap(e) {
    if (dragJustEnded) return;
    var dot = e.target.closest('.player');
    if (!dot) { lastTapInfo = null; return; }

    var playerId = parseInt(dot.getAttribute('data-player-id'), 10);
    var now = Date.now();

    if (lastTapInfo && lastTapInfo.playerId === playerId && (now - lastTapInfo.time) < 400) {
      var player = players.find(function (p) { return p.id === playerId; });
      if (player) openEditModal(player);
      lastTapInfo = null;
      if (doubleTapTimeout) clearTimeout(doubleTapTimeout);
    } else {
      lastTapInfo = { time: now, playerId: playerId };
      if (doubleTapTimeout) clearTimeout(doubleTapTimeout);
      doubleTapTimeout = setTimeout(function () {
        if (lastTapInfo && lastTapInfo.playerId === playerId) lastTapInfo = null;
      }, 400);
    }
  }

  function onPlayerDblClick(e) {
    var dot = e.target.closest('.player');
    if (!dot || dragJustEnded) return;
    var playerId = parseInt(dot.getAttribute('data-player-id'), 10);
    var player = players.find(function (p) { return p.id === playerId; });
    if (player) openEditModal(player);
    lastTapInfo = null;
    if (doubleTapTimeout) clearTimeout(doubleTapTimeout);
  }

  // ============================================================
  // 8. PLAYER EDIT MODAL
  // ============================================================

  var editModal = document.getElementById('editModal');
  var editNumberInput = document.getElementById('editNumber');
  var editNameInput = document.getElementById('editName');
  var editPositionSelect = document.getElementById('editPosition');
  var btnCancelEdit = document.getElementById('btnCancelEdit');
  var btnSaveEdit = document.getElementById('btnSaveEdit');
  var editingPlayer = null;

  function openEditModal(player) {
    editingPlayer = player;
    editNumberInput.value = player.number;
    editNameInput.value = player.name;
    editPositionSelect.value = player.position;
    editModal.classList.add('active');
    document.body.classList.add('modal-open');
    setTimeout(function () { editNumberInput.focus(); editNumberInput.select(); }, 100);
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
      showToast('球衣号码请填写 1-99', 'error');
      editNumberInput.focus(); return;
    }
    editingPlayer.number = numVal;
    editingPlayer.name = editNameInput.value.trim();
    editingPlayer.position = editPositionSelect.value;
    markDirty();
    renderPlayers();
    closeEditModal();
    showToast('球员已更新', 'success');
  }

  // ============================================================
  // 9. TEAM INFO MODAL
  // ============================================================

  var teamInfoModal = document.getElementById('teamInfoModal');
  var tiFields = {
    teamName: document.getElementById('tiTeamName'),
    shortName: document.getElementById('tiShortName'),
    side: document.getElementById('tiSide'),
    opponent: document.getElementById('tiOpponent'),
    competition: document.getElementById('tiCompetition'),
    matchDate: document.getElementById('tiMatchDate'),
    venue: document.getElementById('tiVenue'),
    coach: document.getElementById('tiCoach'),
    captain: document.getElementById('tiCaptain'),
    notes: document.getElementById('tiNotes')
  };

  function openTeamInfoModal() {
    for (var key in tiFields) {
      if (tiFields.hasOwnProperty(key)) {
        tiFields[key].value = teamInfo[key] || '';
      }
    }
    teamInfoModal.classList.add('active');
    document.body.classList.add('modal-open');
    setTimeout(function () { tiFields.teamName.focus(); }, 100);
  }

  function closeTeamInfoModal() {
    teamInfoModal.classList.remove('active');
    document.body.classList.remove('modal-open');
  }

  function saveTeamInfoFromModal() {
    for (var key in tiFields) {
      if (tiFields.hasOwnProperty(key)) {
        teamInfo[key] = tiFields[key].value.trim();
      }
    }
    markDirty();
    updateTeamInfoBar();
    closeTeamInfoModal();
    showToast('队伍信息已保存', 'success');
  }

  // ============================================================
  // 10. SAVE / LOAD (localStorage — extended)
  // ============================================================

  var STORAGE_KEY = 'football_tactics_board_saved_lineup';

  function saveLineup() {
    var data = {
      playerCount: currentPlayerCount,
      formationIndex: currentFormationIndex,
      players: players.map(function (p) {
        return { id: p.id, number: p.number, name: p.name, position: p.position, x: p.x, y: p.y };
      }),
      ball: { x: ball.x, y: ball.y },
      teamInfo: teamInfo,
      positionLang: positionLang,
      theme: currentTheme
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
      var ok = confirm('当前阵型有未保存的修改，加载将覆盖。是否继续？');
      if (!ok) return;
    }
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { showToast('没有已保存的阵型', 'info'); return; }
    try {
      var data = JSON.parse(raw);
      if (!data.players || !Array.isArray(data.players)) throw new Error('数据格式错误');

      currentPlayerCount = data.playerCount || 11;
      currentFormationIndex = data.formationIndex || 0;
      players = data.players;

      if (data.ball) { ball.x = data.ball.x; ball.y = data.ball.y; } else { ball.x = 50; ball.y = 50; }
      if (data.teamInfo) { teamInfo = data.teamInfo; }
      if (data.positionLang) { positionLang = data.positionLang; document.getElementById('langToggle').value = positionLang; }
      if (data.theme) {
        currentTheme = data.theme;
        if (currentTheme === 'away') { document.body.classList.add('away-theme'); btnColorToggle.textContent = '🎨 切换主队'; btnColorToggle.classList.add('active-toggle'); }
        else { document.body.classList.remove('away-theme'); btnColorToggle.textContent = '🎨 切换队服'; btnColorToggle.classList.remove('active-toggle'); }
      }

      document.getElementById('playerCount').value = currentPlayerCount;
      updateFormationSelect();
      if (currentFormationIndex < FORMATIONS[currentPlayerCount].list.length) {
        document.getElementById('formation').value = currentFormationIndex;
      }

      clearDirty();
      renderBall();
      renderPlayers();
      updateTeamInfoBar();
      showToast('阵型已加载！', 'success');
    } catch (err) {
      showToast('加载失败：' + err.message, 'error');
    }
  }

  // ============================================================
  // 11. EXPORT PNG
  // ============================================================

  function exportPNG() {
    if (typeof html2canvas === 'undefined') {
      showToast('html2canvas 库加载失败，请检查网络', 'error'); return;
    }
    var exportBtn = document.getElementById('btnExport');
    exportBtn.disabled = true; exportBtn.textContent = '⏳ 导出中...';

    exportLabel.textContent = getFormationLabelText();
    exportLabel.classList.add('visible');

    requestAnimationFrame(function () {
      html2canvas(exportArea, { backgroundColor: '#f0f2f5', scale: 2, useCORS: true, logging: false })
        .then(function (canvas) {
          var link = document.createElement('a');
          link.download = 'football_lineup.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
          exportLabel.classList.remove('visible');
          exportBtn.disabled = false; exportBtn.textContent = '📸 导出图片';
          showToast('导出成功！', 'success');
        }).catch(function (err) {
          exportLabel.classList.remove('visible');
          exportBtn.disabled = false; exportBtn.textContent = '📸 导出图片';
          showToast('导出失败：' + err.message, 'error');
        });
    });
  }

  // ============================================================
  // 12. FORMATION SWITCHING
  // ============================================================

  function updateFormationSelect() {
    var sel = document.getElementById('formation');
    sel.innerHTML = '';
    FORMATIONS[currentPlayerCount].labels.forEach(function (label, index) {
      var opt = document.createElement('option');
      opt.value = index; opt.textContent = label; sel.appendChild(opt);
    });
    sel.value = 0;
  }

  function applyFormation(skipConfirm) {
    if (!skipConfirm && isDirty) {
      if (!confirm('当前阵型有未保存的修改，切换将丢失。是否继续？')) {
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
    updateTeamInfoBar();
    if (!skipConfirm) showToast(getFormationLabelText(), 'info');
  }

  function resetFormation() {
    if (isDirty && !confirm('当前阵型有未保存的修改，重置将丢失。是否继续？')) return;
    players = generatePlayers(currentPlayerCount, FORMATIONS[currentPlayerCount].list[currentFormationIndex]);
    clearDirty();
    renderPlayers();
    showToast('阵型已重置', 'info');
  }

  function resetBall() {
    ball.x = 50; ball.y = 50;
    renderBall();
    markDirty();
    showToast('足球已重置到中点', 'info');
  }

  // ============================================================
  // 13. COLOR TOGGLE
  // ============================================================

  var btnColorToggle = document.getElementById('btnColorToggle');

  function toggleTeamColors() {
    if (currentTheme === 'home') {
      document.body.classList.add('away-theme'); currentTheme = 'away';
      btnColorToggle.textContent = '🎨 切换主队'; btnColorToggle.classList.add('active-toggle');
      showToast('已切换为客队队服', 'info');
    } else {
      document.body.classList.remove('away-theme'); currentTheme = 'home';
      btnColorToggle.textContent = '🎨 切换队服'; btnColorToggle.classList.remove('active-toggle');
      showToast('已切换为主队队服', 'info');
    }
  }

  // ============================================================
  // 14. POSITION LANGUAGE TOGGLE
  // ============================================================

  function togglePositionLang() {
    positionLang = document.getElementById('langToggle').value;
    renderPlayers();
    markDirty();
  }

  // ============================================================
  // 15. INIT
  // ============================================================

  function init() {
    var countSelect = document.getElementById('playerCount');
    var formationSelect = document.getElementById('formation');

    countSelect.addEventListener('change', function () {
      var newCount = parseInt(countSelect.value, 10);
      if (newCount !== currentPlayerCount && isDirty) {
        if (!confirm('当前阵型有未保存的修改，切换将丢失。是否继续？')) {
          countSelect.value = currentPlayerCount; return;
        }
      }
      currentPlayerCount = newCount;
      updateFormationSelect();
      applyFormation(true);
    });

    formationSelect.addEventListener('change', function () { applyFormation(false); });

    document.getElementById('btnReset').addEventListener('click', resetFormation);
    document.getElementById('btnResetBall').addEventListener('click', resetBall);
    document.getElementById('btnExport').addEventListener('click', exportPNG);
    document.getElementById('btnSave').addEventListener('click', saveLineup);
    document.getElementById('btnLoad').addEventListener('click', loadLineup);
    btnColorToggle.addEventListener('click', toggleTeamColors);

    // Position lang toggle
    document.getElementById('langToggle').addEventListener('change', togglePositionLang);

    // Team info modal
    document.getElementById('btnTeamInfo').addEventListener('click', openTeamInfoModal);
    document.getElementById('btnSaveTeamInfo').addEventListener('click', saveTeamInfoFromModal);
    document.getElementById('btnCancelTeamInfo').addEventListener('click', closeTeamInfoModal);
    teamInfoModal.addEventListener('click', function (e) { if (e.target === teamInfoModal) closeTeamInfoModal(); });

    // Player edit modal
    btnSaveEdit.addEventListener('click', saveEditFromModal);
    btnCancelEdit.addEventListener('click', closeEditModal);
    editModal.addEventListener('click', function (e) { if (e.target === editModal) closeEditModal(); });

    // Esc to close any modal
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (editModal.classList.contains('active')) closeEditModal();
        if (teamInfoModal.classList.contains('active')) closeTeamInfoModal();
      }
    });

    // Drag + edit
    setupDragListeners();
    playersContainer.addEventListener('pointerup', onPlayerTap);
    playersContainer.addEventListener('dblclick', onPlayerDblClick);

    // Initial render
    updateFormationSelect();
    applyFormation(true);
    updateTeamInfoBar();
    renderBall();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();