(() => {
  const base = '/apps/subscriptions/cp/api/';

  async function appstleRequest(path, params = {}, method = 'GET', body) {
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

  const contractId = (value) => String(value ?? '').match(/^(?:gid:\/\/shopify\/SubscriptionContract\/)?(\d+)$/)?.[1];
  const formatDate = (value) => {
    if (typeof value !== 'string' || !value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
  };
  const label = (value) => String(value || '').toLowerCase().replaceAll('_', ' ');
  const dateOf = (order) => order.billingDate || order.orderDate;
  const orderList = (data) => Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];

  function subscriptionPriceSummary(lines) {
    const currency = lines[0]?.currentPrice?.currencyCode;
    if (!currency || !/^[A-Z]{3}$/.test(currency)) return {};
    const amount = (money) => money?.currencyCode === currency &&
      (typeof money.amount === 'string' && money.amount.trim() || typeof money.amount === 'number') &&
      Number.isFinite(Number(money.amount)) && Number(money.amount) >= 0 ? Number(money.amount) : null;
    let total = 0;
    let base = 0;
    let hasBase = true;
    for (const line of lines) {
      const current = amount(line.currentPrice);
      const original = amount(line.pricingPolicy?.basePrice);
      const quantity = Number(line.quantity);
      if (current === null || !Number.isSafeInteger(quantity) || quantity < 1) return {};
      total += current * quantity;
      if (original === null) hasBase = false;
      else base += original * quantity;
    }
    const money = new Intl.NumberFormat(undefined, { style: 'currency', currency });
    const savings = hasBase && base > total && money.format(base - total) !== money.format(0)
      ? money.format(base - total) : '';
    return { price: money.format(total), savings };
  }

  function createPreviewRequest() {
    const day = (offset) => new Date(Date.now() + offset * 86400000).toISOString();
    const subscriptions = new Map(['101', '102'].map((id) => [id, {
      id, status: 'ACTIVE', nextBillingDate: day(7),
      deliveryPolicy: { interval: 'MONTH', intervalCount: 1 },
      customerPaymentMethod: { instrument: { __typename: 'CustomerCreditCard' } },
      deliveryMethod: { __typename: 'SubscriptionDeliveryMethodShipping', address: {} },
      lines: { nodes: [{ title: id === '101' ? 'Sample Black Walnut Drops' : 'Sample Soursop Softgels', quantity: 1, currentPrice: { amount: 34.99, currencyCode: 'USD' }, pricingPolicy: { basePrice: { amount: 44.99, currencyCode: 'USD' } } }] }
    }]));
    const orders = new Map([...subscriptions.keys()].map((id) => [id, [7, 37, 67].map((offset, index) => ({
      id: String(index + 1), billingDate: day(offset), status: 'QUEUED'
    }))]));
    return async (path, params = {}, method = 'GET', body) => {
      if (path === 'logged-in-customer') return 1;
      if (path.startsWith('customer-portal-settings/')) return { pauseResumeSub: true, resumeSub: true, cancelSub: true, changeShippingAddressFlag: true };
      if (path === 'subscription-customers/valid/1') return [...subscriptions.keys()];
      if (path.startsWith('subscription-contracts/contract-external/')) return subscriptions.get(path.split('/').pop());
      if (path === 'subscription-billing-attempts/top-orders') return orders.get(params.contractId);
      if (path === 'subscription-billing-attempts/past-orders') return [{ orderName: 'Sample order', billingDate: day(-23), status: 'SUCCESS' }];
      const subscription = subscriptions.get(params.contractId || params.subscriptionContractId);
      if (method === 'PUT' && subscription) {
        if (path === 'subscription-contracts-update-status') subscription.status = params.status;
        else if (path === 'subscription-contracts-update-shipping-address') subscription.deliveryMethod.address = body;
        else if (path.startsWith('subscription-billing-attempts/skip-order/')) {
          const schedule = orders.get(subscription.id);
          schedule.find(order => order.id === path.split('/').pop()).status = 'SKIPPED';
          subscription.nextBillingDate = schedule.find(order => order.status === 'QUEUED')?.billingDate;
        } else if (path !== 'subscription-contracts-update-payment-method') {
          throw new Error('This action is unavailable in the preview.');
        }
        return null;
      }
      throw new Error('This action is unavailable in the preview.');
    };
  }

  async function setupDashboard(root) {
    const find = (selector) => root.querySelector(selector);
    const preview = new URLSearchParams(location.search).get('preview-subscription') === '1';
    const request = preview ? createPreviewRequest() : appstleRequest;
    find('[data-subscription-preview]').hidden = !preview;
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
      for (const section of root.querySelectorAll('[data-contract-content]')) section.hidden = true;
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
      const products = find('[data-contract-products]');
      products.replaceChildren(...lines.map((line) => {
        const row = document.createElement('li');
        const imageUrl = line.variantImage?.url;
        if (typeof imageUrl === 'string' && /^https:\/\//i.test(imageUrl)) {
          const image = document.createElement('img');
          image.src = imageUrl;
          image.alt = '';
          image.loading = 'lazy';
          row.append(image);
        }
        const name = document.createElement('span');
        name.textContent = [line.title || 'Subscription item', line.variantTitle === 'Default Title' ? '' : line.variantTitle, line.quantity ? 'Qty ' + line.quantity : ''].filter(Boolean).join(' · ');
        row.append(name);
        return row;
      }));
      for (const section of root.querySelectorAll('[data-contract-content]')) section.hidden = false;

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

    function confirmAction(title, description, buttonLabel) {
      const dialog = find('[data-action-dialog]');
      dialog.querySelector('h2').textContent = title;
      dialog.querySelector('p').textContent = description;
      dialog.querySelector('[data-confirm-action]').textContent = buttonLabel;
      dialog.returnValue = '';
      return new Promise((resolve) => {
        dialog.addEventListener('close', () => resolve(dialog.returnValue === 'confirm'), { once: true });
        dialog.showModal();
      });
    }

    function openCancellation() {
      const dialog = find('[data-cancel-dialog]');
      const heading = dialog.querySelector('h2');
      const back = dialog.querySelector('[data-cancel-back]');
      const history = [];
      const lines = contract.lines?.nodes || [];
      const { price, savings } = subscriptionPriceSummary(lines);
      const priceTag = dialog.querySelector('[data-cancel-price]');
      const savingsTag = dialog.querySelector('[data-cancel-savings]');
      dialog.querySelector('[data-cancel-product]').textContent = lines.map(line => line.title).filter(Boolean).join(' · ') || 'Your subscription';
      const nextBill = contract.status === 'ACTIVE' && formatDate(contract.nextBillingDate);
      const frequency = find('[data-contract-frequency]').textContent;
      dialog.querySelector('[data-cancel-schedule]').textContent =
        [frequency === '—' ? '' : frequency, nextBill ? 'Next billing ' + nextBill : ''].filter(Boolean).join(' · ');
      priceTag.hidden = !price;
      priceTag.textContent = price ? price + ' subtotal' : '';
      savingsTag.hidden = !savings;
      savingsTag.textContent = savings ? savings + ' less than your plan’s base price at current pricing' : '';
      let currentStep;
      const titles = { start: 'Before you go', questions: 'Help us understand', review: 'Review your options', confirm: 'Cancel your subscription?' };
      function showStep(step) {
        for (const panel of dialog.querySelectorAll('[data-cancel-step]')) {
          panel.hidden = panel.dataset.cancelStep !== step;
        }
        currentStep = step;
        heading.textContent = titles[step];
        back.hidden = history.length === 0;
        dialog.scrollTop = 0;
        if (dialog.open) heading.focus({ preventScroll: true });
      }
      dialog.querySelector('form').reset();
      showStep('start');
      for (const button of dialog.querySelectorAll('[data-cancel-next]')) {
        button.onclick = () => {
          history.push(currentStep);
          showStep(button.dataset.cancelNext);
        };
      }
      back.onclick = () => { if (history.length) showStep(history.pop()); };
      const order = nextOrder();
      const nextRenewal = order && upcoming
        .filter((item) => item !== order && ['QUEUED', 'SCHEDULED'].includes(item.status))
        .map(dateOf)
        .filter((date) => formatDate(date) && Date.parse(date) > Date.parse(dateOf(order)))
        .sort((left, right) => Date.parse(left) - Date.parse(right))[0];
      const skip = dialog.querySelector('[value="skip"]');
      const note = dialog.querySelector('[data-cancel-skip-note]');
      const reason = dialog.querySelector('[data-cancel-reason]');
      const delivery = dialog.querySelector('[data-cancel-delivery]');
      const selectedReason = () => reason.querySelector('input:checked')?.value;
      function updateOffer() {
        const declined = delivery.value === 'no' || selectedReason() === 'fit';
        skip.hidden = declined || !order || contract.status !== 'ACTIVE';
        note.hidden = false;
        note.textContent = declined ? 'You can continue to cancel your subscription.' :
          skip.hidden ? 'There is no scheduled order available to skip.' :
            nextRenewal ? 'Skipping moves your next scheduled renewal to ' + formatDate(nextRenewal) + '.' :
              'Skipping leaves your subscription active.';
      }
      const questionActions = dialog.querySelectorAll('[data-cancel-step="questions"] [data-cancel-next]');
      if (preview) {
        const bypass = dialog.querySelector('[data-cancel-step="start"] [data-cancel-next="confirm"]');
        bypass.hidden = true;
        bypass.parentElement.style.gridTemplateColumns = '1fr';
        reason.setAttribute('aria-required', 'true');
        delivery.setAttribute('aria-required', 'true');
        dialog.querySelector('[data-cancel-step="questions"] p').textContent =
          'Answer both questions to continue in this sample subscription.';
      }
      function updateQuestions() {
        updateOffer();
        for (const button of questionActions) {
          button.disabled = preview && (!selectedReason() || !delivery.value);
        }
      }
      reason.onchange = updateQuestions;
      delivery.onchange = updateQuestions;
      updateQuestions();
      dialog.returnValue = '';
      dialog.addEventListener('close', async () => {
        if (dialog.returnValue === 'skip') {
          await act('skip');
        } else if (dialog.returnValue === 'cancel') {
          const id = contractId(contract?.id);
          if (!id) return;
          await run(async () => {
            await request('subscription-contracts-update-status', { contractId: id, status: 'CANCELLED' }, 'PUT');
            try {
              await loadContract();
            } catch {
              status.textContent = 'Appstle accepted your request. Reload this page to verify its status before trying again.';
              return;
            }
            status.textContent = contract?.status === 'CANCELLED'
              ? 'Subscription canceled. Future renewals have stopped.'
              : 'Appstle accepted your request. Check this dashboard again for the effective cancellation status.';
          });
        }
      }, { once: true });
      dialog.showModal();
    }

    async function act(action) {
      const id = contractId(contract?.id);
      if (!id) return;
      if (action === 'cancel') return openCancellation();
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
        if (!method) {
          status.textContent = 'There is no saved payment method for this subscription. Contact support for help.';
          return;
        }
        if (method.instrument?.__typename === 'CustomerShopPayAgreement') return location.assign('https://shop.app/');
        if (!await confirmAction('Update payment method', 'Shopify will email a secure link to update the payment method for this subscription.', 'Send secure link')) return;
        await run(async () => {
          await request('subscription-contracts-update-payment-method', params, 'PUT');
          status.textContent = preview ? 'Preview complete. No email was sent.' : 'Check your inbox for Shopify’s payment update link.';
        });
        return;
      }
      if (action === 'skip') {
        const order = nextOrder();
        if (!order || !await confirmAction('Skip your next order?', 'This skips one scheduled order. Your subscription will stay active.', 'Skip next order')) return;
        await run(() => change('subscription-billing-attempts/skip-order/' + order.id, {
          subscriptionContractId: id
        }, 'Next order skipped.'));
        return;
      }
      const stateActions = {
        pause: ['PAUSED', 'Pause this subscription?', 'Subscription paused.'],
        resume: ['ACTIVE', 'Resume renewals for this subscription?', 'Subscription resumed.']
      };
      const choice = stateActions[action];
      if (!choice || !await confirmAction(choice[1], action === 'pause' ? 'Scheduled renewals will pause until you resume.' : 'Scheduled renewals will resume for this subscription.', action === 'pause' ? 'Pause subscription' : 'Resume subscription')) return;
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
      const validIds = ids.map(contractId).filter(Boolean);
      if (ids.length && validIds.length !== ids.length) throw new Error('Subscription results could not be verified.');
      for (const id of new Set(validIds)) {
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
    if (root.hasAttribute('data-dashboard')) setupDashboard(root);
  }
})();
