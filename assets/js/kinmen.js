/* 駐點時間：把「下一次駐點」算在使用者的當下，而不是網站建置的那一刻。
   頁面在沒有 JavaScript 時已經由 Hugo render 出建置當下的結果，這支程式只負責校正。 */
(function () {
  'use strict';

  var node = document.getElementById('km-duty-data');
  if (!node) return;

  var data;
  try { data = JSON.parse(node.textContent); } catch (e) { return; }
  if (!data || !data.sessions || !data.sessions.length) return;

  var DOW = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  var HALF = {
    am: { name: '上午', start: [8, 30], end: [12, 0] },
    pm: { name: '下午', start: [13, 30], end: [17, 30] }
  };

  function at(iso, hm) {
    var p = iso.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2], hm[0], hm[1], 0, 0);
  }
  function midnight(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  var now = new Date();

  var list = data.sessions.map(function (s) {
    var h = HALF[s.half] || HALF.am;
    return {
      iso: s.date,
      half: s.half,
      halfName: h.name,
      hours: data.hours[s.half],
      start: at(s.date, h.start),
      end: at(s.date, h.end)
    };
  }).sort(function (a, b) { return a.start - b.start; });

  list.forEach(function (s) {
    var d = s.start;
    s.month = d.getMonth() + 1;
    s.day = d.getDate();
    s.dow = DOW[d.getDay()];
    s.over = now > s.end;
    s.live = now >= s.start && now <= s.end;
  });

  /* 一次駐點 = 相鄰兩個半天（週三下午 + 週四上午），視為同一趟。 */
  var visits = [];
  for (var i = 0; i < list.length; i += 2) {
    visits.push(list.slice(i, i + 2));
  }

  var nextVisit = null, nextSession = null;
  for (var v = 0; v < visits.length; v++) {
    if (!visits[v][visits[v].length - 1].over) { nextVisit = visits[v]; break; }
  }
  for (var k = 0; k < list.length; k++) {
    if (!list[k].over) { nextSession = list[k]; break; }
  }

  /* ---- 年曆：標出已結束與下一場 ---- */
  var slots = document.querySelectorAll('[data-km-slot]');
  Array.prototype.forEach.call(slots, function (el) {
    var iso = el.getAttribute('data-km-slot');
    var half = el.getAttribute('data-km-half');
    var s = list.filter(function (x) { return x.iso === iso && x.half === half; })[0];
    if (!s) return;
    el.classList.toggle('is-past', !!s.over);
    el.classList.toggle('is-next', s === nextSession);
    var tag = el.querySelector('[data-km-tag]');
    if (tag) {
      tag.textContent = s.live ? '駐點中' : s.over ? '已結束' : (s === nextSession ? '下一場' : '');
    }
  });

  /* ---- 倒數 ---- */
  function countdown(s) {
    if (!s) return '';
    if (s.live) return '現在正在駐點';
    var days = Math.round((midnight(s.start) - midnight(now)) / 86400000);
    if (days <= 0) return '就是今天';
    if (days === 1) return '明天';
    return '還有 ' + days + ' 天';
  }

  /* ---- 下一次駐點方框 ---- */
  function halfMark(half, big) {
    return '<span class="km-half km-half--' + half + (big ? ' km-half--lg' : '') +
           '" aria-hidden="true"><span></span><span></span></span>';
  }

  var card = document.querySelector('[data-km-card]');
  if (card) {
    var html = '<div class="km-next__rule"></div>';
    if (!nextVisit) {
      html += '<p class="km-next__closed">' + data.year +
              ' 年的駐點場次已經全部結束。下一年度的日期由金門縣政府核定後，會更新在這一頁。' +
              '在這之前仍可以線上預約或來電洽詢。</p>';
    } else {
      html += '<div class="km-next__days">';
      nextVisit.forEach(function (s) {
        html += '<div class="km-next__day' + (s.over ? ' is-done' : '') + '">' +
                  '<p class="km-next__date">' + s.month + '月' + s.day + '日<b>' + s.dow + '</b></p>' +
                  '<p class="km-next__mark">' + halfMark(s.half, true) + s.halfName +
                    (s.over ? '<span class="km-next__done">已結束</span>' : '') + '</p>' +
                  '<p class="km-next__hours">' + s.hours + '</p>' +
                '</div>';
      });
      html += '</div>';
    }
    card.innerHTML = html;
  }

  var count = document.querySelector('[data-km-count]');
  if (count) count.textContent = countdown(nextSession);

  /* ---- 首頁提示條 ---- */
  var strip = document.querySelector('[data-km-strip]');
  if (strip) {
    if (!nextSession) {
      strip.innerHTML = '<span class="km-strip__when">' + data.year + ' 年駐點場次已全部結束</span>';
    } else {
      strip.innerHTML = '<span class="km-strip__when">' +
        nextSession.month + '月' + nextSession.day + '日 ' + nextSession.dow +
        halfMark(nextSession.half, false) + nextSession.halfName + ' ' + nextSession.hours +
        '</span><span class="km-strip__count">' + countdown(nextSession) + '</span>';
    }
  }
})();
