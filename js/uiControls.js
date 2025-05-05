window.addEventListener("DOMContentLoaded", () => {
  const winCounts = document.querySelectorAll('.win-count');
  winCounts.forEach(el => {
    el.style.display = 'none';
  });
});

function toggleWinDisplay() {
  const winCounts = document.querySelectorAll('.win-count');
  const showing = winCounts[0].style.display === 'block';

  winCounts.forEach(el => {
    el.style.display = showing ? 'none' : 'block';
  });
}
