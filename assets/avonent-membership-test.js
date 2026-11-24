(() => {
  const base = '/apps/subscriptions/cp/api/';
  const portal = '/apps/subscriptions';

  async function request(path, params = {}, method = 'GET', body) {
    const url = new URL(base + path, location.origin);
    url.search = new URLSearchParams(params);
    const options = { method, credentials: 'same-origin', cache: 'no-store', redirect: 'error' };
    if (body !== undefined) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    const raw = await response.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      if (response.headers.get('Content-Type')?.startsWith('text/html')) {
        throw new Error('The subscription service is unavailable.');
      }
      data = raw;
    }
    if (response.ok) return data;
    const message = typeof data?.message === 'string' ? data.message : '';
    const error = new Error(
      response.status === 429 ? 'Please wait before trying again.' :
        message.startsWith('UserGeneratedError:') ? message.slice('UserGeneratedError:'.length).trim() :
          'Appstle could not complete this request.'
    );
    error.status = response.status;
    throw error;
  }

  function setupEmail(root) {
    const form = root.querySelector('[data-appstle-email-link]');
    if (!form) return;
    const button = form.querySelector('button');
    const status = form.querySelector('[data-appstle-email-status]');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (button.disabled || !form.reportValidity()) return;
      button.disabled = true;
      status.textContent = 'Requesting your link…';
      try {
        await request('subscription-contracts-email-magic-link', {
          email: form.elements.email.value.trim()
        });
        status.textContent = 'If this email is linked to a subscription, check your inbox for a secure link to the Appstle portal.';
      } catch {
        status.textContent = 'The request could not be completed. Try again shortly or continue with Shopify sign-in.';
      } finally {
        button.disabled = false;
      }
    });
    button.disabled = false;
  }

  const contractId = (value) => String(value ?? '').match(/^(?:gid:\/\/shopify\/SubscriptionContract\/)?(\d+)$/)?.[1];
  const formatDate = (value) => {
    if (typeof value !== 'string' || !value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
  };
  const label = (value) => String(value || '').toLowerCase().replaceAll('_', ' ');
  const dateOf = (order) => order.billingDate || order.orderDate;
  const orderList = (data) => Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];

  async function setupDashboard(root) {
    const find = (selector) => root.querySelector(selector);
    const status = find('[data-appstle-status]');
    const select = find('[data-contract]');
    const actions = [...root.querySelectorAll('[data-subscription-action]')];
    const addressDialog = find('[data-address-dialog]');
    const addressForm = find('[data-address-form]');
    const addressStatus = find('[data-address-status]');
    const addressSubmit = addressForm.querySelector('button[type=submit]');
    const addressClose = find('[data-close-address]');
    let settings = {};
    let contract;
    let upcoming = [];
    let busy = false;

    function report(error, element = status) {
      element.textContent = error.status === 401 ? 'Your Shopify sign-in expired. Sign in again.' : error.message;
      if (error.status === 401) {
        const link = document.createElement('a');
        link.href = root.dataset.signInUrl;
        link.textContent = ' Sign in';
        element.append(link);
      }
    }

    function renderOrders(type, orders) {
      const list = find('[data-orders-' + type + ']');
      list.replaceChildren(...orders.map((order) => {
        const row = document.createElement('li');
        row.textContent = [order.orderName, formatDate(dateOf(order)), label(order.status || order.billingAttemptStatus)].filter(Boolean).join(' · ');
        return row;
      }).filter((row) => row.textContent));
    }

    function nextOrder() {
      return upcoming.find((order) =>
        /^\d+$/.test(String(order.id)) && ['QUEUED', 'SCHEDULED'].includes(order.status)
      );
    }

    function setControls() {
      select.disabled = busy;
      const active = contract?.status === 'ACTIVE';
      const paused = contract?.status === 'PAUSED';
      const cancelled = contract?.status === 'CANCELLED';
      const shipping = contract?.deliveryMethod?.__typename === 'SubscriptionDeliveryMethodShipping';
      const enabled = {
        skip: active && Boolean(nextOrder()),
        pause: active && settings.pauseResumeSub === true,
        resume: (paused && settings.resumeSub === true) || (cancelled && settings.resumeSubAfterCancellation === true),
        cancel: (active || paused) && settings.cancelSub === true,
        address: (active || paused) && shipping && settings.changeShippingAddressFlag === true,
        payment: (active || paused) && settings.hidePaymentMethodEdit !== true
      };
      for (const button of actions) button.disabled = busy || !enabled[button.dataset.subscriptionAction];
    }

    async function loadContract() {
      contract = undefined;
      upcoming = [];
      renderOrders('upcoming', []);
      renderOrders('past', []);
      for (const item of root.querySelectorAll('[data-contract-next-billing], [data-contract-frequency], [data-contract-price], [data-contract-billing-status]')) {
        item.textContent = '—';
      }
      const id = select.value;
      if (!id) return;
      const [details, next, past] = await Promise.allSettled([
        request('subscription-contracts/contract-external/' + id),
        request('subscription-billing-attempts/top-orders', { contractId: id }),
        request('subscription-billing-attempts/past-orders', { contractId: id })
      ]);
      if (details.status === 'rejected') throw details.reason;
      contract = details.value;
      if (contractId(contract?.id) !== id) {
        contract = undefined;
        throw new Error('Subscription details could not be verified.');
      }
      upcoming = orderList(next.value);
      renderOrders('upcoming', upcoming);
      renderOrders('past', orderList(past.value));
      const title = contract.lines?.nodes?.map((line) => line.title).filter(Boolean).join(', ');
      if (title) select.selectedOptions[0].textContent = title + ' · #' + id;
      find('[data-contract-next-billing]').textContent = (contract.status === 'ACTIVE' && formatDate(contract.nextBillingDate)) || '—';
      const interval = contract.deliveryPolicy?.intervalCount;
      const unit = label(contract.deliveryPolicy?.interval);
      find('[data-contract-frequency]').textContent = interval && unit ? 'Every ' + interval + ' ' + unit + (interval === 1 ? '' : 's') : '—';
      const lines = contract.lines?.nodes || [];
      const price = lines.length === 1 && lines[0].currentPrice;
      if (price?.currencyCode && price.amount != null && Number.isFinite(Number(price.amount))) {
        find('[data-contract-price]').textContent = new Intl.NumberFormat(undefined, {
          style: 'currency', currency: price.currencyCode
        }).format(Number(price.amount)) + ' per item';
      }
      find('[data-contract-billing-status]').textContent =
        contract.lastPaymentStatus === 'FAILED' ? 'Payment failed' : label(contract.status) || '—';
    }

    async function run(task, element = status) {
      if (busy) return;
      busy = true;
      element.textContent = '';
      setControls();
      try {
        await task();
      } catch (error) {
        report(error, element);
      } finally {
        busy = false;
        setControls();
      }
    }

    async function change(path, params, success, body) {
      try {
        await request(path, params, 'PUT', body);
      } catch (error) {
        try { await loadContract(); } catch { /* Show the original Appstle error. */ }
        throw error;
      }
      // The change was accepted even if a follow-up read fails.
      try {
        await loadContract();
        status.textContent = success;
      } catch {
        status.textContent = success + ' Reload to see updated details.';
      }
    }

    async function act(action) {
      const id = contractId(contract?.id);
      if (!id) return;
      const params = { contractId: id };
      if (action === 'address') {
        addressForm.reset();
        addressSubmit.disabled = false;
        const address = contract.deliveryMethod.address || {};
        for (const input of addressForm.querySelectorAll('input')) input.value = address[input.name] || '';
        addressStatus.textContent = '';
        addressDialog.showModal();
        return;
      }
      if (action === 'payment') {
        const method = contract.customerPaymentMethod;
        if (!method) return location.assign(portal);
        if (method.instrument?.__typename === 'CustomerShopPayAgreement') return location.assign('https://shop.app/');
        if (!window.confirm('Email a secure payment update link for this subscription?')) return;
        await run(async () => {
          await request('subscription-contracts-update-payment-method', params, 'PUT');
          status.textContent = 'Check your inbox for Shopify’s payment update link.';
        });
        return;
      }
      if (action === 'skip') {
        const order = nextOrder();
        if (!order || !window.confirm('Skip the next scheduled order for this subscription?')) return;
        await run(() => change('subscription-billing-attempts/skip-order/' + order.id, {
          subscriptionContractId: id
        }, 'Next order skipped.'));
        return;
      }
      const stateActions = {
        pause: ['PAUSED', 'Pause this subscription?', 'Subscription paused.'],
        resume: ['ACTIVE', 'Resume renewals for this subscription?', 'Subscription resumed.'],
        cancel: ['CANCELLED', 'Cancel this subscription and stop future renewals?', 'Subscription canceled.']
      };
      const choice = stateActions[action];
      if (!choice || !window.confirm(choice[1])) return;
      await run(() => change('subscription-contracts-update-status', { ...params, status: choice[0] }, choice[2]));
    }

    select.addEventListener('change', () => run(loadContract));
    for (const button of actions) {
      button.addEventListener('click', () => act(button.dataset.subscriptionAction));
    }
    addressClose.addEventListener('click', () => addressDialog.close());
    addressDialog.addEventListener('cancel', (event) => {
      if (busy) event.preventDefault();
    });
    addressForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (busy || !addressForm.reportValidity()) return;
      const id = contractId(contract?.id);
      if (!id) return;
      const address = Object.fromEntries([...new FormData(addressForm)].map(([key, value]) => [key, value.trim()]));
      address.countryCode = address.countryCode.toUpperCase();
      address.provinceCode = address.provinceCode.toUpperCase();
      address.methodType = 'SHIPPING';
      addressSubmit.disabled = true;
      addressClose.disabled = true;
      try {
        await run(async () => {
          await change('subscription-contracts-update-shipping-address', { contractId: id }, 'Shipping address updated.', address);
          addressDialog.close();
        }, addressStatus);
      } finally {
        addressSubmit.disabled = false;
        addressClose.disabled = false;
      }
    });

    await run(async () => {
      status.textContent = 'Loading your subscriptions…';
      const [owner, portalSettings] = await Promise.all([
        request('logged-in-customer'),
        request('customer-portal-settings/' + root.dataset.shopId)
      ]);
      if (!/^\d+$/.test(String(owner))) throw new Error('Your Shopify sign-in could not be verified.');
      settings = portalSettings || {};
      const ids = await request('subscription-customers/valid/' + owner);
      if (!Array.isArray(ids)) throw new Error('Appstle could not list your subscriptions.');
      for (const id of new Set(ids.map(contractId).filter(Boolean))) {
        select.add(new Option('Subscription #' + id, id));
      }
      if (!select.options.length) {
        status.textContent = 'No subscriptions were found for this account.';
        return;
      }
      select.hidden = false;
      find('[data-contract-label]').hidden = false;
      await loadContract();
      status.textContent = '';
    });
  }

  for (const root of document.querySelectorAll('[data-appstle-membership]')) {
    setupEmail(root);
    if (root.hasAttribute('data-dashboard')) setupDashboard(root);
  }
})();
