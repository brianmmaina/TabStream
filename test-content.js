//test content script
console.log('TEST: Content script loaded');

//creates a simple test element
const testDiv = document.createElement('div');
testDiv.style.cssText = `
  position: fixed;
  top: 10px;
  right: 10px;
  background: red;
  color: white;
  padding: 10px;
  z-index: 10000;
  font-family: Arial, sans-serif;
`;
testDiv.textContent = 'Tab Stream Test - Extension Loaded!';
document.body.appendChild(testDiv);

console.log('TEST: Test element added to page'); 