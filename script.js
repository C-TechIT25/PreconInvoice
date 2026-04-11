// Firebase Configuration
firebase.initializeApp({
  apiKey: "AIzaSyBCv6IVGlrMLzZDSrQHGw6xqXG-kPDs-JM",
  authDomain: "preconinvoice.firebaseapp.com",
  projectId: "preconinvoice",
  storageBucket: "preconinvoice.firebasestorage.app",
  messagingSenderId: "420799463124",
  appId: "1:420799463124:web:5f5b3d8196478e84944541"
});

var db = firebase.firestore();

// Helper Functions
function toast(msg, color) {
  color = color || "#10b981";
  var t = document.getElementById("toast");
  t.textContent = msg;
  t.style.borderLeftColor = color;
  t.classList.add("show");
  setTimeout(function() { t.classList.remove("show"); }, 2800);
}

function fmt(n) {
  return parseFloat(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function esc(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Navigation
function showPage(pageId, navEl) {
  document.querySelectorAll(".page-section").forEach(s => s.style.display = "none");
  document.getElementById(pageId).style.display = "block";
  document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
  if (navEl) navEl.classList.add("active");
  if (pageId === "viewPage") loadInvoices();
}

// Data Model
var items = [
  {
    name: "1'x1' Grass Paver",
    specs: [{ k: "Thickness", v: "60mm" }, { k: "Size", v: "1'x1'" }, { k: "Material", v: "Concrete" }, { k: "Strength", v: "50 MPa" }, { k: "Color", v: "Gray" }],
    qty: 1300,
    unit: "Nos",
    price: 93
  },
  {
    name: "Hollow Concrete Block",
    specs: [{ k: "Thickness", v: "90mm" }, { k: "Size", v: "400x200x200" }, { k: "Material", v: "Concrete" }, { k: "Density", v: "Lightweight" }, { k: "Usage", v: "Wall" }],
    qty: 500,
    unit: "Nos",
    price: 45
  },
  {
    name: "Paving Interlock Tile",
    specs: [{ k: "Thickness", v: "80mm" }, { k: "Shape", v: "I-Shape" }, { k: "Material", v: "Concrete" }, { k: "Finish", v: "Textured" }, { k: "Color", v: "Red" }],
    qty: 2000,
    unit: "Sqft",
    price: 28
  }
];

// Render Editor
function render() {
  var tb = document.getElementById("itemsBody");
  tb.innerHTML = "";
  items.forEach(function(item, i) {
    var amt = item.qty * item.price;
    var specsHtml = item.specs.map(function(s, si) {
      return '<div class="spec-line">' +
        '<span class="spec-key" contenteditable="true" data-i="' + i + '" data-si="' + si + '" data-f="k">' + esc(s.k) + '</span>' +
        ' : <span contenteditable="true" data-i="' + i + '" data-si="' + si + '" data-f="v">' + esc(s.v) + '</span>' +
        '</div>';
    }).join("");
    var tr = document.createElement("tr");
    tr.innerHTML =
      '<td style="text-align:center;vertical-align:top">' + (i + 1) + '</td>' +
      '<td style="vertical-align:top">' +
      '<input class="ei" style="font-weight:700;font-size:11px" data-i="' + i + '" data-f="name" value="' + esc(item.name) + '">' +
      '<div style="margin-top:4px">' + specsHtml + '</div>' +
      '<div style="margin-top:6px">' +
      '<button onclick="addSpec(' + i + ')"        style="font-size:9px;padding:2px 8px;border:1px solid #ffd6d6;background:#fff5f5;color:#d93a39;border-radius:3px;cursor:pointer;margin-right:4px">+ Spec</button>' +
      '<button onclick="removeLastSpec(' + i + ')" style="font-size:9px;padding:2px 8px;border:1px solid #ffd6d6;background:#fff5f5;color:#d93a39;border-radius:3px;cursor:pointer">− Spec</button>' +
      '</div>' +
      '</td>' +
      '<td style="vertical-align:top"><input class="ei" type="number" data-i="' + i + '" data-f="qty"   value="' + item.qty + '"        style="width:55px;text-align:center"></td>' +
      '<td style="vertical-align:top"><input class="ei"              data-i="' + i + '" data-f="unit"  value="' + esc(item.unit) + '"  style="width:50px;text-align:center"></td>' +
      '<td style="vertical-align:top"><input class="ei" type="number" data-i="' + i + '" data-f="price" value="' + item.price + '"     style="width:75px;text-align:right"></td>' +
      '<td style="text-align:right;font-weight:700;color:var(--red-d);vertical-align:top">₹ ' + fmt(amt) + '</td>';
    tb.appendChild(tr);
  });
  tb.querySelectorAll("input[data-i]").forEach(function(el) {
    el.addEventListener("input", function() {
      var i = +el.dataset.i,
        f = el.dataset.f;
      if (f === "qty" || f === "price") items[i][f] = parseFloat(el.value) || 0;
      else items[i][f] = el.value;
      recalc();
      var row = tb.querySelectorAll("tr")[i];
      if (row) row.cells[5].innerHTML = "₹ " + fmt(items[i].qty * items[i].price);
    });
  });
  tb.querySelectorAll("[data-si]").forEach(function(el) {
    el.addEventListener("input", function() {
      items[+el.dataset.i].specs[+el.dataset.si][el.dataset.f] = el.innerText.trim();
    });
  });
  recalc();
}

// Calculations
function recalc() {
  var sub = 0;
  items.forEach(function(it) { sub += it.qty * it.price; });
  var sg = parseFloat(document.getElementById("sgstRate").value) || 0;
  var cg = parseFloat(document.getElementById("cgstRate").value) || 0;
  document.getElementById("subTotal").innerHTML = "₹ " + fmt(sub);
  document.getElementById("sgstAmt").innerHTML = "₹ " + fmt(sub * sg / 100);
  document.getElementById("cgstAmt").innerHTML = "₹ " + fmt(sub * cg / 100);
  document.getElementById("grandTotal").innerHTML = "₹ " + fmt(sub + sub * sg / 100 + sub * cg / 100);
  document.getElementById("amountWords").innerHTML = numWords(Math.round(sub + sub * sg / 100 + sub * cg / 100));
}

function numWords(n) {
  if (!n) return "Zero Only";
  var a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  var b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function w(x) {
    if (x < 20) return a[x];
    if (x < 100) return b[Math.floor(x / 10)] + (x % 10 ? " " + a[x % 10] : "");
    if (x < 1000) return a[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " + w(x % 100) : "");
    if (x < 100000) return w(Math.floor(x / 1000)) + " Thousand" + (x % 1000 ? " " + w(x % 1000) : "");
    if (x < 10000000) return w(Math.floor(x / 100000)) + " Lakh" + (x % 100000 ? " " + w(x % 100000) : "");
    return w(Math.floor(x / 10000000)) + " Crore" + (x % 10000000 ? " " + w(x % 10000000) : "");
  }
  return "Rupees " + w(n) + " Only";
}

// Add/Remove Functions
function addItemRow() {
  items.push({ name: "New Product", specs: [{ k: "Specification", v: "Value" }, { k: "Material", v: "Standard" }], qty: 1, unit: "Nos", price: 0 });
  render();
}

function removeLastItem() {
  if (items.length > 1) {
    items.pop();
    render();
  } else toast("⚠️ At least one item required", "#f59e0b");
}

function addSpec(i) {
  items[i].specs.push({ k: "Property", v: "Value" });
  render();
}

function removeLastSpec(i) {
  if (items[i].specs.length > 1) {
    items[i].specs.pop();
    render();
  }
}

// Print CSS
/* Updated PRINT_CSS in your script */
var PRINT_CSS = [
  '*{margin:0;padding:0;box-sizing:border-box}',
  'body{font-family:"DM Sans",sans-serif;font-size:10pt;background:#fff}',
  '.pp{width:100%;background:#fff;page-break-after:always;display:flex;flex-direction:column;min-height:100vh}',
  '.pp:last-child{page-break-after:auto}',
  '.pp-content{flex:1}',
  '.title-bar{background:#fe5958;text-align:center;padding:14px 0 12px;position:relative}',
  '.title-bar h1{font-size:22px;font-weight:800;letter-spacing:0px;text-transform:uppercase;color:#fff}',
  '.orig-copy{position:absolute;right:16px;top:50%;transform:translateY(-50%);font-size:8px;color:rgba(255,255,255,0.55);font-weight:600;letter-spacing:1.5px;text-transform:uppercase}',
  '.header-grid{display:grid;grid-template-columns:1fr auto;border-bottom:2px solid #fe5958}',
  '.co-block{padding:16px 20px;border-right:1px solid #ccc;display:flex;gap:14px}',
  '.co-logo{width:64px;height:64px;border-radius:50%;border:2px solid #ffd6d6;object-fit:contain;flex-shrink:0}',
  '.co-name{font-size:17px;font-weight:800;color:#fe5958;text-transform:uppercase;margin-bottom:3px}',
  '.co-tagline{font-size:7.5px;letter-spacing:1.2px;text-transform:uppercase;color:#d93a39;font-weight:600;opacity:.75;margin-bottom:6px}',
  '.co-addr{font-size:9.5px;color:#555;line-height:1.75}',
  '.co-gstin-badge{display:inline-block;margin-top:5px;background:#fff5f5;border:1px solid #ffd6d6;color:#d93a39;padding:2px 8px;border-radius:3px;font-family:monospace;font-size:9px;font-weight:700}',
  '.inv-meta{min-width:240px;display:flex;flex-direction:column}',
  '.inv-meta-title{background:#fe5958;color:#fff;font-size:8px;letter-spacing:2px;text-transform:uppercase;font-weight:700;padding:8px 14px;text-align:center}',
  '.inv-meta table{width:100%;border-collapse:collapse;flex:1}',
  '.inv-meta td{padding:6px 12px;font-size:10px;border-bottom:1px solid #ffd6d6}',
  '.inv-meta td:first-child{color:#555;width:90px;border-right:1px solid #ffd6d6;background:#fff5f5}',
  '.inv-meta td:last-child{font-weight:700}',
  '.cust-strip{display:grid;grid-template-columns:1fr 1fr;border-bottom:2px solid #fe5958}',
  '.cust-block{padding:0px 20px;font-size:10px;line-height:1.75;padding-bottom:12px;background-color:var(--red-l)}',
  '.cust-block:first-child{border-right:1px solid #ffd6d6}',
  '.cust-lbl{font-size:7.5px;letter-spacing:2px;text-transform:uppercase;color:#fff;font-weight:700;background:#fe5958;padding:4px 10px;  margin: -12px -20px 10px;display:inline-block;width:120%}',
  '.cust-name{font-weight:700;font-size:11.5px}',
  '.cust-addr{color:#555;font-size:10px}',
  '.cust-gstin{display:inline-block;margin-top:5px;background:#ffd6d6;color:#d93a39;padding:2px 7px;border-radius:3px;font-family:monospace;font-size:9px;font-weight:700}',
  '.items-wrap{padding:0 0px 10px}',
  /* NEW RULES TO REMOVE GAP BETWEEN TABLE AND BANK DETAILS */
  '.items-wrap table.items { margin-bottom: 0 !important; border-bottom: none !important; }',
  '.footer-three-col { margin-top: 0 !important; border-top: 2px solid #fe5958; }',
  '.footer-bank, .footer-terms, .footer-totals { padding-top: 8px !important; padding-bottom: 8px !important; }',
  '.blabel { margin-bottom: 4px !important; }',
  '.btable td { padding: 1px 6px 1px 0 !important; }',
  /* End of new rules */
  '.footer-three-col{display:grid;grid-template-columns:1fr 1fr 1fr;border-top:2px solid #fe5958;margin-top:100px}',
  '.footer-bank,.footer-terms,.footer-totals{padding:14px 16px}',
  '.footer-bank,.footer-terms{border-right:1px solid #ffd6d6}',
  '.blabel{font-size:7.5px;letter-spacing:2px;text-transform:uppercase;color:#fe5958;font-weight:700;margin-bottom:8px;display:block}',
  '.btable td{padding:2px 6px 2px 0;font-size:10px}',
  '.tc-item{display:flex;gap:8px;font-size:10px;color:#555;margin-bottom:5px}',
  '.tc-num{color:#fe5958;font-weight:700;flex-shrink:0}',
  'table.totals{width:100%;border-collapse:collapse}',
  'table.totals td{padding:6px 10px;font-size:10.5px;border-bottom:1px solid #ffd6d6}',
  '.subtotal-row td{font-weight:600;background:#fff5f5}',
  '.gst-rate-sel{font-size:10px;background:#ffd6d6;border:none;color:#d93a39;font-weight:600;border-radius:3px;padding:1px 4px}',
  '.total-final-row td{background:#fe5958!important;color:#fff!important;font-weight:800;font-size:13px;border:none;padding:10px}',
  '.amount-words{padding:8px 20px;background:#fff5f5;border-top:1px solid #ffd6d6;font-size:10px;font-weight:500}',
  '.sig-strip{display:flex;justify-content:end;align-items:flex-end;padding:16px 24px 22px;border-top:1px solid #ffd6d6}',
  '.sig-area{width:200px;height:100px;border-bottom:1.5px solid #fe5958;margin:10px 0 6px;background:#fff;display:flex;align-items:center;justify-content:center}',
  '.sig-img-fixed{max-width:100$;max-height:100px;object-fit:contain}',
  '.sig-auth{font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:#fe5958;font-weight:700; text-align: center;margin-top: 5px;}',
  '.red-bar{height:6px;background:#fe5958}',
  '@media print{body{margin:0;padding:0}.pp{page-break-after:always;min-height:297mm}.pp:last-child{page-break-after:auto}}'
].join('');

var TH = '<table style="width:100%;border-collapse:collapse;">' +
  '<thead><tr style="background:#fe5958;color:#fff">' +
  '<th style="padding:9px 10px;text-align:center;width:40px;font-size:8px;letter-spacing:1px;text-transform:uppercase">S.No</th>' +
  '<th style="padding:9px 10px;text-align:left;width:185px;font-size:8px;letter-spacing:1px;text-transform:uppercase">Items</th>' +
  '<th style="padding:9px 10px;text-align:center;width:55px;font-size:8px;letter-spacing:1px;text-transform:uppercase">QTY</th>' +
  '<th style="padding:9px 10px;text-align:center;width:55px;font-size:8px;letter-spacing:1px;text-transform:uppercase">Unit</th>' +
  '<th style="padding:9px 10px;text-align:right;width:80px;font-size:8px;letter-spacing:1px;text-transform:uppercase">Price</th>' +
  '<th style="padding:9px 10px;text-align:right;width:90px;font-size:8px;letter-spacing:1px;text-transform:uppercase">Amount</th>' +
  '</tr></thead><tbody>';

function buildItemRows() {
  return items.map(function(item, idx) {
    var specsHtml = item.specs.map(function(s) {
      return '<div style="display:flex;gap:6px;font-size:9px;margin:2px 0">' +
        '<span style="color:#d93a39;font-weight:600;min-width:80px">' + esc(s.k) + '</span>' +
        ' : <span>' + esc(s.v) + '</span></div>';
    }).join("");
    var amt = item.qty * item.price;
    return '<tr style="border-bottom:1px solid #ffd6d6">' +
      '<td style="padding:10px;text-align:center;vertical-align:top">' + (idx + 1) + '</td>' +
      '<td style="padding:10px;vertical-align:top"><strong style="font-size:11px">' + esc(item.name) + '</strong>' +
      '<div style="margin-top:4px">' + specsHtml + '</div></td>' +
      '<td style="padding:10px;text-align:center;vertical-align:top">' + item.qty + '</td>' +
      '<td style="padding:10px;text-align:center;vertical-align:top">' + esc(item.unit) + '</td>' +
      '<td style="padding:10px;text-align:right;vertical-align:top">₹ ' + fmt(item.price) + '</td>' +
      '<td style="padding:10px;text-align:right;font-weight:700;color:#d93a39;vertical-align:top">₹ ' + fmt(amt) + '</td>' +
      '</tr>';
  });
}

function getHeaderHtml() {
  return document.querySelector(".title-bar").outerHTML +
    document.querySelector(".header-grid").outerHTML +
    document.querySelector(".cust-strip").outerHTML;
}

function getFooterHtml() {
  var sub = 0;
  items.forEach(function(it) { sub += it.qty * it.price; });
  var sg = parseFloat(document.getElementById("sgstRate").value) || 0;
  var cg = parseFloat(document.getElementById("cgstRate").value) || 0;
  var grand = sub + sub * sg / 100 + sub * cg / 100;
  var totalsHtml =
    '<div class="footer-three-col">' +
    '<div class="footer-bank">' +
    '<span class="blabel">🏦 Bank Details</span>' +
    '<table class="btable">' +
    document.querySelector(".footer-bank .btable").innerHTML +
    '</table>' +
    '</div>' +
    '<div class="footer-terms">' +
    '<span class="blabel">📜 Terms &amp; Conditions</span>' +
    document.querySelector(".footer-terms").innerHTML.replace(/<span class="blabel">.*?<\/span>/, '') +
    '</div>' +
    '<div class="footer-totals">' +
    '<table class="totals">' +
    '<tr class="subtotal-row"><td>Sub Total</td><td>₹ ' + fmt(sub) + '</td></tr>' +
    '<tr><td>SGST @ ' + sg + '%</td><td>₹ ' + fmt(sub * sg / 100) + '</td></tr>' +
    '<tr><td>CGST @ ' + cg + '%</td><td>₹ ' + fmt(sub * cg / 100) + '</td></tr>' +
    '<tr class="total-final-row"><td>Total</td><td>₹ ' + fmt(grand) + '</td></tr>' +
    '</table>' +
    '</div>' +
    '</div>' +
    '<div class="amount-words">Amount in Words: <b>' + numWords(Math.round(grand)) + '</b></div>' +
    document.querySelector(".sig-strip").outerHTML +
    '<div class="red-bar"></div>';
  return totalsHtml;
}

// Print with Pagination
function printMultiPageInvoice() {
  var hdr = getHeaderHtml();
  var ftr = getFooterHtml();
  var rowsArr = buildItemRows();
  var total = rowsArr.length;
  var pages = [];
  if (total <= 2) {
    pages.push(rowsArr);
  } else {
    pages.push(rowsArr.slice(0, 4));
    var rest = rowsArr.slice(4);
    for (var i = 0; i < rest.length; i += 4) {
      pages.push(rest.slice(i, i + 4));
    }
  }
  var pw = window.open("", "_blank");
  pw.document.write('<!DOCTYPE html><html><head>' +
    '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">' +
    '<style>' + PRINT_CSS + '</style>' +
    '</head><body>');
  for (var p = 0; p < pages.length; p++) {
    var isLast = (p === pages.length - 1);
    pw.document.write(
      '<div class="pp">' +
      '<div class="pp-content">' +
      hdr +
      '<div class="items-wrap">' +
      TH + pages[p].join("") + '</tbody></table>' +
      '</div>' +
      '</div>' +
      (isLast ? '<div class="pp-footer">' + ftr + '</div>' : '') +
      '</div>'
    );
  }
  pw.document.write('</body></html>');
  pw.document.close();
  pw.focus();
  setTimeout(function() { pw.print(); }, 700);
}

// Firestore Operations
function collectData() {
  var sub = 0;
  items.forEach(function(it) { sub += it.qty * it.price; });
  var sg = parseFloat(document.getElementById("sgstRate").value) || 0;
  var cg = parseFloat(document.getElementById("cgstRate").value) || 0;
  return {
    invoiceNo: document.getElementById("invNo").innerText.trim(),
    invoiceDate: document.getElementById("invDate").innerText.trim(),
    buyerRef: document.getElementById("buyerRef").innerText.trim(),
    otherRef: document.getElementById("otherRef").innerText.trim(),
    supplyState: document.getElementById("supplyState").innerText.trim(),
    customer: { name: document.getElementById("custName").innerText.trim(), address: document.getElementById("custAddr").innerText.trim(), gstin: document.getElementById("custGst").innerText.trim() },
    shipTo: { name: document.getElementById("shipName").innerText.trim(), address: document.getElementById("shipAddr").innerText.trim(), phone: document.getElementById("shipPhone").innerText.trim() },
    items: items.map(function(it) { return { name: it.name, specs: it.specs, qty: it.qty, unit: it.unit, price: it.price, amount: it.qty * it.price }; }),
    sgstRate: sg,
    cgstRate: cg,
    subTotal: sub,
    sgstAmt: sub * sg / 100,
    cgstAmt: sub * cg / 100,
    grandTotal: sub + sub * sg / 100 + sub * cg / 100,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
}

function saveToFirestore() {
  var btn = document.getElementById("saveBtn");
  btn.textContent = "Saving…";
  btn.disabled = true;
  db.collection("invoices").add(collectData())
    .then(function(r) { toast("✅ Saved! ID: " + r.id.slice(0, 8)); btn.textContent = "💾 Save to Firestore"; btn.disabled = false; })
    .catch(function(e) { toast("❌ " + e.message, "#ef4444"); btn.textContent = "💾 Save to Firestore"; btn.disabled = false; });
}

function loadInvoices() {
  var tbody = document.getElementById("listBody");
  tbody.innerHTML = '<tr><td colspan="5" style="padding:24px;text-align:center">Loading...</td></tr>';
  db.collection("invoices").orderBy("createdAt", "desc").get()
    .then(function(snap) {
      if (snap.empty) { tbody.innerHTML = '<tr><td colspan="5" style="padding:24px;text-align:center">No invoices found</td></tr>'; return; }
      tbody.innerHTML = "";
      snap.forEach(function(ds) {
        var d = ds.data(),
          id = ds.id,
          tr = document.createElement("tr");
        tr.innerHTML = '<td style="font-weight:700">' + esc(d.invoiceNo) + '</td>' +
          '<td>' + esc(d.invoiceDate) + '</td>' +
          '<td>' + esc((d.customer && d.customer.name) || "-") + '</td>' +
          '<td style="font-weight:700">₹ ' + fmt(d.grandTotal) + '</td>' +
          '<td class="action-cell">' +
          '<button class="more-btn" onclick="toggleMenu(\'' + id + '\', event)">⋮</button>' +
          '<div class="dropdown-menu" id="menu-' + id + '">' +
          '<div class="dropdown-item view" onclick="viewInvoiceDetail(\'' + id + '\')">👁️ View</div>' +
          '<div class="dropdown-item pdf" onclick="pdfInvoice(\'' + id + '\')">📄 PDF Invoice</div>' +
          '</div>' +
          '</td>';
        tbody.appendChild(tr);
      });
    })
    .catch(function(e) { tbody.innerHTML = '<tr><td colspan="5" style="padding:24px;color:#ef4444">Error: ' + esc(e.message) + '</td></tr>'; });
}

var activeMenu = null;
function toggleMenu(id, e) {
  e.stopPropagation();
  var menu = document.getElementById("menu-" + id);
  if (activeMenu && activeMenu !== menu) activeMenu.classList.remove("show");
  menu.classList.toggle("show");
  activeMenu = menu.classList.contains("show") ? menu : null;
}

document.addEventListener("click", function() {
  if (activeMenu) { activeMenu.classList.remove("show"); activeMenu = null; }
});

function viewInvoiceDetail(id) {
  db.collection("invoices").doc(id).get().then(function(ds) {
    if (!ds.exists) return;
    var d = ds.data();
    var body = document.getElementById("modalBody");
    body.innerHTML = '<div class="page" style="box-shadow:none;border:none">' + renderStaticInvoice(d) + '</div>';
    document.getElementById("modal").style.display = "block";
  });
}

function pdfInvoice(id) {
  db.collection("invoices").doc(id).get().then(function(ds) {
    if (!ds.exists) return;
    printStaticInvoice(ds.data());
  });
}

function renderStaticInvoice(d) {
  var itemsHtml = d.items.map((it, i) => {
    var specsHtml = it.specs.map(s => '<div class="spec-line"><span class="spec-key">' + esc(s.k) + '</span> : <span>' + esc(s.v) + '</span></div>').join("");
    return '<tr style="border-bottom:1px solid var(--red-m)">' +
      '<td style="text-align:center">' + (i + 1) + '</td>' +
      '<td><b>' + esc(it.name) + '</b><div style="margin-top:4px">' + specsHtml + '</div></td>' +
      '<td style="text-align:center">' + it.qty + '</td>' +
      '<td style="text-align:center">' + esc(it.unit) + '</td>' +
      '<td style="text-align:right">₹ ' + fmt(it.price) + '</td>' +
      '<td style="text-align:right;font-weight:700;color:var(--red-d)">₹ ' + fmt(it.amount) + '</td></tr>';
  }).join("");

  return document.querySelector(".title-bar").outerHTML +
    '<div class="header-grid">' +
    '<div class="co-block">' + document.querySelector(".co-block").innerHTML + '</div>' +
    '<div class="inv-meta"><div class="inv-meta-title">Invoice Details</div><table>' +
    '<tr><td>No.</td><td>' + esc(d.invoiceNo) + '</td></tr>' +
    '<tr><td>Date</td><td>' + esc(d.invoiceDate) + '</td></tr>' +
    '<tr><td>Buyer Ref.</td><td>' + esc(d.buyerRef) + '</td></tr>' +
    '<tr><td>State</td><td>' + esc(d.supplyState) + '</td></tr></table></div></div>' +
    '<div class="cust-strip">' +
    '<div class="cust-block"><span class="cust-lbl">Customer</span><div class="cust-name">' + esc(d.customer.name) + '</div><div class="cust-addr">' + esc(d.customer.address) + '</div><div class="cust-gstin">' + esc(d.customer.gstin) + '</div></div>' +
    '<div class="cust-block"><span class="cust-lbl">Ship To</span><div class="cust-name">' + esc(d.shipTo.name) + '</div><div class="cust-addr">' + esc(d.shipTo.address) + '</div><div style="font-size:10px">Contact: ' + esc(d.shipTo.phone) + '</div></div></div>' +
    '<div class="items-wrap"><table class="items"><thead><tr><th>S.No</th><th>Items</th><th>QTY</th><th>Unit</th><th>Price</th><th>Amount</th></tr></thead><tbody>' + itemsHtml + '</tbody></table></div>' +
    '<div class="footer-three-col">' +
    '<div class="footer-bank">' + document.querySelector(".footer-bank").innerHTML + '</div>' +
    '<div class="footer-terms">' + document.querySelector(".footer-terms").innerHTML + '</div>' +
    '<div class="footer-totals"><table class="totals">' +
    '<tr class="subtotal-row"><td>Sub Total</td><td>₹ ' + fmt(d.subTotal) + '</td></tr>' +
    '<tr><td>SGST @ ' + d.sgstRate + '%</td><td>₹ ' + fmt(d.sgstAmt) + '</td></tr>' +
    '<tr><td>CGST @ ' + d.cgstRate + '%</td><td>₹ ' + fmt(d.cgstAmt) + '</td></tr>' +
    '<tr class="total-final-row"><td>Total</td><td style="background:var(--red);color:#fff;font-weight:800;font-size:15px;padding:10px">₹ ' + fmt(d.grandTotal) + '</td></tr></table></div></div>' +
    '<div class="amount-words">Amount in Words: <b>' + numWords(Math.round(d.grandTotal)) + '</b></div>' +
    document.querySelector(".sig-strip").outerHTML +
    '<div class="red-bar"></div>';
}

function printStaticInvoice(d) {
  var rowsArr = d.items.map(function(item, idx) {
    var specsHtml = item.specs.map(function(s) {
      return '<div style="display:flex;gap:6px;font-size:9px;margin:2px 0">' +
        '<span style="color:#d93a39;font-weight:600;min-width:80px">' + esc(s.k) + '</span> : <span>' + esc(s.v) + '</span></div>';
    }).join("");
    return '<tr style="border-bottom:1px solid #ffd6d6"><td style="padding:10px;text-align:center;vertical-align:top">' + (idx + 1) + '</td>' +
      '<td style="padding:10px;vertical-align:top"><strong style="font-size:11px">' + esc(item.name) + '</strong><div style="margin-top:4px">' + specsHtml + '</div></td>' +
      '<td style="padding:10px;text-align:center;vertical-align:top">' + item.qty + '</td>' +
      '<td style="padding:10px;text-align:center;vertical-align:top">' + esc(item.unit) + '</td>' +
      '<td style="padding:10px;text-align:right;vertical-align:top">₹ ' + fmt(item.price) + '</td>' +
      '<td style="padding:10px;text-align:right;font-weight:700;color:#d93a39;vertical-align:top">₹ ' + fmt(item.amount) + '</td></tr>';
  });

  var pw = window.open("", "_blank");
  pw.document.write('<!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"><style>' + PRINT_CSS + '</style></head><body>');
  
  // Simplified single page logic for static print for now, or use pagination
  pw.document.write('<div class="pp"><div class="pp-content">' + renderStaticInvoice(d) + '</div></div>');
  pw.document.write('</body></html>');
  pw.document.close();
  pw.focus();
  setTimeout(function() { pw.print(); }, 700);
}

function viewInvoices() { showPage("viewPage"); }
function showInvoiceForm() { showPage("createPage"); }
function closeModal() { document.getElementById("modal").style.display = "none"; }

// Initialize
render();