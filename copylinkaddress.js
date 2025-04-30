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

/*
Refactored: Only creates the hidden span when ⌘+C/Ctrl+C is pressed while hovering a link.
*/

const notyf = new Notyf({
	duration: 1000,
	background: 'green',
});

let previousCaretPosition = -1;
let hoveredLink = null;

function copyToClipboard(text) {
	// Create the hidden span only when needed
	const linkAddress = document.createElement('span');
	linkAddress.style.display = 'inline-block';
	linkAddress.style.position = 'fixed';
	linkAddress.style.top = '0em';
	linkAddress.style.right = '-9999em';
	linkAddress.textContent = text;
	document.body.appendChild(linkAddress);

	selectElement(linkAddress);

	if (text) {
		navigator.clipboard.writeText(text).then(() => {
			notyf.success('Copied to clipboard');
		}).catch(err => {
			notyf.error('Error copying text to clipboard');
			console.error('Error copying text to clipboard', err);
		});
	}

	// Clean up
	linkAddress.blur();
	window.getSelection().removeAllRanges();
	document.body.removeChild(linkAddress);
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

document.addEventListener('mouseover', function (e) {
	if (e.target.tagName === 'A') {
		hoveredLink = e.target;
	}
});

document.addEventListener('mouseout', function (e) {
	if (e.target.tagName === 'A') {
		hoveredLink = null;
	}
});

document.addEventListener('keydown', function (e) {
	if ((e.key === 'c' || e.key === 'C') && (e.ctrlKey || e.metaKey)) {
		let activeElement = document.activeElement;
		let focusInput = activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA");
		let inputIdx = -1;
		if (focusInput) {
			inputIdx = activeElement.selectionStart;
		}
		// Only copy if a link is hovered and nothing is selected
		if (hoveredLink && !window.getSelection().toString()) {
			const targetHref = hoveredLink.getAttribute('href');
			if (targetHref) {
				copyToClipboard(targetHref);
			}
		}
		if (focusInput && inputIdx > -1) {
			activeElement.selectionStart = inputIdx;
			activeElement.selectionEnd = inputIdx;
		}
		if (activeElement) activeElement.focus();
	}
});
