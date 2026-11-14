/* Catalog demonstrations only. Apps supply real commerce and data behavior. */
const statusText = document.querySelector("#demo-status p");
const announce = message => { statusText.textContent = message; };

document.querySelectorAll("[data-demo-action]").forEach(button => {
  button.addEventListener("click", () => announce(button.dataset.demoAction));
});

document.querySelectorAll("[data-demo-loading]").forEach(button => {
  button.addEventListener("click", () => {
    const label = button.querySelector("span");
    const icon = button.querySelector("use");
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    label.textContent = "Saving…";
    icon.setAttribute("href", "#icon-loader-circle");
    window.setTimeout(() => {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      label.textContent = "Try loading";
      icon.setAttribute("href", "#icon-arrow-right");
      announce("Loading demo complete. Your app must wait for the real result.");
    }, 1000);
  });
});

document.querySelectorAll('[role="tablist"]').forEach(list => {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const select = tab => {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute("aria-controls")).hidden = !selected;
    });
    tab.focus();
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", event => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); select(tabs[next]); }
    });
  });
});

// Toolbar: one Tab stop, arrow keys move between items (WAI-ARIA APG toolbar pattern).
document.querySelectorAll('[role="toolbar"][data-roving]').forEach(bar => {
  const items = [...bar.querySelectorAll("button:not(:disabled)")];
  items.forEach((item, i) => { item.tabIndex = i === 0 ? 0 : -1; });
  bar.addEventListener("keydown", event => {
    const index = items.indexOf(document.activeElement);
    if (index < 0) return;
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % items.length;
    if (event.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = items.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    items[index].tabIndex = -1;
    items[next].tabIndex = 0;
    items[next].focus();
  });
  bar.querySelectorAll("[data-toggle-group]").forEach(button => {
    button.addEventListener("click", () => {
      bar.querySelectorAll(`[data-toggle-group="${button.dataset.toggleGroup}"]`).forEach(other => other.setAttribute("aria-pressed", String(other === button)));
      announce(`${button.textContent.trim()} view selected.`);
    });
  });
});

document.querySelectorAll("[data-quantity]").forEach(control => {
  const input = control.querySelector("input");
  const decrease = control.querySelector("[data-decrease]");
  const increase = control.querySelector("[data-increase]");
  const update = () => {
    const min = Number(input.min);
    const max = Number(input.max);
    const parsed = Number(input.value);
    const value = Number.isFinite(parsed) ? Math.round(parsed) : min;
    input.value = String(Math.max(min, Math.min(max, value)));
    decrease.disabled = Number(input.value) <= min;
    increase.disabled = Number(input.value) >= max;
  };
  decrease.addEventListener("click", () => { input.stepDown(); update(); });
  increase.addEventListener("click", () => { input.stepUp(); update(); });
  input.addEventListener("change", update);
  update();
});

const dialog = document.getElementById("remove-dialog");
let dialogTrigger = null;
document.querySelectorAll("[data-open-dialog]").forEach(button => {
  button.addEventListener("click", () => { dialogTrigger = button; dialog.showModal(); });
});
dialog.addEventListener("close", () => {
  announce(dialog.returnValue === "remove" ? "Demo: remove confirmed. The sample bag remains so you can keep exploring." : "Item kept. Dialog closed.");
  dialogTrigger?.focus();
});
