(() => {
  const base = '/apps/subscriptions/cp/api/';
  const previewRequested = new URLSearchParams(location.search).get('preview-subscription') === '1';
  const previewProducts = { 101: 'Black Walnut Drops', 102: 'Soursop Softgels', 103: 'Black Walnut Drops + Soursop Softgels' };

  async function appstleRequest(path, params = {}, method = 'GET', body) {
    const url = new URL(base + path, location.origin);
    url.search = new URLSearchParams(params);
    const options = { method, credentials: 'same-origin', cache: 'no-store', redirect: 'error' };
    options.signal = AbortSignal.timeout(15000);
    if (body !== undefined) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options).catch(() => {
      throw new Error('The subscription service could not be reached. Refresh to check your subscription before retrying.');
    });
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

  function subscriptionPriceSummary(lines, oneTimePrices) {
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
      const original = amount(oneTimePrices.get(String(line.variantId || '').split('/').pop()));
      const quantity = Number(line.quantity);
      if (current === null || !Number.isSafeInteger(quantity) || quantity < 1) return {};
      total += current * quantity;
      if (original === null) hasBase = false;
      else base += original * quantity;
    }
    const money = new Intl.NumberFormat(undefined, { style: 'currency', currency });
    const savings = hasBase && base > total && money.format(base - total) !== money.format(0)
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: 'code' }).format(base - total) : '';
    return { price: money.format(total), savings, discountPercent: savings ? Math.round((base - total) / base * 100) : 0 };
  }

  async function fetchOneTimePrices(lines, country) {
    const ids = [...new Set(lines.map(line => String(line.variantId || '').split('/').pop())
      .filter(id => /^\d+$/.test(id)))];
    const prices = new Map();
    if (!/^[A-Z]{2}$/.test(country || '')) return prices;
    for (let start = 0; start < ids.length; start += 50) {
      const response = await fetch('/api/2026-04/graphql.json', {
        method: 'POST',
        signal: AbortSignal.timeout(8000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query OneTimePrices($ids: [ID!]!, $country: CountryCode!) @inContext(country: $country) {
            nodes(ids: $ids) {
              ... on ProductVariant {
                id availableForSale price { amount currencyCode } product { requiresSellingPlan }
              }
            }
          }`,
          variables: { ids: ids.slice(start, start + 50).map(id => 'gid://shopify/ProductVariant/' + id), country }
        })
      });
      if (!response.ok) return prices;
      const { data } = await response.json();
      for (const variant of data?.nodes || []) {
        if (variant?.availableForSale && variant.product?.requiresSellingPlan === false) {
          prices.set(variant.id.split('/').pop(), variant.price);
        }
      }
    }
    return prices;
  }

  function createPreviewRequest() {
    const day = (offset) => new Date(Date.now() + offset * 86400000).toISOString();
    const previewLine = (variantId, quantity = 1) => ({
      title: previewProducts[variantId], quantity, variantId,
      currentPrice: { amount: variantId === '101' ? 35 : 34.99, currencyCode: 'USD' }
    });
    const subscriptions = new Map(Object.keys(previewProducts).map((id) => [id, {
      id, status: 'ACTIVE', nextBillingDate: day(7), lastPaymentStatus: id === '102' ? 'FAILED' : 'SUCCEEDED',
      deliveryPolicy: { interval: 'MONTH', intervalCount: 1 },
      customerPaymentMethod: { instrument: { __typename: 'CustomerCreditCard' } },
      deliveryMethod: { __typename: 'SubscriptionDeliveryMethodShipping', address: {} },
      lines: { nodes: id === '103' ? [previewLine('101', 2), previewLine('102')] : [previewLine(id)] }
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
      if (path === 'subscription-billing-attempts/past-orders') return params.contractId === '102'
        ? [{ billingDate: day(-1), status: 'FAILED', errorCode: 'INSUFFICIENT_FUNDS' }]
        : [{ orderName: 'Sample order', billingDate: day(-23), status: 'SUCCESS' }];
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
    const preview = root.hasAttribute('data-preview-only') || previewRequested;
    const request = preview ? createPreviewRequest() : appstleRequest;
    const orderTaxes = new Map([...find('[data-subscription-order-taxes]').content.querySelectorAll('[data-order-id]')]
      .map(({ dataset }) => [dataset.orderId, dataset.orderTax]));
    let referencePrices = new Map();
    find('[data-subscription-preview]').hidden = !preview;
    const status = find('[data-appstle-status]');
    const select = find('[data-contract]');
    const paymentAlert = find('[data-payment-alert]');
    const paymentUpdateStatus = find('[data-payment-update-status]');
    const paymentSupport = find('[data-payment-support]');
    const cancellationReceipt = find('[data-cancel-receipt]');
    const requestedPaymentLinks = new Set();
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

    function renderOrders(type, orders, failed = false) {
      const list = find('[data-orders-' + type + ']');
      list.replaceChildren(...orders.map((order) => {
        const row = document.createElement('li');
        const orderId = String(order.graphOrderId || order.orderId || '').split('/').pop();
        const tax = type === 'past' && orderTaxes.get(orderId);
        row.textContent = [order.orderName, formatDate(dateOf(order)), label(order.status || order.billingAttemptStatus), tax ? 'Tax ' + tax : ''].filter(Boolean).join(' · ');
        return row;
      }).filter((row) => row.textContent));
      const message = find('[data-orders-' + type + '-status]');
      message.hidden = list.childElementCount > 0;
      message.textContent = failed ? 'Orders couldn’t be loaded. Refresh to try again.' :
        type === 'upcoming' ? 'No scheduled orders.' : 'No past orders.';

    }

    function nextOrder() {
      return upcoming.filter((order) =>
        /^\d+$/.test(String(order.id)) && ['QUEUED', 'SCHEDULED'].includes(order.status) &&
        Number.isFinite(Date.parse(dateOf(order)))
      ).sort((left, right) => Date.parse(dateOf(left)) - Date.parse(dateOf(right)))[0];
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
      find('[data-cancellation-settings]').hidden = !enabled.cancel;
      find('[data-resume-controls]').hidden = !enabled.resume;
      const skip = find('[data-subscription-action="skip"]');
      skip.hidden = !enabled.skip;
      const paymentAction = paymentAlert.querySelector('button');
      paymentAction.hidden = !enabled.payment || !contract?.customerPaymentMethod;
      paymentSupport.hidden = !paymentAction.hidden;
      for (const button of actions) button.disabled = busy || !enabled[button.dataset.subscriptionAction];
    }

    async function loadContract() {
      contract = undefined;
      paymentAlert.hidden = true;
      cancellationReceipt.hidden = true;
      paymentUpdateStatus.textContent = '';
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
      const canceled = contract.status === 'CANCELLED';
      cancellationReceipt.hidden = !canceled;
      upcoming = canceled ? [] : orderList(next.value);
      renderOrders('upcoming', upcoming, !canceled && next.status === 'rejected');
      const pastOrders = orderList(past.value);
      renderOrders('past', pastOrders, past.status === 'rejected');
      const title = contract.lines?.nodes?.map((line) => line.title).filter(Boolean).join(', ');
      if (title) select.selectedOptions[0].textContent = title + ' · #' + id;
      const nextBilling = contract.status === 'ACTIVE' && formatDate(contract.nextBillingDate);
      find('[data-next-order-heading]').textContent = canceled ? 'Subscription items' : 'Next order';
      find('[data-contract-next-billing]').textContent = nextBilling || '—';
      const nextOrderMessage = find('[data-next-order-message]');
      nextOrderMessage.hidden = Boolean(nextBilling);
      nextOrderMessage.textContent = contract.status === 'ACTIVE' ? 'No billing date is available yet.' : 'No renewal is scheduled while this subscription is ' + label(contract.status) + '.';
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

      referencePrices = preview
        ? new Map([['101', { amount: 67.99, currencyCode: 'USD' }], ['102', { amount: 44.99, currencyCode: 'USD' }]])
        : await fetchOneTimePrices(lines, root.dataset.priceCountry).catch(() => new Map());
      const { price, discountPercent } = contract.lines?.pageInfo?.hasNextPage ? {} :
        subscriptionPriceSummary(lines, referencePrices);
      find('[data-contract-price]').textContent = price || '—';
      const discount = discountPercent === 49 ? 'About 50%' : discountPercent + '%';
      find('[data-vip-price-perk]').textContent = discountPercent > 0
        ? discount + ' off with your VIP rate' : 'Your special VIP rate';
      find('[data-vip-price-note]').textContent = discountPercent > 0
        ? 'Compared with buying the same items one time at today’s prices.'
        : 'See your current rate in Subscription details.';
      const paymentFailed = contract.lastPaymentStatus === 'FAILED';
      const billingStatus = label(contract.status);
      find('[data-contract-billing-status]').textContent = paymentFailed ? 'Payment failed' :
        billingStatus ? billingStatus[0].toUpperCase() + billingStatus.slice(1) : '—';
      if (!paymentFailed) requestedPaymentLinks.delete(id);
      if (paymentFailed && contract.status === 'ACTIVE') {
        const latestAttempt = [...pastOrders, ...upcoming].filter(order =>
          ['FAILED', 'FAILURE', 'SUCCESS', 'SUCCEEDED'].includes(order.status || order.billingAttemptStatus) &&
          Number.isFinite(Date.parse(order.attemptTime || dateOf(order)))
        ).sort((left, right) => Date.parse(right.attemptTime || dateOf(right)) - Date.parse(left.attemptTime || dateOf(left)))[0];
        const insufficient = ['FAILED', 'FAILURE'].includes(latestAttempt?.status || latestAttempt?.billingAttemptStatus) &&
          latestAttempt.errorCode === 'INSUFFICIENT_FUNDS';
        find('[data-payment-failure]').textContent = insufficient
          ? 'Your card has insufficient funds.'
          : 'We couldn’t process your latest renewal payment.';
        paymentAlert.hidden = false;
        if (requestedPaymentLinks.has(id)) showPaymentLinkRequested();
      }
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
      const { price, savings } = contract.lines?.pageInfo?.hasNextPage ? {} :
        subscriptionPriceSummary(lines, referencePrices);
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
      savingsTag.textContent = savings ? (preview ? 'You saved ' : 'You save ') + savings : '';
      let currentStep;
      const titles = { start: 'Before you go', questions: 'Why do you want to cancel?', experience: 'What mattered most in your decision?', timing: 'How did the delivery schedule work for you?', delivery: 'Would skipping your next order help?', decision: 'Are you sure you want to end your subscription?', review: 'Would a break work better?', confirm: 'Cancel your subscription?' };
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
          const answer = dialog.querySelector('[data-cancel-step="' + currentStep + '"] input:checked');
          history.push(currentStep);
          const target = currentStep === 'decision' && answer?.value === 'end' ? 'confirm' : button.dataset.cancelNext;
          showStep(target);
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
      const pause = dialog.querySelector('[value="pause"]');
      const note = dialog.querySelector('[data-cancel-skip-note]');
      const canSkip = !find('[data-subscription-action="skip"]').disabled;
      const canPause = !find('[data-subscription-action="pause"]').disabled;
      skip.hidden = !canSkip;
      pause.hidden = !canPause;
      dialog.querySelector('[data-cancel-options]').hidden = !canSkip && !canPause;
      dialog.querySelector('[data-no-cancel-options]').hidden = canSkip || canPause;
      note.textContent = nextRenewal
        ? 'Skip one order. The following renewal is currently scheduled for ' + formatDate(nextRenewal) + '.'
        : 'Skip one order and keep your subscription active.';
      const previewButtons = dialog.querySelectorAll('[data-preview-next]');
      const liveButtons = dialog.querySelectorAll('[data-live-next]');
      if (preview) {
        const bypass = dialog.querySelector('[data-cancel-step="start"] [data-cancel-next="confirm"]');
        bypass.hidden = true;
        bypass.parentElement.style.gridTemplateColumns = '1fr';
      }
      for (const button of liveButtons) button.hidden = preview;
      function updateQuestions() {
        for (const button of previewButtons) {
          button.hidden = !preview;
          button.disabled = !button.closest('[data-cancel-step]').querySelector('input:checked');
        }
      }
      dialog.onchange = updateQuestions;
      updateQuestions();
      dialog.returnValue = '';
      dialog.addEventListener('close', async () => {
        if (dialog.returnValue === 'skip' || dialog.returnValue === 'pause') {
          const previousStatus = status.textContent;
          await act(dialog.returnValue);
          if (status.textContent && status.textContent !== previousStatus) status.focus();
        } else if (dialog.returnValue === 'cancel') {
          const id = contractId(contract?.id);
          if (!id) return;
          await run(async () => {
            await request('subscription-contracts-update-status', { contractId: id, status: 'CANCELLED' }, 'PUT');
            try {
              await loadContract();
            } catch {
              status.textContent = 'Appstle accepted your request. Reload this page to verify its status before trying again.';
              status.focus();
              return;
            }
            const confirmed = contract?.status === 'CANCELLED';
            status.textContent = confirmed
              ? 'Cancellation confirmed.'
              : 'Appstle accepted your request. Check this dashboard again for the effective cancellation status.';
            (confirmed ? cancellationReceipt.querySelector('h4') : status).focus();
          });
        }
      }, { once: true });
      dialog.showModal();
    }

    function showPaymentLinkRequested() {
      paymentUpdateStatus.textContent = preview
        ? 'Secure link requested in test mode. No email was sent.'
        : 'Secure link requested. Check your inbox to update your payment method.';
    }

    async function act(action) {
      const id = contractId(contract?.id);
      if (!id || busy || find('[data-subscription-action="' + action + '"]')?.disabled) return;
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
          requestedPaymentLinks.add(id);
          showPaymentLinkRequested();
          if (paymentAlert.hidden) status.textContent = paymentUpdateStatus.textContent;
        }, paymentAlert.hidden ? status : paymentUpdateStatus);
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
        select.add(new Option(preview ? previewProducts[id] + ' · #' + id : 'Subscription #' + id, id));
      }
      if (!select.options.length) {
        status.textContent = 'No subscriptions were found for this account.';
        return;
      }
      select.hidden = select.options.length < 2;
      await loadContract();
      status.textContent = '';
    });
  }

  if (previewRequested) {
    const template = document.querySelector('[data-membership-test-preview]');
    const signIn = template?.previousElementSibling;
    if (signIn?.hasAttribute('data-membership-sign-in')) {
      signIn.replaceWith(template.content.cloneNode(true));
    }
  }

  for (const root of document.querySelectorAll('[data-appstle-membership][data-dashboard]')) {
    setupDashboard(root);
  }
})();
