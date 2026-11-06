document.addEventListener("DOMContentLoaded", function () {
	if (document.cookie.indexOf("usageHintsDismissed=1") !== -1) return;
	var lang = new URLSearchParams(window.location.search).get("lang") || "de";
	var hideCls = lang === "en" ? "translate-de" : "translate-en";
	document.querySelectorAll("#usageHintsModal ." + hideCls).forEach(function (el) {
		el.style.display = "none";
	});
	var modalEl = document.getElementById("usageHintsModal");
	var modal = new bootstrap.Modal(modalEl);
	modalEl.addEventListener("hidden.bs.modal", function () {
		if (document.getElementById("usageHintsDismiss").checked) {
			document.cookie = "usageHintsDismissed=1; max-age=31536000; path=/; SameSite=Lax";
		}
	});
	modal.show();
});
