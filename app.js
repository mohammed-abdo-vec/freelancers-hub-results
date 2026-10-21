const HINTS = {
  demo: 'Your live demo counts for this task. Posting the GitHub repo too would let the coaches review your code.',
  demo_only: 'We found a live demo but no GitHub repo. Post the repo link in the group so this task counts.',
  broken: 'The repo link you posted no longer opens. It may be deleted, renamed or private. Make it public or post the new link.',
  missing: 'Nothing posted for this task yet. Post the GitHub repo link in the group when it’s ready.',
  needs_fix: 'Your coach asked for changes to this task. Fix it and post the updated link in the group.',
};

function feedbackItem(label, text) {
  return el('div', { class: 'feedback-item' },
    el('h3', { text: label }),
    text ? el('p', { dir: 'auto', text }) : el('p', { class: 'muted small', text: 'No feedback yet.' }));
}

const loginView = document.getElementById('login-view');
const resultsView = document.getElementById('results-view');

function repoLine(repo) {
  return el('div', { class: 'link' },
    el('span', { class: 'kind', text: 'Repo' }),
    el('a', { href: repo.url, target: '_blank', rel: 'noopener', text: repo.name }),
    el('span', { class: 'chips' }, repo.stack.map((s) => el('span', { class: 'chip', text: s }))));
}

function demoLine(url) {
  return el('div', { class: 'link' },
    el('span', { class: 'kind', text: 'Demo' }),
    el('a', { href: url, target: '_blank', rel: 'noopener', text: url.replace(/^https?:\/\//, '') }));
}

function render(d) {
  document.getElementById('course').textContent = d.course;
  document.getElementById('greeting').textContent = `Hi, ${d.name}`;
  document.getElementById('updated').textContent = `Updated ${formatDate(d.updated)}`;

  const progress = document.getElementById('progress');
  progress.replaceChildren(
    el('span', { class: 'eyebrow', text: 'Progress' }),
    el('div', { class: 'progress-figure' }, `${d.done}`, el('small', { text: ` of ${d.total} tasks done` })),
    el('div', { class: 'segments', 'aria-hidden': 'true' }, d.tasks.map((t) => el('span', { class: `tone-${STATUS[t.status].tone}` }))),
    el('span', { class: 'muted small', text: d.done === d.total
      ? 'Every task is in. Well done.'
      : `Still to do: ${d.tasks.filter((t) => !['done', 'demo'].includes(t.status)).map((t) => t.label).join(', ')}.` }));

  document.getElementById('tasks').replaceChildren(...d.tasks.map((t, i) => {
    const s = STATUS[t.status];
    const showBroken = t.status === 'broken';
    return el('li', { class: 'task' },
      el('span', { class: 'task-num', text: String(i + 1).padStart(2, '0') }),
      el('div', { class: 'task-body' },
        el('div', { class: 'task-head' }, el('h3', { text: t.label }), el('span', { class: `pill tone-${s.tone}`, text: s.label })),
        (t.repos.length || t.demos.length || showBroken) && el('div', { class: 'links' },
          t.repos.map(repoLine), t.demos.map(demoLine),
          showBroken && t.broken.map((url) => el('div', { class: 'link' },
            el('span', { class: 'kind', text: 'Repo' }), el('span', { class: 'small muted', text: url })))),
        HINTS[t.status] && el('p', { class: `hint tone-${s.tone}`, text: HINTS[t.status] })));
  }));

  const extras = d.extras.filter((e) => typeof e === 'object');
  document.getElementById('extras').replaceChildren(...(extras.length ? [
    el('p', { class: 'small muted', text: 'Other projects you shared (not part of the five tasks):' }),
    el('div', { class: 'links' }, extras.map(repoLine))] : []));

  // The coach's notes on each project; points are never part of this page's data
  document.getElementById('feedback').replaceChildren(
    d.feedback && el('div', { class: 'feedback-item feedback-overall' }, el('h3', { text: 'Overall' }), el('p', { dir: 'auto', text: d.feedback })),
    ...d.tasks.map((t) => feedbackItem(t.label, t.feedback)));

  loginView.hidden = true;
  resultsView.hidden = false;
  window.scrollTo(0, 0);
}

Vault.bindLogin(document.getElementById('login-form'), render);
document.getElementById('logout').addEventListener('click', () => {
  Vault.forget();
  resultsView.hidden = true;
  loginView.hidden = false;
});
Vault.recall().then((saved) => {
  if (saved && saved.data) render(saved.data);
  else if (saved && saved.stale) {
    document.querySelector('.login-error').textContent = 'The results were updated. Log in again to see the latest.';
  }
});
