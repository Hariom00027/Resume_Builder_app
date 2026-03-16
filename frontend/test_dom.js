const { JSDOM } = require("jsdom");

const dom = new JSDOM(`<!DOCTYPE html><html><body>
  <div id="test1">Name: <span>John Doe</span></div>
  <div id="test2"><span>Bold</span> text</div>
  <div id="test3">{{ placeholder }}</div>
  <div id="test4"></div>
</body></html>`);

const doc = dom.window.document;

const updateTextPreservingStructure = (el, textToSet) => {
  if (el.textContent && el.textContent.includes('{{')) {
    const walker = el.ownerDocument.createTreeWalker(el, 4, null); // 4 = NodeFilter.SHOW_TEXT
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.includes('{{')) {
        node.textContent = node.textContent.replace(/\{\{[^}]+\}\}/g, textToSet);
      }
    }
    return;
  }

  if (el.children.length === 0) {
    el.textContent = textToSet;
    return;
  }

  const walker = el.ownerDocument.createTreeWalker(el, 4, null);
  let textNodeToUpdate = null;
  let fallbackNode = null;
  let node;
  while ((node = walker.nextNode())) {
    if (node.textContent.trim().length > 0) {
      if (!textNodeToUpdate) textNodeToUpdate = node;
    } else if (!fallbackNode) {
      fallbackNode = node;
    }
  }

  if (textNodeToUpdate) {
    textNodeToUpdate.textContent = textToSet;
  } else if (fallbackNode) {
    fallbackNode.textContent = textToSet;
  } else {
    el.appendChild(el.ownerDocument.createTextNode(textToSet));
  }
};

const el1 = doc.getElementById('test1');
updateTextPreservingStructure(el1, 'Jane Doe');
console.log('test1:', el1.innerHTML); // Expect: "Name: " replaced? Wait. It will find "Name: " first and replace that.

const el2 = doc.getElementById('test2');
updateTextPreservingStructure(el2, 'Updated');
console.log('test2:', el2.innerHTML);

const el3 = doc.getElementById('test3');
updateTextPreservingStructure(el3, 'Filled');
console.log('test3:', el3.innerHTML);

const el4 = doc.getElementById('test4');
updateTextPreservingStructure(el4, 'New text');
console.log('test4:', el4.innerHTML);
