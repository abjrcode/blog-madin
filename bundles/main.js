document.addEventListener("DOMContentLoaded", function () {
  const themeToggleDarkIcon = document.getElementById("theme-toggle-dark-icon");
  const themeToggleLightIcon = document.getElementById(
    "theme-toggle-light-icon"
  );

  function dispatchThemeSwitchEvent(newTheme) {
    window.dispatchEvent(new CustomEvent("theme-switch", { detail: newTheme }));
  }

  const themeToggleBtn = document.getElementById("theme-toggle");

  themeToggleBtn.addEventListener("click", function () {
    themeToggleDarkIcon.classList.toggle("hidden");
    themeToggleLightIcon.classList.toggle("hidden");

    if (localStorage && localStorage.getItem("color-theme")) {
      if (localStorage.getItem("color-theme") === "light") {
        document.documentElement.classList.add("dark");
        dispatchThemeSwitchEvent("dark");
        localStorage.setItem("color-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        dispatchThemeSwitchEvent("light");
        localStorage.setItem("color-theme", "light");
      }
    } else {
      if (document.documentElement.classList.contains("dark")) {
        document.documentElement.classList.remove("dark");
        dispatchThemeSwitchEvent("light");
        localStorage.setItem("color-theme", "light");
      } else {
        document.documentElement.classList.add("dark");
        dispatchThemeSwitchEvent("dark");
        localStorage.setItem("color-theme", "dark");
      }
    }
  });

  if (localStorage) {
    if (
      localStorage.getItem("color-theme") === "dark" ||
      (!("color-theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      themeToggleLightIcon.classList.remove("hidden");
    } else {
      themeToggleDarkIcon.classList.remove("hidden");
    }
  } else {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      themeToggleLightIcon.classList.remove("hidden");
    } else {
      themeToggleDarkIcon.classList.remove("hidden");
    }
  }

  const changeFontSizeBtn = document.getElementById("font-size-switcher");

  changeFontSizeBtn.addEventListener("click", function () {
    const currentFontSize = parseInt(
      document.documentElement.style.fontSize.substring(0, 2),
      10
    );

    let newFontSize = currentFontSize || 16;

    switch (currentFontSize) {
      case 16:
        newFontSize = 18;
        break;
      case 18:
        newFontSize = 20;
        break;
      case 20:
        newFontSize = 16;
        break;
      default:
        newFontSize = 16;
        break;
    }

    localStorage.setItem("font-size", newFontSize);

    document.documentElement.style.fontSize = `${newFontSize}px`;
  });
});

window.madin = window.madin || {};

/**
 *
 * @param {Date} date A UTC timestamp
 * @returns Relative human readable date
 * Thanks to https://javascript.plainenglish.io/convert-a-date-into-relative-date-in-javascript-12d405eae316
 */
window.madin.relativeDate = function (date) {
  const diff = Math.round((new Date() - new Date(date)) / 1000);

  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = month * 12;

  if (diff < 0) {
    return "coming soon";
  } else if (diff < 30) {
    return "just now";
  } else if (diff < minute) {
    return diff + " seconds ago";
  } else if (diff < 2 * minute) {
    return "a minute ago";
  } else if (diff < hour) {
    return Math.floor(diff / minute) + " minutes ago";
  } else if (Math.floor(diff / hour) == 1) {
    return "1 hour ago";
  } else if (diff < day) {
    return Math.floor(diff / hour) + " hours ago";
  } else if (diff < day * 2) {
    return "yesterday";
  } else if (diff < week) {
    return Math.floor(diff / day) + " days ago";
  } else if (diff < month) {
    return Math.floor(diff / week) + " weeks ago";
  } else if (diff < year) {
    return Math.floor(diff / month) + " months ago";
  } else {
    return Math.floor(diff / year) + " years ago";
  }
};

window.madin.getScrollPercentage = function () {
  const view = document.documentElement;

  return Math.round(
    (view.scrollTop / (view.scrollHeight - view.clientHeight)) * 100
  );
};
