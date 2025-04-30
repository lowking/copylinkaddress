/*
The way the extension works is, once you hover a link:
If something is already selected in the page, it does nothing. Else, it
takes the URL of the link you are hovering, copies it to an invisible span,
programmatically selects the span.

Now when you hit Cmd-C (Ctrl-C), the hidden selection is copied to clipboard.

When you move pointer away from the link, it
clears the hidden selection, clears the invisible span.

If, at the time of hover, the cursor was in a textbox (without anything selected),
it is technically a zero-length selection in Chrome. So, the extension goes ahead and clears that selection
(thereby taking the cursor away from the textbox), saving the caret position.
When you move away from the link, the caret position is restored.
*/

// Initialize Notyf for notifications
const notyf = new Notyf({
	duration: 1000,
	background: 'green',
});

// Create the hidden span for copying
let linkAddress = document.createElement('span');
linkAddress.id = 'copylAddress';
linkAddress.style.display = 'inline-block';
linkAddress.style.position = 'fixed';
linkAddress.style.top = '0em';
linkAddress.style.right = '-9999em';
document.body.appendChild(linkAddress);

let previousCaretPosition = -1;

function copyToClipboard() {
	selectElement(linkAddress);

	const text = linkAddress.textContent;
	if (text) {
		navigator.clipboard.writeText(text).then(() => {
			notyf.success('Copied to clipboard');
		}).catch(err => {
			notyf.error('Error copying text to clipboard');
			console.error('Error copying text to clipboard', err);
		});
	}
}

function selectElement(el) {
	// Backup caret position if in an input/textarea
	if (document.activeElement &&
		(document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")) {
		previousCaretPosition = document.activeElement.selectionStart;
	}
	let range = document.createRange();
	range.selectNodeContents(el);
	let sel = window.getSelection();
	if (sel.rangeCount > 0) {
		sel.removeAllRanges();
	}
	sel.addRange(range);
}

function clearLinkAddress() {
	linkAddress.textContent = "";
	linkAddress.blur();
	window.getSelection().removeAllRanges();
	// Restore caret position if needed
	if (previousCaretPosition !== -1 && document.activeElement &&
		(document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")) {
		document.activeElement.selectionStart = previousCaretPosition;
		document.activeElement.selectionEnd = previousCaretPosition;
	}
	previousCaretPosition = -1;
}

// Event listeners
document.addEventListener('keydown', function (e) {
	if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
		let activeElement = document.activeElement;
		let focusInput = activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA");
		let inputIdx = -1;
		if (focusInput) {
			inputIdx = activeElement.selectionStart;
		}
		if (!window.getSelection().toString()) {
			copyToClipboard();
		}
		if (focusInput && inputIdx > -1) {
			activeElement.selectionStart = inputIdx;
			activeElement.selectionEnd = inputIdx;
		}
		if (activeElement) activeElement.focus();
	}
});

document.addEventListener('mouseover', function (e) {
	if (e.target.tagName === 'A' && !window.getSelection().toString()) {
		let targetHref = e.target.getAttribute('href');
		if (targetHref && (targetHref.startsWith("http") || targetHref.startsWith("javascript"))) {
			linkAddress.style.position = 'fixed';
			linkAddress.style.top = '0em';
			linkAddress.style.right = '-9999em';
		} else if (targetHref) {
			// Show the link as a notification using Notyf
			notyf.open({
				type: 'info',
				message: targetHref.length > 100 ? targetHref.substring(0, 100) + '…' : targetHref,
				duration: 2000,
				ripple: false,
				dismissible: true
			});
		}
		linkAddress.textContent = targetHref || "";
	}
});

document.addEventListener('mouseout', function (e) {
	if (e.target.tagName === 'A') {
		clearLinkAddress();
	}
});

window.addEventListener('beforeunload', function () {
	clearLinkAddress();
});
