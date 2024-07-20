document.addEventListener('DOMContentLoaded', function() {
  const reportBugButton = document.getElementById('reportBug');
  const goToGithubButton = document.getElementById('goToGithub');
  const feedbackButtonButton = document.getElementById('feedbackButton');

  reportBugButton.addEventListener('click', function() {
    chrome.tabs.create({ url: 'https://forms.gle/ygGLUG15bauKjpCXA' });
  });

  goToGithubButton.addEventListener('click', function() {
    chrome.tabs.create({ url: 'https://github.com/WhitetapeOwO/Play-Keywords.git' });
  });

  feedbackButtonButton.addEventListener('click', function() {
    chrome.tabs.create({ url: 'https://forms.gle/gAwr1EcJfX1VuCA98' });
  });
});