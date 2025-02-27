document.addEventListener('DOMContentLoaded', () => {
  navigationHandler();
});

const navigationHandler = () => {
  const navToggle = document.getElementById('navtoggle');
  const navBody = document.getElementById('navbody');
  
  if (navToggle === null || navBody === null) return;
  
  navToggle.addEventListener('click', e => {
    if (navToggle.classList.contains('collapsed')) {
      navToggle.classList.remove('collapsed');
      navBody.classList.add('in');
      navBody.style.removeProperty('height');
    } else {
      navToggle.classList.add('collapsed');
      navBody.classList.remove('in');
      navBody.style.height = '1px';
    }
  });
  
  let currentDropdown = null;
  
  const toggleDropdown = (dropdown) => {
    if (!dropdown.classList.contains('open')) {
      if (currentDropdown !== null) toggleDropdown(currentDropdown);
      dropdown.classList.add('open');
      currentDropdown = dropdown;
    } else {
      currentDropdown.classList.remove('open');
      currentDropdown = null;
    }
  }
  
  document.addEventListener('click', e => {
    if (currentDropdown === null || currentDropdown.contains(e.target)) return;
    toggleDropdown(currentDropdown);
  })
  
  for (let ddToggle of navBody.getElementsByClassName('dropdown-toggle')) {
    ddToggle.addEventListener('click', e => {
      toggleDropdown(e.currentTarget.parentElement);
    });
  }
  
}