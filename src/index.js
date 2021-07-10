// @ts-check

import 'bootstrap/dist/css/bootstrap.min.css';
import './tasks_icon.png';

const collapseBtn = document.querySelector('.navbar-toggler');
collapseBtn.addEventListener('click', () => {
  const navbarColapseEl = document.getElementById('navbarToggleExternalContent');
  if (navbarColapseEl.classList.contains('show')) {
    navbarColapseEl.classList.remove('show');
  } else {
    navbarColapseEl.classList.add('show');
  }
});
