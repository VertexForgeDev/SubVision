// Bulletproof Global Disclaimer Handler
window.acceptDisclaimer = function() {
  localStorage.setItem('subvision_disclaimer_accepted', 'true');
  const modal = document.getElementById('disclaimerModal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('searchForm');
  const domainInput = document.getElementById('domainInput');
  const validationError = document.getElementById('validationError');
  const heroSection = document.getElementById('heroSection');
  const scanningOverlay = document.getElementById('scanningOverlay');
  const dashboardSection = document.getElementById('dashboardSection');
  const subTableBody = document.getElementById('subTableBody');
  const jsonOutput = document.getElementById('jsonOutput');
  const targetDomainTitle = document.getElementById('targetDomainTitle');
  const targetDomainSubtitle = document.getElementById('targetDomainSubtitle');

  // Statistics Elements
  const statTotal = document.getElementById('statTotal');
  const statHttps = document.getElementById('statHttps');
  const statHttp = document.getElementById('statHttp');
  const statDuration = document.getElementById('statDuration');

  // Disclaimer Modal Elements
  const disclaimerModal = document.getElementById('disclaimerModal');
  const acceptDisclaimerBtn = document.getElementById('acceptDisclaimerBtn');
  
  let lastScanTimestamp = 0;
  const SCAN_COOLDOWN_MS = 5000;

  // Initial Modal Check
  if (disclaimerModal) {
    if (!localStorage.getItem('subvision_disclaimer_accepted')) {
      disclaimerModal.classList.add('active');
      disclaimerModal.style.display = 'flex';
    } else {
      disclaimerModal.classList.remove('active');
      disclaimerModal.style.display = 'none';
    }
  }

  if (acceptDisclaimerBtn) {
    acceptDisclaimerBtn.addEventListener('click', () => {
      window.acceptDisclaimer();
    });
  }

  let currentScanData = null;

  // Quick tags click handler
  document.querySelectorAll('.domain-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      if (domainInput) {
        domainInput.value = tag.dataset.domain;
        domainInput.focus();
      }
    });
  });

  // Form Submission with Rate Limiting
  if (searchForm) {
    searchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!domainInput) return;

      const now = Date.now();
      if (now - lastScanTimestamp < SCAN_COOLDOWN_MS) {
        const remainingSecs = Math.ceil((SCAN_COOLDOWN_MS - (now - lastScanTimestamp)) / 1000);
        showError(`Rate limit safeguard: Please wait ${remainingSecs}s before initiating another scan.`);
        return;
      }

      const rawInput = domainInput.value;
      const sanitizedDomain = sanitizeDomain(rawInput);

      if (!validateDomain(sanitizedDomain)) {
        showError('Please enter a valid target domain (e.g., example.com)');
        return;
      }

      hideError();
      lastScanTimestamp = now;
      await executeScan(sanitizedDomain);
    });
  }

  function sanitizeDomain(input) {
    let clean = input.trim().toLowerCase();
    clean = clean.replace(/^https?:\/\//, '');
    clean = clean.replace(/\/+$/, '');
    clean = clean.replace(/^www\./, '');
    return clean;
  }

  function validateDomain(domain) {
    const regex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}(?::[0-9]{1,5})?(\/.*)?$/i;
    return regex.test(domain);
  }

  function showError(msg) {
    if (validationError) {
      validationError.textContent = msg;
      validationError.style.display = 'block';
    }
    if (domainInput) {
      domainInput.style.borderColor = 'var(--color-danger)';
    }
  }

  function hideError() {
    if (validationError) {
      validationError.style.display = 'none';
    }
    if (domainInput) {
      domainInput.style.borderColor = 'var(--card-border)';
    }
  }

  const scanningMessages = [
    'Scanning infrastructure topology...',
    'Collecting deep cyber intelligence...',
    'Enumerating public subdomains...',
    'Analyzing DNS records & endpoints...',
    'Mapping attack surface assets...',
    'Finalizing target reconnaissance...'
  ];

  async function executeScan(domain) {
    if (heroSection) heroSection.style.display = 'none';
    if (dashboardSection) dashboardSection.classList.remove('active');
    if (scanningOverlay) scanningOverlay.classList.add('active');

    let msgIndex = 0;
    const scanningStatusText = document.getElementById('scanningStatusText');
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % scanningMessages.length;
      if (scanningStatusText) {
        scanningStatusText.textContent = scanningMessages[msgIndex];
      }
    }, 1200);

    const startTime = Date.now();

    try {
      const response = await fetch(`/api/scan?domain=${encodeURIComponent(domain)}`);
      clearInterval(msgInterval);

      if (!response.ok) {
        let errorMsg = `Server responded with status ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson && errJson.error) {
            errorMsg = errJson.error;
          }
        } catch (err) {
          if (response.status === 404) {
            errorMsg = 'API endpoint (/api/scan) not found. Ensure serverless functions are active.';
          }
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      currentScanData = data;

      const elapsed = Date.now() - startTime;
      const minDelay = 1500;
      if (elapsed < minDelay) {
        await new Promise(r => setTimeout(r, minDelay - elapsed));
      }

      renderDashboard(data);
    } catch (err) {
      clearInterval(msgInterval);
      if (scanningOverlay) scanningOverlay.classList.remove('active');
      if (heroSection) heroSection.style.display = 'flex';
      showError(err.message || 'Scan failed. Please verify the domain and try again.');
      showToast('Scan Error: ' + err.message, 'danger');
    }
  }

  function renderDashboard(data) {
    if (scanningOverlay) scanningOverlay.classList.remove('active');
    if (dashboardSection) dashboardSection.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const domain = data.domain || 'Target';
    if (targetDomainTitle) targetDomainTitle.textContent = `🛰️ ${domain}`;
    if (targetDomainSubtitle) targetDomainSubtitle.textContent = `Scanned at ${new Date(data.scannedAt).toLocaleString()} via Secure Serverless Proxy`;

    let subdomains = [];
    if (Array.isArray(data.results)) {
      subdomains = data.results;
    } else if (data.results && Array.isArray(data.results.subdomains)) {
      subdomains = data.results.subdomains;
    } else if (data.results && typeof data.results === 'object') {
      subdomains = Object.values(data.results).flat();
    }

    const total = subdomains.length;
    let httpsCount = 0;
    let httpCount = 0;

    const formattedSubdomains = subdomains.map(item => {
      let subStr = typeof item === 'string' ? item : (item.subdomain || item.domain || JSON.stringify(item));
      let isHttps = subStr.startsWith('https://') || (item.protocol === 'https');
      if (isHttps) httpsCount++; else httpCount++;

      return {
        subdomain: subStr.replace(/^https?:\/\//, ''),
        url: subStr.startsWith('http') ? subStr : `https://${subStr}`,
        protocol: isHttps ? 'HTTPS' : 'HTTP',
        ip: item.ip || 'Resolved via DNS',
        status: item.status || 'Active'
      };
    });

    if (statTotal) statTotal.textContent = total;
    if (statHttps) statHttps.textContent = httpsCount;
    if (statHttp) statHttp.textContent = httpCount;
    if (statDuration) statDuration.textContent = `${((Date.now() - new Date(data.scannedAt).getTime()) / 1000).toFixed(1)}s`;

    populateTable(formattedSubdomains);
    if (jsonOutput) jsonOutput.textContent = JSON.stringify(data, null, 2);
    saveRecentSearch(domain, total);
  }

  function populateTable(subdomains) {
    if (!subTableBody) return;
    subTableBody.innerHTML = '';

    if (subdomains.length === 0) {
      subTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 3rem;">No subdomains discovered for this target.</td></tr>`;
      return;
    }

    subdomains.forEach(sub => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 600; color: var(--color-primary);">${escapeHtml(sub.subdomain)}</td>
        <td><span class="badge ${sub.protocol.toLowerCase()}">${sub.protocol}</span></td>
        <td>${escapeHtml(sub.ip)}</td>
        <td><span style="color: var(--color-green);">●</span> ${sub.status}</td>
        <td>
          <div class="sub-actions">
            <button class="icon-btn" title="Copy Subdomain" onclick="navigator.clipboard.writeText('${sub.subdomain}'); showToast('Copied to clipboard!', 'success');">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            <a href="${sub.url}" target="_blank" rel="noopener noreferrer" class="icon-btn" title="Open Target">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          </div>
        </td>
      `;
      subTableBody.appendChild(tr);
    });
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  window.showToast = function(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  function saveRecentSearch(domain, count) {
    let history = JSON.parse(localStorage.getItem('subvision_history') || '[]');
    history = history.filter(item => item.domain !== domain);
    history.unshift({ domain, count, date: new Date().toISOString() });
    if (history.length > 10) history.pop();
    localStorage.setItem('subvision_history', JSON.stringify(history));
  }

  window.newScan = function() {
    if (dashboardSection) dashboardSection.classList.remove('active');
    if (heroSection) heroSection.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (domainInput) {
      domainInput.value = '';
      domainInput.focus();
    }
  };

  window.copyAllJSON = function() {
    if (!currentScanData) return;
    navigator.clipboard.writeText(JSON.stringify(currentScanData, null, 2));
    showToast('Complete JSON payload copied to clipboard!');
  };

  window.downloadJSON = function() {
    if (!currentScanData) return;
    const blob = new Blob([JSON.stringify(currentScanData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentScanData.domain || 'subvision'}-subdomains.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSON report downloaded successfully!');
  };

  window.exportCSV = function() {
    if (!currentScanData) return;
    let subs = currentScanData.results;
    if (subs && subs.subdomains) subs = subs.subdomains;
    if (!Array.isArray(subs)) subs = Object.values(subs).flat();

    let csv = 'Subdomain,Protocol,IP,Status\n';
    subs.forEach(s => {
      let subStr = typeof s === 'string' ? s : (s.subdomain || s);
      csv += `"${subStr}","HTTPS","Resolved","Active"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentScanData.domain || 'subvision'}-subdomains.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV report exported successfully!');
  };

  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== domainInput) {
      e.preventDefault();
      if (domainInput) domainInput.focus();
    }
  });
});
